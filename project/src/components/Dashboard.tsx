import { useState } from 'react';
import { Plus, Search, LayoutDashboard } from 'lucide-react';
import AppointmentsList from './AppointmentsList';
import BookingModal, { type EditingAppointment } from './BookingModal';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<EditingAppointment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [appointmentSearch, setAppointmentSearch] = useState('');

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => { setBookingModalOpen(false); setEditingAppointment(null); }}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        editingAppointment={editingAppointment}
      />
      <div className="flex-1 min-h-0 flex flex-col p-6 md:p-8 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Appointments</h1>
              <p className="text-gray-400 text-sm mt-0.5">Today&apos;s bookings by stage. Edit or cancel from here.</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingAppointment(null); setBookingModalOpen(true); }}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            New Booking
          </button>
        </div>

        <div className="mb-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={appointmentSearch}
              onChange={(e) => setAppointmentSearch(e.target.value)}
              placeholder="Search by client name or email..."
              className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 focus:outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AppointmentsList
            refreshKey={refreshKey}
            searchQuery={appointmentSearch}
            onEdit={(apt) => { setEditingAppointment(apt); setBookingModalOpen(true); }}
            onCancel={async (apt) => {
              if (!window.confirm(`Cancel appointment with ${apt.client_name}?`)) return;
              const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
              if (!error) setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
