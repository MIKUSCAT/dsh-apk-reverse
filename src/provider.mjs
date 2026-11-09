import { readFile } from 'node:fs/promises'
import { skillRoot, skillFile, paths } from './paths.mjs'

const providerName = 'dsh-apk-reverse'
const description = '分析、逆向、修改和重新签名 Android APK / AAB / DEX / SO。用于 APK 结构分析、smali / dex 补丁、广告与 SDK 排查、Frida 动态分析、重打包、签名及设备验证。先检查环境和能力边界，再按上游 apk-reverse 流程执行。Android APK reverse engineering, patching, repacking and verification.'

/** The upstream entry remains byte-for-byte intact on disk. */
export function stripFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw)
  if (!match || !/^name:\s*apk-reverse\s*$/mu.test(match[1])) {
    throw new Error('dsh-apk-reverse: invalid upstream SKILL.md frontmatter')
  }
  return raw.slice(match[0].length).trim()
}

function runtimeInstructions() {
  return `# DSH installation context\n\nThis is the packaged apk-reverse skill. Use the actual absolute locations below; never assume the user's workspace contains the upstream repository.\n\n\`\`\`json\n${JSON.stringify(paths(), null, 2)}\n\`\`\`\n\nResolve upstream paths beginning with skills/apk-reverse/ against upstreamRoot. Resolve references/, scripts/, evidence/ and evals/ against skillRoot. Other repository-relative paths such as docs/ and check_repo.py belong under upstreamRoot. Read only the references needed for the current task.\n\nUse DSH's existing file and terminal tools. Keep APK inputs, outputs, keystores and work notes in the user's workspace, never inside this installed package. Preserve the workspace as the process working directory and pass absolute script and input paths. The plugin ships instructions and scripts, not Android SDK binaries or a connected device.\n\nStart by running the packaged CLI with a standalone Node executable: node <cliFile> doctor --json. Pass arguments separately and quote paths with spaces for the actual shell. The CLI discovers Python 3.9+ (including the Windows py -3 launcher); APKREV_PYTHON can point to a specific executable. It does not install tools. Exit code 3 from doctor means missing capabilities, not a plugin failure. On Windows, bash/Unix-specific upstream commands require an appropriate shell or WSL; report that requirement instead of assuming every script is portable.\n\nThe complete upstream workflow follows. Its references and capability evidence are retained without modification.\n\n---\n\n`
}

export function createProvider() {
  const candidate = Object.freeze({
    name: 'apk-reverse', description,
    invocation: Object.freeze({ modelInvocable: true, userInvocable: true }),
    provider: providerName, source: 'bundled',
    // DSH BUNDLED_SKILL_RANK. No runtime dependency duplication is needed.
    rank: 600,
    path: skillFile,
    resourceBase: Object.freeze({ kind: 'directory', path: skillRoot }),
    locator: skillFile,
  })
  return {
    name: providerName,
    async list(options = {}) {
      options.signal?.throwIfAborted()
      return [candidate]
    },
    async get(selected, options = {}) {
      options.signal?.throwIfAborted()
      if (selected.name !== candidate.name || selected.locator !== skillFile) return undefined
      const raw = await readFile(skillFile, { encoding: 'utf8', signal: options.signal })
      const { rank, locator, ...summary } = candidate
      return { ...summary, content: runtimeInstructions() + stripFrontmatter(raw) }
    },
  }
}
