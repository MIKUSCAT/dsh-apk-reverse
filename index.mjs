import { createProvider } from './src/provider.mjs'

export const name = 'apk-reverse'
export const inject = ['skills']

/** Register synchronously; the skill body is only read when requested. */
export function apply(ctx) {
  if (typeof ctx.skills?.registerProvider !== 'function') {
    throw new Error('dsh-apk-reverse needs the DSH skills service. Enable @deepseek-ai/dsh-skill and @deepseek-ai/dsh-tool-skill in this profile.')
  }
  ctx.skills.registerProvider(() => createProvider())
}
