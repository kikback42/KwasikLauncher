import { ipcMain } from 'electron'
import { Client } from 'minecraft-launcher-core'
import { store } from './config'
import path from 'path'

export function setupLauncherHandlers() {
  ipcMain.handle('launch-game', async (_, { version, username }) => {
    const launcher = new Client()
    const settings = store.store

    const opts = {
      authorization: {
        access_token: 'offline',
        client_token: 'offline',
        uuid: 'offline',
        name: username,
        user_properties: {},
      },
      root: path.join(process.cwd(), '.minecraft'),
      version: {
        number: version,
        type: 'release',
      },
      memory: {
        max: `${settings.ram}M`,
        min: '512M',
      },
    }

    try {
      launcher.launch(opts)
      launcher.on('debug', (e) => console.log(e))
      launcher.on('data', (e) => console.log(e))
      return { success: true }
    } catch (error) {
      console.error(error)
      return { success: false, error: String(error) }
    }
  })
}
