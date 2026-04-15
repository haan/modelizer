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
}) {
  const reactFlow = useReactFlow()
  const dragStateRef = useRef(null)

  useEffect(() => {
    return () => {
      const dragState = dragStateRef.current
      if (!dragState) {
        return
      }

      window.removeEventListener('pointermove', dragState.onPointerMove)
      window.removeEventListener('pointerup', dragState.onPointerUp)
      dragStateRef.current = null
    }
  }, [])

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
            className={`nodrag nopan absolute h-3.5 w-3.5 touch-none rounded-full border border-primary bg-base-100 shadow-sm ${cursorClass}`}
            style={{
              transform: `translate(-50%, -50%) translate(${handle.x}px, ${handle.y}px)`,
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

              const onPointerMove = (moveEvent) => {
                moveEvent.preventDefault()
                const nextPoint = toFlowPosition(
                  reactFlow,
                  moveEvent.clientX,
                  moveEvent.clientY,
                )
                onMoveHandle?.(edgeId, handle.key, nextPoint)
              }
              const onPointerUp = () => {
                const activeDragState = dragStateRef.current
                if (!activeDragState) {
                  return
                }

                window.removeEventListener(
                  'pointermove',
                  activeDragState.onPointerMove,
                )
                window.removeEventListener('pointerup', activeDragState.onPointerUp)
                dragStateRef.current = null
              }

              dragStateRef.current = { onPointerMove, onPointerUp }
              window.addEventListener('pointermove', onPointerMove)
              window.addEventListener('pointerup', onPointerUp)
            }}
          />
        )
      })}
    </EdgeLabelRenderer>
  )
}

