import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AssociationLabel } from '../AssociationLabel.jsx'
import AssociationLabelMask from '../AssociationLabelMask.jsx'
import { prepareAssociationLabelsForExport, refreshAssociationLabelMasks } from '../associationLabelMask.js'
import { toSvg } from 'html-to-image'

let zoom, pan, labelBounds, observers
const bounds = (x, y, width, height) => ({ left: x, top: y, width, height, right: x + width, bottom: y + height })
const screenRect = rect => bounds(pan.x + rect.x * zoom, pan.y + rect.y * zoom, rect.width * zoom, rect.height * zoom)

function Canvas({ name = 'records', transform = 'translate(-50%, -100%) translate(-100px, 80px)', showLabel = true }) {
  return <div className="react-flow">
    <div className="react-flow__viewport">
      <svg>
        {['association', 'composition', 'reflexiveAssociation', 'associativeAssociation', 'relationship'].map(type =>
          <g key={type} className={`react-flow__edge-${type}`}>
            <path className="react-flow__edge-path" d="M -100 -200 L -100 300" />
            <path className="react-flow__edge-interaction" d="M -100 -200 L -100 300" />
          </g>)}
      </svg>
      <div className="react-flow__edgelabel-renderer">
        {showLabel && <AssociationLabel label={name} transform={transform} />}
      </div>
    </div>
    <AssociationLabelMask />
  </div>
}

beforeEach(() => {
  zoom = 1; pan = { x: 0, y: 0 }
  labelBounds = { x: -140, y: 61, width: 80, height: 18 }
  observers = []
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; this.elements = new Set(); observers.push(this) }
    observe(element) { this.elements.add(element) }
    unobserve(element) { this.elements.delete(element) }
    disconnect() { this.elements.clear() }
  })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.matches('.react-flow__viewport')) return screenRect({ x: 0, y: 0, width: 1000, height: 800 })
    if (this.matches('[data-association-label]')) return screenRect(labelBounds)
    return screenRect({ x: -100, y: -200, width: 0, height: 500 })
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('cuts all conceptual strokes behind the name without painting a label background or masking hit targets', () => {
  const { container } = render(<Canvas />)
  const mask = container.querySelector('mask')
  expect(mask).toHaveAttribute('maskUnits', 'userSpaceOnUse')
  expect(mask).toHaveAttribute('y', '-232')
  expect(mask).toHaveAttribute('height', '564')
  expect(mask.querySelector('rect[fill="black"]')).toHaveAttribute('x', '-140')
  expect(mask.querySelector('rect[fill="black"]')).toHaveAttribute('height', '18')
  for (const path of container.querySelectorAll('.react-flow__edge-path')) {
    if (path.closest('.react-flow__edge-relationship')) expect(path).not.toHaveAttribute('mask')
    else expect(path).toHaveAttribute('mask', `url(#${mask.id})`)
  }
  for (const path of container.querySelectorAll('.react-flow__edge-interaction')) expect(path).not.toHaveAttribute('mask')
  const label = container.querySelector('[data-association-label]')
  expect(label.className).not.toMatch(/bg-|backdrop|shadow/)
  // A name ending at y=79 must not erase a horizontal line at y=80.
  const hole = mask.querySelector('rect[fill="black"]')
  expect(Number(hole.getAttribute('y')) + Number(hole.getAttribute('height'))).toBe(79)
})

it.each([0.25, 1, 3])('keeps flow-space gaps unchanged under zoom %s and pan, including negative coordinates', scale => {
  zoom = scale; pan = { x: 350, y: -80 }
  const { container } = render(<Canvas />)
  const hole = container.querySelector('rect[fill="black"]')
  expect(hole).toHaveAttribute('x', '-140')
  expect(hole).toHaveAttribute('y', '61')
  expect(hole).toHaveAttribute('width', '80')
  expect(hole).toHaveAttribute('height', '18')
})

it('updates moved and renamed labels, observes font/size changes, and removes obsolete gaps', async () => {
  const { container, rerender } = render(<Canvas />)
  labelBounds = { x: -300, y: 200, width: 300, height: 36 }
  rerender(<Canvas name="A much longer association name" transform="translate(-300px, 200px)" />)
  await act(async () => {})
  expect(container.querySelector('rect[fill="black"]')).toHaveAttribute('width', '300')
  expect(container.querySelector('rect[fill="black"]')).toHaveAttribute('y', '200')
  labelBounds.width = 320
  act(() => observers[0].callback())
  expect(container.querySelector('rect[fill="black"]')).toHaveAttribute('width', '320')
  rerender(<Canvas showLabel={false} />)
  await act(async () => {})
  expect(container.querySelector('rect[fill="black"]')).toBeNull()
  expect(container.querySelector('.react-flow__edge-path')).not.toHaveAttribute('mask')
  expect(observers[0].elements.size).toBe(1) // Only the viewport remains observed.
})

it('isolates simultaneous editor/export canvases and flushes measurements synchronously for capture', () => {
  const editor = render(<Canvas />)
  labelBounds = { x: 80, y: 100, width: 100, height: 18 }
  const exported = render(<Canvas />)
  const editorMask = editor.container.querySelector('mask')
  const exportMask = exported.container.querySelector('mask')
  expect(editorMask.id).not.toBe(exportMask.id)
  labelBounds.width = 200
  refreshAssociationLabelMasks(exported.container)
  expect(exportMask.querySelector('rect[fill="black"]')).toHaveAttribute('width', '200')
  expect(editorMask.querySelector('rect[fill="black"]')).toHaveAttribute('width', '80')
  exported.unmount()
  expect(observers[1].elements.size).toBe(0)
  expect(editor.container.querySelector('.react-flow__edge-path')).toHaveAttribute('mask', `url(#${editorMask.id})`)
})

it('preserves label clipping through the real html-to-image serializer instead of embedding a local mask URL', async () => {
  vi.stubGlobal('SVGImageElement', class SVGImageElement {}) // Absent in jsdom; this fixture has no SVG images.
  const { container } = render(<Canvas />)
  const sourceStyle = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    if (pseudo) {
      const style = document.createElement('span').style
      style.setProperty('content', 'none')
      return style
    }
    // jsdom does not resolve SVG presentation attributes into computed CSS.
    // Supply the mask/clip CSS that browsers expose to html-to-image.
    if (element.matches('.react-flow__edge-path')) {
      const style = document.createElement('span').style
      style.setProperty('stroke', 'rgb(80, 90, 100)')
      if (element.hasAttribute('mask')) style.setProperty('mask-image', element.getAttribute('mask'))
      if (element.hasAttribute('clip-path')) style.setProperty('clip-path', element.getAttribute('clip-path'))
      return style
    }
    return sourceStyle(element)
  })
  const fetchMock = vi.fn(async () => ({ status: 200, headers: { get: () => 'text/html' },
    blob: async () => new Blob(['<!doctype html><title>Modelizer</title>'], { type: 'text/html' }) }))
  vi.stubGlobal('fetch', fetchMock)
  const options = { skipFonts: true, width: 1000, height: 800 }
  const broken = decodeURIComponent(await toSvg(container, options))
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^#association-label-mask-/), undefined)
  const brokenXml = new DOMParser().parseFromString(broken.slice(broken.indexOf('<svg')), 'image/svg+xml')
  expect(brokenXml.querySelector('.react-flow__edge-path').getAttribute('style')).toContain('mask-image: url("data:text/html;base64,')

  fetchMock.mockClear()
  prepareAssociationLabelsForExport(container)
  const serialized = decodeURIComponent(await toSvg(container, options))
  const xml = new DOMParser().parseFromString(serialized.slice(serialized.indexOf('<svg')), 'image/svg+xml')
  expect(xml.querySelector('parsererror')).toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
  const clip = xml.querySelector('clipPath')
  expect(clip.getAttribute('clipPathUnits')).toBe('userSpaceOnUse')
  expect(clip.querySelector('path').getAttribute('d')).toContain('M')
  const path = xml.querySelector('.react-flow__edge-path')
  expect(path.getAttribute('d')).toBe('M -100 -200 L -100 300')
  expect(path.getAttribute('clip-path')).toBe(`url(#${clip.id})`)
  expect(path.getAttribute('mask')).toBeNull()
  expect(path.getAttribute('style')).not.toContain('mask-image')
  expect(xml.querySelector('.react-flow__edge-interaction').getAttribute('clip-path')).toBeNull()
})
