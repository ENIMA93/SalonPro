import { useState } from 'react';
import { SettingsProvider } from './lib/SettingsContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import Staff from './components/Staff';
import Clients from './components/Clients';
import Calendar from './components/Calendar';
import POS from './components/POS';
import Transactions from './pages/Transactions';
import ClientHistory from './pages/ClientHistory';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import type { Client } from './lib/supabase';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const renderContent = () => {
    if (activeTab === 'client-history' && selectedClient) {
      return (
        <ClientHistory
          client={selectedClient}
          onBack={() => { setSelectedClient(null); setActiveTab('clients'); }}
        />
      );
    }
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'services': return <Services />;
      case 'staff': return <Staff />;
      case 'clients': return <Clients onSelectClient={(c) => { setSelectedClient(c); setActiveTab('client-history'); }} />;
      case 'calendar': return <Calendar />;
      case 'pos': return <POS />;
      case 'transactions': return <Transactions />;
      case 'inventory': return <Inventory />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </SettingsProvider>
  );
}

export default App;
