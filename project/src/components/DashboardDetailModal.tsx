import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type AppointmentListItem } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';

export type DashboardDetailType =
  | 'reservations'
  | 'revenue'
  | 'forecast'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

interface DashboardDetailModalProps {
  year: number;
  month: number;
  day?: number | null;
  type: DashboardDetailType;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getRange(year: number, month: number, day?: number | null) {
  if (day != null) {
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
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

type RevenueItem = { client_name: string; service: string; price: number; date_time: string };

export default function DashboardDetailModal({ year, month, day = null, type, onClose }: DashboardDetailModalProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [forecastTotal, setForecastTotal] = useState(0);

  const monthLabel = MONTHS[month - 1];
  const periodLabel = day != null ? `${monthLabel} ${day}, ${year}` : `${monthLabel} ${year}`;
  const titles: Record<DashboardDetailType, string> = {
    reservations: `All reservations – ${periodLabel}`,
    revenue: `Revenue – ${periodLabel}`,
    forecast: `Forecast revenue (scheduled) – ${periodLabel}`,
    scheduled: `Scheduled – ${periodLabel}`,
    'in-progress': `In progress – ${periodLabel}`,
    completed: `Completed – ${periodLabel}`,
    cancelled: `Cancelled – ${periodLabel}`,
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { start, end } = getRange(year, month, day);

      if (type === 'reservations' || type === 'scheduled' || type === 'in-progress' || type === 'completed' || type === 'cancelled') {
        const { data } = await supabase
          .from('appointments')
          .select('id, client_name, date_time, status, services:service_id(name, price), staff:staff_id(name)')
          .gte('date_time', start)
          .lte('date_time', end)
          .order('date_time', { ascending: false });
        let list = (data || []) as AppointmentListItem[];
        if (type !== 'reservations') {
          list = list.filter((a) => a.status === type);
        }
        setAppointments(list);
        setRevenueItems([]);
        setRevenueTotal(0);
        setForecastTotal(0);
      } else if (type === 'revenue') {
        const [aptsRes, txRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('client_name, date_time, status, services:service_id(name, price)')
            .eq('status', 'completed')
            .gte('date_time', start)
            .lte('date_time', end),
          supabase
            .from('transactions')
            .select('total_amount, items_json, created_at')
            .gte('created_at', start)
            .lte('created_at', end),
        ]);
        const apts = aptsRes.data || [];
        const txs = txRes.data || [];
        const aptItems: RevenueItem[] = apts.map((a) => ({
          client_name: a.client_name,
          service: getServiceName(a.services as AppointmentListItem['services']),
          price: getServicePrice(a.services),
          date_time: (a as { date_time?: string }).date_time ?? '',
        })).filter((i) => i.price > 0);
        const txItems: RevenueItem[] = (txs as { total_amount?: number; items_json?: unknown; created_at?: string }[]).map((t) => {
          const amount = Number(t.total_amount ?? 0);
          const items = Array.isArray(t.items_json) ? t.items_json : [];
          const first = items[0] as { name?: string } | undefined;
          const label = items.length > 1
            ? `${first?.name ?? 'POS'} +${items.length - 1} more`
            : (first?.name ?? 'POS sale');
          return { client_name: 'Walk-in', service: label, price: amount, date_time: (t as { created_at?: string }).created_at ?? '' };
        });
        const items = [...aptItems, ...txItems].sort((a, b) => (a.date_time > b.date_time ? -1 : a.date_time < b.date_time ? 1 : 0));
        const total = items.reduce((s, i) => s + i.price, 0);
        setRevenueItems(items);
        setRevenueTotal(total);
        setAppointments([]);
        setForecastTotal(0);
      } else if (type === 'forecast') {
        const { data } = await supabase
          .from('appointments')
          .select('id, client_name, date_time, status, services:service_id(name, price)')
          .eq('status', 'scheduled')
          .gte('date_time', start)
          .lte('date_time', end)
          .order('date_time', { ascending: true });
        const apts = (data || []) as (AppointmentListItem & { services?: { price?: number } | { price?: number }[] })[];
        const items: RevenueItem[] = apts.map((a) => ({
          client_name: a.client_name,
          service: getServiceName(a.services),
          price: getServicePrice(a.services),
          date_time: a.date_time,
        })).filter((i) => i.price > 0);
        const total = items.reduce((s, i) => s + i.price, 0);
        setForecastTotal(total);
        setRevenueItems(items);
        setAppointments([]);
        setRevenueTotal(0);
      }
      setLoading(false);
    };
    fetchData();
  }, [year, month, day, type]);

  const showRevenueList = type === 'revenue' || type === 'forecast';
  const showAppointments = type === 'reservations' || type === 'scheduled' || type === 'in-progress' || type === 'completed' || type === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[85vh] mx-4 overflow-hidden shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-white">{titles[type]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="overflow-y-auto min-h-0 max-h-[60vh] pr-2 [scrollbar-width:auto] [scrollbar-color:rgb(156_163_175)_rgb(55_65_81)] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-300">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : showRevenueList ? (
              <div className="space-y-3">
                {revenueItems.length === 0 ? (
                  <p className="text-gray-400">
                    {type === 'forecast' ? 'No scheduled appointments with service price' : `No revenue in ${periodLabel}`}
                  </p>
                ) : (
                  <>
                    {revenueItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700">
                        <div>
                          <span className="text-white font-medium">{item.client_name}</span>
                          <span className="text-gray-400 text-sm ml-2">— {item.service}</span>
                          {type === 'forecast' && item.date_time && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {new Date(item.date_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          )}
                        </div>
                        <span className="text-green-400 font-medium">{Number(item.price).toFixed(2)} {settings.currency}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 font-bold text-white border-t border-gray-600">
                      <span>{type === 'forecast' ? 'Forecast total' : 'Total'}</span>
                      <span className="text-green-400">
                        {(type === 'forecast' ? forecastTotal : revenueTotal).toFixed(2)} {settings.currency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : showAppointments ? (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-gray-400">No appointments in this period</p>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="flex justify-between items-center py-3 border-b border-gray-700">
                      <div>
                        <span className="text-white font-medium">{apt.client_name}</span>
                        <p className="text-gray-400 text-sm">{getServiceName(apt.services)}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(apt.date_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
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
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
