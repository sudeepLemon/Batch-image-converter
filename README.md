steps
npm approve-scripts electron
npm install
npm approve-scripts --allow-scripts-pending
npm approve-scripts --all

# Batch Image Converter (Electron)

A desktop batch image resizer/converter with a liquid-glass UI (plus dark, light,
and transparent themes). Pick an input folder (or drag files in), pick an output
folder, and it writes the converted images straight to disk — no zip step.

## Run it during development

Requires [Node.js](https://nodejs.org) (LTS) installed.

```bash
cd batch-image-converter-app
npm install
npm start
```

This opens the app in a normal window. Nothing here needs the internet — no
external assets are loaded.

## Build a portable Windows .exe

Still from the project folder:

```bash
npm install
npm run dist
```

`electron-builder` will produce a single portable executable at:

```
dist/BatchImageConverter-Portable.exe
```

That file is fully standalone/portable — no installer, no admin rights, no
Node.js needed on the machine that runs it. You can copy it to a USB stick or
send it to someone else and they can just double-click it.

**Note on building on non-Windows machines:** electron-builder can cross-build
a Windows target from macOS/Linux, but it needs Wine installed on that machine.
The simplest path is to run `npm run dist` directly on a Windows PC with
Node.js installed — no Wine needed there.

## Adding your own icon (optional)

Drop a `.ico` file at `build/icon.ico` and add this to `package.json` under
`"build" → "win"`:

```json
"win": {
  "target": "portable",
  "icon": "build/icon.ico"
}
```

## Project structure

```
batch-image-converter-app/
├─ main.js          # Electron main process: window, folder dialogs, disk read/write
├─ preload.js        # Safe bridge exposing window.api to the UI
├─ renderer/
│  └─ index.html     # The whole UI (HTML/CSS/JS in one file)
└─ package.json      # Scripts + electron-builder config (portable Windows target)
```

## How it works

- **Select input folder** scans the top level of a folder for image files and
  loads them into the queue (drag-and-drop still works too, and can be mixed
  with folder import).
- **Select output folder** is required before you can hit Start — converted
  files are written directly there via Node's `fs` in the main process. If a
  filename already exists, a ` (1)`, ` (2)`, etc. suffix is added rather than
  overwriting.
- Resizing and re-encoding happens on an HTML canvas in the renderer (JPG,
  PNG, WEBP use the browser's built-in encoder; BMP is written manually since
  browsers don't have a native BMP export).
- Click the ⤴ icon next to a finished file to reveal it in Explorer.
