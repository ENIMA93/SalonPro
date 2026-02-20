import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getStoredSettings, setStoredSettings, type SalonSettings } from './settings';

type SettingsContextValue = {
  settings: SalonSettings;
  setSettings: (s: SalonSettings) => void;
};

const defaultSettings = getStoredSettings();

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  setSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setState] = useState<SalonSettings>(defaultSettings);
  const setSettings = useCallback((s: SalonSettings) => {
    setStoredSettings(s);
    setState(s);
  }, []);
  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
