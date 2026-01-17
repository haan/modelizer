import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { DIALOG_COPY } from '../../model/dialogCopy.js'
import { dialogStyles } from './dialogStyles.js'

export function ConfirmDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) {
  const { title, description } = DIALOG_COPY.discardChanges

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={dialogStyles.overlay} />
        <AlertDialog.Content className={dialogStyles.content}>
          <AlertDialog.Title className={dialogStyles.title}>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className={dialogStyles.description}>
            {description}
          </AlertDialog.Description>
          <div className={dialogStyles.actions}>
            <AlertDialog.Cancel
              className={dialogStyles.cancel}
              onClick={onCancel}
            >
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={dialogStyles.action}
              onClick={onConfirm}
              autoFocus
            >
              Discard
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
