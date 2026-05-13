import { useRef } from 'react'
import { useViewport } from 'reactflow'

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

function AnnotationText({ item, onEdit }) {
  const handleDoubleClick = (e) => {
    e.stopPropagation()
    const newText = window.prompt('Edit annotation text:', item.text)
    if (newText !== null) {
      onEdit(item.id, newText)
    }
  }

  const scaledFontSize = item.fontSize
  return (
    <text
      x={item.x}
      y={item.y}
      fill={item.color}
      fontSize={scaledFontSize}
      fontFamily="sans-serif"
      dominantBaseline="text-before-edge"
      style={{ cursor: 'text', userSelect: 'none' }}
      onDoubleClick={handleDoubleClick}
      pointerEvents="all"
    >
      {item.text}
    </text>
  )
}

function PendingTextInput({ pending, zoom, onCommit }) {
  const ref = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onCommit(ref.current?.value ?? '')
    }
    if (e.key === 'Escape') {
      onCommit('')
    }
  }

  const handleBlur = () => {
    onCommit(ref.current?.value ?? '')
  }

  const scaledFontSize = pending.fontSize
  const width = 200 / zoom
  const height = (pending.fontSize + 8) / zoom

  return (
    <foreignObject
      x={pending.x}
      y={pending.y}
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <input
        ref={ref}
        autoFocus
        defaultValue=""
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: `${1 / zoom}px solid ${pending.color}`,
          outline: 'none',
          color: pending.color,
          fontSize: `${scaledFontSize}px`,
          fontFamily: 'sans-serif',
          width: '100%',
          padding: 0,
          margin: 0,
        }}
      />
    </foreignObject>
  )
}

export default function AnnotationLayer({
  annotations,
  activeView,
  activeTool,
  currentStroke,
  pendingText,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCommitText,
  onUpdateText,
}) {
  const { x, y, zoom } = useViewport()
  const items = annotations?.[activeView]?.items ?? []

  return (
    <div
      className="react-flow__annotation-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: activeTool === 'pointer' ? 'none' : 'all',
        zIndex: 10,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ overflow: 'visible', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
          {items.map((item) =>
            item.kind === 'stroke' ? (
              <AnnotationStroke key={item.id} stroke={item} />
            ) : (
              <AnnotationText
                key={item.id}
                item={item}
                onEdit={onUpdateText}
              />
            ),
          )}
          {currentStroke && <AnnotationStroke stroke={currentStroke} />}
          {pendingText && (
            <PendingTextInput
              pending={pendingText}
              zoom={zoom}
              onCommit={onCommitText}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
