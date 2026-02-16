import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor: string;
  iconBgColor: string;
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor,
  iconBgColor,
  onClick
}: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 hover:border-purple-500/50 transition-all ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </button>
  );
}
