// @ts-ignore
const Store = require('electron-store')

export interface AppSettings {
  theme: 'dark-neon' | 'cyberpunk' | 'minimal' | 'custom'
  accentColor: string
  secondaryColor: string
  ram: number
  language: string
  backgroundImage: string
  backgroundBlur: number
  backgroundOpacity: number
  customTitle: string
}

const schema: Record<string, { type: string; default: unknown }> = {
  theme: { type: 'string', default: 'dark-neon' },
  accentColor: { type: 'string', default: '#06b6d4' },
  secondaryColor: { type: 'string', default: '#7a52f4' },
  ram: { type: 'number', default: 4096 },
  language: { type: 'string', default: 'ru' },
  backgroundImage: { type: 'string', default: '' },
  backgroundBlur: { type: 'number', default: 8 },
  backgroundOpacity: { type: 'number', default: 0.55 },
  customTitle: { type: 'string', default: 'KWASIK LAUNCHER' },
}

// @ts-ignore
export const store = new (Store.default || Store)({ schema })
