import { useEffect, useId, useRef, useState } from 'react'
import { useViewport } from 'reactflow'
import { arrowPoints, getAnnotationBounds, getTextLayout, strokePath } from '../../model/annotationGeometry.js'

function buildCircleCursor(diameter, color, fillOpacity = 0) {
  const size = Math.min(128, Math.max(8, Math.round(diameter) + 4))
  const r = (size - 2) / 2
  const cx = size / 2
  // A two-tone outline keeps even black/white drawing cursors visible on either theme.
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${cx}" cy="${cx}" r="${Math.max(1, r - 1)}" stroke="white" stroke-width="4" fill="none"/><circle cx="${cx}" cy="${cx}" r="${Math.max(1, r - 1)}" stroke="black" stroke-width="2.5" fill="none"/><circle cx="${cx}" cy="${cx}" r="${Math.max(1, r - 1)}" stroke="${color}" stroke-width="1.5" fill="${color}" fill-opacity="${fillOpacity}"/></svg>`
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


function AnnotationShape({ item, hit = false, zoom = 1 }) {
  const props = { fill: 'none', stroke: hit ? 'transparent' : item.color, strokeWidth: hit ? Math.max(item.thickness, 12 / zoom) : item.thickness, strokeLinecap: 'round', strokeLinejoin: 'round', pointerEvents: hit ? 'stroke' : 'none' }
  const x = Math.min(item.x1, item.x2), y = Math.min(item.y1, item.y2)
  const width = Math.abs(item.x2 - item.x1), height = Math.abs(item.y2 - item.y1)
  if (item.shape === 'rectangle') return <rect {...props} x={x} y={y} width={width} height={height} />
  if (item.shape === 'ellipse') return <ellipse {...props} cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} />
  const ends = item.shape === 'arrow' ? arrowPoints(item) : []
  const d = 'M ' + item.x1 + ' ' + item.y1 + ' L ' + item.x2 + ' ' + item.y2 +
    (ends.length ? ' M ' + ends[0].x + ' ' + ends[0].y + ' L ' + item.x2 + ' ' + item.y2 + ' L ' + ends[1].x + ' ' + ends[1].y : '')
  return <path {...props} d={d} />
}

function AnnotationVisual({ item, hit = false, zoom = 1 }) {
  if (item.kind === 'shape') return <AnnotationShape item={item} hit={hit} zoom={zoom} />
  if (item.kind === 'stroke') return <path d={strokePath(item)} fill="none" stroke={hit ? 'transparent' : item.color}
    strokeWidth={hit ? Math.max(item.thickness, 12 / zoom) : item.thickness} strokeOpacity={hit ? 1 : item.opacity ?? 1}
    strokeLinecap="round" strokeLinejoin="round" pointerEvents={hit ? 'stroke' : 'none'} />
  const layout = getTextLayout(item)
  if (hit) return <rect data-annotation-hit-target="true" x={layout.x} y={layout.y} width={layout.width} height={layout.height} fill="transparent" pointerEvents="all" />
  return <g pointerEvents="none">
    {(item.background || item.border) && <rect x={layout.x} y={layout.y} width={layout.width} height={layout.height} rx={3}
      fill={item.background || 'none'} stroke={item.border ? item.color : 'none'} strokeWidth={1} />}
    <text x={item.x} y={item.y} fill={item.color} fontSize={item.fontSize} fontFamily="sans-serif" dominantBaseline="alphabetic" style={{ userSelect: 'none' }}>
      {layout.lines.map((line, i) => <tspan key={i} x={item.x} dy={i === 0 ? 0 : item.fontSize * 1.3}>{line || ' '}</tspan>)}
    </text>
  </g>
}

function AnnotationSelection({ item, zoom, onPointerDown }) {
  const bounds = getAnnotationBounds(item), size = 10 / zoom
  const handles = item.kind === 'text'
    ? [['w', bounds.x, bounds.y + bounds.height / 2], ['e', bounds.x + bounds.width, bounds.y + bounds.height / 2]]
    : item.kind === 'shape' && ['line', 'arrow'].includes(item.shape)
      ? [['start', item.x1, item.y1], ['end', item.x2, item.y2]]
      : [['nw', bounds.x, bounds.y], ['ne', bounds.x + bounds.width, bounds.y], ['sw', bounds.x, bounds.y + bounds.height], ['se', bounds.x + bounds.width, bounds.y + bounds.height]]
  return <g>
    <rect data-annotation-selection="true" {...bounds} fill="none" stroke="rgb(var(--color-selection))"
      strokeWidth={1.5 / zoom} strokeDasharray={4 / zoom + ' ' + 3 / zoom} pointerEvents="none" />
    {handles.map(([handle, x, y]) => <rect key={handle} data-resize-handle={handle}
      aria-label={'Resize annotation ' + handle} x={x - size / 2} y={y - size / 2} width={size} height={size}
      fill="rgb(var(--color-base-100))" stroke="rgb(var(--color-selection))" strokeWidth={1.5 / zoom}
      pointerEvents="all" style={{ cursor: handle === 'w' || handle === 'e' ? 'ew-resize' : handle === 'ne' || handle === 'sw' ? 'nesw-resize' : 'nwse-resize' }}
      onPointerDown={(e) => onPointerDown(item.id, e, handle)} />)}
  </g>
}

function TextEditor({ item, initialValue, zoom, onCommit, textareaRef }) {
  const ref = useRef(null), committed = useRef(false)
  const resize = (el) => {
    el.style.width = item.width ? Math.max(item.fontSize, item.width - 2 * (item.padding ?? 0)) + 'px' : 80 / zoom + 'px'
    el.style.height = 'auto'
    if (!item.width) el.style.width = Math.max(el.scrollWidth, 80 / zoom) + 'px'
    el.style.height = Math.max(el.scrollHeight, item.fontSize * 1.3) + 'px'
  }
  useEffect(() => {
    const el = ref.current
    textareaRef.current = el
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    resize(el)
    return () => { textareaRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const commit = (value) => { if (!committed.current) { committed.current = true; onCommit(value) } }
  const stop = (e) => e.stopPropagation()
  const layout = getTextLayout({ ...item, text: initialValue ?? '' })
  return <foreignObject x={item.x} y={item.y - item.fontSize * 0.85}
    width={Math.max(layout.width, 400 / zoom)} height={Math.max(layout.height, 400 / zoom)} style={{ overflow: 'visible', pointerEvents: 'none' }}>
    <textarea ref={ref} aria-label="Annotation text" defaultValue={initialValue ?? ''} rows={1}
      onInput={(e) => resize(e.target)} onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(ref.current.value) }
        if (e.key === 'Escape') { e.preventDefault(); commit(null) }
      }}
      onPointerDown={stop} onPointerMove={stop} onPointerUp={stop} onMouseDown={stop} onMouseMove={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
      style={{ pointerEvents: 'all', background: item.background || 'transparent', border: 'none', borderBottom: 1 / zoom + 'px solid ' + item.color,
        outline: 'none', color: item.color, fontSize: item.fontSize + 'px', fontFamily: 'sans-serif', lineHeight: 1.3, padding: 0, margin: 0,
        resize: 'none', overflow: 'hidden', display: 'block', whiteSpace: item.width ? 'pre-wrap' : 'pre', overflowWrap: 'anywhere' }} />
  </foreignObject>
}

// This component is mounted only for the laser tool, never in export canvases.
function LaserPointer({ isPanning }) {
  const gradientId = useId()
  const [point, setPoint] = useState(null)
  const [trail, setTrail] = useState([])
  const [now, setNow] = useState(0)
  const dragging = useRef(false)
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now()
      setNow(now)
      setTrail((cur) => cur.length ? cur.filter((entry) => now - entry.time < 650) : cur)
    }, 16)
    const clear = () => { dragging.current = false; setPoint(null); setTrail([]) }
    window.addEventListener('blur', clear)
    return () => { window.clearInterval(timer); window.removeEventListener('blur', clear) }
  }, [])
  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const time = Date.now()
    const next = { x: e.clientX - rect.left, y: e.clientY - rect.top, time }
    setPoint(next)
    if (dragging.current && !isPanning) {
      const samples = e.nativeEvent.getCoalescedEvents?.() ?? []
      const points = samples.map((sample) => ({ x: sample.clientX - rect.left, y: sample.clientY - rect.top,
        time: time - Math.max(0, e.timeStamp - sample.timeStamp) }))
      points.push(next)
      setTrail((cur) => {
        const result = cur.filter((entry) => time - entry.time < 650)
        for (const entry of points) {
          const last = result.at(-1)
          if (!last || Math.hypot(entry.x - last.x, entry.y - last.y) >= 0.5) result.push(entry)
        }
        return result.slice(-512)
      })
    }
  }
  const opacity = (entry) => Math.min(1, Math.max(0, 1 - (now - entry.time) / 650))
  return <div data-laser-surface="true" style={{ position: 'absolute', inset: 0, cursor: isPanning ? 'grab' : 'none' }}
    onPointerDown={(e) => {
      dragging.current = e.button === 0
      if (!isPanning && e.button === 0) e.currentTarget.setPointerCapture?.(e.pointerId)
      move(e)
    }}
    onPointerMove={move} onPointerUp={() => { dragging.current = false }}
    onLostPointerCapture={() => { dragging.current = false }}
    onPointerCancel={() => { dragging.current = false; setPoint(null); setTrail([]) }}
    onPointerLeave={() => { setPoint(null); dragging.current = false }}>
    <svg width="100%" height="100%" style={{ pointerEvents: 'none' }} aria-hidden="true">
      {!isPanning && trail.slice(1).map((end, i) => {
        const start = trail[i], before = trail[Math.max(0, i - 1)], after = trail[Math.min(trail.length - 1, i + 2)]
        const id = gradientId + '-' + i
        // Continuous cubic tangents soften sparse input; per-segment gradients
        // fade smoothly without the dark beads caused by overlapping round caps.
        const d = `M ${start.x} ${start.y} C ${start.x + (end.x - before.x) / 6} ${start.y + (end.y - before.y) / 6}, ${end.x - (after.x - start.x) / 6} ${end.y - (after.y - start.y) / 6}, ${end.x} ${end.y}`
        return <g key={i}>
          <defs><linearGradient id={id} gradientUnits="userSpaceOnUse" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            <stop offset="0" stopColor="#ef4444" stopOpacity={opacity(start)} />
            <stop offset="1" stopColor="#ef4444" stopOpacity={opacity(end)} />
          </linearGradient></defs>
          <path data-laser-trail="true" d={d} fill="none" stroke={`url(#${id})`} strokeWidth={4} strokeLinecap="butt" />
        </g>
      })}
      {point && !isPanning && <g><circle cx={point.x} cy={point.y} r={13} fill="#ef4444" fillOpacity={0.2} stroke="white" strokeWidth={2} />
        <circle cx={point.x} cy={point.y} r={5} fill="#ef4444" stroke="#7f1d1d" /></g>}
    </svg>
  </div>
}

export default function AnnotationLayer({
  annotations, activeView, activeTool, penSettings, markerSettings, eraserSettings, currentStroke, pendingText,
  isTemporaryPanMode, onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  onCommitText, onCommitTextEdit, selectedTextId, selectedId, editingTextId,
  onTextPointerDown, onItemPointerDown, onTextDoubleClick, onSelectItem,
}) {
  const activeTextareaRef = useRef(null)
  const capturedPointer = useRef(null)
  const { x, y, zoom } = useViewport()
  const items = annotations?.[activeView]?.items ?? []
  const selected = selectedId ?? selectedTextId
  const selectedItem = items.find((item) => item.id === selected)
  const editingItem = items.find((item) => item.id === editingTextId)
  const handleItemPointerDown = (id, e, handle) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeTextareaRef.current) { activeTextareaRef.current.blur(); return }
    if (onItemPointerDown) onItemPointerDown(id, e, handle)
    else onTextPointerDown?.(id, e)
  }
  const cursor = getCursorForTool(activeTool, penSettings, markerSettings, eraserSettings, zoom, isTemporaryPanMode)
  return <div className="react-flow__annotation-layer" tabIndex={-1}
    style={{ position: 'absolute', inset: 0, pointerEvents: activeTool === 'pointer' ? 'none' : 'all', zIndex: 10, cursor, touchAction: 'none' }}
    onPointerDownCapture={(e) => {
      if (e.target.closest?.('textarea')) return
      if (capturedPointer.current !== null && capturedPointer.current !== e.pointerId) { e.stopPropagation(); return }
      if (e.button !== 0) return
      e.currentTarget.focus({ preventScroll: true })
      capturedPointer.current = e.pointerId
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }}
    onPointerDown={(e) => {
      if (activeTextareaRef.current) { activeTextareaRef.current.blur(); return }
      onPointerDown?.(e)
    }}
    onPointerMove={(e) => { if (capturedPointer.current === null || capturedPointer.current === e.pointerId) onPointerMove?.(e) }}
    onPointerUp={(e) => {
      if (capturedPointer.current !== null && capturedPointer.current !== e.pointerId) return
      onPointerUp?.(e)
      capturedPointer.current = null
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    }}
    onPointerCancel={() => { capturedPointer.current = null; onPointerCancel?.() }}
    onLostPointerCapture={() => { capturedPointer.current = null; onPointerCancel?.() }}
    onWheel={forwardWheelToReactFlow}>
    <svg width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <g transform={'translate(' + x + ', ' + y + ') scale(' + zoom + ')'}>
        {items.map((item) => item.id === editingTextId ? null :
          <g key={item.id} data-annotation-id={item.id} data-annotation-text-id={item.kind === 'text' ? item.id : undefined}>
            <AnnotationVisual item={item} />
            {(activeTool === 'select' || (activeTool === 'text' && item.kind === 'text')) && <g style={{ cursor: 'move' }}
              role="button" tabIndex={0} aria-label={'Select ' + (item.kind === 'text' ? 'text: ' + item.text : item.kind === 'shape' ? item.shape : item.tool + ' stroke')}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault(); e.stopPropagation()
                if (item.id === selected && item.kind === 'text' && e.key === 'Enter') onTextDoubleClick?.(item.id, e)
                else onSelectItem?.(item.id)
              }}
              onPointerDown={(e) => handleItemPointerDown(item.id, e)}
              onDoubleClick={(e) => {
                if (item.kind !== 'text') return
                e.preventDefault(); e.stopPropagation()
                activeTextareaRef.current?.blur()
                onTextDoubleClick?.(item.id, e)
              }}>
              <AnnotationVisual item={item} hit zoom={zoom} />
            </g>}
          </g>)}
        {currentStroke && <AnnotationVisual item={currentStroke} />}
        {selectedItem && !editingItem && <AnnotationSelection item={selectedItem} zoom={zoom} onPointerDown={handleItemPointerDown} />}
        {editingItem && <TextEditor key={editingItem.id} item={editingItem} initialValue={editingItem.text} zoom={zoom}
          onCommit={(value) => onCommitTextEdit(editingItem.id, value)} textareaRef={activeTextareaRef} />}
        {pendingText && <TextEditor item={pendingText} initialValue="" zoom={zoom} onCommit={(value) => onCommitText(value ?? '')} textareaRef={activeTextareaRef} />}
      </g>
    </svg>
    {activeTool === 'laser' && <LaserPointer key={activeView} isPanning={isTemporaryPanMode} />}
  </div>
}
