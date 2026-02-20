import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const [salonName, setSalonName] = useState(settings.salonName);
  const [currency, setCurrency] = useState(settings.currency);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSalonName(settings.salonName);
    setCurrency(settings.currency);
  }, [settings.salonName, settings.currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { salonName: salonName.trim() || 'SalonPro', currency: currency.trim() || 'DH' };
    setSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 mb-8">Salon configuration.</p>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-purple-500/20 text-purple-400 p-3 rounded-lg">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-semibold">General</h3>
              <p className="text-gray-400 text-sm">Edit and save to update across the app.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Salon name</label>
              <input
                type="text"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="SalonPro"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="DH"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium"
              >
                Save
              </button>
              {saved && <span className="text-green-400 text-sm">Saved.</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
