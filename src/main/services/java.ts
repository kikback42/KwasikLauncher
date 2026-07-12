import { exec } from 'child_process'
import fs from 'fs'

const preferredPatterns = [/jdk-2[1-9]/i, /temurin-2[1-9]/i, /jdk-17/i, /temurin-17/i]

export const findJava = (): Promise<string> =>
  new Promise((resolve) => {
    exec('where java', (error, stdout) => {
      if (error || !stdout.trim()) {
        const fallback = 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11.10-hotspot\\bin\\java.exe'
        resolve(fs.existsSync(fallback) ? fallback : 'java')
        return
      }

      const candidates = stdout.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
      for (const pattern of preferredPatterns) {
        const match = candidates.find((item) => pattern.test(item))
        if (match) {
          resolve(match)
          return
        }
      }

      const adoptium = candidates.find((item) => item.includes('Eclipse Adoptium'))
      resolve(adoptium ?? candidates[0] ?? 'java')
    })
  })

export const checkJavaVersion = (javaPath: string): Promise<{ major: number; output: string }> =>
  new Promise((resolve) => {
    exec(`"${javaPath}" -version`, { windowsHide: true }, (error, _stdout, stderr) => {
      const output = stderr || String(error ?? '')
      const match = output.match(/version\s+"(\d+)(?:\.(\d+))?/)
      const major = match ? Number(match[1] === '1' ? match[2] : match[1]) : 0
      resolve({ major, output })
    })
  })
