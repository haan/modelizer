import { EdgeLabelRenderer, useStore } from 'reactflow'
import { AssociationLabel } from './AssociationLabel.jsx'
import { MultiplicityLabel } from './MultiplicityLabel.jsx'
import { RoleLabel } from './RoleLabel.jsx'

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
  selected,
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
  const roleA = data?.roleA ?? ''
  const roleB = data?.roleB ?? ''
  const name = data?.name ?? ''
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path fill-none ${strokeClass}`}
        d={edgePath}
        markerEnd={markerEnd}
        stroke="currentColor"
        style={style}
      />
      <path
        className="react-flow__edge-interaction"
        d={edgePath}
        fill="none"
      />
      <EdgeLabelRenderer>
        {multiplicityA ? (
          <MultiplicityLabel
            transform={`translate(-100%, -100%) translate(${startX}px, ${startY-1}px)`}
            label={multiplicityA}
          />
        ) : null}
        {multiplicityB ? (
          <MultiplicityLabel
            transform={`translate(-100%, -100%) translate(${rightX-1}px, ${endY}px)`}
            label={multiplicityB}
          />
        ) : null}
        {roleA ? (
          <RoleLabel
            transform={`translate(-100%, 0%) translate(${startX}px, ${startY+1}px)`}
            label={roleA}
          />
        ) : null}
        {roleB ? (
          <RoleLabel
            transform={`translate(0%, -100%) translate(${rightX+1}px, ${endY}px)`}
            label={roleB}
          />
        ) : null}
        {name ? (
          <AssociationLabel
            transform={`translate(-50%, -50%) translate(${labelX}px, ${labelY-2}px)`}
            label={name}
          />
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
}
