import { useEffect, useState } from 'react';
import { X, Loader2, Scissors } from 'lucide-react';
import { supabase, type Service as ServiceType } from '../lib/supabase';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service: ServiceType | null;
}

const GENDER_OPTIONS = ['all', 'men', 'women', 'kids'];

export default function ServiceModal({ isOpen, onClose, onSuccess, service }: ServiceModalProps) {
  const [name, setName] = useState('');
  const [durationMin, setDurationMin] = useState<number>(30);
  const [price, setPrice] = useState<number>(0);
  const [genderCategory, setGenderCategory] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!service;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (service) {
      setName(service.name);
      setDurationMin(service.duration_min);
      setPrice(Number(service.price));
      setGenderCategory(service.gender_category || 'all');
    } else {
      setName('');
      setDurationMin(30);
      setPrice(0);
      setGenderCategory('all');
    }
  }, [isOpen, service]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Service name is required');
      return;
    }
    if (durationMin < 1) {
      setError('Duration must be at least 1 minute');
      return;
    }
    if (price < 0) {
      setError('Price cannot be negative');
      return;
    }
    setSubmitting(true);
    setError(null);

    if (isEdit && service) {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          name: name.trim(),
          duration_min: durationMin,
          price,
          gender_category: genderCategory,
        })
        .eq('id', service.id);
      setSubmitting(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('services').insert({
        name: name.trim(),
        duration_min: durationMin,
        price,
        gender_category: genderCategory,
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
              <Scissors className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Service' : 'Add Service'}
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
            <label className="block text-gray-400 text-sm font-medium mb-1">Service name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Haircut"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Duration (min)</label>
              <input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value, 10) || 0)}
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
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Gender category</label>
            <select
              value={genderCategory}
              onChange={(e) => setGenderCategory(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-gray-800">
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
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
              {isEdit ? 'Save' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
