import { EdgeLabelRenderer, useStore } from 'reactflow'
import { EdgeLabel } from './EdgeLabel.jsx'

function distance(a, b) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

function getBend(a, b, c, size) {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size)
  const { x, y } = b

  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L${x} ${y}`
  }

  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1
    const yDir = a.y < c.y ? 1 : -1
    return `L ${x + bendSize * xDir},${y} Q ${x},${y} ${x},${
      y + bendSize * yDir
    }`
  }

  const xDir = a.x < c.x ? 1 : -1
  const yDir = a.y < c.y ? -1 : 1
  return `L ${x},${y + bendSize * yDir} Q ${x},${y} ${
    x + bendSize * xDir
  },${y}`
}

function getSmoothPath(points, borderRadius = 5) {
  return points.reduce((res, point, index) => {
    if (index === 0) {
      return `M${point.x} ${point.y}`
    }

    if (index < points.length - 1) {
      return res + getBend(points[index - 1], point, points[index + 1], borderRadius)
    }

    return res + `L${point.x} ${point.y}`
  }, '')
}

function getNodeRect(node) {
  const width = node?.measured?.width ?? node?.width ?? 0
  const height = node?.measured?.height ?? node?.height ?? 0
  const position =
    node?.internals?.positionAbsolute ??
    node?.positionAbsolute ??
    node?.position ??
    null

  if (!position || !width || !height) {
    return null
  }

  return { x: position.x, y: position.y, width, height }
}

export function ReflexiveAssociation({
  id,
  source,
  markerEnd,
  style,
  data,
}) {
  const node = useStore((state) => state.nodeInternals.get(source))
  const rect = getNodeRect(node)

  if (!rect) {
    return null
  }

  const widthStep = Math.min(40, rect.width / 4)
  const heightStep = Math.min(40, rect.height / 4)
  const startX = rect.x
  const startY = rect.y + heightStep
  const leftX = startX - widthStep
  const upY = startY - heightStep * 2
  const rightX = leftX + widthStep * 2
  const endY = upY + heightStep

  const points = [
    { x: startX, y: startY },
    { x: leftX, y: startY },
    { x: leftX, y: upY },
    { x: rightX, y: upY },
    { x: rightX, y: endY },
  ]
  const edgePath = getSmoothPath(points)
  const labelX = (leftX + rightX) / 2
  const labelY = upY - 8

  const multiplicityA = data?.multiplicityA ?? ''
  const multiplicityB = data?.multiplicityB ?? ''
  const name = data?.name ?? ''

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path fill-none stroke-[var(--color-base-content)] [stroke-width:1]"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        {multiplicityA ? (
          <EdgeLabel
            transform={`translate(-100%, 0%) translate(${startX}px, ${startY+1}px)`}
            label={multiplicityA}
          />
        ) : null}
        {multiplicityB ? (
          <EdgeLabel
            transform={`translate(0%, -100%) translate(${rightX+1}px, ${endY}px)`}
            label={multiplicityB}
          />
        ) : null}
        {name ? (
          <EdgeLabel
            transform={`translate(-50%, -50%) translate(${labelX}px, ${labelY-2}px)`}
            label={name}
          />
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
}
