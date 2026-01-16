import { Handle } from 'reactflow'

const HANDLE_BASE_CLASS =
  'opacity-0 transition-opacity rounded-full w-4 h-4 border-2 border-base-100 bg-secondary'
const HANDLE_SOURCE_CLASS = `${HANDLE_BASE_CLASS} group-hover/node:opacity-100 group-[.is-connecting]/flow:opacity-0 group-[.is-connecting]/flow:pointer-events-none`
const HANDLE_TARGET_CLASS = `${HANDLE_BASE_CLASS} pointer-events-none group-[.is-connecting]/flow:pointer-events-auto group-[.is-connecting]/flow:opacity-100`

export default function AttributeHandle({
  className,
  id,
  isActive = true,
  position,
  style,
  type,
}) {
  const connectableProps =
    type === 'source'
      ? { isConnectableEnd: false }
      : { isConnectableStart: false }
  const handleClass =
    type === 'source' ? HANDLE_SOURCE_CLASS : HANDLE_TARGET_CLASS
  const inactiveClass = isActive ? '' : 'opacity-0 pointer-events-none'
  const finalClassName = [handleClass, inactiveClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Handle
      className={finalClassName}
      id={id}
      type={type}
      position={position}
      isConnectable={isActive}
      style={style}
      {...connectableProps}
    />
  )
}
