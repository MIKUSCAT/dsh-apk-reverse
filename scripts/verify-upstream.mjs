import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pluginRoot, upstreamRoot } from '../src/paths.mjs'

const manifest = JSON.parse(await readFile(join(pluginRoot, 'upstream-manifest.json'), 'utf8'))
let errors = 0
for (const [path, hash] of Object.entries(manifest.files)) {
  try {
    const actual = createHash('sha256').update(await readFile(join(upstreamRoot, path))).digest('hex')
    if (actual !== hash) { console.error(`Modified: ${path}`); errors++ }
  } catch { console.error(`Missing: ${path}`); errors++ }
}
async function checkExtras(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'].includes(entry.name)) continue
    const path = prefix + entry.name
    if (entry.isDirectory()) await checkExtras(join(dir, entry.name), path + '/')
    else if (!(path in manifest.files)) { console.error(`Unexpected upstream file: ${path}`); errors++ }
  }
}
await checkExtras(upstreamRoot)
if (errors) process.exitCode = 1
else console.log(`Verified ${Object.keys(manifest.files).length} original upstream files (SHA-256).`)
