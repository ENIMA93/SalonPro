import { useState } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      const msg = err.message ?? 'Login failed';
      if (msg === 'Failed to fetch' || msg.toLowerCase().includes('fetch')) {
        setError(
          'Cannot reach the server. Check your connection, that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env, and that this app URL (e.g. http://localhost:5176) is allowed in Supabase Dashboard → Authentication → URL Configuration.'
        );
      } else {
        setError(msg);
      }
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scissors className="w-10 h-10 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">SalonPro</h1>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-400 text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="you@salon.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-400 text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
