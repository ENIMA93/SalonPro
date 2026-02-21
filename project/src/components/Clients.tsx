import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, History, Search } from 'lucide-react';
import { supabase, type Client as ClientType } from '../lib/supabase';
import ClientModal from './ClientModal';

interface ClientsProps {
  onSelectClient?: (client: ClientType) => void;
}

export default function Clients({ onSelectClient }: ClientsProps) {
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name');
    setClients(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchClients();
      setLoading(false);
    };
    load();
  }, []);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: ClientType) => {
    setEditingClient(c);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (c: ClientType) => {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('clients').delete().eq('id', c.id);
    if (error) {
      alert(error.message);
      return;
    }
    await fetchClients();
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <ClientModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={() => { fetchClients(); handleCloseModal(); }}
          client={editingClient}
        />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
            <p className="text-gray-400">Manage your client list.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        </div>

        {!loading && clients.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients by name, phone, or email..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center text-gray-400">
            No clients yet. Add your first client to get started.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients
              .filter((c) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                  c.name.toLowerCase().includes(q) ||
                  (c.phone && c.phone.toLowerCase().includes(q)) ||
                  (c.email && c.email.toLowerCase().includes(q))
                );
              })
              .map((c) => (
              <div
                key={c.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-between gap-4"
              >
                <button
                  type="button"
                  onClick={() => onSelectClient?.(c)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors">{c.name}</h3>
                      <span className="text-gray-500 text-xs font-mono" title={c.id}>#{c.id.slice(0, 8)}</span>
                    </div>
                    {c.phone && <p className="text-gray-400 text-sm">{c.phone}</p>}
                    {c.email && <p className="text-gray-500 text-sm truncate">{c.email}</p>}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectClient?.(c)}
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-gray-700 transition-colors"
                    title="View history"
                    aria-label="View history"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
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
