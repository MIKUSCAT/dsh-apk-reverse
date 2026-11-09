import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { cliFile, skillFile } from '../src/paths.mjs'
import { findPython } from '../src/python.mjs'

test('CLI resolves assets from an unrelated working directory', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'apk reverse cwd '))
  try {
    const result = execFileSync(process.execPath, [cliFile, 'paths'], { cwd, encoding: 'utf8' })
    assert.equal(JSON.parse(result).skillFile, skillFile)
    const list = execFileSync(process.execPath, [cliFile, 'list'], { cwd, encoding: 'utf8' })
    assert.ok(list.includes('doctor.py'))
    const help = execFileSync(process.execPath, [cliFile, 'run', 'preflight.py', '--help'], { cwd, encoding: 'utf8' })
    assert.match(help, /usage:/i)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('CLI refuses traversal and preserves upstream failure exit status', () => {
  const invalid = spawnSync(process.execPath, [cliFile, 'run', '../doctor.py'], { encoding: 'utf8' })
  assert.equal(invalid.status, 2)
  assert.match(invalid.stderr, /basename/)
  const usage = spawnSync(process.execPath, [cliFile, 'run', 'preflight.py', '--not-a-real-option'], { encoding: 'utf8' })
  assert.equal(usage.status, 2)
  assert.match(usage.stderr, /usage:/i)
})

test('Windows Python launcher is selected with separate arguments', () => {
  const calls = []
  const result = findPython({ platform: 'win32', env: {}, run: (exe, args, options) => {
    calls.push({ exe, args, options }); return { status: 0 }
  } })
  assert.deepEqual(result, { command: 'py', prefix: ['-3'] })
  assert.equal(calls[0].args[0], '-3')
  assert.equal(calls[0].options.shell, false)
})

test('custom Python paths with spaces stay one executable; invalid override never silently falls back', () => {
  const pythonPath = 'C:\\Program Files\\Python\\python.exe'
  const result = findPython({ env: { APKREV_PYTHON: pythonPath }, run: exe => {
    assert.equal(exe, pythonPath); return { status: 0 }
  } })
  assert.equal(result.command, pythonPath)
  let count = 0
  assert.throws(() => findPython({ env: { APKREV_PYTHON: 'missing' }, run: () => { count++; return { status: 1 } } }), /Python 3.9/)
  assert.equal(count, 1)
})
