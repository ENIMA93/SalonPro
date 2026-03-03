import { useEffect, useState } from 'react';
import { Scissors, Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase, type Service } from '../lib/supabase';
import ServiceModal from './ServiceModal';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('name');
    setServices(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchServices();
      setLoading(false);
    };
    load();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingService(s);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingService(null);
  };

  const handleDelete = async (s: Service) => {
    if (!window.confirm(`Delete "${s.name}"? Appointments using this service may be affected.`)) return;
    const { error } = await supabase.from('services').delete().eq('id', s.id);
    if (error) {
      alert(error.message);
      return;
    }
    await fetchServices();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900 overflow-hidden">
      <ServiceModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={() => { fetchServices(); handleCloseModal(); }}
        service={editingService}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Services</h1>
              <p className="text-gray-400 text-sm">Manage your salon services and pricing.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors text-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>

          {!loading && services.length > 0 && (
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            </div>
          ) : (() => {
            const filtered = services.filter(
              (s) => !search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())
            );
            const typeOrder = ['hair', 'face', 'hand', 'body', 'nails', 'other'];
            const byType = typeOrder.map((t) => ({
              type: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
              items: filtered.filter((s) => (s.service_type ?? 'other') === t),
            })).filter((g) => g.items.length > 0);
            return (
              <div className="space-y-8">
                {byType.length === 0 ? (
                  <div className="bg-gray-800/60 rounded-lg border border-gray-700 p-12 text-center text-gray-400">
                    {search.trim() ? `No services match "${search.trim()}"` : 'No services yet. Add your first service.'}
                  </div>
                ) : (
                  byType.map(({ type, label, items }) => (
                    <div key={type}>
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</h2>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map((s) => (
                          <div
                            key={s.id}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all flex flex-col min-w-0"
                          >
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <div className="bg-purple-500/20 text-purple-400 p-2 rounded shrink-0">
                                  <Scissors className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-white font-medium text-sm break-words">{s.name}</h3>
                                  <p className="text-gray-400 text-xs mt-0.5">{s.duration_min} min · {(s.gender_category ?? 'all')}</p>
                                  <p className="text-green-400 font-semibold text-sm mt-1">{Number(s.price)} DH</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(s)}
                                  className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
                                  aria-label="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(s)}
                                  className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
