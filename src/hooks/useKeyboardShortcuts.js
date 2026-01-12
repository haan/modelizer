import { useEffect } from 'react'

export function useKeyboardShortcuts({
  nodes,
  edges,
  onDeleteAssociation,
  onDeleteClass,
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
        if (selectedNodes.length > 0) {
          event.preventDefault()
          selectedNodes.forEach((node) => onDeleteClass(node.id))
          return
        }

        const selectedEdges = edges.filter((edge) => edge.selected)
        if (selectedEdges.length > 0) {
          event.preventDefault()
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
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
  ])
}
