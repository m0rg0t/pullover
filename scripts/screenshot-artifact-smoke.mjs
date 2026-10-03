import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const scratch = await mkdtemp(join(root, '.screenshot-smoke-'))
const artifacts = join(root, '.vitest-attachments', 'artifact-smoke')
const config = join(scratch, 'vitest.config.mjs')
const fixture = join(scratch, 'fixture.test.js')
const baseline = join(scratch, 'baseline.png')
const cli = join(root, 'node_modules', 'vitest', 'vitest.mjs')

const run = (args = []) =>
  spawnSync(process.execPath, [cli, 'run', '--config', config, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, CI: 'true' },
  })

const fixtureSource = (color) => `
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
test('artifact evidence', async () => {
  document.body.innerHTML = '<div data-testid="square" style="width:32px;height:32px;background:${color}"></div>'
  await expect.element(page.getByTestId('square')).toMatchScreenshot('smoke')
})
`

try {
  await rm(artifacts, { recursive: true, force: true })
  await mkdir(artifacts, { recursive: true })
  await writeFile(
    config,
    `import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
export default defineConfig({
  test: {
    include: [${JSON.stringify(relative(root, fixture))}],
    attachmentsDir: ${JSON.stringify(artifacts)},
    browser: {
      enabled: true, headless: true, provider: playwright(),
      instances: [{ browser: 'chromium' }], screenshotFailures: false,
      expect: { toMatchScreenshot: {
        comparatorName: 'pixelmatch',
        resolveScreenshotPath: () => ${JSON.stringify(baseline)},
        resolveDiffPath: ({ arg, ext }) => ${JSON.stringify(artifacts)} + '/' + arg + ext,
      } },
    },
  },
})`,
  )
  await writeFile(fixture, fixtureSource('red'))
  const seed = run(['--update'])
  assert.equal(seed.status, 0, `Synthetic baseline failed: ${seed.stdout}\n${seed.stderr}`)
  await writeFile(fixture, fixtureSource('blue'))
  const mismatch = run()
  assert.equal(
    mismatch.status,
    1,
    `Expected a visual mismatch: ${mismatch.stdout}\n${mismatch.stderr}`,
  )

  await copyFile(baseline, join(artifacts, 'smoke-reference.png'))
  const manifest = {}
  for (const kind of ['reference', 'actual', 'diff']) {
    const name = `smoke-${kind}.png`
    const bytes = await readFile(join(artifacts, name))
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    manifest[name] = createHash('sha256').update(bytes).digest('hex')
  }
  assert.notEqual(manifest['smoke-reference.png'], manifest['smoke-actual.png'])
  await writeFile(join(artifacts, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log('Deliberate visual mismatch retained reference, actual and diff PNGs')
} finally {
  await rm(scratch, { recursive: true, force: true })
}
