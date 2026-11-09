import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { apply, inject } from '../index.mjs'
import { createProvider, stripFrontmatter } from '../src/provider.mjs'
import { skillFile, skillRoot } from '../src/paths.mjs'

test('registers one lazy skill with absolute resource paths', async () => {
  let provider
  apply({ skills: { registerProvider: factory => { provider = factory() } } })
  assert.deepEqual(inject, ['skills'])
  const [candidate] = await provider.list({ cwd: '/unrelated/workspace' })
  assert.equal(candidate.name, 'apk-reverse')
  assert.equal(candidate.content, undefined)
  assert.ok(candidate.description.length < 500)
  assert.deepEqual(candidate.resourceBase, { kind: 'directory', path: skillRoot })
  const skill = await provider.get(candidate)
  const upstream = stripFrontmatter(await readFile(skillFile, 'utf8'))
  assert.ok(skill.content.endsWith(upstream))
  assert.ok(skill.content.includes('DSH installation context'))
  assert.ok(skill.content.includes('APKREV_PYTHON'))
  assert.equal(skill.rank, undefined)
  assert.equal(skill.locator, undefined)
})

test('rejects stale/foreign candidates and honors cancellation', async () => {
  const provider = createProvider()
  const [candidate] = await provider.list()
  assert.equal(await provider.get({ ...candidate, locator: '/not/the/skill' }), undefined)
  const signal = AbortSignal.abort(new Error('cancelled'))
  await assert.rejects(provider.list({ signal }), /cancelled/)
  await assert.rejects(provider.get(candidate, { signal }), /cancelled/)
})

test('broken skill frontmatter and missing registry fail clearly', () => {
  assert.throws(() => stripFrontmatter('not a skill'), /frontmatter/)
  assert.throws(() => stripFrontmatter('---\nname: another\n---\nbody'), /frontmatter/)
  assert.throws(() => apply({}), /skills service/)
})
