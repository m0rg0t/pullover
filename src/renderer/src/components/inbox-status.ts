import type { InboxSnapshot } from '@shared/ipc'

/** The list loaded, but something is missing from it: an org that hasn't approved Pullover, or a search cut short. */
export function isPartialInbox(snapshot: InboxSnapshot): boolean {
  return snapshot.status === 'ready' && snapshot.errorMessage !== null
}
