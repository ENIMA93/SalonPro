import { useState } from 'react';
import { User, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const MIN_PASSWORD_LENGTH = 8;

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage({ type: 'error', text: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setSubmitting(false);
      setMessage({ type: 'error', text: error.message });
      return;
    }
    const { error: rpcError } = await supabase.rpc('set_password_changed');
    if (rpcError) {
      setSubmitting(false);
      setMessage({ type: 'error', text: rpcError.message });
      return;
    }
    await refreshProfile();
    setSubmitting(false);
    setMessage({ type: 'success', text: 'Password updated. Use your new password next time you sign in.' });
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400 mb-8">Account and password.</p>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {user?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-white font-medium">{user?.email}</p>
              <p className="text-gray-400 text-sm">Change your password below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Change password</h2>
            </div>
            <div>
              <label htmlFor="new" className="block text-gray-400 text-sm font-medium mb-1">
                New password (min {MIN_PASSWORD_LENGTH} characters)
              </label>
              <input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-gray-400 text-sm font-medium mb-1">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                role="alert"
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !newPassword || !confirmPassword}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
