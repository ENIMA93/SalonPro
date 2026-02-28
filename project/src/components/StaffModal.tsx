import { useEffect, useState } from 'react';
import { X, Loader2, User, CheckCircle } from 'lucide-react';
import { supabase, type Staff as StaffType } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useStaff } from '../lib/StaffContext';

const MIN_PASSWORD_LENGTH = 8;
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`;
const SET_PASSWORD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-staff-password`;

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: StaffType | null;
}

export default function StaffModal({ isOpen, onClose, onSuccess, staff }: StaffModalProps) {
  const { session } = useAuth();
  const { addStaff, updateStaff, refreshStaff } = useStaff();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; email: string; password: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [setPasswordSubmitting, setSetPasswordSubmitting] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [setPasswordSuccess, setSetPasswordSuccess] = useState(false);

  const isEdit = !!staff;
  const hasLogin = isEdit && !!(staff?.user_id || staff?.email);

  // Auto-generate email and password for new staff
  const generateStaffCredentials = (name: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const email = `${cleanName}${randomNum}@salon.local`;
    const password = `Temp${randomNum}!`;
    return { email, password };
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (staff) {
      setName(staff.name);
      setRole(staff.role);
      setEmail(staff.email ?? '');
      setIsActive(staff.is_active);
    } else {
      setName('');
      setRole('');
      setEmail('');
      setPassword('');
      setIsActive(true);
    }
    setError(null);
    setSuccess(null);
    setNewPassword('');
    setNewPasswordConfirm('');
    setSetPasswordError(null);
    setSetPasswordSuccess(false);
  }, [isOpen, staff]);

  // Auto-generate credentials when name changes (for new staff only)
  useEffect(() => {
    if (!isEdit && name.trim()) {
      const credentials = generateStaffCredentials(name.trim());
      setEmail(credentials.email);
      setPassword(credentials.password);
    }
  }, [name, isEdit]);

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSetPassword = async () => {
    if (!staff?.id || !newPassword.trim()) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setSetPasswordError(`At least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setSetPasswordError('Passwords do not match');
      return;
    }
    setSetPasswordError(null);
    setSetPasswordSubmitting(true);
    const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
    const token = freshSession?.access_token ?? session?.access_token;
    if (refreshError || !token) {
      setSetPasswordSubmitting(false);
      setSetPasswordError('Session expired. Sign in again and retry.');
      return;
    }
    const res = await fetch(SET_PASSWORD_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: staff.id, new_password: newPassword }),
    });
    const result = await res.json().catch(() => ({}));
    setSetPasswordSubmitting(false);
    if (!res.ok) {
      setSetPasswordError((result?.error as string) || `Failed (${res.status})`);
      return;
    }
    setSetPasswordSuccess(true);
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!role.trim()) {
      setError('Role is required');
      return;
    }
    if (!isEdit) {
      // Email and password are auto-generated, but validate they exist
      if (!email.trim()) {
        setError('Please enter a name to generate login credentials');
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError('Generated password is too short - please try again');
        return;
      }
    }
    setSubmitting(true);
    setError(null);

    if (isEdit && staff) {
      const { error: updateError } = await supabase
        .from('staff')
        .update({ name: name.trim(), role: role.trim(), is_active: isActive })
        .eq('id', staff.id);
      setSubmitting(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      // Update the global context with the edited staff
      const updatedStaff: StaffType = {
        ...staff,
        name: name.trim(),
        role: role.trim(),
        is_active: isActive
      };
      console.log('[StaffModal] Updating staff in global context:', updatedStaff.name);
      updateStaff(updatedStaff);
      
      onSuccess();
      handleClose();
      return;
    }

    const { data: newStaff, error: insertError } = await supabase
      .from('staff')
      .insert({
        name: name.trim(),
        role: role.trim(),
        is_active: isActive,
        email: email.trim(),
      })
      .select('id')
      .single();

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    // Refresh session so we send a valid, non-expired JWT (avoids "Invalid JWT" from Edge Function)
    const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
    const token = freshSession?.access_token ?? session?.access_token;
    
    if (refreshError || !token) {
      setSubmitting(false);
      setError('Session expired or invalid. Please sign in again.');
      return;
    }

    let res: Response;
    // (Debug JWT info is sent via ingest above; do not log token content.)
    console.log('[StaffModal] Calling Edge Function to create user account...');
    try {
      res = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: newStaff.id,
          email: email.trim(),
          password,
        }),
      });
      console.log('[StaffModal] Edge Function response status:', res.status);
    } catch (err) {
      console.error('[StaffModal] Network error calling Edge Function:', err);
      await supabase.from('staff').delete().eq('id', newStaff.id);
      setSubmitting(false);
      setError('Network error. Is the app connected? If using Edge Functions, ensure create-staff-user is deployed.');
      return;
    }

    const result = await res.json().catch(async () => {
      try {
        const text = await res.text();
        return { error: text || `Server error (${res.status})` };
      } catch {
        return { error: `Request failed (${res.status})` };
      }
    });
    
    if (!res.ok) {
      console.error('[StaffModal] Edge Function failed:', { status: res.status, result });
      // Don't delete the staff record - let them retry creating the user account
      setSubmitting(false);
      const msg = result?.error ?? result?.message ?? `Failed to create staff account (${res.status})`;
      const msgStr = typeof msg === 'string' ? msg : 'Failed to create staff account';
      if (res.status === 404) {
        setError('Edge Function not found. Deploy it: supabase functions deploy create-staff-user');
        return;
      }
      if (res.status === 401 && /jwt|token|unauthorized|expired/i.test(msgStr)) {
        const hint =
          ' Sign out and sign in again, then retry. If it persists, ensure Edge Function create-staff-user has secrets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Dashboard → Edge Functions → Secrets).';
        setError(msgStr + hint);
        return;
      }
      setError(`${msgStr}. Staff record saved but user account creation failed. You can edit this staff member to retry creating their login.`);
      return;
    }

    setSubmitting(false);
    
    // Create the complete staff object and add it to global context immediately
    const completeStaff: StaffType = {
      id: newStaff.id,
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      user_id: result?.user_id || null, // Use the user_id from Edge Function if available
      is_active: isActive,
      created_at: new Date().toISOString()
    };

    console.log('[StaffModal] Adding new staff to global context:', completeStaff.name);
    addStaff(completeStaff);

    setSuccess({
      name: name.trim(),
      email: email.trim(),
      password: password
    });

    // Don't call refreshStaff here - addStaff already updated the local state
    // Just call onSuccess after a short delay for the success screen
    setTimeout(() => {
      console.log('[StaffModal] Calling onSuccess');
      onSuccess();
    }, 100);
  };

  if (!isOpen) return null;

  // Success screen
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Staff Created Successfully!</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">
              <span className="font-medium text-white">{success.name}</span> has been successfully added to your team!
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-white mb-3">Login Details:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Email: </span>
                <span className="text-white font-mono">{success.email}</span>
              </div>
              <div>
                <span className="text-gray-400">Temporary Password: </span>
                <span className="text-white font-mono">{success.password}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              They will be prompted to set a new password on first login. To test: sign out, then sign in with the email and temporary password above.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Staff' : 'Add Staff'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Ahmed"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Stylist, Barber"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">
              Email {isEdit ? '(login)' : '(auto-generated)'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={true}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none opacity-70 cursor-not-allowed"
              placeholder="Auto-generated from name"
            />
            {!isEdit && (
              <p className="text-gray-500 text-xs mt-1">Login email is automatically created from the staff name.</p>
            )}
          </div>
          {!isEdit && (
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">
                Temporary password (auto-generated)
              </label>
              <input
                type="text"
                value={password}
                readOnly={true}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none opacity-70 cursor-not-allowed font-mono"
                placeholder="Auto-generated secure password"
              />
              <p className="text-gray-500 text-xs mt-1">Staff will be prompted to change this on first login.</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="staff-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="staff-active" className="text-gray-300 text-sm">Active</label>
          </div>

          {hasLogin && (
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <h3 className="text-sm font-medium text-white">Password</h3>
              {setPasswordError && (
                <p className="text-sm text-red-400" role="alert">{setPasswordError}</p>
              )}
              {setPasswordSuccess && (
                <p className="text-sm text-green-400">Temporary password set. They will be prompted to change it on next login.</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setSetPasswordError(null); }}
                  placeholder="New password"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => { setNewPasswordConfirm(e.target.value); setSetPasswordError(null); }}
                  placeholder="Confirm"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSetPassword}
                  disabled={setPasswordSubmitting || !newPassword || newPassword !== newPasswordConfirm}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {setPasswordSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Set temporary password
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Save' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
