import { runInNewContext } from 'node:vm'
import indexHtml from '../../../index.html?raw'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '../useTheme.js'

const bootstrap = indexHtml
  .match(/<script>([\s\S]*?)<\/script>/)[1]

function initialize() {
  runInNewContext(bootstrap, { document, localStorage: window.localStorage })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.style.colorScheme = 'light'
})

describe('theme preference', () => {
  it.each([null, 'light', 'dark', 'invalid', 'DARK'])('restores %s before rendering', (stored) => {
    if (stored !== null) localStorage.setItem('modelizer.theme', stored)
    initialize()
    const expected = stored === 'dark' ? 'dark' : 'light'
    expect(document.documentElement.dataset.theme).toBe(expected)
    expect(document.documentElement.style.colorScheme).toBe(expected)
    const { result } = renderHook(useTheme)
    expect(result.current.theme).toBe(expected)
  })

  it('persists toggles and restores the preference on reload', () => {
    initialize()
    const first = renderHook(useTheme)
    act(() => first.result.current.toggleTheme())
    expect(localStorage.getItem('modelizer.theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    first.unmount()
    document.documentElement.dataset.theme = 'light'
    initialize()
    const second = renderHook(useTheme)
    expect(second.result.current.theme).toBe('dark')
    act(() => second.result.current.toggleTheme())
    expect(localStorage.getItem('modelizer.theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('defaults to light and keeps switching when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    document.documentElement.dataset.theme = 'dark'
    initialize()
    const { result } = renderHook(useTheme)
    expect(result.current.theme).toBe('light')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })
})
