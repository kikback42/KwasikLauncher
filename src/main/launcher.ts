import { launch } from '@xmcl/core'
import {
  getVersionList,
  installTask,
  installFabric,
  installQuiltVersion,
  installForge,
  installNeoForged,
  getForgeVersionList,
} from '@xmcl/installer'
import { BrowserWindow, ipcMain } from 'electron'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { store, AppSettings } from './config'
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

const installLoader = async (
  root: string,
  javaPath: string,
  gameVersion: string,
  type: string,
  loaderVersion: string,
): Promise<string> => {
  const javaOpt = { java: javaPath }
  switch (type) {
    case 'fabric':
      return installFabric({ minecraftVersion: gameVersion, version: loaderVersion, minecraft: root })
    case 'quilt':
      return installQuiltVersion({ minecraftVersion: gameVersion, version: loaderVersion, minecraft: root })
    case 'forge':
      return installForge({ mcversion: gameVersion, version: loaderVersion }, root, javaOpt)
    case 'neoforge':
      return installNeoForged('neoforge', loaderVersion, root, javaOpt)
    default:
      throw new Error(`Неизвестное ядро: ${type}`)
  }
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
      if (type === 'forge') {
        const data = await getForgeVersionList({ minecraft: gameVersion })
        return data.versions
          .filter((item) => item.type !== 'buggy')
          .map((item) => item.version)
          .slice(0, 20)
      }
      if (type === 'neoforge') {
        const response = await fetch('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml')
        if (!response.ok) return []
        const xml = await response.text()
        const versions = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((match) => match[1])
        return versions.slice(-20).reverse()
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

    const settings = store.store
    const root = minecraftRoot()

    try {
      sendStatus({ type: 'info', message: `Подготовка Minecraft ${input.version}…`, progress: 0 })
      const javaPath = await findJava()
      await writeLog('INFO', `Java path: ${javaPath}`)

      await ensureVersionInstalled(input.version)

      let launchVersion = input.version
      if (input.loader && input.loader.type !== 'vanilla') {
        sendStatus({
          type: 'info',
          message: `Установка ${input.loader.type} ${input.loader.version} для ${input.version}…`,
          progress: 60,
        })
        launchVersion = await installLoader(root, javaPath, input.version, input.loader.type, input.loader.version)
        await writeLog('INFO', `Installed ${input.loader.type} ${input.loader.version} as ${launchVersion}`)
      }

      sendStatus({ type: 'info', message: 'Запуск Minecraft…', progress: 95 })
      await launch({
        gamePath: root,
        javaPath,
        version: launchVersion,
        maxMemory: settings.ram,
        minMemory: 512,
        gameProfile: { name: input.username, id: offlineUuid(input.username) },
        launcherName: 'KwasikLauncher',
        launcherBrand: 'Kwasik',
        extraExecOption: { detached: true, stdio: 'ignore' },
      })

      sendStatus({ type: 'success', message: 'Minecraft запущен.', progress: 100 })
      await writeLog('INFO', `Started Minecraft ${launchVersion} for ${input.username}`)
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

  const localAiReply = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('форж') || q.includes('forge'))
      return 'Forge: выберите «Ядро → Forge», лаунчер сам скачает нужную версию под выбранный Minecraft и запустит её. Для 1.20.1 это самый стабильный вариант.'
    if (q.includes('фабрик') || q.includes('fabric'))
      return 'Fabric: выберите «Ядро → Fabric», лаунчер установит loader и запустит игру. Моды кладите в папку .minecraft/mods.'
    if (q.includes('озу') || q.includes('ram') || q.includes('памят') || q.includes('выдел'))
      return 'ОЗУ: в Настройках укажите 2048–4096 МБ для обычной игры, 6144–8192 МБ при большом числе модов. Слишком много — игра может не запуститься на слабом ПК.'
    if (q.includes('запус') || q.includes('не работ') || q.includes('ошибк') || q.includes('вылет'))
      return 'Не запускается: откройте Настройки → Диагностика. Чаще всего нужна Java 21 (для 1.20.5+/1.21+) или не хватает места на диске. Также проверьте, что версия скачана.'
    if (q.includes('мод') || q.includes('mod'))
      return 'Моды: откройте «Mod Store», найдите мод поиском или возьмите из рекомендаций, нажмите «Установить». Файл попадёт в .minecraft/mods. Для модов нужен Fabric/Forge/Quilt/NeoForge.'
    if (q.includes('java'))
      return 'Java: для современного Minecraft нужна Java 21 (64-bit) с adoptium.net. Лаунчер сам найдёт установленную Java через переменную PATH.'
    return 'Я помощник KwasikLauncher. Спросите меня про установку Forge/Fabric, выделение ОЗУ, запуск игры или моды. Для умного чата укажите API-ключ в Настройках — тогда ответы даст нейросеть, а лаунчер останется лёгким.'
  }

  ipcMain.handle('ai-chat', async (_, input: { messages: Array<{ role: string; content: string }> }) => {
    const settings = store.store as AppSettings
    const lastUser = [...input.messages].reverse().find((item) => item.role === 'user')
    const query = lastUser?.content ?? ''

    if (!settings.aiApiKey) {
      return { ok: true, text: localAiReply(query), offline: true }
    }

    try {
      const baseUrl = (settings.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
      const model = settings.aiModel || 'gpt-4o-mini'
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.aiApiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          messages: [
            {
              role: 'system',
              content:
                'Ты — дружелюбный помощник лаунчера KwasikLauncher для Minecraft. Отвечай кратко на русском, по делу, про установку версий, ядра (Forge/Fabric/Quilt/NeoForge), моды Modrinth, Java и ОЗУ.',
            },
            ...input.messages,
          ],
        }),
      })
      if (!response.ok) return { ok: false, error: `AI вернул ошибку: ${response.status}` }
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const text = data.choices?.[0]?.message?.content?.trim() ?? ''
      if (!text) return { ok: false, error: 'AI вернул пустой ответ.' }
      return { ok: true, text }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, error: `Не удалось обратиться к AI: ${message}` }
    }
  })
}
