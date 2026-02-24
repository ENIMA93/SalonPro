import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Users,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';
import DashboardDetailModal, { type DashboardDetailType } from './DashboardDetailModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20' },
  'in-progress': { label: 'In progress', icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
};

function getMonthRange(year: number, month: number, day?: number) {
  if (day != null) {
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

type DayData = { day: number; reservations: number; revenue: number };

const CHART_PADDING = { top: 16, right: 24, bottom: 32, left: 44 };
const Y_TICKS = 5;

function LineChart({
  data,
  valueKey,
  maxValue,
  color,
  height = 280,
  formatY = (v: number) => String(Math.round(v)),
}: {
  data: DayData[];
  valueKey: 'reservations' | 'revenue';
  maxValue: number;
  color: string;
  height?: number;
  formatY?: (v: number) => string;
}) {
  if (data.length === 0) return <div className="h-64 text-gray-500 text-sm">No data</div>;
  const w = 600;
  const h = height;
  const innerW = w - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = h - CHART_PADDING.top - CHART_PADDING.bottom;
  const xRatio = (i: number) => (data.length <= 1 ? 0.5 : i / Math.max(1, data.length - 1));
  const x = (i: number) => CHART_PADDING.left + xRatio(i) * innerW;
  const y = (v: number) =>
    CHART_PADDING.top + innerH - (maxValue > 0 ? (v / maxValue) * innerH : 0);
  const points = data.map((d, i) => `${x(i)},${y(Number(d[valueKey]))}`).join(' ');

  // Y-axis ticks: 0 to maxValue
  const yTickValues: number[] = [];
  for (let i = 0; i <= Y_TICKS; i++) {
    yTickValues.push((maxValue * i) / Y_TICKS);
  }
  const xTickIndices: number[] = [];
  const step = Math.max(1, Math.floor(data.length / 8));
  for (let i = 0; i < data.length; i += step) {
    xTickIndices.push(i);
  }
  if (data.length > 0 && xTickIndices[xTickIndices.length - 1] !== data.length - 1) {
    xTickIndices.push(data.length - 1);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px` }} preserveAspectRatio="xMidYMid meet">
      {/* Y-axis line */}
      <line
        x1={CHART_PADDING.left}
        y1={CHART_PADDING.top}
        x2={CHART_PADDING.left}
        y2={CHART_PADDING.top + innerH}
        stroke="rgb(75 85 99)"
        strokeWidth="1"
      />
      {/* X-axis line */}
      <line
        x1={CHART_PADDING.left}
        y1={CHART_PADDING.top + innerH}
        x2={CHART_PADDING.left + innerW}
        y2={CHART_PADDING.top + innerH}
        stroke="rgb(75 85 99)"
        strokeWidth="1"
      />
      {/* Y-axis ticks and labels */}
      {yTickValues.map((val, i) => {
        const yPos = y(val);
        return (
          <g key={`y-${i}`}>
            <line
              x1={CHART_PADDING.left}
              y1={yPos}
              x2={CHART_PADDING.left + innerW}
              y2={yPos}
              stroke="rgb(55 65 81)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text
              x={CHART_PADDING.left - 6}
              y={yPos + 4}
              textAnchor="end"
              fill="rgb(156 163 175)"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
            >
              {formatY(val)}
            </text>
          </g>
        );
      })}
      {/* X-axis ticks and labels (day numbers) */}
      {xTickIndices.map((i) => {
        const dayNum = data[i]?.day ?? i + 1;
        const xPos = x(i);
        return (
          <g key={`x-${i}`}>
            <text
              x={xPos}
              y={CHART_PADDING.top + innerH + 18}
              textAnchor="middle"
              fill="rgb(156 163 175)"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
            >
              {dayNum}
            </text>
          </g>
        );
      })}
      {/* Chart line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export default function DashboardKPIs() {
  const { settings } = useSettings();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [forecastRevenue, setForecastRevenue] = useState(0);
  const [detailType, setDetailType] = useState<DashboardDetailType | null>(null);
  const [byStatus, setByStatus] = useState<Record<string, number>>({
    scheduled: 0,
    'in-progress': 0,
    completed: 0,
    cancelled: 0,
  });
  const [dailyReservations, setDailyReservations] = useState<DayData[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DayData[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const daysInMonth = new Date(year, month, 0).getDate();
    const { start, end } = getMonthRange(year, month, day ?? undefined);

    const [aptsRes, txRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, date_time, status, services:service_id(price)')
        .gte('date_time', start)
        .lte('date_time', end),
      supabase
        .from('transactions')
        .select('total_amount, created_at')
        .gte('created_at', start)
        .lte('created_at', end),
    ]);

    const apts = aptsRes.data || [];
    const txs = txRes.data || [];

    setTotalReservations(apts.length);

    let revenueFromApts = 0;
    apts.forEach((a) => {
      if (a.status === 'completed') {
        const svc = a.services as { price?: number } | { price?: number }[] | null;
        const price = Array.isArray(svc) ? (svc[0]?.price ?? 0) : (svc?.price ?? 0);
        revenueFromApts += Number(price);
      }
    });
    const revenueFromTxs = txs.reduce((s, t) => s + Number(t.total_amount ?? 0), 0);
    const total = revenueFromApts + revenueFromTxs;
    setTotalRevenue(total);

    let forecastFromScheduled = 0;
    apts.forEach((a) => {
      if (a.status === 'scheduled') {
        const svc = a.services as { price?: number } | { price?: number }[] | null;
        const price = Array.isArray(svc) ? (svc[0]?.price ?? 0) : (svc?.price ?? 0);
        forecastFromScheduled += Number(price);
      }
    });
    setForecastRevenue(forecastFromScheduled);

    const statusCounts: Record<string, number> = {
      scheduled: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
    };
    apts.forEach((a) => {
      if (a.status in statusCounts) statusCounts[a.status]++;
    });
    setByStatus(statusCounts);

    const resByDay: Record<number, number> = {};
    const revByDay: Record<number, number> = {};
    const dayRange = day != null ? [day] : Array.from({ length: daysInMonth }, (_, i) => i + 1);
    dayRange.forEach((d) => {
      resByDay[d] = 0;
      revByDay[d] = 0;
    });
    apts.forEach((a) => {
      const d = new Date((a as { date_time: string }).date_time).getDate();
      resByDay[d] = (resByDay[d] ?? 0) + 1;
      if (a.status === 'completed') {
        const svc = a.services as { price?: number } | { price?: number }[] | null;
        const price = Array.isArray(svc) ? (svc[0]?.price ?? 0) : (svc?.price ?? 0);
        revByDay[d] = (revByDay[d] ?? 0) + Number(price);
      }
    });
    txs.forEach((t) => {
      const d = new Date((t as { created_at: string }).created_at).getDate();
      revByDay[d] = (revByDay[d] ?? 0) + Number(t.total_amount ?? 0);
    });

    setDailyReservations(
      dayRange.map((d) => ({
        day: d,
        reservations: resByDay[d] ?? 0,
        revenue: revByDay[d] ?? 0,
      }))
    );
    setDailyRevenue(
      dayRange.map((d) => ({
        day: d,
        reservations: resByDay[d] ?? 0,
        revenue: revByDay[d] ?? 0,
      }))
    );
    setLoading(false);
  }, [year, month, day]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const averageBasket = totalReservations > 0 ? totalRevenue / totalReservations : 0;
  const monthLabel = MONTHS[month - 1];
  const daysInMonth = new Date(year, month, 0).getDate();
  const periodLabel = day != null ? `${monthLabel} ${day}, ${year}` : `${monthLabel} ${year}`;
  const maxRes = Math.max(1, ...dailyReservations.map((d) => d.reservations));
  const maxRev = Math.max(1, ...dailyRevenue.map((d) => d.revenue));

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    const maxDay = new Date(year, newMonth, 0).getDate();
    if (day != null && day > maxDay) setDay(null);
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        {detailType && (
          <DashboardDetailModal
            year={year}
            month={month}
            day={day}
            type={detailType}
            onClose={() => setDetailType(null)}
          />
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={day ?? ''}
              onChange={(e) => setDay(e.target.value === '' ? null : Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              title="Filter by day"
            >
              <option value="">All month</option>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button
                type="button"
                onClick={() => setDetailType('reservations')}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-start justify-between text-left hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Total reservations</p>
                  <p className="text-3xl font-bold text-white">{totalReservations}</p>
                  <p className="text-gray-500 text-xs mt-1">For {periodLabel}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDetailType('revenue')}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-start justify-between text-left hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Total revenue</p>
                  <p className="text-3xl font-bold text-white">
                    {totalRevenue.toFixed(2)} {settings.currency}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">For {periodLabel}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-green-500/20 text-green-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDetailType('forecast')}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-start justify-between text-left hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Forecast revenue</p>
                  <p className="text-3xl font-bold text-white">
                    {forecastRevenue.toFixed(2)} {settings.currency}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">From scheduled · {periodLabel}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDetailType('revenue')}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-start justify-between text-left hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer md:col-span-2 lg:col-span-1"
              >
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Average basket</p>
                  <p className="text-3xl font-bold text-white">
                    {averageBasket.toFixed(2)} {settings.currency}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">Per reservation</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Users className="w-6 h-6" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {(['scheduled', 'in-progress', 'completed', 'cancelled'] as const).map((status) => {
                const config = STATUS_CONFIG[status];
                const count = byStatus[status] ?? 0;
                const pct = totalReservations > 0 ? (count / totalReservations) * 100 : 0;
                const Icon = config.icon;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDetailType(status)}
                    className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex items-start justify-between text-left hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-gray-400 text-sm font-medium mb-1">{config.label}</p>
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-gray-500 text-xs mt-1">{pct.toFixed(1)}% of total</p>
                    </div>
                    <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-bold text-white mb-1">
                  Reservations per day
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  {day != null ? `Reservations on ${monthLabel} ${day}, ${year}` : `Evolution of reservations for ${monthLabel} ${year}`}
                </p>
                <LineChart
                  data={dailyReservations}
                  valueKey="reservations"
                  maxValue={maxRes}
                  color="#ef4444"
                  height={280}
                />
                <p className="text-gray-500 text-xs mt-1 text-center">Day of month</p>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-bold text-white mb-1">
                  Revenue per day
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  {day != null ? `Revenue on ${monthLabel} ${day}, ${year}` : `Evolution of revenue for ${monthLabel} ${year}`}
                </p>
                <LineChart
                  data={dailyRevenue}
                  valueKey="revenue"
                  maxValue={maxRev}
                  color="#22c55e"
                  height={280}
                  formatY={(v) => {
                    const num = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
                    return `${num} ${settings.currency}`;
                  }}
                />
                <p className="text-gray-500 text-xs mt-1 text-center">Day of month</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
