import { useEffect, useState } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { supabase, type Service } from '../lib/supabase';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('services').select('*').order('name');
      setServices(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Services</h1>
        <p className="text-gray-400 mb-8">Manage your salon services and pricing.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 text-purple-400 p-3 rounded-lg">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{s.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{s.duration_min} min • {s.gender_category}</p>
                    <p className="text-green-400 font-semibold mt-2">{s.price} DH</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
