import { useEffect, useState } from 'react';
import { X, Loader2, Package } from 'lucide-react';
import { supabase, type Inventory } from '../lib/supabase';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Inventory | null;
}

export default function ProductModal({ isOpen, onClose, onSuccess, product }: ProductModalProps) {
  const [productName, setProductName] = useState('');
  const [stockCount, setStockCount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!product;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (product) {
      setProductName(product.product_name);
      setStockCount(product.stock_count);
      setPrice(Number(product.price));
    } else {
      setProductName('');
      setStockCount(0);
      setPrice(0);
    }
  }, [isOpen, product]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Product name is required');
      return;
    }
    if (price < 0 || stockCount < 0) {
      setError('Stock and price must be 0 or greater');
      return;
    }
    setSubmitting(true);
    setError(null);

    if (isEdit && product) {
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          product_name: productName.trim(),
          stock_count: stockCount,
          price,
        })
        .eq('id', product.id);
      setSubmitting(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('inventory').insert({
        product_name: productName.trim(),
        stock_count: stockCount,
        price,
      });
      setSubmitting(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
    }
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Product' : 'Add Product'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Product name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Shampoo Revitalizing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                min={0}
                value={stockCount}
                onChange={(e) => setStockCount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Price (DH)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Save' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
