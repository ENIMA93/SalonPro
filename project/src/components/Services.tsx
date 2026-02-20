import { useEffect, useState } from 'react';
import { Scissors, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase, type Service } from '../lib/supabase';
import ServiceModal from './ServiceModal';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

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
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <ServiceModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={() => { fetchServices(); handleCloseModal(); }}
          service={editingService}
        />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Services</h1>
            <p className="text-gray-400">Manage your salon services and pricing.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="bg-purple-500/20 text-purple-400 p-3 rounded-lg shrink-0">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg">{s.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{s.duration_min} min • {s.gender_category}</p>
                    <p className="text-green-400 font-semibold mt-2">{Number(s.price)} DH</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
