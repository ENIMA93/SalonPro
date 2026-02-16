import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Clients() {
  const [clients, setClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('appointments').select('client_name');
      const unique = [...new Set((data || []).map((a) => a.client_name).filter(Boolean))].sort();
      setClients(unique);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
        <p className="text-gray-400 mb-8">Clients who have booked appointments.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 divide-y divide-gray-700">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No clients found</div>
            ) : (
              clients.map((name) => (
                <div key={name} className="p-6 flex items-center gap-4 hover:bg-gray-700/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {name.charAt(0)}
                  </div>
                  <span className="text-white font-medium">{name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
