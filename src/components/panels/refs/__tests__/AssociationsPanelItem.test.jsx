import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as Accordion from '@radix-ui/react-accordion'
import { afterEach, expect, it, vi } from 'vitest'
import AssociationsPanelItem from '../AssociationsPanelItem.jsx'

// Exercise endpoint-to-model mapping independently of Radix's popup mechanics.
vi.mock('../../../ui/Select.jsx', () => ({
  default: ({ items, value, onValueChange, ...props }) => <select {...props} value={value} onChange={event => onValueChange(event.target.value)}>
    {items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
  </select>,
}))

afterEach(cleanup)
const edge = { id: 'association-1', type: 'association', source: 'user', target: 'port', data: { name: 'activates', multiplicityA: '0..*', multiplicityB: '1..1' } }
const renderItem = (props = {}) => render(
  <Accordion.Root type="single" value={props.isOpen === false ? '' : edge.id}>
    <AssociationsPanelItem edge={edge} sourceLabel="User" targetLabel="Port" isOpen showCompositionAggregation {...props} />
  </Accordion.Root>,
)

it('shows endpoints in collapsed headers and keeps header actions separate from expansion', () => {
  const onHighlightAssociation = vi.fn(), onDeleteAssociation = vi.fn(), onRenameAssociation = vi.fn(), onToggleOpen = vi.fn()
  renderItem({ isOpen: false, onHighlightAssociation, onDeleteAssociation, onRenameAssociation, onToggleOpen })
  expect(screen.getByTitle('User and Port')).toHaveTextContent('UserandPort')
  fireEvent.click(screen.getByRole('button', { name: 'Highlight association' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete association' }))
  expect(onHighlightAssociation).toHaveBeenCalledWith(edge.id)
  expect(onDeleteAssociation).toHaveBeenCalledWith(edge.id)
  fireEvent.click(screen.getByRole('button', { name: 'Edit association name' }))
  const input = screen.getByPlaceholderText('Association name')
  fireEvent.change(input, { target: { value: 'connects' } })
  expect(onRenameAssociation).toHaveBeenLastCalledWith(edge.id, 'connects')
  fireEvent.keyDown(input, { key: 'Escape' })
  expect(onRenameAssociation).toHaveBeenLastCalledWith(edge.id, 'activates')
  expect(onToggleOpen).not.toHaveBeenCalled()
})

it('keeps multiplicities and roles mapped to the correct endpoint', () => {
  const onUpdateAssociationMultiplicity = vi.fn(), onUpdateAssociationRole = vi.fn()
  renderItem({ onUpdateAssociationMultiplicity, onUpdateAssociationRole })
  fireEvent.change(screen.getByRole('combobox', { name: 'Multiplicity A (User)' }), { target: { value: '__undefined__' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Multiplicity B (Port)' }), { target: { value: '1..*' } })
  expect(onUpdateAssociationMultiplicity.mock.calls).toEqual([[edge.id, 'A', ''], [edge.id, 'B', '1..*']])
  fireEvent.change(screen.getByRole('textbox', { name: 'Role A (User)' }), { target: { value: 'owner' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Role B (Port)' }), { target: { value: 'ports' } })
  expect(onUpdateAssociationRole.mock.calls).toEqual([[edge.id, 'A', 'owner'], [edge.id, 'B', 'ports']])
})

it('preserves composition, routing reset, and comment updates', () => {
  const onToggleAssociationComposition = vi.fn(), onUpdateAssociationComment = vi.fn()
  const onResetAssociationRouting = vi.fn(), onUpdateAssociationLineStyle = vi.fn()
  renderItem({ edge: { ...edge, data: { ...edge.data, lineStyle: 'manual', controlPoints: [{ x: 1, y: 2 }] } },
    onToggleAssociationComposition, onUpdateAssociationComment, onResetAssociationRouting, onUpdateAssociationLineStyle })
  fireEvent.click(screen.getByRole('checkbox', { name: 'Toggle composition' }))
  expect(onToggleAssociationComposition).toHaveBeenCalledWith(edge.id, true)
  fireEvent.click(screen.getByRole('radio', { name: 'Straight' }))
  expect(onResetAssociationRouting).toHaveBeenCalledWith(edge.id)
  expect(onUpdateAssociationLineStyle).toHaveBeenCalledWith(edge.id, 'straight')
  expect(onResetAssociationRouting.mock.invocationCallOrder[0]).toBeLessThan(onUpdateAssociationLineStyle.mock.invocationCallOrder[0])
  fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), { target: { value: 'Owns this port' } })
  expect(onUpdateAssociationComment).toHaveBeenCalledWith(edge.id, 'Owns this port')
})

it('distinguishes the two ends of a reflexive association', () => {
  renderItem({ edge: { ...edge, type: 'reflexiveAssociation', target: 'user' }, targetLabel: 'User' })
  expect(screen.getByRole('combobox', { name: 'Multiplicity A (User)' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Multiplicity B (User)' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Role A (User)' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Role B (User)' })).toBeInTheDocument()
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
})

it('keeps associative links limited to their supported controls', async () => {
  const onRenameAssociation = vi.fn(), onToggleOpen = vi.fn()
  renderItem({ onRenameAssociation, onToggleOpen, edge: { ...edge, type: 'associativeAssociation' }, sourceLabel: 'activates', sourceIsAssociation: true })
  expect(screen.getByText('Association')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Endpoint A: activates' })).toBeInTheDocument()
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  const editButton = screen.getByRole('button', { name: 'Edit association name' })
  expect(editButton).toHaveAttribute('aria-disabled', 'true')
  editButton.focus()
  expect(editButton).toHaveFocus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Associative associations cannot be renamed.')
  fireEvent.click(editButton)
  expect(screen.queryByPlaceholderText('Association name')).not.toBeInTheDocument()
  expect(onRenameAssociation).not.toHaveBeenCalled()
  expect(onToggleOpen).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Delete association' })).toBeInTheDocument()
})
