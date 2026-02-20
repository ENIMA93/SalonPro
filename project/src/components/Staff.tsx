import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase, type Staff as StaffType } from '../lib/supabase';
import StaffModal from './StaffModal';

export default function Staff() {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('name');
    setStaff(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStaff();
      setLoading(false);
    };
    load();
  }, []);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: StaffType) => {
    setEditingStaff(s);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  const handleDelete = async (s: StaffType) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('staff').delete().eq('id', s.id);
    if (error) {
      alert(error.message);
      return;
    }
    await fetchStaff();
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <StaffModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={() => { fetchStaff(); handleCloseModal(); }}
          staff={editingStaff}
        />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
            <p className="text-gray-400">Barbers and stylists at your salon.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-lg">{s.name}</h3>
                    <p className="text-gray-400">{s.role}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
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
