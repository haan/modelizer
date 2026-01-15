export const dialogStyles = {
  overlay: 'fixed inset-0 z-40 bg-black/40',
  content:
    'fixed left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-xl',
  title: 'text-sm font-semibold',
  description: 'mt-2 text-xs text-base-content/70',
  actions: 'mt-4 flex justify-end gap-2',
  cancel:
    'inline-flex h-8 items-center justify-center rounded-md border border-base-content/20 px-3 text-xs font-medium transition-colors hover:bg-base-200 focus:outline-none',
  action:
    'inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-content transition-colors hover:bg-primary/90 focus:outline-none',
}
