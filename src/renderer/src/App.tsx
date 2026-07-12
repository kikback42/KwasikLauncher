import { useEffect, useMemo, useState } from 'react'
import { Activity, Box, Download, FileDown, FileUp, Gamepad2, ImageIcon, RefreshCw, Settings, ShieldCheck, Sparkles, Star, Trash2, TriangleAlert, Wifi } from 'lucide-react'

type Tab = 'home' | 'versions' | 'mods' | 'settings'
type Check = { id: string; title: string; state: 'ok' | 'warning' | 'error'; message: string; solution?: string }
type Version = { id: string; type: string; releaseTime: string; recommendedJava?: number }

const nav: Array<{ id: Tab; label: string; icon: typeof Gamepad2 }> = [
  { id: 'home', label: 'Главная', icon: Gamepad2 },
  { id: 'versions', label: 'Версии', icon: Box },
  { id: 'mods', label: 'Mod Store', icon: Sparkles },
  { id: 'settings', label: 'Настройки', icon: Settings },
]

const themePresets: Record<AppSettings['theme'], { accent: string; secondary: string }> = {
  'dark-neon': { accent: '#00d9ff', secondary: '#7a52f4' },
  cyberpunk: { accent: '#ff2a6d', secondary: '#ffd319' },
  minimal: { accent: '#e2e8f0', secondary: '#94a3b8' },
  custom: { accent: '#06b6d4', secondary: '#7a52f4' },
}

const defaultSettings: AppSettings = {
  theme: 'dark-neon',
  accentColor: '#06b6d4',
  secondaryColor: '#7a52f4',
  ram: 4096,
  language: 'ru',
  backgroundImage: '',
  backgroundBlur: 8,
  backgroundOpacity: 0.55,
  customTitle: 'KWASIK LAUNCHER',
}

const toFileUrl = (filePath: string): string => `file:///${filePath.replace(/\\/g, '/')}`

const applySettings = (settings: AppSettings): void => {
  const preset = themePresets[settings.theme]
  const accent = settings.theme === 'custom' ? settings.accentColor : preset.accent
  const secondary = settings.theme === 'custom' ? settings.secondaryColor : preset.secondary
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-2', secondary)
  root.style.setProperty('--bg-blur', `${settings.backgroundBlur}px`)
  root.style.setProperty('--bg-opacity', String(settings.backgroundOpacity))
  root.style.setProperty('--bg-image', settings.backgroundImage ? `url("${toFileUrl(settings.backgroundImage)}")` : 'none')
}

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [checks, setChecks] = useState<Check[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [installedVersions, setInstalledVersions] = useState<string[]>([])
  const [version, setVersion] = useState('1.21.5')
  const [username, setUsername] = useState('Player')
  const [status, setStatus] = useState('Проводим проверку системы…')
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState('')
  const [modQuery, setModQuery] = useState('sodium')
  const [mods, setMods] = useState<ModCard[]>([])
  const [recommendedMods, setRecommendedMods] = useState<ModCard[]>([])
  const [expandedMod, setExpandedMod] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [minecraftPath, setMinecraftPath] = useState('')

  const [loaderType, setLoaderType] = useState('vanilla')
  const [loaderVersion, setLoaderVersion] = useState('')
  const [loaderVersions, setLoaderVersions] = useState<string[]>([])

  const ready = !checks.some((check) => check.state === 'error')

  const saveSettings = async (patch: Partial<AppSettings>) => {
    const next = await window.api.setSettings(patch)
    setSettings(next)
    applySettings(next)
  }

  const refreshInstalled = async () => setInstalledVersions(await window.api.getInstalledVersions())

  const runChecks = async () => {
    const report = await window.api.runDiagnostics()
    setChecks(report.checks)
    setStatus(report.ready ? 'Система готова к запуску.' : 'Найдены проблемы, требующие внимания.')
    return report.ready
  }

  const loadVersions = async () => {
    setBusy(true)
    try {
      const list = await window.api.getVersions()
      setVersions(list)
      if (list[0] && !list.some((item) => item.id === version)) setVersion(list[0].id)
      setStatus(`Загружено версий: ${list.length}`)
    } catch {
      setStatus('Не удалось обновить список версий Mojang.')
    } finally {
      setBusy(false)
    }
  }

  const downloadVersion = async (versionId: string) => {
    setBusy(true)
    setProgress(0)
    setStatus(`Загрузка Minecraft ${versionId}…`)
    const result = await window.api.downloadVersion(versionId)
    if (!result.success) setStatus(result.error ?? 'Не удалось скачать версию.')
    else {
      setStatus(result.message ?? `Minecraft ${versionId} установлен.`)
      await refreshInstalled()
    }
    setBusy(false)
  }

  useEffect(() => {
    if (loaderType === 'vanilla') {
      setLoaderVersions([])
      setLoaderVersion('')
      return
    }
    const load = async () => {
      setBusy(true)
      setStatus(`Загрузка версий ${loaderType}…`)
      try {
        const list = await window.api.getLoaderVersions({ type: loaderType, gameVersion: version })
        setLoaderVersions(list)
        if (list[0]) setLoaderVersion(list[0])
        setStatus(list.length ? `Версии ${loaderType} загружены.` : `${loaderType} для ${version} недоступен.`)
      } catch {
        setStatus(`Не удалось получить список ${loaderType}.`)
      } finally {
        setBusy(false)
      }
    }
    void load()
  }, [loaderType, version])

  useEffect(() => {
    void (async () => {
      const saved = await window.api.getSettings()
      setSettings(saved)
      applySettings(saved)
      setMinecraftPath(await window.api.getMinecraftPath())
      await runChecks()
      await loadVersions()
      await refreshInstalled()
    })()
    return window.api.onLaunchStatus((event) => {
      setStatus(event.message)
      if (event.progress !== undefined) setProgress(event.progress)
      if (event.speed) setSpeed(event.speed)
      setBusy(event.type === 'info' || event.type === 'progress')
      if (event.type === 'success') void refreshInstalled()
    })
  }, [])

  const launch = async () => {
    if (!(await runChecks())) return
    setBusy(true)
    setProgress(0)
    const result = await window.api.launchGame({
      version,
      username,
      loader: loaderType !== 'vanilla' ? { type: loaderType, version: loaderVersion } : undefined,
    })
    if (!result.success) {
      setStatus(result.error ?? 'Не удалось запустить игру.')
      setBusy(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      const list = await window.api.getRecommendedMods(version)
      setRecommendedMods(list)
    } catch {
      setStatus('Не удалось загрузить рекомендации модов.')
    }
  }

  useEffect(() => {
    if (tab === 'mods') void loadRecommendations()
  }, [tab, version])

  const searchMods = async () => {
    setBusy(true)
    try {
      const found = await window.api.searchMods(modQuery, version)
      setMods(found)
      setStatus(`Найдено модов: ${found.length}`)
    } catch {
      setStatus('Не удалось получить каталог модов.')
    } finally {
      setBusy(false)
    }
  }

  const installMod = async (mod: ModCard) => {
    setBusy(true)
    const result = await window.api.installMod(mod)
    setStatus(result.message)
    setBusy(false)
  }

  const selectedJava = useMemo(() => versions.find((item) => item.id === version)?.recommendedJava ?? 21, [versions, version])
  const title = settings.customTitle || 'KWASIK LAUNCHER'

  return (
    <div className="launcher-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">K</span>
          <div>
            <strong>{title.split(' ')[0] ?? 'KWASIK'}</strong>
            <small>{title.split(' ').slice(1).join(' ') || 'LAUNCHER'}</small>
          </div>
        </div>
        <div className="nav">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className={tab === item.id ? 'active' : ''}>
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="sidebar-foot">
          <span className={ready ? 'dot good' : 'dot bad'} />
          {ready ? 'SYSTEM READY' : 'ACTION REQUIRED'}
        </div>
      </aside>
      <main className="content">
        {tab === 'home' && (
          <section className="home">
            <div className="hero">
              <div>
                <span className="eyebrow">MINECRAFT CONTROL CENTER</span>
                <h1>
                  PLAY THE
                  <br />
                  <em>UNLIMITED.</em>
                </h1>
                <p>Официальные версии Minecraft. Реальная загрузка. Запуск одной кнопкой.</p>
              </div>
              <div className="hero-card">
                <span>SELECTED BUILD</span>
                <b>
                  {loaderType !== 'vanilla' ? `${loaderType.toUpperCase()} ` : ''}Minecraft {version}
                </b>
                <small>Рекомендуется Java {selectedJava}</small>
                <div className="scan-line" />
              </div>
            </div>
            <div className="launch-panel">
              <div>
                <label>Ник игрока</label>
                <input value={username} onChange={(event) => setUsername(event.target.value)} maxLength={16} />
              </div>
              <div>
                <label>Версия</label>
                <select value={version} onChange={(event) => setVersion(event.target.value)}>
                  {versions.map((item) => (
                    <option key={item.id}>{item.id}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label>Ядро</label>
                <select value={loaderType} onChange={(e) => setLoaderType(e.target.value)}>
                  <option value="vanilla">Vanilla</option>
                  <option value="fabric">Fabric</option>
                  <option value="quilt">Quilt</option>
                </select>
              </div>
              {loaderType !== 'vanilla' && (
                <div className="flex flex-col">
                  <label>Версия ядра</label>
                  <select value={loaderVersion} onChange={(e) => setLoaderVersion(e.target.value)}>
                    {loaderVersions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button className="play" disabled={busy || !ready} onClick={() => void launch()}>
                <Gamepad2 />
                {busy ? 'ПОДГОТОВКА…' : 'ИГРАТЬ'}
              </button>
            </div>
            <Progress progress={progress} speed={speed} visible={busy || progress > 0} />
          </section>
        )}
        {tab === 'versions' && (
          <section>
            <Header title="Версии Minecraft" action={<button className="ghost" onClick={() => void loadVersions()}><RefreshCw size={16} />Обновить</button>} />
            <p className="sub">Список из Mojang. Нажмите «Скачать» для установки или «Играть» на главной для авто-загрузки.</p>
            <div className="version-grid">
              {versions.map((item) => {
                const installed = installedVersions.includes(item.id)
                return (
                  <article className={`version-card ${version === item.id ? 'selected' : ''}`} key={item.id}>
                    <span>{installed ? 'УСТАНОВЛЕНО' : 'RELEASE'}</span>
                    <b>{item.id}</b>
                    <small>
                      Java {item.recommendedJava} · {new Date(item.releaseTime).toLocaleDateString('ru-RU')}
                    </small>
                    <div className="version-actions">
                      <button className="ghost" onClick={() => { setVersion(item.id); setTab('home') }}>Выбрать</button>
                      {!installed && (
                        <button onClick={() => void downloadVersion(item.id)} disabled={busy}>
                          <Download size={14} /> Скачать
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
        {tab === 'mods' && (
          <section>
            <Header title="Mod Store" action={<button className="ghost" onClick={() => void loadRecommendations()}><RefreshCw size={16} />Обновить</button>} />
            <p className="sub">Каталог Modrinth · рекомендации, описания и скриншоты модов.</p>

            <h3 className="mod-section-title"><Star size={16} /> Рекомендуемые моды</h3>
            <div className="mod-grid mod-grid-rich">
              {recommendedMods.map((mod) => (
                <ModCardView key={`rec-${mod.projectId}`} mod={mod} busy={busy} expanded={expandedMod === mod.projectId} onToggle={() => setExpandedMod(expandedMod === mod.projectId ? null : mod.projectId)} onInstall={() => void installMod(mod)} />
              ))}
            </div>

            <h3 className="mod-section-title">Поиск</h3>
            <div className="search">
              <input value={modQuery} onChange={(event) => setModQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void searchMods()} placeholder="Найти мод…" />
              <button onClick={() => void searchMods()} disabled={busy}>
                <Download size={16} />Искать
              </button>
            </div>
            {mods.length > 0 && (
              <>
                <h3 className="mod-section-title">Результаты поиска</h3>
                <div className="mod-grid mod-grid-rich">
                  {mods.map((mod) => (
                    <ModCardView key={mod.projectId} mod={mod} busy={busy} expanded={expandedMod === mod.projectId} onToggle={() => setExpandedMod(expandedMod === mod.projectId ? null : mod.projectId)} onInstall={() => void installMod(mod)} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
        {tab === 'settings' && (
          <section>
            <Header title="Настройки и кастомизация" action={<button className="ghost" onClick={() => void runChecks()}><Activity size={16} />Проверить</button>} />
            <p className="sub">Персонализация интерфейса и параметры запуска Minecraft.</p>

            <div className="settings-grid">
              <article className="settings-card">
                <h3>Внешний вид</h3>
                <label>Название лаунчера</label>
                <input value={settings.customTitle} onChange={(e) => void saveSettings({ customTitle: e.target.value })} />
                <label>Тема</label>
                <select value={settings.theme} onChange={(e) => void saveSettings({ theme: e.target.value as AppSettings['theme'] })}>
                  <option value="dark-neon">Тёмная неоновая</option>
                  <option value="cyberpunk">Киберпанк</option>
                  <option value="minimal">Минимализм</option>
                  <option value="custom">Своя (цвета ниже)</option>
                </select>
                <label>Цвет акцента</label>
                <input type="color" value={settings.accentColor} onChange={(e) => void saveSettings({ accentColor: e.target.value, theme: 'custom' })} />
                <label>Второй цвет</label>
                <input type="color" value={settings.secondaryColor} onChange={(e) => void saveSettings({ secondaryColor: e.target.value, theme: 'custom' })} />
                <label>Фоновое изображение</label>
                <div className="bg-actions">
                  <button className="ghost" onClick={async () => { const path = await window.api.pickBackgroundImage(); if (path) await saveSettings({ backgroundImage: path }) }}>
                    <ImageIcon size={16} /> Выбрать фото
                  </button>
                  {settings.backgroundImage && (
                    <button className="ghost danger" onClick={async () => { const next = await window.api.clearBackgroundImage(); setSettings(next); applySettings(next) }}>
                      <Trash2 size={16} /> Удалить
                    </button>
                  )}
                </div>
                {settings.backgroundImage && <div className="bg-preview" style={{ backgroundImage: `url("${toFileUrl(settings.backgroundImage)}")` }} />}
                <label>Размытие фона: {settings.backgroundBlur}px</label>
                <input type="range" min={0} max={24} value={settings.backgroundBlur} onChange={(e) => void saveSettings({ backgroundBlur: Number(e.target.value) })} />
                <label>Прозрачность затемнения: {Math.round(settings.backgroundOpacity * 100)}%</label>
                <input type="range" min={0.2} max={0.9} step={0.05} value={settings.backgroundOpacity} onChange={(e) => void saveSettings({ backgroundOpacity: Number(e.target.value) })} />
              </article>

              <article className="settings-card">
                <h3>CFG профиль</h3>
                <p className="hint">Импортируй или экспортируй все настройки в файл .cfg — удобно делиться темой с друзьями.</p>
                <div className="bg-actions">
                  <button className="ghost" onClick={async () => {
                    const result = await window.api.importSettingsCfg()
                    setStatus(result.message)
                    if (result.success && result.settings) { setSettings(result.settings); applySettings(result.settings) }
                  }}>
                    <FileUp size={16} /> Импорт из CFG
                  </button>
                  <button className="ghost" onClick={async () => {
                    const result = await window.api.exportSettingsCfg()
                    setStatus(result.message)
                  }}>
                    <FileDown size={16} /> Экспорт в CFG
                  </button>
                </div>
              </article>

              <article className="settings-card">
                <h3>Игра</h3>
                <label>Выделение RAM (MB)</label>
                <input type="number" min={1024} max={16384} step={512} value={settings.ram} onChange={(e) => void saveSettings({ ram: Number(e.target.value) })} />
                <label>Папка Minecraft</label>
                <input value={minecraftPath} readOnly />
                <small className="hint">Версии, библиотеки и моды хранятся здесь.</small>
              </article>
            </div>

            <h3 className="diag-title">Диагностика системы</h3>
            <div className="checks">
              {checks.map((check) => (
                <article key={check.id} className={`check ${check.state}`}>
                  <div>{check.state === 'error' || check.state === 'warning' ? <TriangleAlert /> : <ShieldCheck />}</div>
                  <div>
                    <b>{check.title}</b>
                    <p>{check.message}</p>
                    {check.solution && <small>Решение: {check.solution}</small>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="statusbar">
        <span>
          <Wifi size={14} /> {status}
        </span>
        <span>{progress ? `${progress}% ${speed}` : 'KwasikLauncher · защищённый режим'}</span>
      </footer>
    </div>
  )
}

const ModCardView = ({ mod, busy, expanded, onToggle, onInstall }: { mod: ModCard; busy: boolean; expanded: boolean; onToggle: () => void; onInstall: () => void }) => (
  <article className={`mod-card-rich ${mod.recommended ? 'recommended' : ''}`}>
    <div className="mod-banner" style={{ backgroundImage: mod.bannerUrl ? `url("${mod.bannerUrl}")` : undefined }}>
      {mod.recommended && <span className="mod-badge"><Star size={12} /> Рекомендуем</span>}
      {mod.iconUrl && <img className="mod-icon" src={mod.iconUrl} alt={mod.title} />}
    </div>
    <div className="mod-body">
      <div className="mod-head">
        <div>
          <b>{mod.title}</b>
          <small>{mod.author} · {mod.downloads.toLocaleString('ru-RU')} загрузок</small>
        </div>
        {mod.categories.length > 0 && (
          <div className="mod-tags">{mod.categories.slice(0, 3).map((cat) => <span key={cat}>{cat}</span>)}</div>
        )}
      </div>
      <p className="mod-desc">{mod.description}</p>
      {expanded && <p className="mod-full-desc">{mod.fullDescription}</p>}
      {mod.gallery.length > 1 && (
        <div className="mod-gallery">
          {mod.gallery.slice(0, 4).map((url) => (
            <img key={url} src={url} alt="" loading="lazy" />
          ))}
        </div>
      )}
      <div className="mod-actions">
        <button className="ghost" onClick={onToggle}>{expanded ? 'Свернуть' : 'Подробнее'}</button>
        <button onClick={onInstall} disabled={busy}>Установить</button>
      </div>
    </div>
  </article>
)

const Header = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="section-head">
    <h2>{title}</h2>
    {action}
  </div>
)

const Progress = ({ progress, speed, visible }: { progress: number; speed: string; visible: boolean }) =>
  visible ? (
    <div className="progress">
      <div>
        <span>DOWNLOAD STREAM</span>
        <b>{progress}%</b>
      </div>
      <div className="track">
        <i style={{ width: `${progress}%` }} />
      </div>
      <small>{speed || 'Ожидание данных…'}</small>
    </div>
  ) : null

export default App
