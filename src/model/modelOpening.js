import { ASSOCIATION_EDGE_TYPE, REFLEXIVE_EDGE_TYPE, MODEL_VERSION } from './constants.js'
import { normalizeEdges } from './edgeUtils.js'

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

export function parseModelFile(text) {
  if (!text.trim()) throw new Error('The selected model file is empty.')
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('The selected file does not contain valid JSON.')
  }
  if (!isObject(payload) || !Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    throw new Error('Invalid model: nodes and edges must be arrays.')
  }
  if (payload.version !== undefined && payload.version !== MODEL_VERSION) {
    throw new Error(`Unsupported model version: ${String(payload.version)}.`)
  }
  const normalizeEntries = (entries, kind) => {
    const ids = new Set()
    for (const entry of entries) {
      if (!isObject(entry) || (entry.data !== undefined && !isObject(entry.data))) {
        throw new Error(`Invalid model: malformed ${kind} entry.`)
      }
      if ((entry.type !== undefined && typeof entry.type !== 'string') ||
          (entry.position !== undefined && (!isObject(entry.position) ||
            !Number.isFinite(entry.position.x) || !Number.isFinite(entry.position.y))) ||
          (entry.style !== undefined && !isObject(entry.style))) {
        throw new Error(`Invalid model: malformed ${kind} entry.`)
      }
      if (entry.id !== undefined) {
        if (typeof entry.id !== 'string' || !entry.id.trim() || ids.has(entry.id)) {
          throw new Error(`Invalid model: invalid or duplicate ${kind} ID.`)
        }
        ids.add(entry.id)
      }
    }
    return entries.map((entry, index) => {
      if (entry.id !== undefined) return entry
      let id = `${kind}-loaded-${index}`
      while (ids.has(id)) id += '-'
      ids.add(id)
      return { ...entry, id }
    })
  }
  const nodes = normalizeEntries(payload.nodes, 'node')
  const edges = normalizeEdges(normalizeEntries(payload.edges, 'edge'))
  const nodeIds = new Set(nodes.map((node) => node.id))
  // Associative relationships connect to virtual nodes derived from base associations.
  const endpointIds = new Set(nodeIds)
  for (const edge of edges) {
    if ((edge.type === ASSOCIATION_EDGE_TYPE || edge.type === REFLEXIVE_EDGE_TYPE) &&
        nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      endpointIds.add(`assoc-edge-${edge.id}`)
    }
  }
  if (edges.some((edge) => !endpointIds.has(edge.source) || !endpointIds.has(edge.target))) {
    throw new Error('Invalid model: an edge refers to a nonexistent node.')
  }
  return { ...payload, version: MODEL_VERSION, nodes, edges }
}

export async function pickModelFile(registerCleanup, importFormat = null) {
  const type = importFormat === 'java'
    ? { description: 'Java Modelizer Model', accept: { 'application/json': ['.mod'] } }
    : importFormat === 'mysql'
      ? { description: 'MySQL file', accept: { 'text/sql': ['.sql'] } }
      : { description: 'Modelizer Model', accept: { 'application/json': ['.mdlz', '.json'] } }
  if (typeof window.showOpenFilePicker === 'function') {
    let handle
    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [type],
      })
      handle = handles[0]
    } catch (error) {
      if (error?.name === 'AbortError') return null
      throw new Error('The file picker could not be opened. Please try again.', { cause: error })
    }
    if (!handle) return null
    try {
      return { file: await handle.getFile(), handle }
    } catch {
      throw new Error('The selected file could not be read. Please select it again.')
    }
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = Object.entries(type.accept).flatMap(([mime, extensions]) => [...extensions, mime]).join(',')
    input.hidden = true
    const finish = (selection) => {
      input.onchange = null
      input.oncancel = null
      input.remove()
      registerCleanup?.(null)
      resolve(selection)
    }
    input.onchange = () => finish(input.files?.[0] ? { file: input.files[0], handle: null } : null)
    input.oncancel = () => finish(null)
    registerCleanup?.(() => finish(null))
    document.body.append(input)
    try {
      input.click()
    } catch {
      input.onchange = null
      input.oncancel = null
      input.remove()
      registerCleanup?.(null)
      reject(new Error('The file picker could not be opened. Please try again.'))
    }
  })
}
