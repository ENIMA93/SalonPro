import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { SettingsProvider } from './lib/SettingsContext';
import { StaffProvider } from './lib/StaffContext';
import Login from './components/Login';
import ClaimAdmin from './components/ClaimAdmin';
import ChangePassword from './components/ChangePassword';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import DashboardKPIs from './components/DashboardKPIs';
import Services from './components/Services';
import Staff from './components/Staff';
import Clients from './components/Clients';
import Calendar from './components/Calendar';
import POS from './components/POS';
import Transactions from './pages/Transactions';
import ClientHistory from './pages/ClientHistory';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import Profile from './components/Profile';
import type { Client } from './lib/supabase';

const STAFF_ALLOWED_TABS = new Set(['home', 'dashboard', 'pos', 'transactions', 'calendar', 'profile']);

function App() {
  const { session, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const isAdmin = profile?.role === 'admin';

  // Must run on every render (Rules of Hooks); keep above any early returns.
  useEffect(() => {
    if (!isAdmin && activeTab !== 'home' && !STAFF_ALLOWED_TABS.has(activeTab)) {
      setActiveTab('home');
    }
  }, [isAdmin, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (profile === null || !profile?.role) {
    return <ClaimAdmin />;
  }

  if (profile.must_change_password) {
    return <ChangePassword />;
  }

  const effectiveTab = !isAdmin && !STAFF_ALLOWED_TABS.has(activeTab) ? 'home' : activeTab;

  const renderContent = () => {
    if (effectiveTab === 'client-history' && selectedClient) {
      return (
        <ClientHistory
          client={selectedClient}
          onBack={() => { setSelectedClient(null); setActiveTab('clients'); }}
        />
      );
    }
    switch (effectiveTab) {
      case 'home': return <Home onNavigate={setActiveTab} />;
      case 'dashboard-kpis': return <DashboardKPIs />;
      case 'dashboard': return <Dashboard />;
      case 'services': return <Services />;
      case 'staff': return <Staff />;
      case 'clients': return <Clients onSelectClient={(c) => { setSelectedClient(c); setActiveTab('client-history'); }} />;
      case 'calendar': return <Calendar />;
      case 'pos': return <POS />;
      case 'transactions': return <Transactions />;
      case 'inventory': return <Inventory />;
      case 'settings': return <Settings />;
      case 'profile': return <Profile />;
      default: return <Home onNavigate={setActiveTab} />;
    }
  };

  return (
    <SettingsProvider>
      <StaffProvider>
        <div className="flex h-screen overflow-hidden bg-gray-900">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          {renderContent()}
        </div>
      </StaffProvider>
    </SettingsProvider>
  );
}

export default App;
