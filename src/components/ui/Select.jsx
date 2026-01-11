import * as Select from '@radix-ui/react-select'

const triggerBase =
  'flex w-full items-center justify-between whitespace-nowrap rounded-md border border-base-content/20 bg-transparent px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
const contentBase =
  'z-50 min-w-[8rem] overflow-hidden rounded-md border border-base-content/20 bg-base-100 shadow-lg'
const itemBase =
  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none data-[highlighted]:bg-base-200 data-[highlighted]:text-base-content data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

export default function SelectField({
  value,
  onValueChange,
  items,
  placeholder,
  disabled,
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className={triggerBase}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="ml-2 h-3.5 w-3.5 opacity-60">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={contentBase} position="popper">
          <Select.Viewport className="p-1">
            {items.map((item) => (
              <Select.Item
                key={item.value || 'undefined'}
                value={item.value}
                className={itemBase}
              >
                <Select.ItemText>{item.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
