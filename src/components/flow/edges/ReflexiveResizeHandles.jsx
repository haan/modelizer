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

export function ReflexiveResizeHandles({
  edgeId,
  selected,
  handles,
  onMoveHandle,
  onDragStart,
  onDragEnd,
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
        onDragEnd?.()
      }
    }
  }, [onDragEnd])

  if (!selected || !Array.isArray(handles) || handles.length === 0) {
    return null
  }

  return (
    <EdgeLabelRenderer>
      {handles.map((handle) => {
        if (
          !handle ||
          !Number.isFinite(handle.x) ||
          !Number.isFinite(handle.y) ||
          (handle.axis !== 'x' && handle.axis !== 'y')
        ) {
          return null
        }

        const cursorClass =
          handle.axis === 'x'
            ? 'cursor-ew-resize active:cursor-ew-resize'
            : 'cursor-ns-resize active:cursor-ns-resize'
        return (
          <div
            key={`${edgeId}-reflexive-${handle.key ?? handle.axis}`}
            data-no-export="true"
            className={`nodrag nopan absolute touch-none rounded-full border border-primary bg-base-100 shadow-sm ${cursorClass}`}
            style={{
              transform: `translate(-50%, -50%) translate(${handle.x}px, ${handle.y}px)`,
              width: '10px',
              height: '10px',
              pointerEvents: 'all',
              zIndex: 20,
            }}
            onPointerDown={(event) => {
              const isPrimaryPointer =
                event.pointerType === 'touch' || event.button === 0
              if (!isPrimaryPointer) {
                return
              }

              event.preventDefault()
              event.stopPropagation()
              event.currentTarget.setPointerCapture?.(event.pointerId)
              onDragStart?.()

              const onPointerMove = (moveEvent) => {
                moveEvent.preventDefault()
                const nextPoint = toFlowPosition(
                  reactFlow,
                  moveEvent.clientX,
                  moveEvent.clientY,
                )
                onMoveHandle?.(edgeId, handle.key, nextPoint)
              }
              const finishDrag = () => {
                if (clearActiveDrag()) {
                  onDragEnd?.()
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
        )
      })}
    </EdgeLabelRenderer>
  )
}

