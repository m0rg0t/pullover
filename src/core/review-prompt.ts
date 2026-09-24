import type { PullRequest } from '@shared/types'

/** Instructions to paste into a local code agent; no repository access happens in Pullover. */
export function reviewPrompt(pr: PullRequest, roots: string[]): string {
  const locations = roots.length
    ? roots.map((root) => `- ${root}`).join('\n')
    : '- Ask me for a local repository folder'
  return `Review this ${pr.provider === 'gitlab' ? 'GitLab merge request' : 'GitHub pull request'}: ${pr.url}

Repository: ${pr.repository}
Source branch: ${pr.headRefName}
Target branch: ${pr.baseRefName}
Search for the local repository under:
${locations}

Match the repository by its Git remote URL, then fetch the source and target branches. Read the diff, related code and tests. Report concrete defects with file and line references, ordered by severity. Do not modify code or publish a review without asking me first.`
}
