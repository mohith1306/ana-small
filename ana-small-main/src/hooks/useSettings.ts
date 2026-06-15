import { useLocalStorage } from './useLocalStorage';
import { AppSettings, RedshiftCredentials } from '../types';

const DEFAULT_REDSHIFT_CREDENTIALS: RedshiftCredentials = {
  host: '',
  port: 5439,
  database: '',
  user: '',
  password: '',
  schema: '',
  name: '',
  description: ''
};

const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: '',
  redshiftCredentials: DEFAULT_REDSHIFT_CREDENTIALS
};

export function useSettings(): [
  AppSettings,
  (settings: Partial<AppSettings>) => void,
  (field: keyof AppSettings, value: any) => void
] {
  const [settings, setSettingsRaw] = useLocalStorage<AppSettings>('appSettings', DEFAULT_SETTINGS);

  // Update entire settings object
  const setSettings = (newSettings: Partial<AppSettings>) => {
    setSettingsRaw(prev => ({
      ...prev,
      ...newSettings,
      redshiftCredentials: {
        ...DEFAULT_REDSHIFT_CREDENTIALS,
        ...prev.redshiftCredentials,
        ...(newSettings.redshiftCredentials || {})
      }
    }));
  };

  // Update a specific field in settings
  const updateField = (field: keyof AppSettings, value: any) => {
    setSettingsRaw(prev => ({
      ...prev,
      [field]: field === 'redshiftCredentials' && typeof value === 'object'
        ? { ...DEFAULT_REDSHIFT_CREDENTIALS, ...prev.redshiftCredentials, ...value }
        : value
    }));
  };

  return [settings, setSettings, updateField];
}