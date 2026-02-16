import { useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase, type Inventory } from '../lib/supabase';

export default function POS() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('inventory').select('*').order('product_name');
      setInventory(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">POS</h1>
        <p className="text-gray-400 mb-8">Inventory available for sale.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/20 text-purple-400 p-3 rounded-lg">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.product_name}</h3>
                    <p className="text-gray-400 text-sm">Stock: {item.stock_count}</p>
                  </div>
                </div>
                <p className="text-green-400 font-semibold">{item.price} DH</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
