import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toPng } from 'html-to-image'
import {
  exportFlowPng,
  shouldIncludePngExportNode,
} from '../pngExport.jsx'

const reactFlowMockState = vi.hoisted(() => ({
  skipInit: false,
  nodesInitialized: true,
  setViewport: vi.fn(),
}))

vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,exported')),
}))

vi.mock('@xyflow/react', async () => {
  const React = await import('react')

  return {
    ReactFlow: function MockReactFlow({ children, onInit, defaultNodes: nodes, defaultViewport }) {
      React.useEffect(() => {
        if (reactFlowMockState.skipInit) {
          return
        }
        onInit?.({ setViewport: reactFlowMockState.setViewport })
      }, [onInit])
      return <div className="react-flow__viewport" data-viewport={JSON.stringify(defaultViewport)}>
        {nodes.map((node) => <div key={node.id} className="react-flow__node" />)}
        {children}
      </div>
    },
    useNodesInitialized: () => reactFlowMockState.nodesInitialized,
    useReactFlow: () => ({ viewportInitialized: !reactFlowMockState.skipInit, setViewport: reactFlowMockState.setViewport }),
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
    reactFlowMockState.nodesInitialized = true
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 1
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.documentElement.dataset.theme = 'light'
  })

  it('scopes exports to light without changing a dark editor', async () => {
    document.documentElement.dataset.theme = 'dark'
    toPng.mockImplementationOnce(async (container, options) => {
      expect(container.dataset.theme).toBe('light')
      expect(container).toBeInTheDocument()
      expect(options.backgroundColor).toBe('#ffffff')
      expect(document.documentElement.dataset.theme).toBe('dark')
      return 'data:image/png;base64,light'
    })
    expect(await exportFlowPng(getExportArgs())).toBe('data:image/png;base64,light')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.querySelector('[aria-hidden="true"][data-theme="light"]')).toBeNull()
  })

  it('leaves the dark editor unchanged and removes the export canvas on failure', async () => {
    document.documentElement.dataset.theme = 'dark'
    toPng.mockRejectedValueOnce(new Error('capture failed'))
    await expect(exportFlowPng(getExportArgs())).rejects.toThrow('capture failed')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.querySelector('[aria-hidden="true"][data-theme="light"]')).toBeNull()
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

  it('renders a transparent background and applies the requested margin and resolution', async () => {
    toPng.mockImplementationOnce(async (container, options) => {
      expect(container.style.background).toBe('transparent')
      expect(container.querySelector('.bg-base-100')).toBeNull()
      expect(options).toMatchObject({ backgroundColor: 'transparent', width: 364, height: 264, pixelRatio: 1 })
      return 'data:image/png;base64,transparent'
    })
    await exportFlowPng(getExportArgs({ background: 'transparent', padding: 32, resolution: 'standard' }))
    await exportFlowPng(getExportArgs({ padding: 64, resolution: 'high' }))
    expect(toPng.mock.lastCall[1]).toMatchObject({ width: 428, height: 328, pixelRatio: 2 })
  })

  it('reserves space below the diagram for the physical view default-values legend', async () => {
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const height = this.hasAttribute('data-export-footer') ? 120 : 0
      return { width: 0, height, x: 0, y: 0, top: 0, left: 0, right: 0, bottom: height }
    })
    try {
      await exportFlowPng(getExportArgs({ activeView: 'physical', defaultValueEntries: [{ key: 'Table.value', value: '0' }] }))
      expect(toPng.mock.lastCall[1]).toMatchObject({ height: 512 })
      expect(toPng.mock.lastCall[0].style.height).toBe('512px')
    } finally {
      rect.mockRestore()
    }
  })

  it('expands the image for newly visible content larger than its estimated bounds', async () => {
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const isNode = this.classList.contains('react-flow__node')
      return isNode
        ? { x: 64, y: 64, left: 64, top: 64, right: 564, bottom: 664, width: 500, height: 600 }
        : { x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    })
    try {
      await exportFlowPng(getExportArgs({ padding: 64 }))
      expect(toPng.mock.lastCall[1]).toMatchObject({ width: 628, height: 728 })
    } finally {
      rect.mockRestore()
    }
  })

  it('does not capture an initialized viewport before its nodes are measured', async () => {
    vi.useFakeTimers()
    reactFlowMockState.nodesInitialized = false
    const pending = exportFlowPng(getExportArgs()).catch(error => error)
    await vi.advanceTimersByTimeAsync(5000)
    expect(await pending).toBeInstanceOf(Error)
    expect(toPng).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-hidden="true"][data-theme="light"]')).toBeNull()
  })

  it('waits for asynchronous viewport adjustments before capturing expanded content', async () => {
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return this.classList.contains('react-flow__node')
        ? { left: 0, top: 0, right: 1000, bottom: 900, width: 1000, height: 900 }
        : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    })
    let finishViewport
    reactFlowMockState.setViewport.mockImplementationOnce(() => new Promise(resolve => { finishViewport = resolve }))
    try {
      const pending = exportFlowPng(getExportArgs())
      await vi.waitFor(() => expect(finishViewport).toBeTypeOf('function'))
      expect(toPng).not.toHaveBeenCalled()
      finishViewport(true)
      await pending
      expect(toPng).toHaveBeenCalledOnce()
    } finally {
      rect.mockRestore()
    }
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
