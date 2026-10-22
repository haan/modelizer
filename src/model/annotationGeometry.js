// Shared geometry keeps canvas rendering, selection, erasing and export in sync.
export const SHAPE_TOOLS = ['arrow', 'line', 'rectangle', 'ellipse']
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

export function constrainPoint(start, end, tool) {
  const dx = end.x - start.x, dy = end.y - start.y
  if (tool === 'rectangle' || tool === 'ellipse') {
    const size = Math.max(Math.abs(dx), Math.abs(dy))
    return { x: start.x + (dx < 0 ? -size : size), y: start.y + (dy < 0 ? -size : size) }
  }
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4
  const length = Math.hypot(dx, dy)
  return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length }
}

const strokeCache = new WeakMap()
export function getStrokePoints(stroke) {
  if (stroke.linear || stroke.points.length < 3) return stroke.points
  if (strokeCache.has(stroke)) return strokeCache.get(stroke)
  const points = stroke.points, result = [points[0]]
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)]
    const steps = Math.max(4, Math.min(256, Math.ceil((distance(a, b) + distance(b, c) + distance(c, d)) / 2)))
    for (let j = 1; j <= steps; j++) {
      const t = j / steps, t2 = t * t, t3 = t2 * t
      const coord = (k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3)
      result.push({ x: coord('x'), y: coord('y') })
    }
  }
  strokeCache.set(stroke, result)
  return result
}

export function strokePath(stroke) {
  const points = getStrokePoints(stroke)
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.001 0`
  return points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
}

export function arrowPoints(item) {
  const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1)
  const length = Math.min(distance({ x: item.x1, y: item.y1 }, { x: item.x2, y: item.y2 }), Math.max(10, item.thickness * 4))
  return [-1, 1].map((sign) => ({ x: item.x2 - length * Math.cos(angle + sign * Math.PI / 6), y: item.y2 - length * Math.sin(angle + sign * Math.PI / 6) }))
}

let measureContext
function textWidth(text, size) {
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    measureContext ??= document.createElement('canvas').getContext('2d')
    if (measureContext) {
      measureContext.font = `${size}px sans-serif`
      return measureContext.measureText(text).width
    }
  }
  return text.length * size * 0.62
}

export function getTextLayout(item) {
  const padding = item.padding ?? 0, size = item.fontSize ?? 14
  const available = item.width ? Math.max(size, item.width - 2 * padding) : Infinity
  const lines = []
  for (const paragraph of (item.text ?? '').split('\n')) {
    if (!paragraph || available === Infinity) { lines.push(paragraph); continue }
    let line = ''
    for (const word of paragraph.split(/(\s+)/)) {
      if (line && textWidth(line + word, size) > available) { lines.push(line.trimEnd()); line = '' }
      for (const char of word) {
        if (line && textWidth(line + char, size) > available) { lines.push(line); line = '' }
        if (line || char.trim()) line += char
      }
    }
    lines.push(line)
  }
  const width = item.width ?? Math.max(size * 2, ...lines.map((line) => textWidth(line, size))) + padding * 2
  return { lines, x: item.x - padding, y: item.y - size * 0.95 - padding, width, height: Math.max(1, lines.length) * size * 1.3 + 2 * padding }
}

export function getAnnotationBounds(item, includeStroke = false) {
  if (item.kind === 'text') {
    const { x, y, width, height } = getTextLayout(item)
    const margin = includeStroke && item.border ? 0.5 : 0
    return { x: x - margin, y: y - margin, width: width + margin * 2, height: height + margin * 2 }
  }
  let points = item.kind === 'stroke' ? getStrokePoints(item) : [{ x: item.x1, y: item.y1 }, { x: item.x2, y: item.y2 }]
  if (item.kind === 'shape' && item.shape === 'arrow') points = [...points, ...arrowPoints(item)]
  const extent = points.reduce((bounds, p) => ({
    minX: Math.min(bounds.minX, p.x), minY: Math.min(bounds.minY, p.y),
    maxX: Math.max(bounds.maxX, p.x), maxY: Math.max(bounds.maxY, p.y),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
  const r = includeStroke ? item.thickness / 2 : 0
  return { x: extent.minX - r, y: extent.minY - r, width: extent.maxX - extent.minX + 2 * r, height: extent.maxY - extent.minY + 2 * r }
}

export function moveAnnotation(item, dx, dy) {
  if (item.kind === 'stroke') return { ...item, points: item.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
  if (item.kind === 'shape') return { ...item, x1: item.x1 + dx, y1: item.y1 + dy, x2: item.x2 + dx, y2: item.y2 + dy }
  return { ...item, x: item.x + dx, y: item.y + dy }
}

export function resizeAnnotation(item, handle, point) {
  if (item.kind === 'shape' && handle === 'start') return { ...item, x1: point.x, y1: point.y }
  if (item.kind === 'shape' && handle === 'end') return { ...item, x2: point.x, y2: point.y }
  const bounds = getAnnotationBounds(item)
  const left = handle.includes('w') ? Math.min(point.x, bounds.x + bounds.width - 4) : bounds.x
  const top = handle.includes('n') ? Math.min(point.y, bounds.y + bounds.height - 4) : bounds.y
  const right = handle.includes('e') ? Math.max(point.x, bounds.x + 4) : bounds.x + bounds.width
  const bottom = handle.includes('s') ? Math.max(point.y, bounds.y + 4) : bounds.y + bounds.height
  if (item.kind === 'text') {
    const width = Math.max(item.fontSize * 2 + 2 * (item.padding ?? 0), right - left)
    return { ...item, x: left + (item.padding ?? 0), width }
  }
  const map = (p) => ({ x: left + (bounds.width ? (p.x - bounds.x) / bounds.width : 0) * (right - left), y: top + (bounds.height ? (p.y - bounds.y) / bounds.height : 0) * (bottom - top) })
  if (item.kind === 'stroke') return { ...item, points: item.points.map(map) }
  const start = map({ x: item.x1, y: item.y1 }), end = map({ x: item.x2, y: item.y2 })
  return { ...item, x1: start.x, y1: start.y, x2: end.x, y2: end.y }
}

// Clip a segment against the capsule swept by an eraser. Collect exact circle
// and rectangle intersections, then classify the intervals between them.
function outsideIntervals(a, b, from, to, radius) {
  const cuts = [0, 1], dx = b.x - a.x, dy = b.y - a.y
  const length = distance(from, to), ux = length ? (to.x - from.x) / length : 1, uy = length ? (to.y - from.y) / length : 0
  for (const center of [from, to]) {
    const x = a.x - center.x, y = a.y - center.y
    const qa = dx * dx + dy * dy, qb = 2 * (x * dx + y * dy), qc = x * x + y * y - radius * radius
    const disc = qb * qb - 4 * qa * qc
    if (qa > 0 && disc >= 0) for (const t of [(-qb - Math.sqrt(disc)) / (2 * qa), (-qb + Math.sqrt(disc)) / (2 * qa)]) if (t > 0 && t < 1) cuts.push(t)
  }
  const ax = (a.x - from.x) * ux + (a.y - from.y) * uy, ay = -(a.x - from.x) * uy + (a.y - from.y) * ux
  const vx = dx * ux + dy * uy, vy = -dx * uy + dy * ux
  for (const [origin, delta, edges] of [[ax, vx, [0, length]], [ay, vy, [-radius, radius]]]) {
    if (delta) for (const edge of edges) { const t = (edge - origin) / delta; if (t > 0 && t < 1) cuts.push(t) }
  }
  const isOutside = (t) => {
    const x = ax + vx * t, y = ay + vy * t
    const nearest = Math.max(0, Math.min(length, x))
    return Math.hypot(x - nearest, y) > radius
  }
  cuts.sort((x, y) => x - y)
  const intervals = []
  for (let i = 1; i < cuts.length; i++) if (cuts[i] - cuts[i - 1] > 1e-10 && isOutside((cuts[i] + cuts[i - 1]) / 2)) intervals.push([cuts[i - 1], cuts[i]])
  return intervals
}

export function eraseStroke(stroke, from, to, radius, mode) {
  const points = getStrokePoints(stroke), r = radius + stroke.thickness / 2
  const segments = [], single = points.length === 1
  let current = [], changed = false
  for (let i = 0; i < Math.max(1, points.length - 1); i++) {
    const a = points[i], b = points[i + 1] ?? a
    const outside = outsideIntervals(a, b, from, to, r)
    const retained = outside.reduce((sum, [start, end]) => sum + end - start, 0)
    if (retained < 1 - 1e-8) { changed = true; if (mode === 'whole') return [] }
    for (const [start, end] of outside) {
      const p = lerp(a, b, start), q = lerp(a, b, end)
      if (current.length && distance(current[current.length - 1], p) > 1e-6) { segments.push(current); current = [] }
      if (!current.length) current.push(p)
      if (!single) current.push(q)
      if (end < 1 - 1e-8) { segments.push(current); current = [] }
    }
    if (!outside.length && current.length) { segments.push(current); current = [] }
  }
  if (!changed) return [stroke]
  if (current.length) segments.push(current)
  return segments.filter((segment) => segment.length >= (single ? 1 : 2)).map((segment) => ({ ...stroke, id: crypto.randomUUID(), points: segment, linear: true }))
}
