import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { supabase, type Inventory } from '../lib/supabase';
import ProductModal from './ProductModal';

export default function Inventory() {
  const [products, setProducts] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Inventory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .order('product_name');
    if (fetchError) {
      setError(fetchError.message);
      setProducts([]);
      return;
    }
    setProducts(data || []);
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

  const handleModalSuccess = () => {
    fetchProducts();
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

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Inventory</h1>
            <p className="text-gray-400">Manage your salon products and stock.</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        <ProductModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSuccess={handleModalSuccess}
          product={editingProduct}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/80">
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Product</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4 w-28">Stock</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4 w-32">Price</th>
                  <th className="text-right text-gray-400 font-medium px-6 py-4 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16">
                      <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No products yet.</p>
                      <p className="text-gray-500 text-sm mt-1">Click &quot;Add Product&quot; to get started.</p>
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-700 last:border-0 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{item.product_name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.stock_count}</td>
                      <td className="px-6 py-4 text-green-400 font-medium">{Number(item.price)} DH</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
