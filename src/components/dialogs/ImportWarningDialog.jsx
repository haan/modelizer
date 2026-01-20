import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { DIALOG_COPY } from '../../model/dialogCopy.js'
import { dialogStyles } from './dialogStyles.js'

export function ImportWarningDialog({ open, onOpenChange, count }) {
  const { title, description } = DIALOG_COPY.importWarnings
  const safeCount = typeof count === 'number' ? count : 0

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={dialogStyles.overlay} />
        <AlertDialog.Content className={dialogStyles.content}>
          <AlertDialog.Title className={dialogStyles.title}>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className={dialogStyles.description}>
            {description(safeCount)}
          </AlertDialog.Description>
          <div className={dialogStyles.actions}>
            <AlertDialog.Action
              className={dialogStyles.action}
              onClick={() => onOpenChange?.(false)}
              autoFocus
            >
              OK
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
