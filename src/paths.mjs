import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

export const pluginRoot = fileURLToPath(new URL('../', import.meta.url))
export const upstreamRoot = join(pluginRoot, 'upstream')
export const skillRoot = join(upstreamRoot, 'skills', 'apk-reverse')
export const skillFile = join(skillRoot, 'SKILL.md')
export const scriptsRoot = join(skillRoot, 'scripts')
export const cliFile = join(pluginRoot, 'bin', 'apk-reverse.mjs')

export function paths() {
  return { pluginRoot, upstreamRoot, skillRoot, skillFile, scriptsRoot, cliFile }
}
