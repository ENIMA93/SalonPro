import { useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search, LogIn, RefreshCw, UserPlus } from 'lucide-react';
import { supabase, type Staff as StaffType } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useStaff } from '../lib/StaffContext';
import StaffModal from './StaffModal';

export default function Staff() {
  const { session } = useAuth();
  const { staff, loading, error, refreshStaff, removeStaff, updateStaff } = useStaff();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);
  const [search, setSearch] = useState('');
  const [creatingLoginFor, setCreatingLoginFor] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: StaffType) => {
    setEditingStaff(s);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  const handleSuccess = () => {
    console.log('[Staff] handleSuccess called, closing modal...');
    // Don't refresh here - StaffModal already updated the global state
    setModalOpen(false);
    setEditingStaff(null);
  };

  const handleDelete = async (s: StaffType) => {
    const hasAccount = !!s.email || !!s.user_id;
    const msg = hasAccount
      ? `Delete ${s.name}? This cannot be undone. They will still have a login account; disable or remove it in Supabase Dashboard → Authentication → Users if needed.`
      : `Delete ${s.name}? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    
    const { error } = await supabase.from('staff').delete().eq('id', s.id);
    if (error) {
      alert(error.message);
      return;
    }
    
    // Update both database and local state
    removeStaff(s.id);
    await refreshStaff();
  };

  const handleCreateLogin = async (s: StaffType) => {
    setCreatingLoginFor(s.id);
    
    // Store original email to rollback if needed
    const originalEmail = s.email;
    
    try {
      // Generate credentials
      const cleanName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const email = `${cleanName}${randomNum}@salon.local`;
      const password = `Temp${randomNum}!`;

      // Refresh session to get a valid token BEFORE updating database
      const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
      const token = freshSession?.access_token;
      
      console.log('[Staff] Session refresh result:', {
        hasSession: !!freshSession,
        hasToken: !!token,
        tokenLength: token?.length,
        refreshError: refreshError?.message,
        expiresAt: freshSession?.expires_at,
        currentTime: Math.floor(Date.now() / 1000)
      });
      
      if (refreshError || !token) {
        throw new Error(`Session expired. Please refresh the page and try again. Error: ${refreshError?.message || 'No token'}`);
      }

      // Update staff record with email
      const { error: updateError } = await supabase
        .from('staff')
        .update({ email })
        .eq('id', s.id);

      if (updateError) {
        throw new Error(`Failed to update staff email: ${updateError.message}`);
      }

      // Call Edge Function to create user account
      const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`;
      
      console.log('[Staff] Calling Edge Function to create user account...');
      console.log('[Staff] Function URL:', FUNCTIONS_URL);
      console.log('[Staff] Token (first 20 chars):', token.substring(0, 20) + '...');
      
      const response = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: s.id,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Rollback email update if Edge Function fails
        console.log('[Staff] Edge Function failed, rolling back email update...');
        await supabase
          .from('staff')
          .update({ email: originalEmail })
          .eq('id', s.id);
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Login created successfully:', result);

      // Update the staff member in local state with the new user_id
      const updatedStaff = { ...s, email, user_id: result.user_id };
      updateStaff(updatedStaff);

      alert(`Login created successfully!\n\nEmail: ${email}\nTemporary Password: ${password}\n\nThey will be prompted to change the password on first login.`);

    } catch (error) {
      console.error('Failed to create login:', error);
      alert(`Failed to create login account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingLoginFor(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <StaffModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          staff={editingStaff}
        />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
            <p className="text-gray-400">Barbers and stylists at your salon.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshStaff()}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              title="Force refresh staff list and session"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Force Refresh
            </button>
            <button
              onClick={handleOpenAdd}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm" role="alert">
            Could not load staff list: {error}
          </div>
        )}
        {!loading && staff.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name or role..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff
              .filter((s) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                const email = (s.email ?? '').toLowerCase();
                return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || email.includes(q);
              })
              .map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-lg">{s.name}</h3>
                      <span className="text-gray-500 text-xs font-mono" title={s.id}>#{s.id.slice(0, 8)}</span>
                      {(s.user_id || s.email) ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1" title="Has login account">
                          <LogIn className="w-3 h-3" />
                          Can sign in
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center gap-1" title="No login account">
                          No login
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">{s.role}</p>
                    {s.email && (
                      <p className="text-gray-500 text-sm truncate" title={s.email}>{s.email}</p>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!(s.user_id || s.email) && (
                    <button
                      type="button"
                      onClick={() => handleCreateLogin(s)}
                      disabled={creatingLoginFor === s.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      aria-label="Create login account"
                      title="Create login account for this staff member"
                    >
                      {creatingLoginFor === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
