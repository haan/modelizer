// Decompose the area outside the union of label rectangles into disjoint bands.
// Unlike even-odd holes, overlapping labels never restore a piece of the line.
export function getLabelClipRects(bounds, holes) {
  const right = bounds.x + bounds.width
  const bottom = bounds.y + bounds.height
  const clipped = holes.map(rect => ({
    x: Math.max(bounds.x, rect.x), y: Math.max(bounds.y, rect.y),
    right: Math.min(right, rect.x + rect.width), bottom: Math.min(bottom, rect.y + rect.height),
  })).filter(rect => rect.right > rect.x && rect.bottom > rect.y)
  const rows = [...new Set([bounds.y, bottom, ...clipped.flatMap(rect => [rect.y, rect.bottom])])].sort((a, b) => a - b)
  const result = []
  for (let i = 1; i < rows.length; i++) {
    const y = rows[i - 1], height = rows[i] - y
    const intervals = clipped.filter(rect => rect.y < rows[i] && rect.bottom > y).sort((a, b) => a.x - b.x)
    let x = bounds.x
    for (const interval of intervals) {
      if (interval.x > x) result.push({ x, y, width: interval.x - x, height })
      x = Math.max(x, interval.right)
    }
    if (x < right) result.push({ x, y, width: right - x, height })
  }
  return result
}
