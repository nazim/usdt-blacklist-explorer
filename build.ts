import { toSSG } from 'hono/ssg'
import fs from 'node:fs/promises'
import path from 'node:path'
import app from './src/index.tsx'

const OUT_DIR = './dist'

await fs.rm(OUT_DIR, { recursive: true, force: true })
await toSSG(app, fs, { dir: OUT_DIR })

// Static assets (CSS/JS) are served as-is, no bundling needed.
await fs.cp('./public', OUT_DIR, { recursive: true })

// GitHub Pages serves 404.html for unknown paths; the app routes /address/<addr> client-side.
await fs.copyFile(path.join(OUT_DIR, 'index.html'), path.join(OUT_DIR, '404.html'))

console.log(`Built static site to ${path.resolve(OUT_DIR)}`)
