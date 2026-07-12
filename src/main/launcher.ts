import { launch } from '@xmcl/core'
import { getVersionList, installTask } from '@xmcl/installer'
import { BrowserWindow, ipcMain } from 'electron'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { store } from './config'
import { minecraftRoot, runDiagnostics } from './services/diagnostics'
import { findJava } from './services/java'
import { enrichMods, fetchRecommendedHits, searchModrinth } from './services/mods'
import { writeLog } from './services/logger'

type Status = {
  type: 'info' | 'progress' | 'error' | 'success'
  message: string
  progress?: number
  speed?: string
  eta?: string
}

const sendStatus = (status: Status): void =>
  BrowserWindow.getAllWindows().forEach((window) => window.webContents.send('launcher-status', status))

const javaFor = (version: string): number =>
  version.startsWith('1.20.5') || version.startsWith('1.21') ? 21 : 17

const offlineUuid = (username: string): string => {
  const md5 = createHash('md5').update(`OfflinePlayer:${username}`).digest('hex')
  return `${md5.slice(0, 8)}-${md5.slice(8, 12)}-${md5.slice(12, 16)}-${md5.slice(16, 20)}-${md5.slice(20)}`
}

const versionJsonPath = (versionId: string): string =>
  path.join(minecraftRoot(), 'versions', versionId, `${versionId}.json`)

const isVersionInstalled = async (versionId: string): Promise<boolean> => {
  try {
    await fs.access(versionJsonPath(versionId))
    return true
  } catch {
    return false
  }
}

const installVersionWithProgress = async (versionId: string): Promise<void> => {
  sendStatus({ type: 'info', message: `Загрузка Minecraft ${versionId}…`, progress: 0 })

  const list = await getVersionList()
  const meta = list.versions.find((item) => item.id === versionId)
  if (!meta) throw new Error(`Версия ${versionId} не найдена в манифесте Mojang.`)

  const task = installTask(meta, minecraftRoot(), {
    librariesDownloadConcurrency: 4,
    assetsDownloadConcurrency: 4,
  })

  let lastProgress = 0
  await task.startAndWait({
    onUpdate: () => {
      const progress = task.total > 0 ? Math.round((task.progress / task.total) * 100) : lastProgress
      lastProgress = progress
      sendStatus({
        type: 'progress',
        message: task.path ? `Загрузка: ${task.path}` : `Загрузка Minecraft ${versionId}…`,
        progress,
      })
    },
  })

  sendStatus({ type: 'success', message: `Minecraft ${versionId} установлен.`, progress: 100 })
  await writeLog('INFO', `Installed Minecraft ${versionId}`)
}

const ensureVersionInstalled = async (versionId: string): Promise<void> => {
  if (await isVersionInstalled(versionId)) return
  await installVersionWithProgress(versionId)
}

const listInstalledVersions = async (): Promise<string[]> => {
  try {
    const versionsDir = path.join(minecraftRoot(), 'versions')
    const entries = await fs.readdir(versionsDir, { withFileTypes: true })
    const installed: string[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (await isVersionInstalled(entry.name)) installed.push(entry.name)
    }
    return installed.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  } catch {
    return []
  }
}

export function setupLauncherHandlers(): void {
  ipcMain.handle('run-diagnostics', () => runDiagnostics())
  ipcMain.handle('get-minecraft-path', () => minecraftRoot())
  ipcMain.handle('get-installed-versions', () => listInstalledVersions())

  ipcMain.handle('get-versions', async () => {
    const list = await getVersionList()
    return list.versions
      .filter((version) => version.type === 'release')
      .slice(0, 50)
      .map((version) => ({
        id: version.id,
        type: version.type as 'release' | 'snapshot',
        releaseTime: version.releaseTime,
        recommendedJava: javaFor(version.id),
      }))
  })

  ipcMain.handle('get-loader-versions', async (_, { type, gameVersion }: { type: string; gameVersion: string }) => {
    if (type === 'vanilla') return []
    try {
      if (type === 'fabric') {
        const response = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${gameVersion}`)
        if (!response.ok) return []
        const data = (await response.json()) as Array<{ loader: { version: string } }>
        return data.map((item) => item.loader.version).slice(0, 20)
      }
      if (type === 'quilt') {
        const response = await fetch(`https://meta.quiltmc.org/v3/versions/${gameVersion}`)
        if (!response.ok) return []
        const data = (await response.json()) as { loaders: Array<{ version: string }> }
        return data.loaders.map((item) => item.version).slice(0, 20)
      }
    } catch {
      return []
    }
    return []
  })

  ipcMain.handle('download-version', async (_, versionId: string) => {
    try {
      if (await isVersionInstalled(versionId)) {
        return { success: true, message: `Minecraft ${versionId} уже установлен.` }
      }
      await installVersionWithProgress(versionId)
      return { success: true, message: `Minecraft ${versionId} установлен.` }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      sendStatus({ type: 'error', message })
      await writeLog('ERROR', 'Failed to download Minecraft version', message)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('launch-game', async (_, input: { version: string; username: string; loader?: { type: string; version: string } }) => {
    const preflight = await runDiagnostics()
    const javaCheck = preflight.checks.find((check) => check.id === 'java')
    if (javaCheck?.state === 'error') {
      return { success: false, error: javaCheck.message + (javaCheck.solution ? ` ${javaCheck.solution}` : '') }
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(input.username)) {
      return { success: false, error: 'Ник: 3–16 символов, латиница, цифры и _.' }
    }
    if (input.loader && input.loader.type !== 'vanilla') {
      return {
        success: false,
        error: `Запуск с ${input.loader.type} пока поддерживается только для vanilla. Выберите Vanilla в ядре.`,
      }
    }

    const settings = store.store
    const root = minecraftRoot()

    try {
      sendStatus({ type: 'info', message: `Подготовка Minecraft ${input.version}…`, progress: 0 })
      const javaPath = await findJava()
      await writeLog('INFO', `Java path: ${javaPath}`)

      await ensureVersionInstalled(input.version)

      sendStatus({ type: 'info', message: 'Запуск Minecraft…', progress: 95 })
      await launch({
        gamePath: root,
        javaPath,
        version: input.version,
        maxMemory: settings.ram,
        minMemory: 512,
        gameProfile: { name: input.username, id: offlineUuid(input.username) },
        launcherName: 'KwasikLauncher',
        launcherBrand: 'Kwasik',
        extraExecOption: { detached: true, stdio: 'ignore' },
      })

      sendStatus({ type: 'success', message: 'Minecraft запущен.', progress: 100 })
      await writeLog('INFO', `Started Minecraft ${input.version} for ${input.username}`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await writeLog('ERROR', 'Failed to launch Minecraft', errorMessage)
      sendStatus({ type: 'error', message: `Ошибка запуска: ${errorMessage}` })
      return { success: false, error: errorMessage }
    }
  })

  ipcMain.handle('verify-game-files', async () => {
    const installed = await listInstalledVersions()
    if (installed.length === 0) return { success: false, message: 'Файлы игры ещё не загружены.' }
    return { success: true, message: `Установлено версий: ${installed.length}.` }
  })

  ipcMain.handle('get-recommended-mods', async (_, version: string) => {
    const hits = await fetchRecommendedHits(version)
    return enrichMods(hits, version, true)
  })

  ipcMain.handle('search-mods', async (_, input: { query: string; version: string }) => {
    const hits = await searchModrinth(input.query, input.version)
    return enrichMods(hits, input.version, false)
  })

  ipcMain.handle('install-mod', async (_, mod: { projectId: string; version: string; title: string }) => {
    const loaders = encodeURIComponent(JSON.stringify(['fabric', 'quilt', 'forge', 'neoforge']))
    const response = await fetch(
      `https://api.modrinth.com/v2/project/${mod.projectId}/version?game_versions=${encodeURIComponent(JSON.stringify([mod.version]))}&loaders=${loaders}`,
    )
    if (!response.ok) return { success: false, message: 'Не удалось получить файл мода.' }
    const versions = (await response.json()) as Array<{ files: Array<{ url: string; filename: string; primary: boolean }> }>
    const file = versions[0]?.files.find((item) => item.primary) ?? versions[0]?.files[0]
    if (!file) return { success: false, message: `Нет совместимого файла для ${mod.version}.` }
    const mods = path.join(minecraftRoot(), 'mods')
    await fs.mkdir(mods, { recursive: true })
    const download = await fetch(file.url)
    if (!download.ok) return { success: false, message: 'Не удалось скачать мод.' }
    await fs.writeFile(path.join(mods, path.basename(file.filename)), Buffer.from(await download.arrayBuffer()))
    await writeLog('INFO', `Installed mod ${mod.title}`)
    return { success: true, message: `${mod.title} установлен.` }
  })
}
