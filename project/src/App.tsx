import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import Staff from './components/Staff';
import Clients from './components/Clients';
import Calendar from './components/Calendar';
import POS from './components/POS';
import Transactions from './pages/Transactions';
import Inventory from './components/Inventory';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'services': return <Services />;
      case 'staff': return <Staff />;
      case 'clients': return <Clients />;
      case 'calendar': return <Calendar />;
      case 'pos': return <POS />;
      case 'transactions': return <Transactions />;
      case 'inventory': return <Inventory />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </div>
  );
}

export default App;
