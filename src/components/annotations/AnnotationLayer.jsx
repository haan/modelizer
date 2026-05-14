import { useEffect, useRef } from 'react'
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

function getCursorForTool(activeTool, penSettings, markerSettings, eraserSettings, zoom, isTemporaryPanMode) {
  if (isTemporaryPanMode) return 'grab'
  if (activeTool === 'pointer') return 'default'
  if (activeTool === 'text') return 'text'
  if (activeTool === 'pen') return buildCircleCursor(penSettings.thickness * zoom, penSettings.color)
  if (activeTool === 'marker') return buildCircleCursor(markerSettings.thickness * zoom, markerSettings.color, markerSettings.opacity * 0.5)
  if (activeTool === 'eraser') return buildCircleCursor(eraserSettings.size * zoom, '#6b7280')
  return 'crosshair'
}

function forwardWheelToReactFlow(e) {
  const overlay = e.currentTarget
  const sourceEvent = e.nativeEvent
  if (!overlay || sourceEvent.__annotationWheelForwarded) {
    return
  }

  // Temporarily opting the overlay out of hit-testing lets the browser resolve
  // the React Flow element underneath. The style is restored before this handler
  // returns, so the mutation is scoped to one synchronous event dispatch.
  const previousPointerEvents = overlay.style.pointerEvents
  overlay.style.pointerEvents = 'none'
  const target = document.elementFromPoint(sourceEvent.clientX, sourceEvent.clientY)
  overlay.style.pointerEvents = previousPointerEvents

  if (!target || overlay.contains(target)) {
    return
  }

  e.preventDefault()
  e.stopPropagation()

  const forwardedEvent = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    composed: true,
    deltaX: sourceEvent.deltaX,
    deltaY: sourceEvent.deltaY,
    deltaZ: sourceEvent.deltaZ,
    deltaMode: sourceEvent.deltaMode,
    clientX: sourceEvent.clientX,
    clientY: sourceEvent.clientY,
    screenX: sourceEvent.screenX,
    screenY: sourceEvent.screenY,
    ctrlKey: sourceEvent.ctrlKey,
    shiftKey: sourceEvent.shiftKey,
    altKey: sourceEvent.altKey,
    metaKey: sourceEvent.metaKey,
  })

  Object.defineProperty(forwardedEvent, '__annotationWheelForwarded', {
    value: true,
  })
  target.dispatchEvent(forwardedEvent)
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

  const stopEditorEventPropagation = (e) => {
    e.stopPropagation()
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
        onPointerDown={stopEditorEventPropagation}
        onPointerMove={stopEditorEventPropagation}
        onPointerUp={stopEditorEventPropagation}
        onMouseDown={stopEditorEventPropagation}
        onMouseMove={stopEditorEventPropagation}
        onMouseUp={stopEditorEventPropagation}
        onClick={stopEditorEventPropagation}
        onDoubleClick={stopEditorEventPropagation}
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

function getTextBounds(item) {
  const lines = item.text.split('\n')
  const lineHeight = item.fontSize * LINE_HEIGHT_RATIO
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0)
  // Text hit targets are an SVG-side approximation so selection works without
  // measuring rendered DOM on every annotation render.
  const width = Math.max(item.fontSize * 2, longestLine * item.fontSize * 0.62)
  return {
    x: item.x,
    y: item.y - item.fontSize * 0.95,
    width,
    height: Math.max(lineHeight, lines.length * lineHeight),
  }
}

function TextSelection({ bounds, zoom }) {
  const handleSize = 6 / zoom
  const half = handleSize / 2
  const handles = [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width, bounds.y],
    [bounds.x, bounds.y + bounds.height],
    [bounds.x + bounds.width, bounds.y + bounds.height],
  ]

  return (
    <g pointerEvents="none">
      <rect
        data-annotation-selection="true"
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1.5 / zoom}
        strokeDasharray={`${4 / zoom} ${3 / zoom}`}
      />
      {handles.map(([x, y], index) => (
        <rect
          key={index}
          x={x - half}
          y={y - half}
          width={handleSize}
          height={handleSize}
          rx={1 / zoom}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth={1.25 / zoom}
        />
      ))}
    </g>
  )
}

function AnnotationText({
  item,
  editing,
  selected,
  activeTool,
  zoom,
  onPointerDown,
  onDoubleClick,
}) {
  if (editing) {
    return null  // caller renders TextEditor directly so it can pass textareaRef
  }

  const lines = item.text.split('\n')
  const lineHeight = item.fontSize * LINE_HEIGHT_RATIO
  const bounds = getTextBounds(item)
  const canInteract = activeTool === 'text'

  return (
    <g
      data-annotation-text-id={item.id}
      style={{ cursor: canInteract && selected ? 'move' : canInteract ? 'text' : 'default' }}
    >
      {selected ? <TextSelection bounds={bounds} zoom={zoom} /> : null}
      {canInteract ? (
        <rect
          data-annotation-hit-target="true"
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill="transparent"
          pointerEvents="all"
          onPointerDown={(e) => onPointerDown(item.id, e)}
          onDoubleClick={(e) => onDoubleClick(item.id, e)}
        />
      ) : null}
      <text
        x={item.x}
        y={item.y}
        fill={item.color}
        fontSize={item.fontSize}
        fontFamily="sans-serif"
        dominantBaseline="alphabetic"
        style={{ userSelect: 'none' }}
        pointerEvents="none"
      >
        {lines.map((line, i) => (
          <tspan key={i} x={item.x} dy={i === 0 ? 0 : lineHeight}>
            {line || ' '}
          </tspan>
        ))}
      </text>
    </g>
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
  isTemporaryPanMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCommitText,
  onCommitTextEdit,
  selectedTextId,
  editingTextId,
  onTextPointerDown,
  onTextDoubleClick,
}) {
  const activeTextareaRef = useRef(null)
  const { x, y, zoom } = useViewport()
  const items = annotations?.[activeView]?.items ?? []
  const cursor = getCursorForTool(
    activeTool,
    penSettings,
    markerSettings,
    eraserSettings,
    zoom,
    isTemporaryPanMode,
  )

  const handleEditCommit = (id, value) => {
    onCommitTextEdit(id, value)
  }

  // Div is the event surface. When an active text input exists, blur it to commit,
  // then return so we don't immediately place a new text annotation.
  const handlePointerDown = (e) => {
    const activeTextarea = activeTextareaRef.current
    if (activeTextarea) {
      if (e.target instanceof Node && activeTextarea.contains(e.target)) {
        return
      }
      activeTextarea.blur()
      return
    }
    onPointerDown(e)
  }

  const handleTextPointerDown = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeTextareaRef.current) {
      activeTextareaRef.current.blur()
      return
    }
    onTextPointerDown(id, e)
  }

  const handleTextDoubleClick = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeTextareaRef.current) {
      activeTextareaRef.current.blur()
    }
    onTextDoubleClick(id, e)
  }

  const editingItem = editingTextId ? items.find((i) => i.id === editingTextId) : null

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
      onWheel={forwardWheelToReactFlow}
    >
      <svg
        width="100%"
        height="100%"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
          {items.map((item) =>
            item.kind === 'stroke' ? (
              <AnnotationStroke key={item.id} stroke={item} />
            ) : (
              <AnnotationText
                key={item.id}
                item={item}
                editing={editingTextId === item.id}
                selected={selectedTextId === item.id}
                activeTool={activeTool}
                zoom={zoom}
                onPointerDown={handleTextPointerDown}
                onDoubleClick={handleTextDoubleClick}
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
