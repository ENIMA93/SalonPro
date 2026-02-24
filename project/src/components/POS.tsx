import { useEffect, useState } from 'react';
import { ShoppingCart, Loader2, Plus, Minus, Trash2, CreditCard, Check, Package } from 'lucide-react';
import { supabase, type Service, type Staff, type Client, type Inventory } from '../lib/supabase';
import ClientNameInput from './ClientNameInput';
import ExistingClientNotice from './ExistingClientNotice';

type CartItem =
  | { type: 'service'; id: string; name: string; price: number; quantity: number }
  | { type: 'product'; id: string; name: string; price: number; quantity: number };

function cartItemKey(item: CartItem) {
  return `${item.type}-${item.id}`;
}

export default function POS() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [existingClientInPOS, setExistingClientInPOS] = useState<Client | null>(null);
  const [isSamePersonInPOS, setIsSamePersonInPOS] = useState(true);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('product_name');
    setInventory(data || []);
  };

  useEffect(() => {
    const fetch = async () => {
      const [svcRes, staffRes, invRes] = await Promise.all([
        supabase.from('services').select('*').order('name'),
        supabase.from('staff').select('*').eq('is_active', true).order('name'),
        supabase.from('inventory').select('*').order('product_name'),
      ]);
      setServices(svcRes.data || []);
      setStaff(staffRes.data || []);
      setStaffId(staffRes.data?.[0]?.id ?? '');
      setInventory(invRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    const name = clientName.trim();
    if (!name || name.length < 2) {
      setExistingClientInPOS(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('clients')
      .select('id, name, phone, email, created_at')
      .eq('name', name)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setExistingClientInPOS(data as Client);
        else if (!cancelled) setExistingClientInPOS(null);
      });
    return () => { cancelled = true; };
  }, [clientName]);

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === 'service' && i.id === service.id);
      if (existing) {
        return prev.map((i) =>
          i.type === 'service' && i.id === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { type: 'service' as const, id: service.id, name: service.name, price: Number(service.price), quantity: 1 }];
    });
  };

  const addProductToCart = (product: Inventory) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === 'product' && i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.type === 'product' && i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { type: 'product' as const, id: product.id, name: product.product_name, price: Number(product.price), quantity: 1 }];
    });
  };

  const updateQuantity = (item: CartItem, delta: number) => {
    const key = cartItemKey(item);
    setCart((prev) =>
      prev
        .map((i) => (cartItemKey(i) === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (item: CartItem) => {
    const key = cartItemKey(item);
    setCart((prev) => prev.filter((i) => cartItemKey(i) !== key));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePay = async () => {
    if (cart.length === 0) return;
    setPaying(true);
    try {
      const itemsJson = cart.map((item) => {
        if (item.type === 'service') {
          return { service_id: item.id, name: item.name, price: item.price, quantity: item.quantity };
        }
        return { product_id: item.id, name: item.name, price: item.price, quantity: item.quantity };
      });
      const { data: inserted, error } = await supabase
        .from('transactions')
        .insert({
          total_amount: total,
          items_json: itemsJson,
          client_name: clientName.trim() || null,
          staff_id: staffId || null,
        })
        .select('id')
        .single();
      if (error) {
        setToast(`Error: ${error.message}`);
        setTimeout(() => setToast(null), 4000);
        return;
      }
      const transactionId = inserted?.id;
      // Decrement inventory stock for product items; on first failure roll back and remove transaction
      const productItems = cart.filter((i): i is Extract<CartItem, { type: 'product' }> => i.type === 'product');
      const decremented: { id: string; quantity: number; previousStock: number }[] = [];
      for (const item of productItems) {
        const product = inventory.find((p) => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, product.stock_count - item.quantity);
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ stock_count: newStock })
            .eq('id', item.id);
          if (updateError) {
            // Roll back: restore stock for already-decremented products, then delete the transaction
            for (const d of decremented) {
              const p = inventory.find((x) => x.id === d.id);
              if (p) {
                await supabase
                  .from('inventory')
                  .update({ stock_count: d.previousStock })
                  .eq('id', d.id);
              }
            }
            if (transactionId) {
              await supabase.from('transactions').delete().eq('id', transactionId);
            }
            setToast(`Payment failed: inventory update failed for ${product.product_name}. No sale recorded.`);
            setTimeout(() => setToast(null), 6000);
            await fetchInventory();
            return;
          }
          decremented.push({ id: item.id, quantity: item.quantity, previousStock: product.stock_count });
        }
      }
      setCart([]);
      setClientName('');
      await fetchInventory();
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
        <p className="text-gray-400 text-sm">Select services or products and complete payment.</p>
      </div>

      <div className="flex-1 flex min-h-0 p-6 gap-6">
        {/* Left: Services + Products (scrollable) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-6 pr-2 [scrollbar-width:thin] [scrollbar-color:rgb(75_85_99)_transparent]">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Services
                  </h2>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => addToCart(service)}
                        className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg group-hover:bg-purple-500/30 shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate" title={service.name}>{service.name}</p>
                            <p className="text-green-400 font-semibold text-sm">{Number(service.price)} DH</p>
                          </div>
                          <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-400 shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Products (from inventory)
                  </h2>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {inventory.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProductToCart(product)}
                        className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-amber-500/50 hover:bg-gray-700/50 transition-all text-left group min-w-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg group-hover:bg-amber-500/30 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate" title={product.product_name}>{product.product_name}</p>
                            <p className="text-green-400 font-semibold text-sm">{Number(product.price)} DH</p>
                            <p className="text-gray-500 text-xs mt-0.5">Stock: {product.stock_count}</p>
                          </div>
                          <Plus className="w-5 h-5 text-gray-400 group-hover:text-amber-400 shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Cart — fixed height so Pay is always visible */}
        <div className="w-full sm:w-96 flex flex-col min-h-0 bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-700 flex items-center gap-2 shrink-0">
            <ShoppingCart className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Cart</h2>
          </div>
          <div className="p-4 border-b border-gray-700 space-y-3 shrink-0">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1">Client (optional)</label>
              <ClientNameInput
                value={clientName}
                onChange={setClientName}
                placeholder="Walk-in if empty"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
              {existingClientInPOS && (
                <ExistingClientNotice
                  existingClient={existingClientInPOS}
                  isSamePerson={isSamePersonInPOS}
                  onSamePersonChange={setIsSamePersonInPOS}
                  checkboxLabel="This is the same client we have in the system"
                  compact
                />
              )}
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
          <div className="flex-1 min-h-0 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:rgb(75_85_99)_transparent]">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Cart is empty. Add services or products from the left.</p>
            ) : (
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li
                    key={cartItemKey(item)}
                    className="flex items-center gap-2 bg-gray-900/60 rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate" title={item.name}>{item.name}</p>
                      <p className="text-gray-400 text-sm">{Number(item.price)} DH × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, -1)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, 1)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item)}
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
          <div className="p-4 border-t border-gray-700 space-y-3 shrink-0 bg-gray-800/80">
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
