import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { CLASS_COLOR_PALETTE } from '../../../classPalette.js'
import ControlTooltip from '../../ui/ControlTooltip.jsx'

export default function ClassColorControl({ color, entityNoun, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <ControlTooltip label={`Choose ${entityNoun} color`}>
        <Popover.Trigger asChild>
          <button type="button" aria-label={`Choose ${entityNoun} color`}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
            <span className="h-3.5 w-3.5 rounded-full border border-base-content/20" style={{ backgroundColor: color }} />
          </button>
        </Popover.Trigger>
      </ControlTooltip>
      <Popover.Portal>
        <Popover.Content aria-label={`${entityNoun} color`} side="bottom" align="end" sideOffset={8}
          className="z-50 w-52 rounded-lg border border-base-content/20 bg-base-100 p-3 text-base-content shadow-lg"
          onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
          <p className="mb-3 text-xs font-medium">Accent color</p>
          <div className="grid grid-cols-6 gap-2">
            {CLASS_COLOR_PALETTE.map(value => (
              <button key={value} type="button" aria-label={`Use color ${value}`} aria-pressed={color.toLowerCase() === value.toLowerCase()}
                className="h-6 w-6 rounded-full border border-base-content/20 ring-primary ring-offset-base-100 aria-pressed:ring-2 aria-pressed:ring-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                style={{ backgroundColor: value }} onClick={() => { onChange(value); setOpen(false) }} />
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
