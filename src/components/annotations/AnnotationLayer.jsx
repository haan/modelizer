import { useEffect, useRef, useState } from 'react'
import { useViewport } from 'reactflow'

function buildCircleCursor(diameter, color, fillOpacity = 0) {
  const size = Math.min(128, Math.max(8, Math.round(diameter) + 4))
  const r = (size - 2) / 2
  const cx = size / 2
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${cx}" cy="${cx}" r="${r}" stroke="${color}" stroke-width="1.5" fill="${color}" fill-opacity="${fillOpacity}"/></svg>`
  )
  return `url("data:image/svg+xml,${svg}") ${cx} ${cx}, crosshair`
}

function getCursorForTool(activeTool, penSettings, markerSettings, eraserSettings, zoom) {
  if (activeTool === 'pointer') return 'default'
  if (activeTool === 'text') return 'text'
  if (activeTool === 'pen') return buildCircleCursor(penSettings.thickness * zoom, penSettings.color)
  if (activeTool === 'marker') return buildCircleCursor(markerSettings.thickness * zoom, markerSettings.color, markerSettings.opacity * 0.5)
  if (activeTool === 'eraser') return buildCircleCursor(eraserSettings.size * zoom, '#6b7280')
  return 'crosshair'
}

function pointsToPath(points) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) {
    const { x, y } = points[0]
    return `M ${x} ${y} L ${x} ${y}`
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }
  // Catmull-Rom to cubic bezier
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function AnnotationStroke({ stroke }) {
  const d = pointsToPath(stroke.points)
  if (!d) return null
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.thickness}
      strokeOpacity={stroke.opacity ?? 1}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
    />
  )
}

const LINE_HEIGHT_RATIO = 1.3

// Inline textarea for both new text placement and editing existing text.
// y is the text baseline in flow coords. The foreignObject is shifted up so the
// textarea's rendered baseline aligns with y, matching SVG dominantBaseline="alphabetic".
function TextEditor({ x, y, color, fontSize, initialValue, zoom, onCommit, textareaRef }) {
  const ref = useRef(null)
  const committedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (textareaRef) textareaRef.current = el
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    resizeTextarea(el, fontSize, zoom)
    return () => { if (textareaRef) textareaRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (value) => {
    if (committedRef.current) return
    committedRef.current = true
    onCommit(value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit(ref.current?.value ?? '')
    }
    if (e.key === 'Escape') {
      commit(null)
    }
  }

  const lineHeight = fontSize * LINE_HEIGHT_RATIO
  const topOffset = fontSize * 0.85

  return (
    <foreignObject
      x={x}
      y={y - topOffset}
      width={400 / zoom}
      height={400 / zoom}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <textarea
        ref={ref}
        defaultValue={initialValue ?? ''}
        rows={1}
        onKeyDown={handleKeyDown}
        onInput={(e) => resizeTextarea(e.target, fontSize, zoom)}
        onBlur={(e) => commit(e.target.value)}
        style={{
          pointerEvents: 'all',
          background: 'transparent',
          border: 'none',
          borderBottom: `${1 / zoom}px solid ${color}`,
          outline: 'none',
          color,
          fontSize: `${fontSize}px`,
          fontFamily: 'sans-serif',
          lineHeight: `${lineHeight}px`,
          minWidth: `${80 / zoom}px`,
          minHeight: `${lineHeight}px`,
          padding: 0,
          margin: 0,
          resize: 'none',
          overflow: 'hidden',
          display: 'block',
          whiteSpace: 'pre',
        }}
      />
    </foreignObject>
  )
}

function resizeTextarea(el, fontSize, zoom) {
  el.style.width = `${80 / zoom}px`
  el.style.height = 'auto'
  el.style.width = `${Math.max(el.scrollWidth, 80 / zoom)}px`
  el.style.height = `${el.scrollHeight}px`
}

function AnnotationText({ item, editing, activeTool, zoom, onCommit }) {
  if (editing) {
    return null  // caller renders TextEditor directly so it can pass textareaRef
  }

  const lines = item.text.split('\n')
  const lineHeight = item.fontSize * LINE_HEIGHT_RATIO

  return (
    <text
      x={item.x}
      y={item.y}
      fill={item.color}
      fontSize={item.fontSize}
      fontFamily="sans-serif"
      dominantBaseline="alphabetic"
      data-annotation-id={item.id}
      style={{ cursor: activeTool === 'text' ? 'text' : 'default', userSelect: 'none' }}
      pointerEvents={activeTool === 'text' ? 'all' : 'none'}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={item.x} dy={i === 0 ? 0 : lineHeight}>
          {line || ' '}
        </tspan>
      ))}
    </text>
  )
}

export default function AnnotationLayer({
  annotations,
  activeView,
  activeTool,
  penSettings,
  markerSettings,
  eraserSettings,
  currentStroke,
  pendingText,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCommitText,
  onUpdateText,
}) {
  const [editingId, setEditingId] = useState(null)
  const activeTextareaRef = useRef(null)
  const { x, y, zoom } = useViewport()
  const items = annotations?.[activeView]?.items ?? []
  const cursor = getCursorForTool(activeTool, penSettings, markerSettings, eraserSettings, zoom)

  const handleEditCommit = (id, value) => {
    setEditingId(null)
    if (value !== null) {
      onUpdateText(id, value)
    }
  }

  // Div is the event surface. When an active text input exists, blur it explicitly
  // before e.preventDefault() runs (which would otherwise suppress the blur).
  // Clicking on an existing text item is handled by the <g> capture handler below.
  const handlePointerDown = (e) => {
    if (activeTextareaRef.current) {
      activeTextareaRef.current.blur()
      return  // commit the open input; don't immediately place a new one
    }
    onPointerDown(e)
  }

  // Capture phase on <g>: intercepts text-item clicks before they bubble to the div.
  // Empty-canvas clicks target <svg> directly and never pass through <g> in capture.
  const handleGroupCapture = (e) => {
    if (activeTool !== 'text') return
    const annotEl = e.target.closest?.('[data-annotation-id]')
    if (!annotEl) return
    if (activeTextareaRef.current) {
      activeTextareaRef.current.blur()
    }
    setEditingId(annotEl.dataset.annotationId)
    e.stopPropagation()
  }

  const editingItem = editingId ? items.find((i) => i.id === editingId) : null

  return (
    <div
      className="react-flow__annotation-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: activeTool === 'pointer' ? 'none' : 'all',
        zIndex: 10,
        cursor,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg
        width="100%"
        height="100%"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <g
          transform={`translate(${x}, ${y}) scale(${zoom})`}
          onPointerDownCapture={handleGroupCapture}
        >
          {items.map((item) =>
            item.kind === 'stroke' ? (
              <AnnotationStroke key={item.id} stroke={item} />
            ) : (
              <AnnotationText
                key={item.id}
                item={item}
                editing={editingId === item.id}
                activeTool={activeTool}
                zoom={zoom}
                onCommit={(value) => handleEditCommit(item.id, value)}
              />
            ),
          )}
          {editingItem && (
            <TextEditor
              key={editingItem.id}
              x={editingItem.x}
              y={editingItem.y}
              color={editingItem.color}
              fontSize={editingItem.fontSize}
              initialValue={editingItem.text}
              zoom={zoom}
              onCommit={(value) => handleEditCommit(editingItem.id, value)}
              textareaRef={activeTextareaRef}
            />
          )}
          {currentStroke && <AnnotationStroke stroke={currentStroke} />}
          {pendingText && (
            <TextEditor
              x={pendingText.x}
              y={pendingText.y}
              color={pendingText.color}
              fontSize={pendingText.fontSize}
              initialValue=""
              zoom={zoom}
              onCommit={(value) => onCommitText(value ?? '')}
              textareaRef={activeTextareaRef}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
