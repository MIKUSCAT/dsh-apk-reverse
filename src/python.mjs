import { spawnSync } from 'node:child_process'

/** Executable and args are always separate; overrides are paths, not shell commands. */
export function findPython({ env = process.env, platform = process.platform, run = spawnSync } = {}) {
  const candidates = env.APKREV_PYTHON
    ? [[env.APKREV_PYTHON, []]]
    : platform === 'win32'
      ? [['py', ['-3']], ['python', []], ['python3', []]]
      : [['python3', []], ['python', []]]
  for (const [command, prefix] of candidates) {
    const result = run(command, [...prefix, '-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'], {
      encoding: 'utf8', timeout: 5000, windowsHide: true, shell: false, env,
      stdio: 'ignore',
    })
    if (!result.error && result.status === 0) return { command, prefix }
  }
  throw new Error('Python 3.9+ was not found. Install Python, or set APKREV_PYTHON to the full executable path (without arguments).')
}
