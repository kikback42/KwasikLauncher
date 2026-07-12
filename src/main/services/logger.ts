import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

type Level = 'INFO' | 'WARN' | 'ERROR'

const logFile = (): string => path.join(app.getPath('userData'), 'logs', 'kwasik.log')

export async function writeLog(level: Level, message: string, details?: unknown): Promise<void> {
  const extra = details ? ` ${JSON.stringify(details, Object.getOwnPropertyNames(details))}` : ''
  const line = `${new Date().toISOString()} [${level}] ${message}${extra}\n`
  try {
    await fs.mkdir(path.dirname(logFile()), { recursive: true })
    await fs.appendFile(logFile(), line, 'utf8')
  } catch {
    // Logging must never crash the launcher when the disk is unavailable.
  }
}

export const getLogPath = (): string => logFile()
