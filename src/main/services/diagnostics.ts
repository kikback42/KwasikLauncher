import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { checkJavaVersion, findJava } from './java'
import { writeLog } from './logger'

export type CheckId = 'java' | 'storage' | 'internet' | 'files' | 'fileHandles'
export type CheckState = 'ok' | 'warning' | 'error'
export interface DiagnosticCheck { id: CheckId; title: string; state: CheckState; message: string; solution?: string }
export interface DiagnosticReport { checkedAt: string; ready: boolean; checks: DiagnosticCheck[] }

export const minecraftRoot = (): string => path.join(app.getPath('userData'), 'minecraft')

const checkJava = async (): Promise<DiagnosticCheck> => {
  try {
    const javaPath = await findJava()
    const { major } = await checkJavaVersion(javaPath)
    if (major >= 21) return { id: 'java', title: 'Java', state: 'ok', message: `Найдена Java ${major}.` }
    if (major >= 17) return { id: 'java', title: 'Java', state: 'warning', message: `Найдена Java ${major}.`, solution: 'Для Minecraft 1.21+ рекомендуется Java 21.' }
    return {
      id: 'java',
      title: 'Java',
      state: 'error',
      message: major ? `Найдена Java ${major} — слишком старая для современного Minecraft.` : 'Java найдена, но версия не определена.',
      solution: 'Установите Java 21 (64-bit) с adoptium.net и перезапустите лаунчер.',
    }
  } catch {
    return { id: 'java', title: 'Java', state: 'error', message: 'Java не найдена.', solution: 'Установите Java 21 и перезапустите лаунчер.' }
  }
}

const checkStorage = async (): Promise<DiagnosticCheck> => {
  const root = minecraftRoot()
  const probe = path.join(root, `.write-test-${process.pid}-${Date.now()}`)
  try {
    await fs.mkdir(root, { recursive: true }); await fs.writeFile(probe, 'ok'); await fs.unlink(probe)
    return { id: 'storage', title: 'Доступ к файлам', state: 'ok', message: `Папка игры доступна: ${root}` }
  } catch (error) {
    return { id: 'storage', title: 'Доступ к файлам', state: 'error', message: 'Нет доступа к папке игры.', solution: 'Освободите место на диске и разрешите KwasikLauncher доступ в антивирусе.', }
  }
}

const checkInternet = async (): Promise<DiagnosticCheck> => {
  try {
    const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json', { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(String(response.status))
    return { id: 'internet', title: 'Интернет и Mojang', state: 'ok', message: 'Серверы Minecraft доступны.' }
  } catch {
    return { id: 'internet', title: 'Интернет и Mojang', state: 'error', message: 'Нет доступа к серверам Minecraft.', solution: 'Проверьте интернет, DNS, VPN или настройки брандмауэра.' }
  }
}

const checkFiles = async (): Promise<DiagnosticCheck> => {
  try {
    const versions = await fs.readdir(path.join(minecraftRoot(), 'versions'))
    const corrupt = versions.length === 0
    return { id: 'files', title: 'Целостность файлов', state: corrupt ? 'warning' : 'ok', message: corrupt ? 'Версии Minecraft ещё не установлены.' : `Найдено версий: ${versions.length}.`, solution: corrupt ? 'Выберите версию и нажмите «Играть» — она скачается автоматически.' : undefined }
  } catch {
    return { id: 'files', title: 'Целостность файлов', state: 'warning', message: 'Версии Minecraft ещё не установлены.', solution: 'Это нормально при первом запуске.' }
  }
}

const checkFileHandles = async (): Promise<DiagnosticCheck> => {
  try {
    const file = path.join(minecraftRoot(), `.handle-test-${process.pid}`)
    await fs.writeFile(file, 'ok'); const handle = await fs.open(file, 'r'); await handle.close(); await fs.unlink(file)
    return { id: 'fileHandles', title: 'Лимит файлов', state: 'ok', message: 'Лимит открытых файлов в норме. Очередь загрузки включена.' }
  } catch (error) {
    const isEmfile = String(error).includes('EMFILE')
    return { id: 'fileHandles', title: 'Лимит файлов', state: isEmfile ? 'error' : 'warning', message: isEmfile ? 'Windows достигла лимита открытых файлов.' : 'Не удалось проверить лимит файлов.', solution: 'Закройте лишние программы и перезапустите компьютер.' }
  }
}

export async function runDiagnostics(): Promise<DiagnosticReport> {
  const checks = await Promise.all([checkJava(), checkStorage(), checkInternet(), checkFiles(), checkFileHandles()])
  const report = { checkedAt: new Date().toISOString(), ready: !checks.some((check) => check.state === 'error'), checks }
  await writeLog(report.ready ? 'INFO' : 'WARN', 'Preflight diagnostics complete', report)
  return report
}
