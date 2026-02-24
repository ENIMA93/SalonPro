import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Package,
  Plus,
  Receipt,
  Scissors,
  Settings,
  UserCircle,
  Users,
} from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';
import BookingModal from './BookingModal';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

const quickActions = [
  { id: 'dashboard-kpis', label: 'Dashboard', description: 'KPIs, revenue and reservations by month', icon: BarChart3 },
  { id: 'dashboard', label: 'Appointments', description: 'View and manage today\'s bookings by stage', icon: LayoutDashboard },
  { id: 'pos', label: 'Point of Sale', description: 'Services, products & checkout', icon: CreditCard },
  { id: 'calendar', label: 'Calendar', description: 'Week view and schedule', icon: Calendar },
  { id: 'transactions', label: 'Sales History', description: 'Past transactions and receipts', icon: Receipt },
  { id: 'inventory', label: 'Inventory', description: 'Products and stock', icon: Package },
  { id: 'services', label: 'Services', description: 'Manage services and pricing', icon: Scissors },
  { id: 'staff', label: 'Staff', description: 'Team members and roles', icon: Users },
  { id: 'clients', label: 'Clients', description: 'Client list and details', icon: UserCircle },
  { id: 'settings', label: 'Settings', description: 'Salon name and currency', icon: Settings },
];

export default function Home({ onNavigate }: HomeProps) {
  const { settings } = useSettings();
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <div className="flex-1 bg-gray-900 min-h-screen flex flex-col items-center justify-center p-8">
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccess={() => { setBookingOpen(false); onNavigate('dashboard'); }}
        editingAppointment={null}
      />
      <div className="w-full max-w-2xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          {settings.salonName}
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          Welcome back. Choose where to go next.
        </p>
        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={`${action.id}-${action.label}`}
              type="button"
              onClick={() => onNavigate(action.id)}
              className="group flex items-start gap-4 p-5 rounded-xl bg-gray-800 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/50 transition-all text-left"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-semibold text-lg">{action.label}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
