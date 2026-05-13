import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY_TOOL_SETTINGS = 'modelizer.annotationToolSettings'

const VIEWS = ['conceptual', 'logical', 'physical']

const DEFAULT_TOOL_SETTINGS = {
  pen: { color: '#ef4444', thickness: 2 },
  marker: { color: '#facc15', thickness: 12, opacity: 0.35 },
  text: { color: '#1e293b', fontSize: 14 },
  eraser: { size: 20, mode: 'whole' },
  activeTool: 'pointer',
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

function normalizeAnnotations(raw) {
  const result = makeEmptyAnnotations()
  if (!raw || typeof raw !== 'object') return result
  for (const view of VIEWS) {
    const viewData = raw[view]
    if (!viewData || typeof viewData !== 'object') continue
    const items = Array.isArray(viewData.items) ? viewData.items : []
    result[view].items = items.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        (item.kind === 'stroke' || item.kind === 'text'),
    )
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

export function useAnnotations({ activeView, reactFlowInstance, pushHistorySnapshot }) {
  const initialSettings = readToolSettings()

  const [annotations, setAnnotations] = useState(makeEmptyAnnotations)
  const [activeTool, setActiveTool] = useState(initialSettings.activeTool)
  const [penSettings, setPenSettings] = useState(initialSettings.pen)
  const [markerSettings, setMarkerSettings] = useState(initialSettings.marker)
  const [textSettings, setTextSettings] = useState(initialSettings.text)
  const [eraserSettings, setEraserSettings] = useState(initialSettings.eraser)
  const [currentStroke, setCurrentStroke] = useState(null)
  const [pendingText, setPendingText] = useState(null)
  const [dirtySignal, setDirtySignal] = useState(0)

  const annotationsRef = useRef(annotations)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  const bumpDirty = useCallback(() => setDirtySignal((n) => n + 1), [])

  const getAnnotationsSnapshot = useCallback(() => annotationsRef.current, [])

  const setTool = useCallback((tool) => {
    setActiveTool(tool)
    const settings = readToolSettings()
    writeToolSettings({ ...settings, activeTool: tool })
    setPendingText(null)
    setCurrentStroke(null)
    isDrawingRef.current = false
  }, [])

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

  const updateTextSettings = useCallback((updates) => {
    setTextSettings((cur) => {
      const next = { ...cur, ...updates }
      const settings = readToolSettings()
      writeToolSettings({ ...settings, text: next })
      return next
    })
  }, [])

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
      e.preventDefault()
      e.stopPropagation()
      const flowPt = screenToFlow(e.clientX, e.clientY)

      if (activeTool === 'pen' || activeTool === 'marker') {
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
        pushHistorySnapshot?.()
        onEraseAt(flowPt)
        isDrawingRef.current = true
      } else if (activeTool === 'text') {
        // Don't create a new input while one is already open — let blur commit it first
        if (!pendingText) {
          setPendingText({ x: flowPt.x, y: flowPt.y, text: '', color: textSettings.color, fontSize: textSettings.fontSize })
        }
      }
    },
    [activeTool, penSettings, markerSettings, textSettings, pendingText, screenToFlow, pushHistorySnapshot, onEraseAt],
  )

  const onPointerMove = useCallback(
    (e) => {
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
    [activeTool, screenToFlow, onEraseAt],
  )

  const onPointerUp = useCallback(
    () => {
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
        const item = {
          id: crypto.randomUUID(),
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
        bumpDirty()
      }
      setPendingText(null)
    },
    [activeView, pendingText, pushHistorySnapshot, bumpDirty],
  )

  const onUpdateText = useCallback(
    (id, text) => {
      pushHistorySnapshot?.()
      if (!text.trim()) {
        setAnnotations((cur) => ({
          ...cur,
          [activeView]: {
            items: cur[activeView].items.filter((i) => i.id !== id),
          },
        }))
      } else {
        setAnnotations((cur) => ({
          ...cur,
          [activeView]: {
            items: cur[activeView].items.map((i) =>
              i.id === id ? { ...i, text: text.trim() } : i,
            ),
          },
        }))
      }
      bumpDirty()
    },
    [activeView, pushHistorySnapshot, bumpDirty],
  )

  const onClearAnnotations = useCallback(
    (view) => {
      pushHistorySnapshot?.()
      setAnnotations((cur) => ({ ...cur, [view ?? activeView]: { items: [] } }))
      bumpDirty()
    },
    [activeView, pushHistorySnapshot, bumpDirty],
  )

  const onLoadAnnotations = useCallback((raw) => {
    setAnnotations(normalizeAnnotations(raw))
    setDirtySignal(0)
  }, [])

  return {
    annotations,
    activeTool,
    penSettings,
    markerSettings,
    textSettings,
    eraserSettings,
    currentStroke,
    pendingText,
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
    onUpdateText,
    onClearAnnotations,
    onLoadAnnotations,
  }
}
