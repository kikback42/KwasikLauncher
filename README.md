# KwasikLauncher

Minecraft launcher for Windows with real version downloads, customization, and Modrinth mod store.

## Download

Latest release: [GitHub Releases](https://github.com/kikback42/KwasikLauncher/releases/latest)

Download `KwasikLauncher-*-Setup.exe`, run the installer, and launch **KwasikLauncher** from the desktop shortcut.

## Requirements

- Windows 10/11 (64-bit)
- [Java 21](https://adoptium.net/temurin/releases/?version=21) (required for modern Minecraft versions)
- Internet connection for downloading Minecraft and mods

## Features

- Official Minecraft versions from Mojang
- Real download and install with progress
- Full UI customization (themes, colors, background photo)
- Modrinth mod catalog
- System diagnostics before launch

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:win
```

Installer output: `dist/KwasikLauncher-2.0.0-Setup.exe`

### CFG profiles (v2)

Export your theme and settings to a `.cfg` file, or import someone else's profile:

1. Open **Settings**
2. Click **Import from CFG** or **Export to CFG**

Example profile: `resources/example.kwasik.cfg`
