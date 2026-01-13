import { useEffect } from 'react'

export function useKeyboardShortcuts({
  nodes,
  edges,
  onDeleteAssociation,
  onDeleteClass,
  onDeleteSelection,
  onOpenModel,
  onRequestNewModel,
  onSaveModel,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      if (isEditable) {
        return
      }

      const key = event.key?.toLowerCase()
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
      }

      if (key === 'delete' || key === 'backspace') {
        const selectedNodes = nodes.filter((node) => node.selected)
        const selectedEdges = edges.filter((edge) => edge.selected)
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
    edges,
    nodes,
    onDeleteAssociation,
    onDeleteClass,
    onDeleteSelection,
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
  ])
}
