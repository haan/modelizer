import { Handle } from 'reactflow'

const HANDLE_BASE_CLASS =
  'opacity-0 transition-opacity rounded-full w-4 h-4 border-2 border-base-100 bg-primary'
const HANDLE_SOURCE_CLASS = `${HANDLE_BASE_CLASS} group-hover/node:opacity-100 group-[.is-connecting]/flow:opacity-0 group-[.is-connecting]/flow:pointer-events-none`
const HANDLE_TARGET_CLASS = `${HANDLE_BASE_CLASS} pointer-events-none group-[.is-connecting]/flow:pointer-events-auto group-[.is-connecting]/flow:opacity-100`

export default function ClassHandle({
  className,
  id,
  position,
  type,
}) {
  const connectableProps =
    type === 'source'
      ? { isConnectableEnd: false }
      : { isConnectableStart: false }
  const handleClass =
    type === 'source' ? HANDLE_SOURCE_CLASS : HANDLE_TARGET_CLASS
  const finalClassName = className ? `${handleClass} ${className}` : handleClass

  return (
    <Handle
      className={finalClassName}
      id={id}
      type={type}
      position={position}
      {...connectableProps}
    />
  )
}
