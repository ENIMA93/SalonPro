import { useEffect, useState } from 'react';
import { Clock, AlertCircle, Pencil, XCircle } from 'lucide-react';
import { supabase, type AppointmentListItem } from '../lib/supabase';
import type { EditingAppointment } from './BookingModal';

const statusColors = {
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  scheduled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const statusLabels = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled'
};

function getServiceName(services: AppointmentListItem['services']): string {
  if (!services) return 'Service';
  return Array.isArray(services) ? services[0]?.name ?? 'Service' : services.name ?? 'Service';
}

type AppointmentRow = AppointmentListItem & { service_id?: string; staff_id?: string };

interface AppointmentsListProps {
  refreshKey?: number;
  searchQuery?: string;
  onEdit?: (apt: EditingAppointment) => void;
  onCancel?: (apt: AppointmentRow) => void;
}

export default function AppointmentsList({ refreshKey = 0, searchQuery = '', onEdit, onCancel }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [clientsForSearch, setClientsForSearch] = useState<{ name: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const [aptRes, clientsRes] = await Promise.all([
          supabase
            .from('appointments')
            .select(`
              id,
              client_name,
              date_time,
              status,
              service_id,
              staff_id,
              services:service_id(name),
              staff:staff_id(name)
            `)
            .order('date_time', { ascending: true }),
          supabase.from('clients').select('name, email'),
        ]);
        if (aptRes.error) throw aptRes.error;
        setAppointments((aptRes.data || []) as AppointmentRow[]);
        setClientsForSearch((clientsRes.data || []).map((c) => ({ name: c.name, email: c.email ?? null })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [refreshKey]);

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredAppointments = !searchLower
    ? appointments
    : appointments.filter((apt) => {
        const nameMatch = (apt.client_name || '').toLowerCase().includes(searchLower);
        if (nameMatch) return true;
        const client = clientsForSearch.find((c) => c.name === apt.client_name);
        return client?.email?.toLowerCase().includes(searchLower) ?? false;
      });

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const statusOrder = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;
  const byStatus = statusOrder.map((status) => ({
    status,
    appointments: filteredAppointments.filter((a) => a.status === status),
  }));

  const renderAppointment = (appointment: AppointmentRow) => (
    <div
      key={appointment.id}
      className="p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium text-sm truncate">{appointment.client_name}</p>
          <p className="text-gray-400 text-xs truncate">{getServiceName(appointment.services)}</p>
          <div className="flex items-center gap-1 mt-1 text-gray-500">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-xs">{formatTime(appointment.date_time)}</span>
          </div>
        </div>
        {appointment.status !== 'cancelled' && onEdit && onCancel && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit({
                id: appointment.id,
                client_name: appointment.client_name,
                service_id: appointment.service_id ?? '',
                staff_id: appointment.staff_id ?? '',
                date_time: appointment.date_time,
                status: appointment.status,
              })}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
              aria-label="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Cancel"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 space-y-3">
        <h2 className="text-lg font-bold text-white">Today&apos;s Appointments by Stage</h2>
        <p className="text-gray-400 text-sm mt-0.5">Scroll inside a column if needed</p>
      </div>

      {error && (
        <div className="p-4 flex items-center gap-3 bg-red-500/10 text-red-400 border-b border-gray-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <p className="mt-2 text-sm">Loading appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          {searchLower ? `No appointments match "${searchQuery.trim()}"` : 'No appointments found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {byStatus.map(({ status, appointments: list }) => (
            <div
              key={status}
              className="flex flex-col rounded-lg border border-gray-600/50 bg-gray-800/50 min-h-0"
            >
              <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                  {statusLabels[status]}
                </span>
                <span className="text-gray-500 text-xs">({list.length})</span>
              </div>
              <div className="flex-1 min-h-[120px] max-h-[280px] overflow-y-auto p-2 space-y-2">
                {list.length === 0 ? (
                  <p className="text-gray-500 text-xs py-4 text-center">None</p>
                ) : (
                  list.map(renderAppointment)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
