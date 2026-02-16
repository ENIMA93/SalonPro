import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
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
              <p className="text-gray-400 text-sm">Currency: DH (Morocco)</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b border-gray-700">
              <span className="text-gray-400">Currency</span>
              <span className="text-white font-medium">DH - Moroccan Dirham</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-700">
              <span className="text-gray-400">Salon name</span>
              <span className="text-white font-medium">SalonPro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
