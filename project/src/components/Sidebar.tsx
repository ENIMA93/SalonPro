import {
  Home,
  BarChart3,
  LayoutDashboard,
  CreditCard,
  Package,
  Calendar,
  Scissors,
  Users,
  UserCircle,
  Receipt,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';
import { useAuth } from '../lib/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const allMenuItems = [
  { id: 'home', label: 'Home', icon: Home, adminOnly: false },
  { id: 'dashboard-kpis', label: 'Dashboard', icon: BarChart3, adminOnly: true },
  { id: 'dashboard', label: 'Appointments', icon: LayoutDashboard, adminOnly: false },
  { id: 'pos', label: 'POS', icon: CreditCard, adminOnly: false },
  { id: 'transactions', label: 'Sales History', icon: Receipt, adminOnly: false },
  { id: 'inventory', label: 'Inventory', icon: Package, adminOnly: true },
  { id: 'calendar', label: 'Calendar', icon: Calendar, adminOnly: false },
  { id: 'services', label: 'Services', icon: Scissors, adminOnly: true },
  { id: 'staff', label: 'Staff', icon: Users, adminOnly: true },
  { id: 'clients', label: 'Clients', icon: UserCircle, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  { id: 'profile', label: 'Profile', icon: User, adminOnly: false },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { settings } = useSettings();
  const { user, profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const menuItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="w-64 bg-gray-900 min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-white">
          <Scissors className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold">{settings.salonName}</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-gray-800 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            {(user?.email?.charAt(0) ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium truncate text-sm">{user?.email ?? 'User'}</p>
            <p className="text-gray-400 text-xs">{profile?.role === 'admin' ? 'Admin' : 'Staff'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
