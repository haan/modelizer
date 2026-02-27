import { useEffect, useRef } from 'react'
import { CLASS_NODE_TYPE } from '../model/constants.js'

export function useKeyboardShortcuts({
  nodes,
  edges,
  onAddAttribute,
  onDeleteAssociation,
  onDeleteClass,
  onDeleteSelection,
  onOpenModel,
  onRequestNewModel,
  onSaveModel,
}) {
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [edges, nodes])

  useEffect(() => {
    const isMac =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform)

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase()
      const isAddAttributeShortcut =
        key === 'a' && event.ctrlKey && event.altKey && !event.shiftKey

      const target = event.target
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      if (isEditable && !isAddAttributeShortcut) {
        return
      }

      if (event.ctrlKey || event.metaKey) {
        if (key === 's') {
          event.preventDefault()
          onSaveModel()
        }
        if (key === 'o') {
          event.preventDefault()
          onOpenModel()
        }
        if (key === 'n') {
          event.preventDefault()
          onRequestNewModel()
        }
        if (key === 'a') {
          if (!event.ctrlKey || (isMac && event.metaKey)) {
            return
          }
          if (!event.altKey || event.shiftKey) {
            return
          }

          const selectedClass = nodesRef.current.find(
            (node) => node.selected && node.type === CLASS_NODE_TYPE,
          )
          if (!selectedClass) {
            return
          }

          event.preventDefault()
          onAddAttribute?.(selectedClass.id)
        }
      }

      if (key === 'delete' || key === 'backspace') {
        const selectedNodes = nodesRef.current.filter((node) => node.selected)
        const selectedEdges = edgesRef.current.filter((edge) => edge.selected)
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault()
          if (onDeleteSelection) {
            onDeleteSelection({
              nodeIds: selectedNodes.map((node) => node.id),
              edgeIds: selectedEdges.map((edge) => edge.id),
            })
            return
          }
          selectedNodes.forEach((node) => onDeleteClass(node.id))
          selectedEdges.forEach((edge) => onDeleteAssociation(edge.id))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    onAddAttribute,
    onDeleteAssociation,
    onDeleteClass,
    onDeleteSelection,
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
  ])
}
