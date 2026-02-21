import { useEffect, useState, useMemo } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Clock, Pencil, XCircle, Plus, Search } from 'lucide-react';
import { supabase, type AppointmentListItem } from '../lib/supabase';
import BookingModal, { type EditingAppointment } from './BookingModal';

type CalendarAppointment = AppointmentListItem & { service_id?: string; staff_id?: string };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getServiceName(services: AppointmentListItem['services']): string {
  if (!services) return 'Service';
  return Array.isArray(services) ? services[0]?.name ?? 'Service' : services.name ?? 'Service';
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getAppointmentDateKey(dateTime: string): string {
  const d = new Date(dateTime);
  return toDateKey(d);
}

function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Calendar() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<EditingAppointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientsForSearch, setClientsForSearch] = useState<{ name: string; email: string | null }[]>([]);

  const fetchAppointments = async () => {
    const [aptRes, clientsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, client_name, date_time, status, service_id, staff_id, services:service_id(name), staff:staff_id(name)')
        .order('date_time', { ascending: true }),
      supabase.from('clients').select('name, email'),
    ]);
    if (aptRes.error) {
      setAppointments([]);
    } else {
      setAppointments((aptRes.data || []) as CalendarAppointment[]);
    }
    if (clientsRes.error) {
      setClientsForSearch([]);
    } else {
      setClientsForSearch((clientsRes.data || []).map((c) => ({ name: c.name, email: c.email ?? null })));
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAppointments();
      setLoading(false);
    };
    load();
  }, []);

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredAppointments = !searchLower
    ? appointments
    : appointments.filter((apt) => {
        const nameMatch = (apt.client_name || '').toLowerCase().includes(searchLower);
        if (nameMatch) return true;
        const client = clientsForSearch.find((c) => c.name === apt.client_name);
        return client?.email?.toLowerCase().includes(searchLower) ?? false;
      });

  const handleCancel = async (apt: CalendarAppointment) => {
    if (!window.confirm(`Cancel this appointment with ${apt.client_name}?`)) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
    if (error) alert(error.message);
    else await fetchAppointments();
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400 border-green-500/40',
    'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    scheduled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  const goToToday = () => setViewDate(new Date());

  const weekStart = useMemo(() => {
    const d = new Date(viewDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [viewDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);
  const weekLabel = `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('en-US', { month: 'short' })} ${weekDays[6].getFullYear()}`;
  const prevWeek = () => setViewDate((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
  const nextWeek = () => setViewDate((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));

  const HOURS = [...Array.from({ length: 16 }, (_, i) => i + 8), 0];
  const appointmentsByDayAndHour = useMemo(() => {
    const map: Record<string, Record<number, CalendarAppointment[]>> = {};
    filteredAppointments.forEach((apt) => {
      const d = new Date(apt.date_time);
      const key = toDateKey(d);
      const h = d.getHours();
      if (!map[key]) map[key] = {};
      if (!map[key][h]) map[key][h] = [];
      map[key][h].push(apt);
    });
    Object.keys(map).forEach((k) => {
      Object.keys(map[k]).forEach((hr) => {
        const h = Number(hr);
        map[k][h].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
      });
    });
    return map;
  }, [filteredAppointments]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, CalendarAppointment[]> = {};
    filteredAppointments.forEach((apt) => {
      const key = getAppointmentDateKey(apt.date_time);
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()));
    return map;
  }, [filteredAppointments]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const endPad = 6 - last.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, 1 - (startPad - i));
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    for (let i = 1; i <= endPad; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [viewDate]);

  const todayKey = toDateKey(new Date());

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-6 md:p-8">
        <BookingModal
          isOpen={bookingModalOpen || !!editingAppointment}
          onClose={() => { setBookingModalOpen(false); setEditingAppointment(null); }}
          onSuccess={() => { fetchAppointments(); setBookingModalOpen(false); setEditingAppointment(null); }}
          editingAppointment={editingAppointment}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Calendar</h1>
            <p className="text-gray-400">Appointments by day and time.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => { setEditingAppointment(null); setBookingModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              New booking
            </button>
            <div className="flex rounded-lg border border-gray-600 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'week' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Week
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={viewMode === 'month' ? prevMonth : prevWeek}
                className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Today
              </button>
              <span className="min-w-[180px] text-center text-white font-semibold text-lg">
                {viewMode === 'month' ? monthLabel : weekLabel}
              </span>
              <button
                type="button"
                onClick={viewMode === 'month' ? nextMonth : nextWeek}
                className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments by client name or email..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : viewMode === 'week' ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b border-gray-700">
                <div className="py-2 px-2 text-gray-500 text-xs font-medium border-r border-gray-700" />
                {weekDays.map((d) => (
                  <div
                    key={toDateKey(d)}
                    className={`py-2 text-center text-sm font-medium border-r border-gray-700 last:border-r-0 ${
                      toDateKey(d) === todayKey ? 'text-purple-400' : 'text-gray-400'
                    }`}
                  >
                    <div>{WEEKDAYS[d.getDay()]}</div>
                    <div className="text-white font-semibold">{d.getDate()}</div>
                  </div>
                ))}
              </div>
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-700 last:border-b-0 min-h-[52px]">
                  <div className="py-1.5 px-2 text-gray-500 text-xs font-medium border-r border-gray-700 shrink-0">
                    {hour === 0 ? '12:00 AM' : hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
                  </div>
                  {weekDays.map((d) => {
                    const key = toDateKey(d);
                    const hourApts = appointmentsByDayAndHour[key]?.[hour] ?? [];
                    return (
                      <div
                        key={key}
                        className="p-1 border-r border-gray-700 last:border-r-0 bg-gray-800/30 min-h-[52px]"
                      >
                        {hourApts.map((apt) => (
                          <div
                            key={apt.id}
                            className={`group rounded border p-1.5 cursor-pointer text-xs transition-colors ${
                              statusColors[apt.status] || 'bg-gray-700/50 border-gray-600'
                            } ${apt.status === 'cancelled' ? 'opacity-60' : ''}`}
                            onClick={() => apt.status !== 'cancelled' && setEditingAppointment({
                              id: apt.id,
                              client_name: apt.client_name,
                              service_id: apt.service_id ?? '',
                              staff_id: apt.staff_id ?? '',
                              date_time: apt.date_time,
                              status: apt.status,
                            })}
                          >
                            <p className="text-white font-medium truncate" title={apt.client_name}>{apt.client_name}</p>
                            <p className="text-gray-300 truncate" title={getServiceName(apt.services)}>{getServiceName(apt.services)}</p>
                            <p className="text-gray-400 flex items-center gap-0.5 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTime(apt.date_time)}
                            </p>
                            {apt.status !== 'cancelled' && (
                              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingAppointment({ id: apt.id, client_name: apt.client_name, service_id: apt.service_id ?? '', staff_id: apt.staff_id ?? '', date_time: apt.date_time, status: apt.status }); }} className="p-0.5 rounded bg-gray-800/80 text-gray-300 hover:text-white" aria-label="Edit">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCancel(apt); }} className="p-0.5 rounded bg-gray-800/80 text-gray-300 hover:text-red-400" aria-label="Cancel">
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-gray-700">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-gray-400 text-sm font-medium"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 min-h-[60vh] [grid-auto-rows:minmax(100px,1fr)]">
              {calendarDays.map(({ date, isCurrentMonth }) => {
                const key = toDateKey(date);
                const dayAppointments = appointmentsByDay[key] ?? [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`border-b border-r border-gray-700 last:border-r-0 flex flex-col min-h-0 ${
                      isCurrentMonth ? 'bg-gray-800/50' : 'bg-gray-900/60'
                    }`}
                  >
                    <div
                      className={`p-1.5 sm:p-2 text-sm font-medium shrink-0 ${
                        isCurrentMonth ? 'text-white' : 'text-gray-500'
                      } ${isToday ? 'rounded-full bg-purple-600 w-8 h-8 flex items-center justify-center' : ''}`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="flex-1 overflow-auto p-1.5 space-y-1">
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={`group rounded-lg border p-2 cursor-pointer transition-colors ${
                            statusColors[apt.status] || 'bg-gray-700/50 border-gray-600'
                          } ${apt.status === 'cancelled' ? 'opacity-60' : ''}`}
                          onClick={() => apt.status !== 'cancelled' && setEditingAppointment({
                            id: apt.id,
                            client_name: apt.client_name,
                            service_id: apt.service_id ?? '',
                            staff_id: apt.staff_id ?? '',
                            date_time: apt.date_time,
                            status: apt.status,
                          })}
                        >
                          <p className="text-white font-medium truncate text-xs" title={apt.client_name}>
                            {apt.client_name}
                          </p>
                          <p className="text-gray-300 truncate text-xs" title={getServiceName(apt.services)}>
                            {getServiceName(apt.services)}
                          </p>
                          <p className="text-gray-400 text-xs flex items-center gap-0.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTime(apt.date_time)}
                          </p>
                          {apt.status !== 'cancelled' && (
                            <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingAppointment({
                                  id: apt.id,
                                  client_name: apt.client_name,
                                  service_id: apt.service_id ?? '',
                                  staff_id: apt.staff_id ?? '',
                                  date_time: apt.date_time,
                                  status: apt.status,
                                }); }}
                                className="p-1 rounded bg-gray-800/80 text-gray-300 hover:text-white"
                                aria-label="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCancel(apt); }}
                                className="p-1 rounded bg-gray-800/80 text-gray-300 hover:text-red-400"
                                aria-label="Cancel"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
