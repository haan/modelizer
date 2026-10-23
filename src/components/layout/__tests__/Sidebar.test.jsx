import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import Sidebar from '../Sidebar.jsx'

afterEach(cleanup)

it('keeps panel and view selections independent and retains existing action callbacks', () => {
  const onSelect = vi.fn(), onViewChange = vi.fn()
  render(<Sidebar activeItem="refs" activeView="logical" onSelect={onSelect} onViewChange={onViewChange} />)
  expect(within(screen.getByRole('list', { name: 'Panels' })).getByRole('button', { name: 'Relations' })).toHaveAttribute('aria-pressed', 'true')
  expect(within(screen.getByRole('list', { name: 'Model views' })).getByRole('button', { name: 'Logical' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Relations' }))
  fireEvent.click(screen.getByRole('button', { name: 'Physical' }))
  expect(onSelect).toHaveBeenCalledWith('refs')
  expect(onViewChange).toHaveBeenCalledWith('physical')
  for (const action of ['New', 'Open', 'Save', 'Export']) {
    fireEvent.click(screen.getByRole('button', { name: action, exact: true }))
    expect(onSelect).toHaveBeenLastCalledWith(action.toLowerCase())
  }
})

it('explains unavailable Sync on keyboard focus without allowing it to run', async () => {
  const onSyncViewPositions = vi.fn()
  render(<Sidebar activeItem="tables" activeView="conceptual" onSelect={vi.fn()} onSyncViewPositions={onSyncViewPositions} />)
  const sync = screen.getByRole('button', { name: 'Sync', exact: true })
  expect(sync).toHaveAttribute('aria-disabled', 'true')
  sync.focus()
  expect(sync).toHaveFocus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Sync is unavailable in conceptual view: there is no previous modeling phase.')
  fireEvent.click(sync)
  expect(onSyncViewPositions).not.toHaveBeenCalled()
})

it.each([['logical', 'conceptual'], ['physical', 'logical']])('identifies the source view and enables Sync in %s', async (activeView, sourceView) => {
  const onSyncViewPositions = vi.fn()
  render(<Sidebar activeItem="tables" activeView={activeView} onSelect={vi.fn()} onSyncViewPositions={onSyncViewPositions} />)
  const sync = screen.getByRole('button', { name: 'Sync', exact: true })
  expect(sync).toHaveAttribute('aria-disabled', 'false')
  sync.focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Sync positions from ' + sourceView + ' view')
  fireEvent.click(sync)
  expect(onSyncViewPositions).toHaveBeenCalledTimes(1)
})
