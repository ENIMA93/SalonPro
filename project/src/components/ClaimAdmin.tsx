import { useState } from 'react';
import { Scissors, Loader2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function ClaimAdmin() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.rpc('claim_admin');
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    await refreshProfile();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scissors className="w-10 h-10 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">SalonPro</h1>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Set up admin</h2>
              <p className="text-gray-400 text-sm">No admin account exists yet.</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            If you’re the salon owner, click below to claim full admin access. This can only be done once for the first account.
          </p>
          <p className="text-gray-500 text-xs mb-4">
            Signed in as: <span className="text-gray-400">{user?.email}</span>
          </p>
          {error && (
            <p className="text-sm text-red-400 mb-4" role="alert">
              {error}
            </p>
          )}
          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'I’m the owner – set as admin'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
