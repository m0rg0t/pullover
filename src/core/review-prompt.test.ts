import { makePullRequest } from '@core/test-factory'
import { describe, expect, it } from 'vitest'
import { reviewPrompt } from './review-prompt'

describe('reviewPrompt', () => {
  it('identifies a GitLab MR and every configured local search folder', () => {
    const pr = makePullRequest({
      provider: 'gitlab',
      url: 'https://gitlab.example.com/group/app/-/merge_requests/42',
      repository: 'group/app',
      headRefName: 'feature',
      baseRefName: 'main',
    })
    const prompt = reviewPrompt(pr, ['/Projects', '/Work/repositories'])

    expect(prompt).toContain(
      'GitLab merge request: https://gitlab.example.com/group/app/-/merge_requests/42',
    )
    expect(prompt).toContain('Repository: group/app')
    expect(prompt).toContain('- /Projects\n- /Work/repositories')
    expect(prompt).toContain('Match the repository by its Git remote URL')
  })

  it('asks for a checkout when no local folder is configured', () => {
    const prompt = reviewPrompt(makePullRequest({ provider: 'github' }), [])
    expect(prompt).toContain('GitHub pull request')
    expect(prompt).toContain('Ask me for a local repository folder')
  })
})
