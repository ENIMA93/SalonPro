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
  onEdit?: (apt: EditingAppointment) => void;
  onCancel?: (apt: AppointmentRow) => void;
}

export default function AppointmentsList({ refreshKey = 0, onEdit, onCancel }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error: fetchError } = await supabase
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
          .order('date_time', { ascending: true });

        if (fetchError) throw fetchError;

        setAppointments((data || []) as AppointmentRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [refreshKey]);

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
    appointments: appointments.filter((a) => a.status === status),
  }));

  const renderAppointment = (appointment: AppointmentRow) => (
    <div
      key={appointment.id}
      className="p-6 hover:bg-gray-700/50 transition-colors flex items-center justify-between"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
          {appointment.client_name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold">{appointment.client_name}</h3>
          <p className="text-gray-400 text-sm">
            {getServiceName(appointment.services)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{formatTime(appointment.date_time)}</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            statusColors[appointment.status]
          }`}
        >
          {statusLabels[appointment.status]}
        </span>
        {appointment.status !== 'cancelled' && onEdit && onCancel && (
          <div className="flex items-center gap-1">
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
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
              aria-label="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Cancel"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Recent Appointments</h2>
      </div>

      {error && (
        <div className="p-6 flex items-center gap-3 bg-red-500/10 text-red-400 border-b border-gray-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <p className="mt-2">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          No appointments found
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {byStatus.map(({ status, appointments: list }) =>
            list.length > 0 ? (
              <div key={status}>
                <div className="px-6 py-3 bg-gray-700/40 border-b border-gray-700 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                    {statusLabels[status]}
                  </span>
                  <span className="text-gray-400 text-sm">({list.length})</span>
                </div>
                {list.map(renderAppointment)}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
