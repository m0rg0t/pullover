import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const path = process.argv[2]
assert.ok(path, 'Pass the downloaded artifact directory')
const manifest = JSON.parse(await readFile(join(path, 'manifest.json'), 'utf8'))
assert.deepEqual(Object.keys(manifest).sort(), [
  'smoke-actual.png',
  'smoke-diff.png',
  'smoke-reference.png',
])
for (const [name, hash] of Object.entries(manifest)) {
  const bytes = await readFile(join(path, name))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash)
}
console.log('Screenshot artifact round-trip preserved all three PNGs byte-for-byte')
