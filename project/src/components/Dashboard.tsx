import { useEffect, useState } from 'react';
import { DollarSign, Calendar, UserPlus, Users, Plus } from 'lucide-react';
import MetricCard from './MetricCard';
import AppointmentsList from './AppointmentsList';
import BookingModal from './BookingModal';
import KPIDetailModal from './KPIDetailModal';
import { supabase } from '../lib/supabase';

type KPIDetailType = 'revenue' | 'appointments' | 'clients' | 'staff';

interface Metrics {
  totalRevenueToday: number;
  appointmentsToday: number;
  newClientsThisWeek: number;
  staffActiveNow: number;
  totalStaff: number;
}

export default function Dashboard() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [kpiDetailType, setKpiDetailType] = useState<KPIDetailType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenueToday: 0,
    appointmentsToday: 0,
    newClientsThisWeek: 0,
    staffActiveNow: 0,
    totalStaff: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [appointmentsRes, staffRes, staffActiveRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('id, status, services:service_id(price)', { count: 'exact' })
            .gte('date_time', todayStart)
            .lt('date_time', todayEnd),
          supabase
            .from('staff')
            .select('id', { count: 'exact' }),
          supabase
            .from('staff')
            .select('id', { count: 'exact' })
            .eq('is_active', true)
        ]);

        const appointmentsToday = appointmentsRes.count || 0;
        const totalStaff = staffRes.count || 0;
        const staffActiveNow = staffActiveRes.count || 0;

        let totalRevenueToday = 0;
        if (appointmentsRes.data) {
          totalRevenueToday = appointmentsRes.data.reduce((sum, apt) => {
            const services = apt.services as { price?: number } | { price?: number }[] | null;
            const price = Array.isArray(services)
              ? (services[0]?.price ?? 0)
              : (services?.price ?? 0);
            return sum + (apt.status === 'completed' ? price : 0);
          }, 0);
        }

        const { data: appointmentsByClient } = await supabase
          .from('appointments')
          .select('client_name')
          .gte('created_at', weekStart)
          .lt('created_at', todayEnd);

        const newClientsThisWeek = new Set(appointmentsByClient?.map(a => a.client_name) || []).size;

        setMetrics({
          totalRevenueToday,
          appointmentsToday,
          newClientsThisWeek,
          staffActiveNow,
          totalStaff
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [refreshKey]);

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
        {kpiDetailType && (
          <KPIDetailModal type={kpiDetailType} onClose={() => setKpiDetailType(null)} />
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
          </div>
          <button
            onClick={() => setBookingModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Booking
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
              <p className="mt-4 text-gray-400">Loading metrics...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Revenue (Today)"
                value={`${metrics.totalRevenueToday.toFixed(2)} DH`}
                icon={DollarSign}
                trend={{ value: 'From completed appointments', isPositive: true }}
                iconColor="text-green-400"
                iconBgColor="bg-green-500/20"
                onClick={() => setKpiDetailType('revenue')}
              />
              <MetricCard
                title="Appointments (Today)"
                value={metrics.appointmentsToday}
                icon={Calendar}
                trend={{ value: 'Scheduled & completed', isPositive: true }}
                iconColor="text-blue-400"
                iconBgColor="bg-blue-500/20"
                onClick={() => setKpiDetailType('appointments')}
              />
              <MetricCard
                title="New Clients (This Week)"
                value={metrics.newClientsThisWeek}
                icon={UserPlus}
                trend={{ value: 'Unique clients', isPositive: true }}
                iconColor="text-purple-400"
                iconBgColor="bg-purple-500/20"
                onClick={() => setKpiDetailType('clients')}
              />
              <MetricCard
                title="Staff Active (Now)"
                value={`${metrics.staffActiveNow}/${metrics.totalStaff}`}
                icon={Users}
                iconColor="text-yellow-400"
                iconBgColor="bg-yellow-500/20"
                onClick={() => setKpiDetailType('staff')}
              />
            </div>

            <AppointmentsList refreshKey={refreshKey} />
          </>
        )}
      </div>
    </div>
  );
}
