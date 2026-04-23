import { useCallback, useRef, useState } from 'react'

export function useHistory({ limit = 50 } = {}) {
  const historyRef = useRef({ past: [], future: [] })
  const isRestoringRef = useRef(false)
  const pendingPushRef = useRef(false)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0)
    setCanRedo(historyRef.current.future.length > 0)
  }, [])

  const pushHistory = useCallback(
    (snapshot) => {
      if (isRestoringRef.current || pendingPushRef.current) return
      pendingPushRef.current = true
      const h = historyRef.current
      h.past.push(snapshot)
      if (h.past.length > limit) h.past.shift()
      h.future = []
      Promise.resolve().then(() => {
        pendingPushRef.current = false
        syncFlags()
      })
    },
    [limit, syncFlags],
  )

  const undo = useCallback(
    (current, restore) => {
      const h = historyRef.current
      if (!h.past.length) return
      const target = h.past.pop()
      h.future.unshift(current)
      isRestoringRef.current = true
      restore(target)
      isRestoringRef.current = false
      syncFlags()
    },
    [syncFlags],
  )

  const redo = useCallback(
    (current, restore) => {
      const h = historyRef.current
      if (!h.future.length) return
      const target = h.future.shift()
      h.past.push(current)
      isRestoringRef.current = true
      restore(target)
      isRestoringRef.current = false
      syncFlags()
    },
    [syncFlags],
  )

  const clearHistory = useCallback(() => {
    historyRef.current = { past: [], future: [] }
    syncFlags()
  }, [syncFlags])

  return { pushHistory, undo, redo, canUndo, canRedo, isRestoringRef, clearHistory }
}
