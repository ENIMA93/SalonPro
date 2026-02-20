import { useEffect, useState } from 'react';
import { Loader2, Clock, Pencil, XCircle } from 'lucide-react';
import { supabase, type AppointmentListItem } from '../lib/supabase';
import BookingModal, { type EditingAppointment } from './BookingModal';

type CalendarAppointment = AppointmentListItem & { service_id?: string; staff_id?: string };

function getServiceName(services: AppointmentListItem['services']): string {
  if (!services) return 'Service';
  return Array.isArray(services) ? services[0]?.name ?? 'Service' : services.name ?? 'Service';
}

export default function Calendar() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<EditingAppointment | null>(null);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, client_name, date_time, status, service_id, staff_id, services:service_id(name), staff:staff_id(name)')
      .order('date_time', { ascending: true });
    setAppointments((data || []) as CalendarAppointment[]);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAppointments();
      setLoading(false);
    };
    load();
  }, []);

  const handleCancel = async (apt: CalendarAppointment) => {
    if (!window.confirm(`Cancel this appointment with ${apt.client_name}?`)) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
    if (error) alert(error.message);
    else await fetchAppointments();
  };

  const formatDateTime = (dateTime: string) => {
    const d = new Date(dateTime);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    scheduled: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <BookingModal
          isOpen={!!editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSuccess={() => { fetchAppointments(); setEditingAppointment(null); }}
          editingAppointment={editingAppointment}
        />
        <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
        <p className="text-gray-400 mb-8">All appointments.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 divide-y divide-gray-700">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No appointments</div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="bg-purple-500/20 text-purple-400 p-3 rounded-lg shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold">{apt.client_name}</h3>
                      <p className="text-gray-400 text-sm">{getServiceName(apt.services)}</p>
                      <p className="text-gray-500 text-xs mt-1">{formatDateTime(apt.date_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {apt.status}
                    </span>
                    {apt.status !== 'cancelled' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingAppointment({
                            id: apt.id,
                            client_name: apt.client_name,
                            service_id: apt.service_id ?? '',
                            staff_id: apt.staff_id ?? '',
                            date_time: apt.date_time,
                            status: apt.status,
                          })}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(apt)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label="Cancel appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
