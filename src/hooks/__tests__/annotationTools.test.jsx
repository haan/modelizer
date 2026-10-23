import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeAnnotations, useAnnotations } from '../useAnnotations.js'
import { useHistory } from '../useHistory.js'
import { useRef } from 'react'
import { parseModelFile } from '../../model/modelOpening.js'

const event = (x, y, options = {}) => ({ clientX: x, clientY: y, preventDefault: vi.fn(), stopPropagation: vi.fn(), ...options })
const ink = { id: 'ink', kind: 'stroke', tool: 'pen', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], color: '#000000', thickness: 2, opacity: 1 }
const rectangle = { id: 'box', kind: 'shape', shape: 'rectangle', x1: 0, y1: 0, x2: 100, y2: 50, thickness: 2, color: '#ef4444' }
const textItem = { id: 'text', kind: 'text', x: 20, y: 30, text: 'Check this', fontSize: 14, color: '#000000', width: 100, padding: 6, background: '#ffffff', border: true }
function setup() {
  const history = vi.fn()
  const hook = renderHook(({ view = 'conceptual', enabled = true, zoom = 1 }) => useAnnotations({
    activeView: view, enabled, pushHistorySnapshot: history,
    reactFlowInstance: { screenToFlowPosition: ({ x, y }) => ({ x: x / zoom, y: y / zoom }) },
  }), { initialProps: {} })
  return { ...hook, history }
}
const load = (result, items) => act(() => result.current.onLoadAnnotations({ conceptual: { items } }))
beforeEach(() => window.localStorage.clear())

describe('annotation tools', () => {
  it.each(['arrow', 'line', 'rectangle', 'ellipse'])('creates %s at the final pointer position with one undo entry', (tool) => {
    const { result, history } = setup()
    act(() => result.current.setTool(tool))
    act(() => result.current.onPointerDown(event(10, 20)))
    act(() => result.current.onPointerMove(event(30, 40)))
    expect(history).not.toHaveBeenCalled()
    expect(result.current.annotations.conceptual.items).toEqual([])
    act(() => result.current.onPointerUp(event(110, 70)))
    expect(result.current.annotations.conceptual.items[0]).toMatchObject({ kind: 'shape', shape: tool, x1: 10, y1: 20, x2: 110, y2: 70 })
    expect(history).toHaveBeenCalledTimes(1)
  })
  it('constrains rectangles and straight marker strokes using Shift', () => {
    const { result } = setup()
    act(() => result.current.setTool('rectangle'))
    act(() => result.current.onPointerDown(event(0, 0)))
    act(() => result.current.onPointerUp(event(100, 30, { shiftKey: true })))
    expect(result.current.annotations.conceptual.items[0]).toMatchObject({ x2: 100, y2: 100 })
    act(() => result.current.setTool('marker'))
    act(() => result.current.onPointerDown(event(0, 0, { shiftKey: true })))
    act(() => result.current.onPointerMove(event(40, 3)))
    act(() => result.current.onPointerUp(event(100, 5)))
    const marker = result.current.annotations.conceptual.items[1]
    expect(marker.points).toHaveLength(2)
    expect(marker.points[1].y).toBeCloseTo(0)
    expect(marker.linear).toBe(true)
  })
  it.each([0.5, 1, 2])('moves and resizes annotations in model coordinates at zoom %s', (zoom) => {
    const { result, rerender, history } = setup()
    rerender({ zoom })
    load(result, [rectangle])
    act(() => result.current.setTool('select'))
    act(() => result.current.onItemPointerDown('box', event(0, 0)))
    act(() => result.current.onPointerMove(event(20 * zoom, 30 * zoom)))
    expect(result.current.displayAnnotations.conceptual.items[0]).toMatchObject({ x1: 20, y1: 30 })
    expect(result.current.getAnnotationsSnapshot().conceptual.items[0]).toEqual(rectangle)
    act(() => result.current.onPointerUp())
    expect(result.current.annotations.conceptual.items[0]).toMatchObject({ x1: 20, y1: 30, x2: 120, y2: 80 })
    act(() => result.current.onItemPointerDown('box', event(120 * zoom, 80 * zoom), 'se'))
    act(() => result.current.onPointerUp(event(160 * zoom, 100 * zoom)))
    expect(result.current.annotations.conceptual.items[0]).toMatchObject({ x1: 20, y1: 30, x2: 160, y2: 100 })
    expect(history).toHaveBeenCalledTimes(2)
  })
  it.each([ink, rectangle, textItem])('recolors, duplicates and deletes a selected $kind', (item) => {
    const { result, history } = setup()
    load(result, [item])
    act(() => result.current.setTool('select'))
    act(() => result.current.onItemPointerDown(item.id, event(0, 0)))
    act(() => result.current.onPointerUp())
    act(() => result.current.updateSelected({ color: '#3b82f6' }))
    act(() => result.current.onDuplicateSelected())
    const items = result.current.annotations.conceptual.items
    expect(items).toHaveLength(2)
    expect(items[1].id).not.toBe(item.id)
    expect(items[1].color).toBe('#3b82f6')
    act(() => result.current.onDeleteSelected())
    expect(result.current.annotations.conceptual.items).toHaveLength(1)
    expect(history).toHaveBeenCalledTimes(3)
  })
  it('ignores pointer input and right clicks when drawing is not intended', () => {
    const { result, history } = setup()
    act(() => result.current.onPointerDown(event(10, 10)))
    act(() => result.current.onPointerUp())
    act(() => result.current.setTool('pen'))
    act(() => result.current.onPointerDown(event(10, 10, { button: 2 })))
    act(() => result.current.onPointerUp())
    expect(result.current.annotations.conceptual.items).toEqual([])
    expect(history).not.toHaveBeenCalled()
  })
  it('erases swept ink in one transaction and does not record empty erasures', () => {
    const { result, history } = setup()
    load(result, [ink, rectangle, textItem])
    act(() => result.current.setTool('eraser'))
    act(() => result.current.onPointerDown(event(300, 300)))
    act(() => result.current.onPointerUp())
    expect(history).not.toHaveBeenCalled()
    act(() => result.current.onPointerDown(event(50, -30)))
    act(() => result.current.onPointerMove(event(50, 30)))
    expect(history).not.toHaveBeenCalled()
    act(() => result.current.onPointerUp())
    expect(result.current.annotations.conceptual.items.map((item) => item.id)).toEqual(['box', 'text'])
    expect(history).toHaveBeenCalledTimes(1)
  })
  it.each(['pen', 'eraser', 'select'])('cancels unfinished %s gestures without dirtying the model', (tool) => {
    const { result, history } = setup()
    load(result, [ink])
    act(() => result.current.setTool(tool))
    act(() => tool === 'select' ? result.current.onItemPointerDown('ink', event(0, 0)) : result.current.onPointerDown(event(0, 0)))
    act(() => result.current.onPointerMove(event(100, 100)))
    act(() => result.current.onPointerCancel())
    expect(result.current.annotations.conceptual.items).toEqual([ink])
    expect(result.current.displayAnnotations.conceptual.items).toEqual([ink])
    expect(result.current.dirtySignal).toBe(0)
    expect(history).not.toHaveBeenCalled()
  })
  it('drops unfinished gestures when switching views or hiding annotations', () => {
    const { result, rerender, history } = setup()
    act(() => result.current.setTool('pen'))
    act(() => result.current.onPointerDown(event(10, 10)))
    rerender({ view: 'logical' })
    act(() => result.current.onPointerUp())
    expect(result.current.currentStroke).toBeNull()
    expect(result.current.annotations.logical.items).toEqual([])
    act(() => result.current.onPointerDown(event(10, 10)))
    rerender({ view: 'logical', enabled: false })
    act(() => result.current.onPointerUp())
    expect(result.current.annotations.logical.items).toEqual([])
    expect(history).not.toHaveBeenCalled()
  })
  it('keeps laser pointing out of saved content, dirty state and undo', () => {
    const { result, history } = setup()
    act(() => result.current.setTool('laser'))
    act(() => result.current.onPointerDown(event(10, 10)))
    act(() => result.current.onPointerMove(event(100, 100)))
    act(() => result.current.onPointerUp())
    expect(result.current.currentStroke).toBeNull()
    expect(result.current.annotations.conceptual.items).toEqual([])
    expect(result.current.dirtySignal).toBe(0)
    expect(history).not.toHaveBeenCalled()
  })
  it('opens text editing from Select annotation and preserves its box styling', () => {
    const { result } = setup()
    load(result, [textItem])
    act(() => result.current.setTool('select'))
    act(() => result.current.onTextDoubleClick('text', event(20, 30)))
    expect(result.current.editingTextId).toBe('text')
    act(() => result.current.onCommitTextEdit('text', 'Updated'))
    expect(result.current.annotations.conceptual.items[0]).toEqual({ ...textItem, text: 'Updated' })
  })
  it('round-trips new annotations in all views and upgrades legacy files', () => {
    const annotations = Object.fromEntries(['conceptual', 'logical', 'physical'].map((view) => [view, { items: [rectangle, textItem, { ...ink, linear: true }] }]))
    const loaded = parseModelFile(JSON.stringify({ version: 2, nodes: [], edges: [], annotations }))
    expect(normalizeAnnotations(loaded.annotations)).toEqual(annotations)
    expect(parseModelFile(JSON.stringify({ version: 1, nodes: [], edges: [], annotations: { conceptual: { items: [ink] } } })).version).toBe(2)
    expect(normalizeAnnotations({ conceptual: { items: [{ ...rectangle, x1: 'bad' }, { ...rectangle, shape: 'unknown' }] } }).conceptual.items).toEqual([])
  })
  it('restores a completed gesture through the shared history without saving its preview', async () => {
    const { result } = renderHook(() => {
      const snapshot = useRef(() => null)
      const history = useHistory()
      const annotation = useAnnotations({ activeView: 'conceptual', pushHistorySnapshot: () => history.pushHistory(snapshot.current()) })
      snapshot.current = annotation.getAnnotationsSnapshot
      return { ...annotation, undo: () => history.undo(annotation.getAnnotationsSnapshot(), annotation.onLoadAnnotations), redo: () => history.redo(annotation.getAnnotationsSnapshot(), annotation.onLoadAnnotations) }
    })
    act(() => result.current.setTool('line'))
    act(() => result.current.onPointerDown(event(0, 0)))
    await act(async () => result.current.onPointerUp(event(100, 20)))
    expect(result.current.annotations.conceptual.items).toHaveLength(1)
    act(() => result.current.undo())
    expect(result.current.annotations.conceptual.items).toEqual([])
    act(() => result.current.redo())
    expect(result.current.annotations.conceptual.items[0]).toMatchObject({ kind: 'shape', x2: 100, y2: 20 })
  })
})

 it('undoes and redoes each style gesture once, including separate drags on the same slider', async () => {
  const {result} = renderHook(() => {
   const snapshot = useRef(() => null);
   const history = useHistory();
   const annotation = useAnnotations({activeView:'conceptual',pushHistorySnapshot:()=>history.pushHistory(snapshot.current())});
   snapshot.current = annotation.getAnnotationsSnapshot;
   return {...annotation,undo:()=>history.undo(annotation.getAnnotationsSnapshot(),annotation.onLoadAnnotations),redo:()=>history.redo(annotation.getAnnotationsSnapshot(),annotation.onLoadAnnotations)};
  });
  load(result,[textItem]);
  act(()=>{result.current.setTool('select');result.current.onSelectItem('text')});
  act(()=>result.current.beginStyleEdit());
  for(const fontSize of [15,16,17,18,19,20]) await act(async()=>result.current.updateSelected({fontSize}));
  act(()=>result.current.endStyleEdit());
  act(()=>result.current.beginStyleEdit());
  for(const fontSize of [21,22]) await act(async()=>result.current.updateSelected({fontSize}));
  act(()=>result.current.endStyleEdit());
  act(()=>result.current.undo());
  expect(result.current.annotations.conceptual.items[0].fontSize).toBe(20);
  act(()=>result.current.undo());
  expect(result.current.annotations.conceptual.items[0].fontSize).toBe(14);
  act(()=>result.current.redo());
  expect(result.current.annotations.conceptual.items[0].fontSize).toBe(20);
 });
