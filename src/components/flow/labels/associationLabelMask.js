import { getLabelClipRects } from './labelClipRects.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const refreshers = new WeakMap()
const strokeSelector = ['association', 'composition', 'reflexiveAssociation', 'associativeAssociation']
  .map(type => `.react-flow__edge-${type} .react-flow__edge-path`).join(',')

// Export calls this synchronously after its final viewport/size adjustment.
// Masks and measurements belong to this canvas, never to persisted model data.
export function refreshAssociationLabelMasks(container) {
  container.querySelectorAll('[data-association-label-mask]').forEach(element => refreshers.get(element)?.refresh())
}

// html-to-image 1.11.11 embeds CSS mask URLs as external images, including
// local SVG fragments. Use equivalent vector clipping in the export canvas;
// clip-path references are left intact by its resource-embedding step.
export function prepareAssociationLabelsForExport(container) {
  container.querySelectorAll('[data-association-label-mask]').forEach(svg => {
    const observer = refreshers.get(svg)
    observer?.refresh()
    observer?.stop()
    const mask = svg.querySelector('mask')
    if (!mask?.children.length) return
    const readRect = rect => Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Number(rect.getAttribute(key))]))
    const rects = getLabelClipRects(readRect(mask), [...mask.querySelectorAll('rect[fill="black"]')].map(readRect))
    const clip = document.createElementNS(SVG_NS, 'clipPath')
    clip.id = `${mask.id}-export`
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse')
    const outline = document.createElementNS(SVG_NS, 'path')
    outline.setAttribute('d', rects.map(({ x, y, width, height }) => `M${x},${y}h${width}v${height}h${-width}Z`).join(''))
    clip.appendChild(outline)
    mask.parentNode.appendChild(clip)
    container.querySelectorAll(strokeSelector).forEach(path => {
      if (path.getAttribute('mask') !== `url(#${mask.id})`) return
      path.removeAttribute('mask')
      path.setAttribute('clip-path', `url(#${clip.id})`)
    })
  })
}

export function observeAssociationLabelMask(svg, mask, id) {
  const viewport = svg.closest('.react-flow')?.querySelector('.react-flow__viewport')
  if (!viewport) return
  const observed = new Set()
  let maskedPaths = new Set()
  let previousGeometry = ''
  const maskUrl = `url(#${id})`
  const clearPath = path => {
    if (path.getAttribute('mask') === maskUrl) path.removeAttribute('mask')
  }
  const refresh = () => {
    const origin = viewport.getBoundingClientRect()
    const zoom = origin.width / viewport.offsetWidth
    if (!Number.isFinite(zoom) || zoom <= 0) return

    const labels = new Set(viewport.querySelectorAll('[data-association-label]'))
    for (const element of observed) {
      if (!labels.has(element)) { resizeObserver.unobserve(element); observed.delete(element) }
    }
    for (const element of labels) {
      if (!observed.has(element)) { observed.add(element); resizeObserver.observe(element) }
    }

    const toFlowRect = element => {
      const rect = element.getBoundingClientRect()
      return { x: (rect.left - origin.left) / zoom, y: (rect.top - origin.top) / zoom,
        width: rect.width / zoom, height: rect.height / zoom }
    }
    // The label already has horizontal padding and a full text line box.
    // Extra vertical padding would cut lines immediately below horizontal names.
    const holes = [...labels].map(toFlowRect).filter(rect => rect.width > 0 && rect.height > 0)
    const paths = new Set(holes.length ? viewport.querySelectorAll(strokeSelector) : [])
    for (const path of maskedPaths) if (!paths.has(path)) clearPath(path)
    for (const path of paths) if (path.getAttribute('mask') !== maskUrl) path.setAttribute('mask', maskUrl)
    maskedPaths = paths

    if (!paths.size) {
      mask.replaceChildren()
      previousGeometry = ''
      return
    }

    // Explicit user-space bounds also work for perfectly horizontal/vertical
    // paths, whose object bounding box has a zero dimension. Include negative
    // coordinates and leave ample room for strokes/markers at the extremes.
    const rects = [...paths].map(toFlowRect).concat(holes)
    const x = Math.min(...rects.map(rect => rect.x)) - 32
    const y = Math.min(...rects.map(rect => rect.y)) - 32
    const width = Math.max(...rects.map(rect => rect.x + rect.width)) + 32 - x
    const height = Math.max(...rects.map(rect => rect.y + rect.height)) + 32 - y
    const geometry = JSON.stringify([x, y, width, height, holes])
    if (geometry === previousGeometry) return
    previousGeometry = geometry
    for (const [key, value] of Object.entries({ x, y, width, height })) mask.setAttribute(key, value)
    const makeRect = (bounds, fill) => {
      const rect = document.createElementNS(SVG_NS, 'rect')
      for (const [key, value] of Object.entries({ ...bounds, fill })) rect.setAttribute(key, value)
      return rect
    }
    mask.replaceChildren(makeRect({ x, y, width, height }, 'white'), ...holes.map(rect => makeRect(rect, 'black')))
  }
  const resizeObserver = new ResizeObserver(refresh)
  const mutations = new MutationObserver(refresh)
  // Mask definitions live outside the viewport. Updating them cannot trigger
  // this observer; mask attributes on strokes are deliberately excluded too.
  mutations.observe(viewport, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['transform', 'style', 'class', 'd'] })
  resizeObserver.observe(viewport)
  const stop = () => { mutations.disconnect(); resizeObserver.disconnect() }
  refreshers.set(svg, { refresh, stop })
  refresh()
  return () => {
    stop()
    refreshers.delete(svg)
    maskedPaths.forEach(clearPath)
  }
}
