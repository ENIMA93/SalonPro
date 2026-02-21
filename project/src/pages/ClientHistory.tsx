import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Calendar, ShoppingBag } from 'lucide-react';
import { supabase, type Client } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';

type AppointmentRow = {
  id: string;
  client_name: string;
  date_time: string;
  status: string;
  service_id: string;
  staff_id: string;
  services: { name: string } | null;
  staff: { name: string } | null;
};

type TransactionRow = {
  id: string;
  created_at: string;
  total_amount: number;
  items_json: { name: string; price: number; quantity: number }[];
  client_name: string | null;
};

interface ClientHistoryProps {
  client: Client;
  onBack: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ClientHistory({ client, onBack }: ClientHistoryProps) {
  const { settings } = useSettings();
  const currency = settings?.currency ?? 'DH';
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const clientNameTrim = client.name.trim();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [aptRes, txRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, client_name, date_time, status, service_id, staff_id, services:service_id(name), staff:staff_id(name)')
          .eq('client_name', clientNameTrim)
          .order('date_time', { ascending: false }),
        supabase
          .from('transactions')
          .select('id, created_at, total_amount, items_json, client_name')
          .eq('client_name', clientNameTrim)
          .order('created_at', { ascending: false }),
      ]);
      setAppointments((aptRes.data || []) as AppointmentRow[]);
      setTransactions((txRes.data || []) as TransactionRow[]);
      setLoading(false);
    };
    fetch();
  }, [clientNameTrim]);

  const parseItems = (raw: unknown): { name: string; price: number; quantity: number }[] => {
    if (Array.isArray(raw)) return raw as { name: string; price: number; quantity: number }[];
    return [];
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Clients
        </button>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-700">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <span className="text-gray-500 text-sm font-mono" title={client.id}>#{client.id.slice(0, 8)}</span>
            </div>
            {client.phone && <p className="text-gray-400">{client.phone}</p>}
            {client.email && <p className="text-gray-500 text-sm">{client.email}</p>}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                <Calendar className="w-5 h-5 text-purple-400" />
                Services (appointments)
              </h2>
              {appointments.length === 0 ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-gray-400">
                  No appointments yet.
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <ul className="divide-y divide-gray-700">
                    {appointments.map((apt) => (
                      <li key={apt.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-white font-medium">
                            {(apt.services as { name: string } | null)?.name ?? '—'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(apt.date_time)}
                            {(apt.staff as { name: string } | null)?.name && (
                              <> · {(apt.staff as { name: string }).name}</>
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            apt.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : apt.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-400'
                                : apt.status === 'in-progress'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                Products purchased
              </h2>
              {transactions.length === 0 ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-gray-400">
                  No purchases yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const items = parseItems(tx.items_json);
                    return (
                      <div
                        key={tx.id}
                        className="bg-gray-800 rounded-xl border border-gray-700 p-4"
                      >
                        <p className="text-gray-400 text-sm mb-2">{formatDate(tx.created_at)}</p>
                        <ul className="space-y-1 mb-3">
                          {items.map((item, i) => (
                            <li key={i} className="text-white flex justify-between">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-gray-400">
                                {Number(item.price * item.quantity).toFixed(2)} {currency}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-right font-semibold text-green-400">
                          Total: {Number(tx.total_amount).toFixed(2)} {currency}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
