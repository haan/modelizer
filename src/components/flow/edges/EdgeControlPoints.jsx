import { useEffect, useRef } from 'react'
import { EdgeLabelRenderer, useReactFlow } from 'reactflow'

function toFlowPosition(reactFlow, clientX, clientY) {
  if (reactFlow?.screenToFlowPosition) {
    return reactFlow.screenToFlowPosition({ x: clientX, y: clientY })
  }

  if (reactFlow?.project) {
    return reactFlow.project({ x: clientX, y: clientY })
  }

  return { x: clientX, y: clientY }
}

export function EdgeControlPoints({
  edgeId,
  controlPoints,
  selected,
  onMoveControlPoint,
  onDeleteControlPoint,
  onControlPointDragStart,
  onControlPointDragEnd,
}) {
  const reactFlow = useReactFlow()
  const dragStateRef = useRef(null)
  const clearActiveDrag = () => {
    const dragState = dragStateRef.current
    if (!dragState) {
      return false
    }

    window.removeEventListener('pointermove', dragState.onPointerMove)
    window.removeEventListener('pointerup', dragState.onPointerUp)
    window.removeEventListener('pointercancel', dragState.onPointerCancel)
    dragStateRef.current = null
    return true
  }

  useEffect(() => {
    return () => {
      if (clearActiveDrag()) {
        onControlPointDragEnd?.()
      }
    }
  }, [onControlPointDragEnd])

  if (!selected || !Array.isArray(controlPoints) || controlPoints.length === 0) {
    return null
  }

  return (
    <EdgeLabelRenderer>
      {controlPoints.map((point, index) => (
        <div
          key={`${edgeId}-cp-${index}`}
          data-no-export="true"
          className="nodrag nopan absolute touch-none cursor-grab rounded-full border border-primary bg-base-100 shadow-sm active:cursor-grabbing"
          style={{
            transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
            width: '10px',
            height: '10px',
            pointerEvents: 'all',
            zIndex: 20,
          }}
          onClick={(event) => {
            if (!event.altKey) {
              return
            }
            event.preventDefault()
            event.stopPropagation()
            onDeleteControlPoint?.(edgeId, index)
          }}
          onPointerDown={(event) => {
            const isPrimaryPointer =
              event.pointerType === 'touch' || event.button === 0
            if (!isPrimaryPointer) {
              return
            }
            if (event.altKey) {
              event.preventDefault()
              event.stopPropagation()
              return
            }

            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.setPointerCapture?.(event.pointerId)
            onControlPointDragStart?.()

            const onPointerMove = (moveEvent) => {
              moveEvent.preventDefault()
              const nextPoint = toFlowPosition(
                reactFlow,
                moveEvent.clientX,
                moveEvent.clientY,
              )
              onMoveControlPoint?.(edgeId, index, nextPoint)
            }
            const finishDrag = () => {
              if (clearActiveDrag()) {
                onControlPointDragEnd?.()
              }
            }
            const onPointerUp = () => finishDrag()
            const onPointerCancel = () => finishDrag()

            dragStateRef.current = { onPointerMove, onPointerUp, onPointerCancel }
            window.addEventListener('pointermove', onPointerMove)
            window.addEventListener('pointerup', onPointerUp)
            window.addEventListener('pointercancel', onPointerCancel)
          }}
        />
      ))}
    </EdgeLabelRenderer>
  )
}
