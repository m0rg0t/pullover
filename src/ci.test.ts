import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8')

describe('CI evidence and quality gates', () => {
  it('keeps hidden screenshot directories in each artifact upload', () => {
    const uploads = workflow
      .split(/(?= {6}- (?:name:|uses:|run:))/)
      .filter((step) => step.includes('uses: actions/upload-artifact@'))
    expect(uploads).toHaveLength(2)
    for (const upload of uploads) {
      expect(upload).toContain('include-hidden-files: true')
      expect(upload).toMatch(/path: \.vitest-attachments\/(?:artifact-smoke\/)?\n/)
    }
  })

  it('pins the evidence directory for every Vitest project', () => {
    const config = readFileSync(resolve(import.meta.dirname, '../vitest.config.ts'), 'utf8')
    expect(config).toContain("resolve(import.meta.dirname, '.vitest-attachments')")
    expect(config.match(/attachmentsDir,/g)).toHaveLength(3)
  })

  it('runs lint, types, build, screenshots and artifact round-trip on the macOS baseline runner', () => {
    expect(workflow).toContain('runs-on: macos-15')
    for (const command of ['npm run lint', 'npm run typecheck', 'npm run build', 'npm test']) {
      expect(workflow).toContain(`- run: ${command}`)
    }
    expect(workflow).toContain('npm run test:artifact-smoke')
    expect(workflow).toContain('node scripts/verify-artifact-roundtrip.mjs .artifact-roundtrip')
    expect(workflow).toContain('if-no-files-found: error')
    expect(workflow).toContain('contents: read')
  })
})
