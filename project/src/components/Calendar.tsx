import { useEffect, useState } from 'react';
import { Loader2, Clock } from 'lucide-react';
import { supabase, type AppointmentListItem } from '../lib/supabase';

function getServiceName(services: AppointmentListItem['services']): string {
  if (!services) return 'Service';
  return Array.isArray(services) ? services[0]?.name ?? 'Service' : services.name ?? 'Service';
}

export default function Calendar() {
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('id, client_name, date_time, status, services:service_id(name), staff:staff_id(name)')
        .order('date_time', { ascending: true });
      setAppointments((data || []) as AppointmentListItem[]);
      setLoading(false);
    };
    fetch();
  }, []);

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
                <div key={apt.id} className="p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-500/20 text-purple-400 p-3 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{apt.client_name}</h3>
                      <p className="text-gray-400 text-sm">{getServiceName(apt.services)}</p>
                      <p className="text-gray-500 text-xs mt-1">{formatDateTime(apt.date_time)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
