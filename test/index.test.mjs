import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const bundle = fileURLToPath(new URL('../dist/index.mjs', import.meta.url))

function writeEvent(payload) {
  const path = join(mkdtempSync(join(tmpdir(), 'protect-event-')), 'event.json')
  writeFileSync(path, JSON.stringify(payload))
  return path
}

function runAction({ eventName = 'repository_dispatch', eventPath, allowlist = '', env = {} }) {
  const { status, stdout } = spawnSync(process.execPath, [bundle], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: eventName,
      INPUT_ALLOWLIST: allowlist,
      ...(eventPath === undefined ? {} : { GITHUB_EVENT_PATH: eventPath }),
      ...env
    }
  })
  return { status, stdout }
}

test('masks every client_payload value, including nested ones', () => {
  const eventPath = writeEvent({
    client_payload: { token: 'sekrit', nested: { pw: 'hunter2' } }
  })

  const { status, stdout } = runAction({ eventPath })

  assert.equal(status, 0)
  assert.match(stdout, /::add-mask::sekrit/)
  assert.match(stdout, /::add-mask::hunter2/)
})

test('leaves allowlisted members unmasked, matching on the full path', () => {
  const eventPath = writeEvent({
    client_payload: { token: 'sekrit', nested: { pw: 'hunter2' }, branch: 'main' }
  })

  const { stdout } = runAction({ eventPath, allowlist: 'branch,nested.pw' })

  assert.match(stdout, /::add-mask::sekrit/)
  assert.doesNotMatch(stdout, /::add-mask::hunter2/)
  assert.doesNotMatch(stdout, /::add-mask::main/)
})

test('ignores events other than repository_dispatch', () => {
  const eventPath = writeEvent({ client_payload: { token: 'sekrit' } })

  const { status, stdout } = runAction({ eventName: 'push', eventPath })

  assert.equal(status, 0)
  assert.doesNotMatch(stdout, /::add-mask::/)
})

test('fails the job when the event file cannot be read', () => {
  const { status, stdout } = runAction({ eventPath: join(tmpdir(), 'no-such-event.json') })

  assert.equal(status, 1)
  assert.match(stdout, /::error::/)
})

test('fails the job when the event path is unset', () => {
  const { status, stdout } = runAction({ eventPath: undefined })

  assert.equal(status, 1)
  assert.match(stdout, /::error::/)
})

test('masks with a proxy configured, where a reachable undici stub would throw', () => {
  const eventPath = writeEvent({ client_payload: { token: 'sekrit' } })

  const { status, stdout } = runAction({
    eventPath,
    env: { HTTPS_PROXY: 'http://proxy.invalid:3128', HTTP_PROXY: 'http://proxy.invalid:3128' }
  })

  assert.equal(status, 0)
  assert.match(stdout, /::add-mask::sekrit/)
})
