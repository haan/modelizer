import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'

const baseClass =
  'flex h-4 w-4 items-center justify-center rounded border border-base-content/30 bg-base-100 text-base-content shadow-sm focus:outline-none focus:ring-1 focus:ring-ring data-[state=checked]:border-base-content/70'

export default function CheckboxInput({
  checked,
  onCheckedChange,
  className,
  ...props
}) {
  const classes = [baseClass, className].filter(Boolean).join(' ')

  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={classes}
      {...props}
    >
      <Checkbox.Indicator>
        <CheckIcon className="h-3 w-3" />
      </Checkbox.Indicator>
    </Checkbox.Root>
  )
}
