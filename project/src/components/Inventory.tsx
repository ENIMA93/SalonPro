import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Package, Search, AlertTriangle, Boxes, RefreshCw, ChevronRight, X } from 'lucide-react';
import { supabase, type Inventory } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';
import ProductModal from './ProductModal';

const LOW_STOCK_THRESHOLD = 5;

export default function Inventory() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Inventory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [kpiDetail, setKpiDetail] = useState<'total' | 'low_stock' | 'value' | null>(null);

  const fetchProducts = async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .order('product_name');
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setProducts((data ?? []) as Inventory[]);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchProducts();
      setLoading(false);
    };
    load();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Inventory) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleModalSuccess = async (newOrUpdated?: Inventory) => {
    setSearch('');
    setFilterGender('all');
    setFilterCategory('all');
    await fetchProducts();
  };

  const handleDelete = async (item: Inventory) => {
    if (!window.confirm(`Delete "${item.product_name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    setError(null);
    const { error: deleteError } = await supabase.from('inventory').delete().eq('id', item.id);
    setDeletingId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchProducts();
  };

  const q = search.trim().toLowerCase();
  const bySearch = !q ? products : products.filter((p) => p.product_name.toLowerCase().includes(q));
  const filtered = bySearch.filter((p) => {
    if (filterGender !== 'all' && (p.gender ?? 'all') !== filterGender) return false;
    if (filterCategory !== 'all' && (p.category ?? 'other') !== filterCategory) return false;
    return true;
  });
  const lowStockCount = products.filter((p) => p.stock_count <= LOW_STOCK_THRESHOLD).length;
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * (p.stock_count ?? 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900 min-w-0 overflow-hidden">
      <ProductModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        onSuccess={handleModalSuccess}
        product={editingProduct}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col p-6 md:p-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Inventory</h1>
              <p className="text-gray-400 text-sm mt-0.5">Manage products and stock. Add or edit from here.</p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); }}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
              title="Reload list from server"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setKpiDetail('total')}
              className="bg-gray-800/60 rounded-xl border border-gray-700/80 p-4 flex items-center gap-3 text-left hover:border-gray-600 hover:bg-gray-800/80 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-gray-700/80">
                <Boxes className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm font-medium">Total products</p>
                <p className="text-xl font-bold text-white">{products.length}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => setKpiDetail('low_stock')}
              className="bg-gray-800/60 rounded-xl border border-gray-700/80 p-4 flex items-center gap-3 text-left hover:border-amber-500/50 hover:bg-gray-800/80 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm font-medium">Low stock (≤{LOW_STOCK_THRESHOLD})</p>
                <p className="text-xl font-bold text-white">{lowStockCount}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => setKpiDetail('value')}
              className="bg-gray-800/60 rounded-xl border border-gray-700/80 p-4 flex items-center gap-3 text-left hover:border-green-500/50 hover:bg-gray-800/80 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-green-500/20">
                <Package className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm font-medium">Stock value</p>
                <p className="text-xl font-bold text-green-400">{totalValue.toFixed(2)} {settings.currency}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-green-400 shrink-0" />
            </button>
          </div>
        )}

        {kpiDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setKpiDetail(null)} />
            <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white">
                  {kpiDetail === 'total' && 'All products'}
                  {kpiDetail === 'low_stock' && `Low stock (≤${LOW_STOCK_THRESHOLD} units)`}
                  {kpiDetail === 'value' && 'Stock value breakdown'}
                </h2>
                <button
                  type="button"
                  onClick={() => setKpiDetail(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 flex-1 min-h-0">
                {kpiDetail === 'total' && (
                  <ul className="space-y-2">
                    {products.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-white font-medium truncate">{p.product_name}</span>
                        <span className="text-gray-400 text-sm shrink-0">Stock: {p.stock_count}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {kpiDetail === 'low_stock' && (
                  lowStockCount === 0 ? (
                    <p className="text-gray-400 py-4">No products with low stock.</p>
                  ) : (
                    <ul className="space-y-2">
                      {products
                        .filter((p) => p.stock_count <= LOW_STOCK_THRESHOLD)
                        .sort((a, b) => a.stock_count - b.stock_count)
                        .map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-700/50 last:border-0">
                            <span className="text-white font-medium truncate">{p.product_name}</span>
                            <span className="text-amber-400 font-semibold shrink-0">{p.stock_count} left</span>
                            <button
                              type="button"
                              onClick={() => { setKpiDetail(null); openEditModal(p); }}
                              className="shrink-0 text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </li>
                        ))}
                    </ul>
                  )
                )}
                {kpiDetail === 'value' && (
                  <ul className="space-y-2">
                    {[...products]
                      .map((p) => ({ product: p, value: Number(p.price) * (p.stock_count ?? 0) }))
                      .sort((a, b) => b.value - a.value)
                      .map(({ product, value }) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-700/50 last:border-0">
                          <span className="text-white font-medium truncate">{product.product_name}</span>
                          <span className="text-green-400 font-medium shrink-0">
                            {value.toFixed(2)} {settings.currency}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="relative max-w-xs flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 focus:outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-gray-400 text-sm">Gender:</span>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
              </select>
              <span className="text-gray-400 text-sm">Type:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="hair">Hair</option>
                <option value="face">Face</option>
                <option value="hand">Hand</option>
                <option value="body">Body</option>
                <option value="nails">Nails</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
              <p className="mt-3 text-gray-400 text-sm">Loading inventory...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col bg-gray-800/40 rounded-2xl border border-gray-700/80 overflow-hidden shadow-xl">
            {filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="p-4 rounded-2xl bg-gray-700/50 mb-4">
                  <Package className="w-14 h-14 text-gray-500" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  {filtered.length === 0 && bySearch.length > 0
                    ? 'No products match filters'
                    : q
                      ? `No products match "${search.trim()}"`
                      : 'No products yet'}
                </h2>
                <p className="text-gray-400 text-sm max-w-sm mb-6">
                  {q ? 'Try a different search term.' : 'Add your first product to start tracking stock and selling from POS.'}
                </p>
                {!q && (
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Add Product
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-auto min-h-0 p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((item) => {
                    const isLowStock = item.stock_count <= LOW_STOCK_THRESHOLD;
                    const rowValue = Number(item.price) * (item.stock_count ?? 0);
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-800/80 rounded-xl border border-gray-700 hover:border-gray-600 transition-all p-5 flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                            <h3 className="text-white font-semibold text-base break-words">{item.product_name}</h3>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/20 transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              aria-label="Delete"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Stock</span>
                            <span className={isLowStock ? 'text-amber-400 font-semibold' : 'text-white font-medium'}>
                              {item.stock_count}
                              {isLowStock && ' ⚠'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Price</span>
                            <span className="text-green-400 font-medium">
                              {Number(item.price).toFixed(2)} {settings.currency}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-700/80">
                            <span className="text-gray-400">Value</span>
                            <span className="text-gray-300 font-medium">
                              {rowValue.toFixed(2)} {settings.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
