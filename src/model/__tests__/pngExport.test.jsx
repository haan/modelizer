import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toPng } from 'html-to-image'
import {
  exportFlowPng,
  shouldIncludePngExportNode,
} from '../pngExport.jsx'

const reactFlowMockState = vi.hoisted(() => ({
  skipInit: false,
}))

vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,exported')),
}))

vi.mock('reactflow', async () => {
  const React = await import('react')

  return {
    default: function MockReactFlow({ children, onInit }) {
      React.useEffect(() => {
        if (reactFlowMockState.skipInit) {
          return
        }
        onInit?.({})
      }, [onInit])
      return <div className="react-flow__viewport">{children}</div>
    },
    ConnectionLineType: { Straight: 'straight' },
    ConnectionMode: { Loose: 'loose' },
    useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  }
})

function getExportArgs(overrides = {}) {
  return {
    nodes: [
      {
        id: 'class-a',
        position: { x: 100, y: 40 },
        width: 300,
        height: 200,
      },
    ],
    edges: [],
    nodeTypes: {},
    edgeTypes: {},
    annotations: {},
    activeView: 'conceptual',
    showAnnotations: false,
    currentStroke: null,
    defaultValueEntries: [],
    fallbackWidth: 640,
    fallbackHeight: 480,
    includeAccentColorsInExport: true,
    ...overrides,
  }
}

describe('pngExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    reactFlowMockState.skipInit = false
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 1
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('exports full content bounds instead of the fallback viewport size', async () => {
    const dataUrl = await exportFlowPng(getExportArgs())

    expect(dataUrl).toBe('data:image/png;base64,exported')
    expect(toPng).toHaveBeenCalledTimes(1)
    expect(toPng.mock.calls[0][0].style.left).toBe('0px')
    expect(toPng.mock.calls[0][0].style.zIndex).toBe('-1')
    expect(toPng.mock.calls[0][1]).toMatchObject({
      width: 492,
      height: 392,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
  })

  it('does not capture when the offscreen flow fails to initialize', async () => {
    vi.useFakeTimers()
    reactFlowMockState.skipInit = true

    const exportPromise = exportFlowPng(getExportArgs())
    const exportErrorPromise = exportPromise.catch((error) => error)

    await vi.advanceTimersByTimeAsync(5000)

    const error = await exportErrorPromise

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(
      'Timed out waiting for the PNG export canvas to render.',
    )
    expect(toPng).not.toHaveBeenCalled()
  })

  it('keeps existing export filtering semantics', () => {
    const root = document.createElement('div')
    const controls = document.createElement('div')
    controls.dataset.noExport = 'true'
    const child = document.createElement('span')
    controls.appendChild(child)
    const background = document.createElement('div')
    background.className = 'react-flow__background'
    const accent = document.createElement('div')
    accent.dataset.accentBar = 'true'
    root.append(controls, background, accent)

    expect(shouldIncludePngExportNode(child, true)).toBe(false)
    expect(shouldIncludePngExportNode(background, true)).toBe(false)
    expect(shouldIncludePngExportNode(accent, false)).toBe(false)
    expect(shouldIncludePngExportNode(accent, true)).toBe(true)
  })
})
