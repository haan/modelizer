import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseModelFile, pickModelFile } from '../modelOpening.js'

afterEach(() => {
  vi.restoreAllMocks()
  delete window.showOpenFilePicker
  document.body.innerHTML = ''
})

describe('model file validation', () => {
  it('accepts the bundled example including virtual association endpoints', () => {
    const text = readFileSync('import/Convention_Example.mdlz', 'utf8')
    const original = JSON.parse(text)
    const loaded = parseModelFile(text)
    expect(loaded.nodes).toHaveLength(original.nodes.length)
    expect(loaded.edges).toHaveLength(original.edges.length)
    const association = loaded.edges.find((edge) => edge.target.startsWith('assoc-edge-'))
    expect(association).toBeDefined()
    original.edges = original.edges.filter((edge) => `assoc-edge-${edge.id}` !== association.target)
    expect(() => parseModelFile(JSON.stringify(original))).toThrow('nonexistent')
  })
  it.each([
    ['', 'empty'], [' ', 'empty'], ['{', 'JSON'], ['null', 'nodes and edges'],
    ['[]', 'nodes and edges'], ['{}', 'nodes and edges'],
    ['{"nodes":{},"edges":[]}', 'nodes and edges'],
    ['{"nodes":[],"edges":null}', 'nodes and edges'],
    ['{"version":2,"nodes":[],"edges":[]}', 'version'],
    ['{"nodes":[null],"edges":[]}', 'malformed'],
    ['{"nodes":[{"id":2}],"edges":[]}', 'ID'],
    ['{"nodes":[{"id":null}],"edges":[]}', 'ID'],
    ['{"nodes":[{"id":" "}],"edges":[]}', 'ID'],
    ['{"nodes":[{"id":"a"},{"id":"a"}],"edges":[]}', 'duplicate'],
    ['{"nodes":[{"data":[]}],"edges":[]}', 'malformed'],
    ['{"nodes":[{"type":{}}],"edges":[]}', 'malformed'],
    ['{"nodes":[{"position":{"x":"0","y":0}}],"edges":[]}', 'malformed'],
    ['{"nodes":[],"edges":[{"source":"a","target":"b"}]}', 'nonexistent'],
    ['{"nodes":[],"edges":[false]}', 'malformed'],
    ['{"nodes":[],"edges":[{"id":"e"},{"id":"e"}]}', 'duplicate'],
  ])('rejects %s without treating it as an empty model', (text, message) => {
    expect(() => parseModelFile(text)).toThrow(message)
  })

  it('accepts empty legacy models and generates collision-free missing IDs', () => {
    expect(parseModelFile('{"nodes":[],"edges":[]}')).toMatchObject({ version: 1, nodes: [], edges: [] })
    const result = parseModelFile(JSON.stringify({
      nodes: [{}, { id: 'node-loaded-0' }],
      edges: [{ source: 'node-loaded-0', target: 'node-loaded-0' }],
    }))
    expect(new Set(result.nodes.map((node) => node.id)).size).toBe(2)
    expect(result.edges[0].id).toBeTruthy()
  })
})

describe('model picker', () => {
  it('preserves native handles and distinguishes cancellation, picker failure, and read failure', async () => {
    const file = { name: 'model.mdlz' }
    const handle = { getFile: vi.fn().mockResolvedValue(file) }
    window.showOpenFilePicker = vi.fn().mockResolvedValue([handle])
    await expect(pickModelFile()).resolves.toEqual({ file, handle })
    window.showOpenFilePicker.mockRejectedValueOnce(new DOMException('Canceled', 'AbortError'))
    await expect(pickModelFile()).resolves.toBeNull()
    window.showOpenFilePicker.mockRejectedValueOnce(new Error('Denied'))
    await expect(pickModelFile()).rejects.toThrow('picker')
    handle.getFile.mockRejectedValueOnce(new DOMException('Cannot read', 'AbortError'))
    await expect(pickModelFile()).rejects.toThrow('read')
  })

  it('settles fallback cancellation and removes the input and listeners', async () => {
    window.showOpenFilePicker = true
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const pending = pickModelFile()
    const input = document.querySelector('input')
    input.dispatchEvent(new Event('cancel'))
    await expect(pending).resolves.toBeNull()
    expect(input.onchange).toBeNull()
    expect(input.oncancel).toBeNull()
    expect(input.isConnected).toBe(false)
  })

  it('allows repeated selection of the same file and explicit cleanup', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const file = new File(['{}'], 'model.json')
    for (let i = 0; i < 2; i += 1) {
      const pending = pickModelFile()
      const input = document.querySelector('input')
      Object.defineProperty(input, 'files', { value: [file] })
      input.dispatchEvent(new Event('change'))
      await expect(pending).resolves.toEqual({ file, handle: null })
      expect(document.querySelector('input')).toBeNull()
    }
    let cleanup
    const pending = pickModelFile((value) => { cleanup = value })
    cleanup()
    await expect(pending).resolves.toBeNull()
    expect(cleanup).toBeNull()
  })

  it('reports a fallback picker launch failure', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => { throw new Error('Failed') })
    await expect(pickModelFile()).rejects.toThrow('picker')
    expect(document.querySelector('input')).toBeNull()
  })
})
