import { Slot } from '@radix-ui/react-slot'

const baseClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
const variants = {
  ghost: 'bg-transparent text-base-content hover:bg-base-200',
  primary: 'bg-primary text-primary-content hover:bg-primary/90',
}
const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4',
}

export default function Button({
  asChild = false,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}) {
  const Comp = asChild ? Slot : 'button'
  const classes = [
    baseClass,
    variants[variant] ?? variants.ghost,
    sizes[size] ?? sizes.md,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <Comp className={classes} {...props} />
}
