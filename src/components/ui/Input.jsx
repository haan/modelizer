import { forwardRef } from 'react'

const baseClass =
  'w-full rounded-md border border-base-content/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring'
const sizes = {
  xs: 'h-6 px-1 py-0.5 text-xs',
  sm: 'h-7 px-2 py-1 text-sm',
  md: 'h-8 px-3 py-2 text-sm',
}

const Input = forwardRef(function Input(
  { className, size = 'sm', ...props },
  ref,
) {
  const sizeClass = sizes[size] ?? sizes.sm
  const classes = [baseClass, sizeClass, className]
    .filter(Boolean)
    .join(' ')

  return <input ref={ref} className={classes} {...props} />
})

export default Input
