import { useCallback, useEffect, useRef, useState } from 'react'

import { SHAPE_TOOLS, constrainPoint, eraseStroke, moveAnnotation, resizeAnnotation } from '../model/annotationGeometry.js'

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
  v: 'pointer', s: 'select', l: 'laser',
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
  return tool !== 'pointer'
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
      activeTool: ['pointer', 'select', 'laser', 'pen', 'marker', 'text', 'eraser', ...SHAPE_TOOLS].includes(parsed.activeTool) ? parsed.activeTool : 'pointer',
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
    ...(item.linear === true ? { linear: true } : {}),
    opacity: isFiniteNumber(item.opacity) ? Math.max(0, Math.min(1, item.opacity)) : tool === 'marker' ? DEFAULT_TOOL_SETTINGS.marker.opacity : 1,
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
    ...(isFiniteNumber(item.width) && item.width > 0 ? { width: Math.max(28, item.width) } : {}),
    ...(isFiniteNumber(item.padding) ? { padding: Math.max(0, Math.min(32, item.padding)) } : {}),
    ...(typeof item.background === 'string' ? { background: item.background } : {}),
    ...(typeof item.border === 'boolean' ? { border: item.border } : {}),
  }
}

export function normalizeAnnotations(raw) {
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
      if (item.kind === 'shape' && SHAPE_TOOLS.includes(item.shape) &&
          [item.x1, item.y1, item.x2, item.y2].every(isFiniteNumber)) {
        return [{ id: item.id, kind: 'shape', shape: item.shape,
          x1: item.x1, y1: item.y1, x2: item.x2, y2: item.y2,
          color: typeof item.color === 'string' && item.color ? item.color : DEFAULT_TOOL_SETTINGS.pen.color,
          thickness: isFiniteNumber(item.thickness) && item.thickness > 0 ? item.thickness : 2 }]
      }
      return []
    })
  }
  return result
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
  const [previewItems, setPreviewItems] = useState(null)
  const [pendingText, setPendingText] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [editingTextId, setEditingTextId] = useState(null)
  const [isTemporaryPanMode, setTemporaryPanMode] = useState(false)
  const [dirtySignal, setDirtySignal] = useState(0)
  const annotationsRef = useRef(annotations)
  const gestureRef = useRef(null)
  const styleEditRef = useRef(null)
  const beginStyleEdit = useCallback(() => { styleEditRef.current ??= { historyPushed: false } }, [])
  const endStyleEdit = useCallback(() => { styleEditRef.current = null }, [])
  const panRef = useRef(false)
  const getAnnotationsSnapshot = useCallback(() => annotationsRef.current, [])
  const selectedItem = annotations[activeView]?.items.find((item) => item.id === selectedId) ?? null
  const selectedTextItem = selectedItem?.kind === 'text' ? selectedItem : null
  const editingTextItem = annotations[activeView]?.items.find((item) => item.kind === 'text' && item.id === editingTextId)

  const cancelGesture = useCallback(() => {
    gestureRef.current = null
    setCurrentStroke(null)
    setPreviewItems(null)
  }, [])
  const resetTransient = useCallback(() => {
    endStyleEdit()
    cancelGesture()
    setPendingText(null)
    setSelectedId(null)
    setEditingTextId(null)
    panRef.current = false
    setTemporaryPanMode(false)
  }, [cancelGesture, endStyleEdit])
  useEffect(() => {
    // A view switch must not carry unfinished gestures into the new view.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetTransient()
  }, [activeView, enabled, resetTransient])

  const commitItems = useCallback((items, view = activeView, recordHistory = true) => {
    const old = annotationsRef.current
    if (items === old[view].items) return false
    if (recordHistory) pushHistorySnapshot?.()
    const next = { ...old, [view]: { items } }
    annotationsRef.current = next
    setAnnotations(next)
    setDirtySignal((n) => n + 1)
    return true
  }, [activeView, pushHistorySnapshot])
  const setTool = useCallback((tool) => {
    resetTransient()
    setActiveTool(tool)
    writeToolSettings({ ...readToolSettings(), activeTool: tool })
  }, [resetTransient])
  const updateSelected = useCallback((updates) => {
    const items = annotationsRef.current[activeView].items
    const item = items.find((entry) => entry.id === selectedId)
    if (!item || !Object.keys(updates).some((key) => item[key] !== updates[key])) return
    const edit = styleEditRef.current
    commitItems(items.map((entry) => entry.id === selectedId ? { ...entry, ...updates } : entry), activeView, !edit?.historyPushed)
    if (edit) edit.historyPushed = true
  }, [activeView, selectedId, commitItems])
  const onSelectItem = useCallback((id) => {
    endStyleEdit()
    cancelGesture()
    setPendingText(null)
    setEditingTextId(null)
    setSelectedId(id)
  }, [cancelGesture, endStyleEdit])
  const updateSettings = useCallback((key, setter, updates) => {
    setter((cur) => {
      const next = { ...cur, ...updates }
      writeToolSettings({ ...readToolSettings(), [key]: next })
      return next
    })
  }, [])
  const updatePenSettings = useCallback((updates) => updateSettings('pen', setPenSettings, updates), [updateSettings])
  const updateMarkerSettings = useCallback((updates) => updateSettings('marker', setMarkerSettings, updates), [updateSettings])
  const updateEraserSettings = useCallback((updates) => updateSettings('eraser', setEraserSettings, updates), [updateSettings])
  const updateTextSettings = useCallback((updates) => {
    if (selectedTextItem && (activeTool === 'text' || activeTool === 'select')) updateSelected(updates)
    else updateSettings('text', setTextSettings, updates)
  }, [activeTool, selectedTextItem, updateSelected, updateSettings])
  const screenToFlow = useCallback((e) =>
    reactFlowInstance?.screenToFlowPosition({ x: e.clientX, y: e.clientY }) ?? { x: e.clientX, y: e.clientY },
  [reactFlowInstance])
  const capture = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.pointerId !== undefined) e.currentTarget?.setPointerCapture?.(e.pointerId)
  }
  const startPan = useCallback((e) => {
    if (!enabled || !panRef.current || !reactFlowInstance?.getViewport || !reactFlowInstance?.setViewport) return false
    capture(e)
    setPendingText(null)
    setSelectedId(null)
    setEditingTextId(null)
    gestureRef.current = { type: 'pan', start: { x: e.clientX, y: e.clientY }, viewport: reactFlowInstance.getViewport() }
    return true
  }, [enabled, reactFlowInstance])
  const eraseAt = useCallback((gesture, point) => {
    const next = gesture.items.flatMap((item) =>
      item.kind === 'stroke' ? eraseStroke(item, gesture.last, point, eraserSettings.size / 2, eraserSettings.mode) : [item])
    if (next.length !== gesture.items.length || next.some((item, i) => item !== gesture.items[i])) {
      gesture.items = next
      gesture.changed = true
      setPreviewItems(next)
    }
    gesture.last = point
  }, [eraserSettings])
  const onPointerDown = useCallback((e) => {
    if (!enabled || activeTool === 'pointer' || (e.button !== undefined && e.button !== 0) || gestureRef.current) return
    if (startPan(e)) return
    if (activeTool === 'laser') return
    capture(e)
    const point = screenToFlow(e)
    if (activeTool === 'select') { setSelectedId(null); return }
    if (activeTool === 'text') {
      if (selectedItem || editingTextItem) { setSelectedId(null); setEditingTextId(null); return }
      if (!pendingText) setPendingText({ ...textSettings, x: point.x, y: point.y, text: '' })
      return
    }
    setSelectedId(null)
    setEditingTextId(null)
    if (activeTool === 'eraser') {
      const gesture = { type: 'erase', view: activeView, items: annotationsRef.current[activeView].items, last: point, changed: false }
      gestureRef.current = gesture
      eraseAt(gesture, point)
      return
    }
    const settings = activeTool === 'marker' ? markerSettings : penSettings
    const item = SHAPE_TOOLS.includes(activeTool)
      ? { id: crypto.randomUUID(), kind: 'shape', shape: activeTool, x1: point.x, y1: point.y, x2: point.x, y2: point.y, ...penSettings }
      : { id: crypto.randomUUID(), kind: 'stroke', tool: activeTool, points: [point], ...settings, opacity: activeTool === 'marker' ? markerSettings.opacity : 1 }
    gestureRef.current = { type: 'draw', view: activeView, start: point, item, straight: activeTool === 'marker' && e.shiftKey }
    setCurrentStroke(item)
  }, [enabled, activeTool, activeView, startPan, screenToFlow, selectedItem, editingTextItem, pendingText, textSettings, eraseAt, markerSettings, penSettings])
  const onItemPointerDown = useCallback((id, e, handle = null) => {
    if (!enabled || (activeTool !== 'select' && activeTool !== 'text') || (e.button !== undefined && e.button !== 0)) return
    if (startPan(e)) return
    capture(e)
    const item = annotationsRef.current[activeView].items.find((entry) => entry.id === id)
    if (!item || (activeTool === 'text' && item.kind !== 'text')) return
    setPendingText(null)
    setEditingTextId(null)
    setSelectedId(id)
    if (activeTool === 'select' || selectedId === id || handle) {
      gestureRef.current = { type: 'transform', view: activeView, item, handle, start: screenToFlow(e), changed: false }
    }
  }, [enabled, activeTool, activeView, selectedId, screenToFlow, startPan])
  const onPointerMove = useCallback((e) => {
    const g = gestureRef.current
    if (!g) return
    if (g.view && g.view !== activeView) { cancelGesture(); return }
    e.preventDefault()
    if (g.type === 'pan') {
      reactFlowInstance.setViewport({ x: g.viewport.x + e.clientX - g.start.x, y: g.viewport.y + e.clientY - g.start.y, zoom: g.viewport.zoom }, { duration: 0 })
      return
    }
    const point = screenToFlow(e)
    if (g.type === 'erase') { eraseAt(g, point); return }
    if (g.type === 'transform') {
      const dx = point.x - g.start.x, dy = point.y - g.start.y
      if (!g.changed && Math.hypot(dx, dy) <= 0.5) return
      g.changed = true
      g.result = g.handle ? resizeAnnotation(g.item, g.handle, point) : moveAnnotation(g.item, dx, dy)
      setPreviewItems(annotationsRef.current[g.view].items.map((item) => item.id === g.item.id ? g.result : item))
      return
    }
    if (g.item.kind === 'shape') {
      const end = e.shiftKey ? constrainPoint(g.start, point, g.item.shape) : point
      g.item = { ...g.item, x2: end.x, y2: end.y }
    } else if (g.item.tool === 'marker' && (g.straight || e.shiftKey)) {
      g.straight = true
      g.item = { ...g.item, linear: true, points: [g.start, constrainPoint(g.start, point, 'line')] }
    } else {
      const last = g.item.points.at(-1)
      if (last.x === point.x && last.y === point.y) return
      g.item = { ...g.item, points: [...g.item.points, point] }
    }
    setCurrentStroke(g.item)
  }, [activeView, cancelGesture, reactFlowInstance, screenToFlow, eraseAt])
  const onPointerUp = useCallback((e) => {
    const g = gestureRef.current
    if (!g) return
    if (e && Number.isFinite(e.clientX) && g.type !== 'pan') onPointerMove(e)
    if (g.view === activeView) {
      const items = annotationsRef.current[g.view].items
      if (g.type === 'draw' && (g.item.kind !== 'shape' || Math.hypot(g.item.x2 - g.item.x1, g.item.y2 - g.item.y1) > 0.5)) commitItems([...items, g.item], g.view)
      if (g.type === 'erase' && g.changed) commitItems(g.items, g.view)
      if (g.type === 'transform' && g.changed) commitItems(items.map((item) => item.id === g.item.id ? g.result : item), g.view)
    }
    cancelGesture()
  }, [activeView, onPointerMove, commitItems, cancelGesture])
  const onCommitText = useCallback((text) => {
    if (!pendingText) return
    if (text?.trim()) {
      const item = { ...pendingText, id: crypto.randomUUID(), kind: 'text', text: text.trim() }
      commitItems([...annotationsRef.current[activeView].items, item])
      setSelectedId(item.id)
    } else setSelectedId(null)
    setPendingText(null)
  }, [activeView, pendingText, commitItems])
  const onCommitTextEdit = useCallback((id, text) => {
    setEditingTextId(null)
    if (text === null) return
    const items = annotationsRef.current[activeView].items
    const item = items.find((entry) => entry.id === id)
    if (!item || item.text === text.trim()) return
    commitItems(text.trim() ? items.map((entry) => entry.id === id ? { ...entry, text: text.trim() } : entry) : items.filter((entry) => entry.id !== id))
    setSelectedId(text.trim() ? id : null)
  }, [activeView, commitItems])
  const onStartTextEdit = useCallback((id) => {
    if (activeTool !== 'text' && activeTool !== 'select') return
    cancelGesture()
    setPendingText(null)
    setSelectedId(id)
    setEditingTextId(id)
  }, [activeTool, cancelGesture])
  const onTextDoubleClick = useCallback((id, e) => {
    if (activeTool !== 'text' && activeTool !== 'select') return
    e.preventDefault()
    e.stopPropagation()
    onStartTextEdit(id)
  }, [activeTool, onStartTextEdit])
  const onDeleteSelected = useCallback(() => {
    if (!selectedItem) return false
    commitItems(annotationsRef.current[activeView].items.filter((item) => item.id !== selectedItem.id))
    resetTransient()
    return true
  }, [activeView, selectedItem, commitItems, resetTransient])
  const onDuplicateSelected = useCallback(() => {
    if (!selectedItem) return
    const item = { ...moveAnnotation(selectedItem, 20, 20), id: crypto.randomUUID() }
    commitItems([...annotationsRef.current[activeView].items, item])
    setSelectedId(item.id)
  }, [activeView, selectedItem, commitItems])
  const onClearAnnotations = useCallback((view = activeView) => {
    if (annotationsRef.current[view].items.length) commitItems([], view)
    resetTransient()
  }, [activeView, commitItems, resetTransient])
  const onLoadAnnotations = useCallback((raw) => {
    const next = normalizeAnnotations(raw)
    annotationsRef.current = next
    setAnnotations(next)
    setDirtySignal(0)
    resetTransient()
  }, [resetTransient])
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!enabled || event.defaultPrevented || isEditableTarget(event.target) || event.target?.closest?.('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      const key = event.key?.toLowerCase()
      if ((isSpaceKey(event) || key === 'enter') && event.target?.closest?.('button, a, [role="button"]')) return
      if (isSpaceKey(event)) {
        if (isAnnotationTool(activeTool) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault()
          event.stopPropagation()
          if (!event.repeat) { panRef.current = true; setTemporaryPanMode(true) }
        }
        return
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey && TOOL_HOTKEYS[key]) {
        event.preventDefault(); setTool(TOOL_HOTKEYS[key]); return
      }
      if ((event.ctrlKey || event.metaKey) && key === 'd' && selectedItem && activeTool !== 'pointer') {
        event.preventDefault(); onDuplicateSelected(); return
      }
      if ((key === 'delete' || key === 'backspace') && activeTool !== 'pointer') {
        event.preventDefault(); event.stopPropagation(); onDeleteSelected(); return
      }
      if (activeTool === 'select' && selectedItem && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        const step = event.shiftKey ? 10 : 1
        updateSelected(moveAnnotation(selectedItem, event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0))
      }
      if (key === 'escape') {
        event.preventDefault()
        if (pendingText || selectedItem || editingTextItem || gestureRef.current) resetTransient()
        else if (activeTool !== 'pointer') setTool('pointer')
      }
      if ((activeTool === 'text' || activeTool === 'select') && key === 'enter' && selectedTextItem && !editingTextItem) {
        event.preventDefault(); onStartTextEdit(selectedTextItem.id)
      }
    }
    const handleKeyUp = (event) => {
      if (isSpaceKey(event)) {
        if (gestureRef.current?.type === 'pan') gestureRef.current = null
        panRef.current = false
        setTemporaryPanMode(false)
      }
    }
    const handleBlur = () => { cancelGesture(); panRef.current = false; setTemporaryPanMode(false) }
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      window.removeEventListener('blur', handleBlur)
    }
  }, [enabled, activeTool, pendingText, selectedItem, editingTextItem, selectedTextItem, setTool, resetTransient, cancelGesture, onDeleteSelected, onDuplicateSelected, onStartTextEdit, updateSelected])
  const effectiveTextSettings = selectedTextItem
    ? Object.fromEntries(['color', 'fontSize', 'width', 'padding', 'background', 'border'].filter((key) => selectedTextItem[key] !== undefined).map((key) => [key, selectedTextItem[key]]))
    : textSettings
  return {
    annotations, displayAnnotations: previewItems ? { ...annotations, [activeView]: { items: previewItems } } : annotations,
    activeTool, penSettings, markerSettings, textSettings: effectiveTextSettings, eraserSettings,
    currentStroke, pendingText, selectedItem, selectedId: selectedItem?.id ?? null,
    selectedTextId: selectedTextItem?.id ?? null, editingTextId: editingTextItem?.id ?? null,
    isTemporaryPanMode: enabled && isTemporaryPanMode, dirtySignal, getAnnotationsSnapshot,
    setTool, updatePenSettings, updateMarkerSettings, updateTextSettings, updateEraserSettings,
    updateSelected, beginStyleEdit, endStyleEdit, onSelectItem, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: cancelGesture,
    onCommitText, onCommitTextEdit, onTextPointerDown: onItemPointerDown, onItemPointerDown,
    onTextDoubleClick, onDeleteSelectedText: onDeleteSelected, onDeleteSelected, onDuplicateSelected,
    onClearAnnotations, onLoadAnnotations,
  }
}
