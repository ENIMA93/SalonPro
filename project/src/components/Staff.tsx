import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, type Staff as StaffType } from '../lib/supabase';

export default function Staff() {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('staff').select('*').order('name');
      setStaff(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
        <p className="text-gray-400 mb-8">Barbers and stylists at your salon.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{s.name}</h3>
                  <p className="text-gray-400">{s.role}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
