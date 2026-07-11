import Store from 'electron-store';

export interface AppSettings {
  theme: 'dark-neon' | 'cyberpunk' | 'minimal' | 'custom';
  accentColor: string;
  ram: number;
  language: string;
}

const schema: any = {
  theme: {
    type: 'string',
    default: 'dark-neon',
  },
  accentColor: {
    type: 'string',
    default: '#06b6d4',
  },
  ram: {
    type: 'number',
    default: 4096,
  },
  language: {
    type: 'string',
    default: 'ru',
  },
};

export const store = new Store<AppSettings>({ schema });
