import type { DeviceCodePayload } from '@shared/ipc'
import { DEFAULT_SETTINGS } from '@shared/types'
import { Reshaped } from 'reshaped/bundle'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { visualCase } from '../test/visual'
import SignIn from './SignIn'

/**
 * The only component screenshotted here that reaches for the IPC bridge on
 * mount, so the bridge is stubbed rather than the component reshaped to suit
 * the test. `SignIn` fills its parent, which in the app is the shell's whole
 * column, so the case gives it a height to fill.
 */
function signIn(
  code: DeviceCodePayload | null,
  provider: 'github' | 'gitlab' = 'github',
  height = provider === 'gitlab' ? 620 : 320,
  oauthAvailable = true,
): React.JSX.Element {
  window.api = {
    getSettings: () => Promise.resolve({ ...DEFAULT_SETTINGS, provider }),
    onSettings: () => () => {},
    switchProvider: async () => {},
    canUseGitHubDeviceFlow: async () => oauthAvailable,
    startAuth: async () => {},
    onDeviceCode: (listener: (payload: DeviceCodePayload) => void) => {
      if (code !== null) listener(code)
      return () => {}
    },
  } as unknown as typeof window.api

  return (
    <div style={{ height }}>
      <SignIn />
    </div>
  )
}

visualCase('prompt', () => signIn(null))
visualCase('gitlab', () => signIn(null, 'gitlab'))

test('GitHub browser sign-in (light)', async () => {
  document.documentElement.setAttribute('data-rs-color-mode', 'light')
  const screen = await render(
    <Reshaped theme="slate" defaultColorMode="light">
      <div data-testid="github-sign-in" style={{ width: '440px', height: 620 }}>
        {signIn(null, 'github', 620)}
      </div>
    </Reshaped>,
  )

  await screen.getByRole('button', { name: 'GitHub', exact: true }).click()
  const signInButton = screen.getByRole('button', { name: 'Sign in with GitHub' })
  await expect.element(signInButton).toBeEnabled()
  await expect.element(screen.getByLabelText('GitHub access token')).not.toBeInTheDocument()
  await expect.element(screen.getByTestId('github-sign-in')).toMatchScreenshot('github-oauth-light')

  const startAuth = vi.fn(async () => {})
  window.api.startAuth = startAuth
  await signInButton.click()
  expect(startAuth).toHaveBeenCalledOnce()
})

test('explains why a source build without OAuth configuration cannot sign in', async () => {
  const screen = await render(signIn(null, 'github', 320, false))
  await screen.getByRole('button', { name: 'GitHub', exact: true }).click()
  await expect.element(screen.getByRole('button', { name: 'Sign in with GitHub' })).toBeDisabled()
  await expect.element(screen.getByText(/needs a GitHub OAuth Client ID/)).toBeVisible()
})

visualCase('device-code', () =>
  signIn({ userCode: 'WDJB-MJHT', verificationUri: 'github.com/login/device' }),
)
