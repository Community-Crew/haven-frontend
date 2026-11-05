import {afterEach, describe, expect, it, vi} from 'vitest'
import type {Router} from 'vue-router'
import {openLink} from './openLink'
import {Capacitor} from '@capacitor/core'
import {Browser} from '@capacitor/browser'

vi.mock('@capacitor/core', () => ({Capacitor: {isNativePlatform: vi.fn(() => false)}}))
vi.mock('@capacitor/browser', () => ({Browser: {open: vi.fn()}}))

const router = {push: vi.fn()} as unknown as Router

describe('openLink', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('navigates inside the app for an app path', async () => {
    const open = vi.fn()
    vi.stubGlobal('window', {open})

    await openLink('/dashboard/rooms', router)

    expect(router.push).toHaveBeenCalledWith('/dashboard/rooms')
    expect(open).not.toHaveBeenCalled()
  })

  it('treats a protocol-relative URL as external, not an app path', async () => {
    const open = vi.fn()
    vi.stubGlobal('window', {open})

    await openLink('//evil.example.com', router)

    expect(router.push).not.toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith('//evil.example.com', '_blank', 'noopener,noreferrer')
  })

  it('opens a web address in a new tab on the web', async () => {
    const open = vi.fn()
    vi.stubGlobal('window', {open})

    await openLink('https://vestide.nl', router)

    expect(open).toHaveBeenCalledWith('https://vestide.nl', '_blank', 'noopener,noreferrer')
  })

  it('opens a web address in the in-app browser on iOS/Android', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(true)

    await openLink('https://vestide.nl', router)

    expect(Browser.open).toHaveBeenCalledWith({url: 'https://vestide.nl'})
  })
})
