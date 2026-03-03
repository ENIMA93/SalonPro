import { useState } from 'react';
import { Loader2, Plus, Pencil, Search, LogIn, RefreshCw, UserPlus, Ban, CheckCircle } from 'lucide-react';
import { supabase, type Staff as StaffType } from '../lib/supabase';
import { useStaff } from '../lib/StaffContext';
import StaffModal from './StaffModal';

export default function Staff() {
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

  const handleToggleActive = async (s: StaffType) => {
    const newActive = !s.is_active;
    const action = newActive ? 'Enable' : 'Disable';
    if (!window.confirm(`${action} ${s.name}? ${newActive ? 'They will be able to sign in and appear as active again.' : 'They will no longer be able to sign in. Past operations stay linked to them.'}`)) return;
    const { error } = await supabase.from('staff').update({ is_active: newActive }).eq('id', s.id);
    if (error) {
      alert(error.message);
      return;
    }
    updateStaff({ ...s, is_active: newActive });
    await refreshStaff();
  };

  const handleCreateLogin = async (s: StaffType) => {
    setCreatingLoginFor(s.id);
    
    try {
      // Generate email
      const cleanName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const email = `${cleanName}${randomNum}@salon.local`;

      console.log('[Staff] Calling PostgreSQL function to create user account...');
      
      // Call the PostgreSQL function to create user account
      const { data, error } = await supabase.rpc('create_staff_user_account', {
        staff_id_param: s.id,
        email_param: email
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Failed to create user account');
      }

      console.log('Login created successfully via PostgreSQL function:', data);

      // Update the staff member in local state with the new user_id and email
      const updatedStaff = { 
        ...s, 
        email: data.email, 
        user_id: data.user_id 
      };
      updateStaff(updatedStaff);

      alert(`Login created successfully!\n\nEmail: ${data.email}\nTemporary Password: ${data.temporary_password}\n\nThey will be prompted to change the password on first login.`);

    } catch (error) {
      console.error('Failed to create login:', error);
      alert(`Failed to create login account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingLoginFor(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900 overflow-hidden">
      <StaffModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        staff={editingStaff}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-8">
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
                    onClick={() => handleToggleActive(s)}
                    className={`p-2 rounded-lg transition-colors ${
                      s.is_active
                        ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'
                        : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                    }`}
                    aria-label={s.is_active ? 'Disable' : 'Enable'}
                    title={s.is_active ? 'Disable (keeps history)' : 'Enable again'}
                  >
                    {s.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
