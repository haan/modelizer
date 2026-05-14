import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY_TOOL_SETTINGS = 'modelizer.annotationToolSettings'

const VIEWS = ['conceptual', 'logical', 'physical']

const DEFAULT_TOOL_SETTINGS = {
  pen: { color: '#ef4444', thickness: 2 },
  marker: { color: '#facc15', thickness: 12, opacity: 0.35 },
  text: { color: '#1e293b', fontSize: 14 },
  eraser: { size: 20, mode: 'whole' },
  activeTool: 'pointer',
}

const TOOL_HOTKEYS = {
  v: 'pointer',
  p: 'pen',
  m: 'marker',
  t: 'text',
  e: 'eraser',
}

function isEditableTarget(target) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  )
}

function isSpaceKey(event) {
  const key = event.key?.toLowerCase()
  return key === ' ' || key === 'spacebar' || key === 'space' || event.code === 'Space'
}

function isAnnotationTool(tool) {
  return tool === 'pen' || tool === 'marker' || tool === 'text' || tool === 'eraser'
}

function readToolSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TOOL_SETTINGS)
    if (!raw) return DEFAULT_TOOL_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      pen: { ...DEFAULT_TOOL_SETTINGS.pen, ...parsed.pen },
      marker: { ...DEFAULT_TOOL_SETTINGS.marker, ...parsed.marker },
      text: { ...DEFAULT_TOOL_SETTINGS.text, ...parsed.text },
      eraser: { ...DEFAULT_TOOL_SETTINGS.eraser, ...parsed.eraser },
      activeTool: parsed.activeTool ?? DEFAULT_TOOL_SETTINGS.activeTool,
    }
  } catch {
    return DEFAULT_TOOL_SETTINGS
  }
}

function writeToolSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY_TOOL_SETTINGS, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function makeEmptyAnnotations() {
  return {
    conceptual: { items: [] },
    logical: { items: [] },
    physical: { items: [] },
  }
}

function isFiniteNumber(value) {
  return Number.isFinite(value)
}

function normalizePoint(point) {
  if (!point || typeof point !== 'object') return null
  if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return null
  return { x: point.x, y: point.y }
}

function normalizeStrokeItem(item) {
  const points = Array.isArray(item.points)
    ? item.points.map(normalizePoint).filter(Boolean)
    : []
  if (points.length === 0) return null

  const tool = item.tool === 'marker' ? 'marker' : 'pen'
  const defaults = tool === 'marker' ? DEFAULT_TOOL_SETTINGS.marker : DEFAULT_TOOL_SETTINGS.pen

  return {
    id: item.id,
    kind: 'stroke',
    tool,
    points,
    color: typeof item.color === 'string' && item.color ? item.color : defaults.color,
    thickness: isFiniteNumber(item.thickness) && item.thickness > 0 ? item.thickness : defaults.thickness,
    opacity: isFiniteNumber(item.opacity) ? item.opacity : tool === 'marker' ? DEFAULT_TOOL_SETTINGS.marker.opacity : 1,
  }
}

function normalizeTextItem(item) {
  if (!isFiniteNumber(item.x) || !isFiniteNumber(item.y)) return null

  return {
    id: item.id,
    kind: 'text',
    x: item.x,
    y: item.y,
    text: typeof item.text === 'string' ? item.text : '',
    color: typeof item.color === 'string' && item.color ? item.color : DEFAULT_TOOL_SETTINGS.text.color,
    fontSize: isFiniteNumber(item.fontSize) && item.fontSize > 0 ? item.fontSize : DEFAULT_TOOL_SETTINGS.text.fontSize,
  }
}

function normalizeAnnotations(raw) {
  const result = makeEmptyAnnotations()
  if (!raw || typeof raw !== 'object') return result
  for (const view of VIEWS) {
    const viewData = raw[view]
    if (!viewData || typeof viewData !== 'object') continue
    const items = Array.isArray(viewData.items) ? viewData.items : []
    result[view].items = items.flatMap((item) => {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string') return []
      if (item.kind === 'stroke') {
        const stroke = normalizeStrokeItem(item)
        return stroke ? [stroke] : []
      }
      if (item.kind === 'text') {
        const text = normalizeTextItem(item)
        return text ? [text] : []
      }
      return []
    })
  }
  return result
}

function dist(p1, p2) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

function strokeIntersectsEraser(stroke, center, radius) {
  return stroke.points.some((p) => dist(p, center) <= radius)
}

function partialEraseStroke(stroke, center, radius) {
  const segments = []
  let current = []
  for (const pt of stroke.points) {
    if (dist(pt, center) > radius) {
      current.push(pt)
    } else {
      if (current.length >= 2) {
        segments.push(current)
      }
      current = []
    }
  }
  if (current.length >= 2) segments.push(current)
  return segments.map((points) => ({
    ...stroke,
    id: crypto.randomUUID(),
    points,
  }))
}

export function useAnnotations({ activeView, reactFlowInstance, pushHistorySnapshot, enabled = true }) {
  const [initialSettings] = useState(readToolSettings)

  const [annotations, setAnnotations] = useState(makeEmptyAnnotations)
  const [activeTool, setActiveTool] = useState(initialSettings.activeTool)
  const [penSettings, setPenSettings] = useState(initialSettings.pen)
  const [markerSettings, setMarkerSettings] = useState(initialSettings.marker)
  const [textSettings, setTextSettings] = useState(initialSettings.text)
  const [eraserSettings, setEraserSettings] = useState(initialSettings.eraser)
  const [currentStroke, setCurrentStroke] = useState(null)
  const [pendingText, setPendingText] = useState(null)
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [editingTextId, setEditingTextId] = useState(null)
  const [isTemporaryPanMode, setTemporaryPanMode] = useState(false)
  const [dirtySignal, setDirtySignal] = useState(0)

  const annotationsRef = useRef(annotations)
  const isDrawingRef = useRef(false)
  const textDragRef = useRef(null)
  const panDragRef = useRef(null)
  const isTemporaryPanModeRef = useRef(false)

  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  const bumpDirty = useCallback(() => setDirtySignal((n) => n + 1), [])

  const getAnnotationsSnapshot = useCallback(() => annotationsRef.current, [])

  const setTemporaryPanModeActive = useCallback((active) => {
    isTemporaryPanModeRef.current = active
    setTemporaryPanMode(active)
  }, [])

  const selectedTextItem = useMemo(() => {
    if (!selectedTextId) return null
    return annotations[activeView]?.items.find(
      (item) => item.kind === 'text' && item.id === selectedTextId,
    ) ?? null
  }, [activeView, annotations, selectedTextId])

  const editingTextItem = useMemo(() => {
    if (!editingTextId) return null
    return annotations[activeView]?.items.find(
      (item) => item.kind === 'text' && item.id === editingTextId,
    ) ?? null
  }, [activeView, annotations, editingTextId])

  const setTool = useCallback((tool) => {
    setActiveTool(tool)
    const settings = readToolSettings()
    writeToolSettings({ ...settings, activeTool: tool })
    setPendingText(null)
    setCurrentStroke(null)
    setEditingTextId(null)
    if (tool !== 'text') {
      setSelectedTextId(null)
    }
    isDrawingRef.current = false
    textDragRef.current = null
    panDragRef.current = null
    setTemporaryPanModeActive(false)
  }, [setTemporaryPanModeActive])

  const updatePenSettings = useCallback((updates) => {
    setPenSettings((cur) => {
      const next = { ...cur, ...updates }
      const settings = readToolSettings()
      writeToolSettings({ ...settings, pen: next })
      return next
    })
  }, [])

  const updateMarkerSettings = useCallback((updates) => {
    setMarkerSettings((cur) => {
      const next = { ...cur, ...updates }
      const settings = readToolSettings()
      writeToolSettings({ ...settings, marker: next })
      return next
    })
  }, [])

  const updateSelectedText = useCallback(
    (id, updates, { pushHistory = true } = {}) => {
      const currentItem = annotationsRef.current[activeView].items.find(
        (item) => item.kind === 'text' && item.id === id,
      )
      if (!currentItem) {
        return false
      }
      const changed = Object.keys(updates).some((key) => updates[key] !== currentItem[key])
      if (!changed) {
        return false
      }
      if (pushHistory) {
        pushHistorySnapshot?.()
      }
      setAnnotations((cur) => {
        const nextItems = cur[activeView].items.map((item) =>
          item.kind === 'text' && item.id === id ? { ...item, ...updates } : item,
        )
        return { ...cur, [activeView]: { items: nextItems } }
      })
      bumpDirty()
      return true
    },
    [activeView, bumpDirty, pushHistorySnapshot],
  )

  const updateTextSettings = useCallback(
    (updates) => {
      if (activeTool === 'text' && selectedTextItem) {
        updateSelectedText(selectedTextItem.id, updates)
        return
      }

      setTextSettings((cur) => {
        const next = { ...cur, ...updates }
        const settings = readToolSettings()
        writeToolSettings({ ...settings, text: next })
        return next
      })
    },
    [activeTool, selectedTextItem, updateSelectedText],
  )

  const updateEraserSettings = useCallback((updates) => {
    setEraserSettings((cur) => {
      const next = { ...cur, ...updates }
      const settings = readToolSettings()
      writeToolSettings({ ...settings, eraser: next })
      return next
    })
  }, [])

  const screenToFlow = useCallback(
    (clientX, clientY) => {
      if (!reactFlowInstance) return { x: clientX, y: clientY }
      return reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY })
    },
    [reactFlowInstance],
  )

  const startTemporaryPanDrag = useCallback(
    (e) => {
      if (
        !enabled ||
        !isTemporaryPanModeRef.current ||
        !reactFlowInstance?.getViewport ||
        !reactFlowInstance?.setViewport
      ) {
        return false
      }
      const viewport = reactFlowInstance.getViewport()
      if (!viewport) return false

      e.preventDefault()
      e.stopPropagation()
      setSelectedTextId(null)
      setEditingTextId(null)
      setPendingText(null)
      setCurrentStroke(null)
      isDrawingRef.current = false
      textDragRef.current = null
      panDragRef.current = {
        startClient: { x: e.clientX, y: e.clientY },
        startViewport: viewport,
      }
      return true
    },
    [enabled, reactFlowInstance],
  )

  const onEraseAt = useCallback(
    (flowPt) => {
      const radius = eraserSettings.size / 2
      if (eraserSettings.mode === 'whole') {
        setAnnotations((cur) => {
          const items = cur[activeView].items.filter((item) => {
            if (item.kind !== 'stroke') return true
            return !strokeIntersectsEraser(item, flowPt, radius)
          })
          if (items.length === cur[activeView].items.length) return cur
          bumpDirty()
          return { ...cur, [activeView]: { items } }
        })
      } else {
        setAnnotations((cur) => {
          const nextItems = []
          let changed = false
          for (const item of cur[activeView].items) {
            if (item.kind !== 'stroke') {
              nextItems.push(item)
              continue
            }
            if (!strokeIntersectsEraser(item, flowPt, radius)) {
              nextItems.push(item)
              continue
            }
            const segments = partialEraseStroke(item, flowPt, radius)
            nextItems.push(...segments)
            changed = true
          }
          if (!changed) return cur
          bumpDirty()
          return { ...cur, [activeView]: { items: nextItems } }
        })
      }
    },
    [activeView, eraserSettings, bumpDirty],
  )

  const onPointerDown = useCallback(
    (e) => {
      if (activeTool === 'pointer') return
      if (startTemporaryPanDrag(e)) return
      e.preventDefault()
      e.stopPropagation()
      const flowPt = screenToFlow(e.clientX, e.clientY)

      if (activeTool === 'pen' || activeTool === 'marker') {
        setSelectedTextId(null)
        setEditingTextId(null)
        isDrawingRef.current = true
        const settings = activeTool === 'pen' ? penSettings : markerSettings
        setCurrentStroke({
          id: crypto.randomUUID(),
          kind: 'stroke',
          tool: activeTool,
          points: [flowPt],
          color: settings.color,
          thickness: settings.thickness,
          opacity: activeTool === 'pen' ? 1 : markerSettings.opacity,
        })
      } else if (activeTool === 'eraser') {
        setSelectedTextId(null)
        setEditingTextId(null)
        pushHistorySnapshot?.()
        onEraseAt(flowPt)
        isDrawingRef.current = true
      } else if (activeTool === 'text') {
        if (selectedTextItem || editingTextItem) {
          setSelectedTextId(null)
          setEditingTextId(null)
          return
        }
        // Don't create a new input while one is already open - let blur commit it first.
        if (!pendingText) {
          setPendingText({ x: flowPt.x, y: flowPt.y, text: '', color: textSettings.color, fontSize: textSettings.fontSize })
        }
      }
    },
    [activeTool, editingTextItem, penSettings, markerSettings, textSettings, pendingText, screenToFlow, selectedTextItem, pushHistorySnapshot, onEraseAt, startTemporaryPanDrag],
  )

  const onPointerMove = useCallback(
    (e) => {
      const panDrag = panDragRef.current
      if (panDrag && reactFlowInstance?.setViewport) {
        e.preventDefault()
        e.stopPropagation()
        const dx = e.clientX - panDrag.startClient.x
        const dy = e.clientY - panDrag.startClient.y
        reactFlowInstance.setViewport(
          {
            x: panDrag.startViewport.x + dx,
            y: panDrag.startViewport.y + dy,
            zoom: panDrag.startViewport.zoom,
          },
          { duration: 0 },
        )
        return
      }

      const textDrag = textDragRef.current
      if (textDrag) {
        e.preventDefault()
        const flowPt = screenToFlow(e.clientX, e.clientY)
        const dx = flowPt.x - textDrag.start.x
        const dy = flowPt.y - textDrag.start.y
        if (!textDrag.historyPushed && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
          pushHistorySnapshot?.()
          textDrag.historyPushed = true
        }
        if (textDrag.historyPushed) {
          textDrag.moved = true
          setAnnotations((cur) => ({
            ...cur,
            [activeView]: {
              items: cur[activeView].items.map((item) =>
                item.kind === 'text' && item.id === textDrag.id
                  ? {
                      ...item,
                      x: textDrag.origin.x + dx,
                      y: textDrag.origin.y + dy,
                    }
                  : item,
              ),
            },
          }))
        }
        return
      }

      if (!isDrawingRef.current) return
      e.preventDefault()
      const flowPt = screenToFlow(e.clientX, e.clientY)

      if (activeTool === 'pen' || activeTool === 'marker') {
        setCurrentStroke((cur) => {
          if (!cur) return cur
          return { ...cur, points: [...cur.points, flowPt] }
        })
      } else if (activeTool === 'eraser') {
        onEraseAt(flowPt)
      }
    },
    [activeTool, activeView, pushHistorySnapshot, reactFlowInstance, screenToFlow, onEraseAt],
  )

  const onPointerUp = useCallback(
    () => {
      panDragRef.current = null
      if (textDragRef.current) {
        if (textDragRef.current.moved) {
          bumpDirty()
        }
        textDragRef.current = null
      }
      if (activeTool === 'pen' || activeTool === 'marker') {
        if (isDrawingRef.current && currentStroke) {
          pushHistorySnapshot?.()
          const stroke = currentStroke
          setAnnotations((cur) => ({
            ...cur,
            [activeView]: {
              items: [...cur[activeView].items, stroke],
            },
          }))
          bumpDirty()
        }
        setCurrentStroke(null)
      }
      isDrawingRef.current = false
    },
    [activeTool, activeView, currentStroke, pushHistorySnapshot, bumpDirty],
  )

  const onCommitText = useCallback(
    (text) => {
      if (!pendingText) return
      if (text.trim()) {
        pushHistorySnapshot?.()
        const id = crypto.randomUUID()
        const item = {
          id,
          kind: 'text',
          x: pendingText.x,
          y: pendingText.y,
          text: text.trim(),
          color: pendingText.color,
          fontSize: pendingText.fontSize,
        }
        setAnnotations((cur) => ({
          ...cur,
          [activeView]: { items: [...cur[activeView].items, item] },
        }))
        setSelectedTextId(id)
        setEditingTextId(null)
        bumpDirty()
      } else {
        setSelectedTextId(null)
        setEditingTextId(null)
      }
      setPendingText(null)
    },
    [activeView, pendingText, pushHistorySnapshot, bumpDirty],
  )

  const onCommitTextEdit = useCallback(
    (id, text) => {
      setEditingTextId(null)
      if (text === null) {
        return
      }
      const nextText = text.trim()
      const currentItem = annotationsRef.current[activeView].items.find(
        (item) => item.kind === 'text' && item.id === id,
      )
      if (!currentItem) {
        return
      }
      if (!nextText) {
        pushHistorySnapshot?.()
        setAnnotations((cur) => ({
          ...cur,
          [activeView]: {
            items: cur[activeView].items.filter((i) => i.id !== id),
          },
        }))
        setSelectedTextId(null)
        bumpDirty()
        return
      }
      if (nextText === currentItem.text) {
        return
      }
      pushHistorySnapshot?.()
      setAnnotations((cur) => ({
        ...cur,
        [activeView]: {
          items: cur[activeView].items.map((i) =>
            i.id === id ? { ...i, text: nextText } : i,
          ),
        },
      }))
      setSelectedTextId(id)
      bumpDirty()
    },
    [activeView, pushHistorySnapshot, bumpDirty],
  )

  const onStartTextEdit = useCallback(
    (id) => {
      if (activeTool !== 'text') return
      setPendingText(null)
      setSelectedTextId(id)
      setEditingTextId(id)
      textDragRef.current = null
    },
    [activeTool],
  )

  const onTextPointerDown = useCallback(
    (id, e) => {
      if (activeTool !== 'text') return
      if (startTemporaryPanDrag(e)) return
      e.preventDefault()
      e.stopPropagation()
      const item = annotationsRef.current[activeView].items.find(
        (entry) => entry.kind === 'text' && entry.id === id,
      )
      if (!item) return
      const flowPt = screenToFlow(e.clientX, e.clientY)
      setPendingText(null)
      setEditingTextId(null)
      setSelectedTextId(id)
      textDragRef.current =
        selectedTextId === id
          ? {
              id,
              start: flowPt,
              origin: { x: item.x, y: item.y },
              moved: false,
              historyPushed: false,
            }
          : null
    },
    [activeTool, activeView, screenToFlow, selectedTextId, startTemporaryPanDrag],
  )

  const onTextDoubleClick = useCallback(
    (id, e) => {
      if (activeTool !== 'text') return
      e.preventDefault()
      e.stopPropagation()
      onStartTextEdit(id)
    },
    [activeTool, onStartTextEdit],
  )

  const onDeleteSelectedText = useCallback(() => {
    if (!selectedTextItem) return false
    pushHistorySnapshot?.()
    setAnnotations((cur) => ({
      ...cur,
      [activeView]: {
        items: cur[activeView].items.filter(
          (item) => item.kind !== 'text' || item.id !== selectedTextItem.id,
        ),
      },
    }))
    setSelectedTextId(null)
    setEditingTextId(null)
    textDragRef.current = null
    panDragRef.current = null
    bumpDirty()
    return true
  }, [activeView, bumpDirty, pushHistorySnapshot, selectedTextItem])

  const onClearAnnotations = useCallback(
    (view) => {
      pushHistorySnapshot?.()
      setAnnotations((cur) => ({ ...cur, [view ?? activeView]: { items: [] } }))
      setPendingText(null)
      setSelectedTextId(null)
      setEditingTextId(null)
      textDragRef.current = null
      bumpDirty()
    },
    [activeView, pushHistorySnapshot, bumpDirty],
  )

  const onLoadAnnotations = useCallback((raw) => {
    setAnnotations(normalizeAnnotations(raw))
    setDirtySignal(0)
    setPendingText(null)
    setSelectedTextId(null)
    setEditingTextId(null)
    textDragRef.current = null
    panDragRef.current = null
    setTemporaryPanModeActive(false)
  }, [setTemporaryPanModeActive])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!enabled || event.defaultPrevented || isEditableTarget(event.target)) return

      const key = event.key?.toLowerCase()
      if (isSpaceKey(event)) {
        if (isAnnotationTool(activeTool) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault()
          if (!event.repeat) {
            setTemporaryPanModeActive(true)
          }
        }
        return
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && TOOL_HOTKEYS[key]) {
        event.preventDefault()
        setTool(TOOL_HOTKEYS[key])
        return
      }

      if (key === 'delete' || key === 'backspace') {
        if (activeTool === 'text' && onDeleteSelectedText()) {
          event.preventDefault()
        }
        return
      }
      if (key === 'escape') {
        if (pendingText || selectedTextItem || editingTextItem) {
          event.preventDefault()
          setPendingText(null)
          setSelectedTextId(null)
          setEditingTextId(null)
          textDragRef.current = null
          panDragRef.current = null
          setTemporaryPanModeActive(false)
          return
        }
        if (activeTool !== 'pointer') {
          event.preventDefault()
          setTool('pointer')
        }
        return
      }
      if (activeTool === 'text' && key === 'enter' && selectedTextItem && !editingTextItem) {
        event.preventDefault()
        onStartTextEdit(selectedTextItem.id)
      }
    }

    const handleKeyUp = (event) => {
      if (isSpaceKey(event)) {
        panDragRef.current = null
        setTemporaryPanModeActive(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [activeTool, editingTextItem, enabled, onDeleteSelectedText, onStartTextEdit, pendingText, selectedTextItem, setTemporaryPanModeActive, setTool])

  const effectiveTextSettings = selectedTextItem
    ? { color: selectedTextItem.color, fontSize: selectedTextItem.fontSize }
    : textSettings

  return {
    annotations,
    activeTool,
    penSettings,
    markerSettings,
    textSettings: effectiveTextSettings,
    eraserSettings,
    currentStroke,
    pendingText,
    selectedTextId: selectedTextItem ? selectedTextItem.id : null,
    editingTextId: editingTextItem ? editingTextItem.id : null,
    isTemporaryPanMode: enabled && isTemporaryPanMode,
    dirtySignal,
    getAnnotationsSnapshot,
    setTool,
    updatePenSettings,
    updateMarkerSettings,
    updateTextSettings,
    updateEraserSettings,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCommitText,
    onCommitTextEdit,
    onTextPointerDown,
    onTextDoubleClick,
    onDeleteSelectedText,
    onClearAnnotations,
    onLoadAnnotations,
  }
}
