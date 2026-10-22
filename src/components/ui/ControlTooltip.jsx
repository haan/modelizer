import * as Tooltip from '@radix-ui/react-tooltip'

export default function ControlTooltip({ label, children }) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-50 rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg"
          >
            {label}
            <Tooltip.Arrow className="fill-base-100" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
