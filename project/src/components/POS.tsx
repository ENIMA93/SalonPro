import { useEffect, useState } from 'react';
import { ShoppingCart, Loader2, Plus, Minus, Trash2, CreditCard, Check } from 'lucide-react';
import { supabase, type Service, type Staff } from '../lib/supabase';

type CartItem = {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
};

export default function POS() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [svcRes, staffRes] = await Promise.all([
        supabase.from('services').select('*').order('name'),
        supabase.from('staff').select('*').eq('is_active', true).order('name'),
      ]);
      setServices(svcRes.data || []);
      setStaff(staffRes.data || []);
      setStaffId(staffRes.data?.[0]?.id ?? '');
      setLoading(false);
    };
    fetch();
  }, []);

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.serviceId === service.id);
      if (existing) {
        return prev.map((i) =>
          i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { serviceId: service.id, name: service.name, price: Number(service.price), quantity: 1 }];
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.serviceId === serviceId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => prev.filter((i) => i.serviceId !== serviceId));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePay = async () => {
    if (cart.length === 0) return;
    setPaying(true);
    try {
      const itemsJson = cart.map(({ serviceId, name, price, quantity }) => ({
        service_id: serviceId,
        name,
        price,
        quantity,
      }));
      const { error } = await supabase.from('transactions').insert({
        total_amount: total,
        items_json: itemsJson,
        client_name: clientName.trim() || null,
        staff_id: staffId || null,
      });
      if (error) {
        setToast(`Error: ${error.message}`);
        setTimeout(() => setToast(null), 4000);
        return;
      }
      setCart([]);
      setClientName('');
      setToast('Payment successful!');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
        <p className="text-gray-400 text-sm">Select services and complete payment.</p>
      </div>

      <div className="flex-1 flex min-h-0 p-6 gap-6">
        {/* Left: Services grid */}
        <div className="flex-1 min-w-0 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => addToCart(service)}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg group-hover:bg-purple-500/30">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{service.name}</p>
                      <p className="text-green-400 font-semibold">{Number(service.price)} DH</p>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-400 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="w-full sm:w-96 flex flex-col bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-700 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Cart</h2>
          </div>
          <div className="p-4 border-b border-gray-700 space-y-3">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1">Client (optional)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Walk-in if empty"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1">Staff</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Cart is empty. Add services from the left.</p>
            ) : (
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li
                    key={item.serviceId}
                    className="flex items-center gap-2 bg-gray-900/60 rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.name}</p>
                      <p className="text-gray-400 text-sm">{Number(item.price)} DH × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.serviceId, -1)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.serviceId, 1)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.serviceId)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t border-gray-700 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-green-400">{total.toFixed(2)} DH</span>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={cart.length === 0 || paying}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Pay
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-6 py-3 rounded-xl bg-gray-800 border border-gray-600 text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
