import { useEffect, useState } from 'react';
import { X, Loader2, Plus, Minus, Trash2, ShoppingCart, Check } from 'lucide-react';
import { supabase, type Service, type Staff } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';

type CartItem = {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
};

interface CompletionSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientName: string;
  defaultStaffId: string;
}

export default function CompletionSaleModal({
  isOpen,
  onClose,
  onSuccess,
  clientName,
  defaultStaffId,
}: CompletionSaleModalProps) {
  const { settings } = useSettings();
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [staffId, setStaffId] = useState(defaultStaffId);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCart([]);
    setStaffId(defaultStaffId);
    setError(null);
    const fetch = async () => {
      setLoading(true);
      const [svcRes, staffRes] = await Promise.all([
        supabase.from('services').select('*').order('name'),
        supabase.from('staff').select('*').eq('is_active', true).order('name'),
      ]);
      setServices(svcRes.data || []);
      setStaff(staffRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [isOpen, defaultStaffId]);

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

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.serviceId === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.serviceId !== id));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePay = async () => {
    if (cart.length === 0) {
      setError('Add at least one product.');
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const itemsJson = cart.map(({ serviceId, name, price, quantity }) => ({
        service_id: serviceId,
        name,
        price,
        quantity,
      }));
      const { error: insertError } = await supabase.from('transactions').insert({
        total_amount: total,
        items_json: itemsJson,
        client_name: clientName.trim() || null,
        staff_id: staffId || null,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      onSuccess();
      onClose();
    } finally {
      setPaying(false);
    }
  };

  const handleSkip = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-bold text-white">Add products purchased by {clientName}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Services */}
          <div className="flex-1 overflow-auto p-4 border-r border-gray-700">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addToCart(s)}
                    className="bg-gray-700/80 rounded-lg p-3 border border-gray-600 hover:border-purple-500/50 text-left"
                  >
                    <p className="text-white font-medium truncate text-sm">{s.name}</p>
                    <p className="text-green-400 font-semibold text-sm">{Number(s.price)} {settings.currency}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Cart */}
          <div className="w-80 flex flex-col shrink-0 border-l border-gray-700">
            <div className="p-3 border-b border-gray-700 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Cart</span>
            </div>
            <div className="p-3 border-b border-gray-700">
              <p className="text-gray-400 text-xs">Client</p>
              <p className="text-white font-medium truncate">{clientName}</p>
            </div>
            <div className="p-3 border-b border-gray-700">
              <label className="block text-gray-400 text-xs mb-1">Staff</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-auto p-3 min-h-0">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">Cart empty. Select products on the left.</p>
              ) : (
                <ul className="space-y-2">
                  {cart.map((item) => (
                    <li key={item.serviceId} className="flex items-center gap-2 bg-gray-900/80 rounded p-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{item.name}</p>
                        <p className="text-gray-400 text-xs">{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button type="button" onClick={() => updateQuantity(item.serviceId, -1)} className="p-1 rounded text-gray-400 hover:text-white">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-5 text-center text-white">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.serviceId, 1)} className="p-1 rounded text-gray-400 hover:text-white">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => removeFromCart(item.serviceId)} className="p-1 rounded text-red-400 hover:bg-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 border-t border-gray-700 space-y-2">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-between text-white font-semibold">
                <span>Total</span>
                <span className="text-green-400">{total.toFixed(2)} {settings.currency}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm font-medium"
                >
                  Skip (no products)
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={cart.length === 0 || paying}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Pay & complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
