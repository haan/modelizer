import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PngExportDialog from '../PngExportDialog.jsx'
import { exportFlowPng } from '../../../model/pngExport.jsx'
import { AREA_NODE_TYPE, CLASS_NODE_TYPE, NOTE_NODE_TYPE } from '../../../model/constants.js'

vi.mock('../../../model/pngExport.jsx', () => ({ exportFlowPng: vi.fn() }))

const source = {
  activeView: 'logical', fileName: 'Assignment-logical.png', annotations: {},
  nodes: [
    { id: 'class', type: CLASS_NODE_TYPE, selected: true, data: { showAccentColors: false } },
    { id: 'note', type: NOTE_NODE_TYPE },
    { id: 'area', type: AREA_NODE_TYPE },
  ],
  edges: [{ id: 'link', source: 'class', target: 'note', selected: true }],
  defaults: { includeAnnotations: false, includeNotes: false, includeAreas: true, includeAccentColors: true },
}

beforeEach(() => { exportFlowPng.mockReset().mockResolvedValue('data:image/png;base64,preview') })
afterEach(cleanup)

describe('PNG export preview', () => {
  it('filters content independently of the canvas and regenerates resolution, background, and margin', async () => {
    const user = userEvent.setup()
    render(<PngExportDialog source={source} onClose={vi.fn()} />)
    expect(await screen.findByAltText('PNG export preview')).toBeInTheDocument()
    expect(screen.getByText('Logical view')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Include annotations' })).not.toBeInTheDocument()
    expect(exportFlowPng).toHaveBeenLastCalledWith(expect.objectContaining({
      nodes: [expect.objectContaining({ id: 'class', selected: false, data: { showAccentColors: true } }), expect.objectContaining({ id: 'area' })],
      edges: [], resolution: 'standard', background: 'white', padding: 64,
    }))
    await user.click(screen.getByRole('checkbox', { name: 'Include notes' }))
    await user.click(screen.getByRole('checkbox', { name: 'Include areas' }))
    await user.click(screen.getByRole('checkbox', { name: 'Accent colors' }))
    await user.selectOptions(screen.getByLabelText('Resolution', { exact: false }), 'high')
    await user.click(screen.getByText('More options'))
    await user.selectOptions(screen.getByLabelText('Background'), 'transparent')
    await user.selectOptions(screen.getByLabelText('Margin'), 'small')
    expect(await screen.findByAltText('PNG export preview')).toBeInTheDocument()
    expect(exportFlowPng).toHaveBeenLastCalledWith(expect.objectContaining({
      nodes: [expect.objectContaining({ id: 'class', data: { showAccentColors: false } }), expect.objectContaining({ id: 'note' })],
      edges: [expect.objectContaining({ id: 'link', selected: false })],
      resolution: 'high', background: 'transparent', padding: 32, currentStroke: null,
    }))
    expect(source.nodes[0]).toMatchObject({ selected: true, data: { showAccentColors: false } })
    const count = exportFlowPng.mock.calls.length
    await user.clear(screen.getByLabelText('Filename'))
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
    await user.type(screen.getByLabelText('Filename'), 'My feedback.PNG')
    expect(screen.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('download', 'My feedback.png')
    expect(exportFlowPng).toHaveBeenCalledTimes(count)
  })

  it('keeps the previous preview mounted while updating but never downloads a stale image', async () => {
    const pending = []
    exportFlowPng.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))
    render(<PngExportDialog source={source} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include notes' }))
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
    await act(async () => pending[1]('data:image/png;base64,new'))
    expect(screen.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('href', 'data:image/png;base64,new')
    await act(async () => pending[0]('data:image/png;base64,old'))
    expect(screen.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('href', 'data:image/png;base64,new')
    const image = screen.getByAltText('PNG export preview')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include areas' }))
    expect(screen.queryByRole('link', { name: 'Download PNG' })).not.toBeInTheDocument()
    expect(screen.getByAltText('PNG export preview')).toBe(image)
    expect(image).toHaveAttribute('src', 'data:image/png;base64,new')
    expect(screen.getByRole('status')).toHaveTextContent('Updating preview')
    await act(async () => pending[2]('data:image/png;base64,latest'))
    expect(screen.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('href', 'data:image/png;base64,latest')
    expect(screen.getByAltText('PNG export preview')).toBe(image)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('retries a failed preview with the current settings', async () => {
    exportFlowPng.mockRejectedValueOnce(new Error('Capture failed'))
    render(<PngExportDialog source={source} onClose={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Capture failed')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Download PNG' })).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
