import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type Staff, type AppointmentListItem } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';

type KPIType = 'revenue' | 'appointments' | 'clients' | 'staff';

interface KPIDetailModalProps {
  type: KPIType;
  onClose: () => void;
}

function getServiceName(services: AppointmentListItem['services']): string {
  if (!services) return 'Service';
  return Array.isArray(services) ? services[0]?.name ?? 'Service' : services.name ?? 'Service';
}

function getServicePrice(services: unknown): number {
  const s = services as { price?: number } | { price?: number }[] | null;
  if (!s) return 0;
  return Array.isArray(s) ? (s[0]?.price ?? 0) : (s?.price ?? 0);
}

export default function KPIDetailModal({ type, onClose }: KPIDetailModalProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    | { type: 'revenue'; items: { client_name: string; service: string; price: number }[]; total: number }
    | { type: 'appointments'; items: AppointmentListItem[] }
    | { type: 'clients'; items: string[] }
    | { type: 'staff'; items: Staff[] }
  | null>(null);

  const titles: Record<KPIType, string> = {
    revenue: 'Revenue (Today) – Appointments + POS',
    appointments: 'Appointments (Today)',
    clients: 'New Clients (This Week)',
    staff: 'Staff',
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      switch (type) {
        case 'revenue': {
          const [aptsRes, txRes] = await Promise.all([
            supabase
              .from('appointments')
              .select('client_name, status, services:service_id(name, price)')
              .eq('status', 'completed')
              .gte('date_time', todayStart)
              .lt('date_time', todayEnd),
            supabase
              .from('transactions')
              .select('total_amount, items_json')
              .gte('created_at', todayStart)
              .lt('created_at', todayEnd)
              .order('created_at', { ascending: true }),
          ]);
          const apts = aptsRes.data || [];
          const txs = txRes.data || [];
          const appointmentItems = apts
            .map((a) => ({
              client_name: a.client_name,
              service: getServiceName(a.services as AppointmentListItem['services']),
              price: getServicePrice(a.services),
            }))
            .filter((i) => i.price > 0);
          const transactionItems = txs.map((t) => {
            const amount = Number(t.total_amount ?? 0);
            const items = Array.isArray(t.items_json) ? t.items_json : [];
            const first = items[0] as { name?: string } | undefined;
            const label = items.length > 1
              ? `${first?.name ?? 'POS'} +${items.length - 1} more`
              : (first?.name ?? 'POS sale');
            return { client_name: 'Walk-in', service: label, price: amount };
          });
          const items = [...appointmentItems, ...transactionItems];
          const total = items.reduce((s, i) => s + i.price, 0);
          setData({ type: 'revenue', items, total });
          break;
        }
        case 'appointments': {
          const { data: apts } = await supabase
            .from('appointments')
            .select('id, client_name, date_time, status, services:service_id(name), staff:staff_id(name)')
            .gte('date_time', todayStart)
            .lt('date_time', todayEnd)
            .order('date_time', { ascending: true });
          setData({ type: 'appointments', items: (apts || []) as AppointmentListItem[] });
          break;
        }
        case 'clients': {
          const { data: apts } = await supabase
            .from('appointments')
            .select('client_name')
            .gte('created_at', weekStart)
            .lt('created_at', todayEnd);
          const unique = [...new Set((apts || []).map((a) => a.client_name).filter(Boolean))].sort();
          setData({ type: 'clients', items: unique });
          break;
        }
        case 'staff': {
          const { data: stf } = await supabase
            .from('staff')
            .select('*')
            .order('name');
          setData({ type: 'staff', items: stf || [] });
          break;
        }
      }
      setLoading(false);
    };
    fetch();
  }, [type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] mx-4 overflow-hidden shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-white">{titles[type]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : data?.type === 'revenue' ? (
            <div className="space-y-3">
              {data.items.length === 0 ? (
                <p className="text-gray-400">No revenue today (completed appointments or POS sales)</p>
              ) : (
                <>
                  {data.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-700">
                      <div>
                        <span className="text-white font-medium">{item.client_name}</span>
                        <span className="text-gray-400 text-sm ml-2">— {item.service}</span>
                      </div>
                      <span className="text-green-400 font-medium">{item.price} {settings.currency}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 font-bold text-white border-t border-gray-600">
                    <span>Total</span>
                    <span className="text-green-400">{data.total.toFixed(2)} {settings.currency}</span>
                  </div>
                </>
              )}
            </div>
          ) : data?.type === 'appointments' ? (
            <div className="space-y-3">
              {data.items.length === 0 ? (
                <p className="text-gray-400">No appointments today</p>
              ) : (
                data.items.map((apt) => (
                  <div key={apt.id} className="flex justify-between items-center py-3 border-b border-gray-700">
                    <div>
                      <span className="text-white font-medium">{apt.client_name}</span>
                      <p className="text-gray-400 text-sm">{getServiceName(apt.services)}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(apt.date_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      apt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      apt.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                      apt.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : data?.type === 'clients' ? (
            <div className="space-y-2">
              {data.items.length === 0 ? (
                <p className="text-gray-400">No new clients this week</p>
              ) : (
                data.items.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                      {name.charAt(0)}
                    </div>
                    <span className="text-white">{name}</span>
                  </div>
                ))
              )}
            </div>
          ) : data?.type === 'staff' ? (
            <div className="space-y-3">
              {data.items.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-white font-medium">{s.name}</span>
                      <p className="text-gray-400 text-sm">{s.role}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
