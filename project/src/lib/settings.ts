const STORAGE_KEY = 'salonpro_settings';

export type SalonSettings = {
  salonName: string;
  currency: string;
};

const defaults: SalonSettings = {
  salonName: 'SalonPro',
  currency: 'DH',
};

export function getStoredSettings(): SalonSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<SalonSettings>;
    return {
      salonName: typeof parsed.salonName === 'string' ? parsed.salonName : defaults.salonName,
      currency: typeof parsed.currency === 'string' ? parsed.currency : defaults.currency,
    };
  } catch {
    return { ...defaults };
  }
}

export function setStoredSettings(settings: SalonSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
