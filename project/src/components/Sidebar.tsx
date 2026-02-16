import {
  LayoutDashboard,
  CreditCard,
  Package,
  Calendar,
  Scissors,
  Users,
  UserCircle,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS', icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'clients', label: 'Clients', icon: UserCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-white">
          <Scissors className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold">SalonPro</h1>
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

      <div className="pt-6 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div>
            <p className="text-white font-medium">Admin User</p>
            <p className="text-gray-400 text-sm">Salon Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
