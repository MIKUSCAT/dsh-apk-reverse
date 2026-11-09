import test from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry, { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill'
import * as plugin from '../../index.mjs'
import { createProvider } from '../../src/provider.mjs'

test('real DSH registry discovers, loads, overrides and disposes the plugin', async () => {
  const ctx = new Context()
  await ctx.plugin(SkillRegistry)
  const fork = await ctx.plugin(plugin)
  try {
    assert.equal((await createProvider().list())[0].rank, BUNDLED_SKILL_RANK)
    const summary = (await ctx.skills.list({ cwd: process.cwd() })).find(s => s.name === 'apk-reverse')
    assert.ok(summary)
    assert.equal(summary.provider, 'dsh-apk-reverse')
    const skill = await ctx.skills.get('apk-reverse', { cwd: process.cwd() })
    assert.match(skill.content, /DSH installation context/)
    assert.match(skill.content, /Symptom index/)
    const unregister = ctx.skills.registerProvider(() => ({
      name: 'test-project',
      async list() { return [{ ...summary, provider: 'test-project', source: 'project-dsh', rank: 100, locator: 'local' }] },
      async get() { return { ...summary, provider: 'test-project', source: 'project-dsh', content: 'project override' } },
    }))
    assert.equal((await ctx.skills.get('apk-reverse')).content, 'project override')
    unregister()
    assert.match((await ctx.skills.get('apk-reverse')).content, /DSH installation context/)
    await fork.dispose()
    assert.equal((await ctx.skills.list()).length, 0)
  } finally { await ctx.fiber.dispose() }
})
