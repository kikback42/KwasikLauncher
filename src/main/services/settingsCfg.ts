import fs from 'fs/promises'
import path from 'path'
import { AppSettings } from '../config'

const THEMES = new Set<AppSettings['theme']>(['dark-neon', 'cyberpunk', 'minimal', 'custom'])

const parseValue = (key: keyof AppSettings, raw: string): unknown => {
  const value = raw.trim()
  if (key === 'ram' || key === 'backgroundBlur') return Number(value)
  if (key === 'backgroundOpacity') return Number(value)
  if (key === 'theme' && THEMES.has(value as AppSettings['theme'])) return value
  return value
}

export const parseSettingsCfg = (content: string, cfgDir: string): Partial<AppSettings> => {
  const result: Partial<AppSettings> = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || trimmed.startsWith('[')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim() as keyof AppSettings
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key === 'backgroundImage' && value && !path.isAbsolute(value)) {
      value = path.resolve(cfgDir, value)
    }
    if (key in DEFAULT_KEYS) {
      const parsed = parseValue(key, value)
      if (parsed !== undefined && !Number.isNaN(parsed)) {
        ;(result as Record<string, unknown>)[key] = parsed
      }
    }
  }
  return result
}

const DEFAULT_KEYS: Record<keyof AppSettings, true> = {
  theme: true,
  accentColor: true,
  secondaryColor: true,
  ram: true,
  language: true,
  backgroundImage: true,
  backgroundBlur: true,
  backgroundOpacity: true,
  customTitle: true,
  aiBaseUrl: true,
  aiApiKey: true,
  aiModel: true,
}

export const serializeSettingsCfg = (settings: AppSettings, relativeBackground?: string): string => {
  const bg = relativeBackground ?? settings.backgroundImage
  return `; KwasikLauncher Settings
; Импорт: Настройки -> Импорт из CFG

[appearance]
theme=${settings.theme}
accentColor=${settings.accentColor}
secondaryColor=${settings.secondaryColor}
customTitle=${settings.customTitle}
backgroundBlur=${settings.backgroundBlur}
backgroundOpacity=${settings.backgroundOpacity}
backgroundImage=${bg}

[game]
ram=${settings.ram}
language=${settings.language}
`
}

export const copyBackgroundIfNeeded = async (imagePath: string): Promise<string> => {
  if (!imagePath) return ''
  try {
    await fs.access(imagePath)
    return imagePath
  } catch {
    return ''
  }
}
