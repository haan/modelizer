import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { dialogStyles } from './dialogStyles.js'

const CATEGORIES = [
  ['hiddenNotes', 'notes', 'notes'],
  ['hiddenAreas', 'areas', 'areas'],
  ['hiddenCompositions', 'compositions', 'composite aggregations'],
  ['hiddenAnnotations', 'annotations', 'annotations'],
]

export default function ModelContentDialog({ report, enabled, onDismiss, onReveal, visible = true }) {
  const categories = CATEGORIES.filter(([key]) => report?.[key])
  const pending = categories.filter(([, setting]) => !enabled[setting])
  const resolved = categories.length > 0 && pending.length === 0

  useEffect(() => {
    // Forget this file-opening report once resolved; later settings changes
    // must not revive it, even when a different view is active.
    if (resolved) onDismiss()
  }, [resolved, onDismiss])

  const needsComposition = pending.some(([, setting]) => setting === 'compositions')
  const content = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
    .format(pending.filter(([, setting]) => setting !== 'compositions').map(([, , label]) => label))

  return (
    <Dialog.Root open={visible && pending.length > 0} onOpenChange={open => { if (!open) onDismiss() }}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogStyles.overlay} data-no-export="true" />
        <Dialog.Content data-no-export="true"
          className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-base-content/20 bg-base-100 p-6 text-base-content shadow-xl">
          <Dialog.Title className="text-base font-semibold">{needsComposition && !content ? 'Enable composite aggregation?' : 'Show hidden content?'}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-base-content/75">
            {content && <>This model contains {content} hidden by your display settings. </>}
            {needsComposition && 'Composite aggregation is disabled. Enabling it will show the composite aggregations in this model and allow you to create them.'}
          </Dialog.Description>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Dialog.Close className={`${dialogStyles.cancel} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-base-100`}>
              {needsComposition ? (content ? 'Keep current settings' : 'Keep disabled') : 'Keep hidden'}
            </Dialog.Close>
            <button type="button" className={`${dialogStyles.action} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-base-100`}
              onClick={() => {
                pending.forEach(([, setting]) => onReveal(setting))
                onDismiss()
              }}>
              {needsComposition ? (content ? 'Enable and show all' : 'Enable composite aggregation') : 'Show all'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
