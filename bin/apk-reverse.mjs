#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { paths, scriptsRoot } from '../src/paths.mjs'
import { findPython } from '../src/python.mjs'

const help = `dsh-apk-reverse
  paths                         Print absolute installed resource paths as JSON
  list                          List bundled Python scripts
  doctor [args...]               Check the local toolchain; forwards args to doctor.py
  run <script.py> [args...]      Run a bundled Python script in the current workspace

Use APKREV_PYTHON for a custom Python executable. No tools are auto-installed.
doctor exit 3 means some capabilities are missing. Script exit codes are preserved.
`

async function main() {
  const [action, ...args] = process.argv.slice(2)
  if (!action || action === '--help' || action === '-h') return console.log(help)
  if (action === 'paths') return console.log(JSON.stringify(paths(), null, 2))
  if (action === 'list') {
    return console.log((await readdir(scriptsRoot)).filter(name => name.endsWith('.py')).sort().join('\n'))
  }
  let script, forwarded
  if (action === 'doctor') { script = 'doctor.py'; forwarded = args }
  else if (action === 'run') { [script, ...forwarded] = args }
  else throw new Error(`Unknown command: ${action}. Use --help.`)
  if (!script || !/^[a-zA-Z0-9_]+\.py$/u.test(script)) throw new Error('Use the basename of a bundled Python script, e.g. preflight.py.')
  const scriptPath = join(scriptsRoot, script)
  if (!(await stat(scriptPath)).isFile()) throw new Error(`Script is not a file: ${script}`)
  const python = findPython()
  const child = spawn(python.command, [...python.prefix, scriptPath, ...forwarded], {
    cwd: process.cwd(), stdio: 'inherit', shell: false,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' },
  })
  const forwardInterrupt = () => child.kill('SIGINT')
  const forwardTerminate = () => child.kill('SIGTERM')
  process.on('SIGINT', forwardInterrupt)
  process.on('SIGTERM', forwardTerminate)
  const cleanup = () => {
    process.off('SIGINT', forwardInterrupt)
    process.off('SIGTERM', forwardTerminate)
  }
  child.once('error', error => { cleanup(); console.error(error.message); process.exitCode = 1 })
  child.once('exit', (code, signal) => { cleanup(); process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 143) })
}

main().catch(error => { console.error(`dsh-apk-reverse: ${error.message}`); process.exitCode = 2 })
