import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { DIALOG_COPY } from '../../model/dialogCopy.js'
import { dialogStyles } from './dialogStyles.js'

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  kind,
}) {
  const { title, description } =
    DIALOG_COPY.delete[kind] ?? DIALOG_COPY.delete.fallback

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
            >
              Delete
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
