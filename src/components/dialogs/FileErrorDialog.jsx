import * as Dialog from '@radix-ui/react-dialog'
import { dialogStyles } from './dialogStyles.js'

export default function FileErrorDialog({ error, onOpenChange }) {
  const unsupported = error.code === 'UNSUPPORTED_MODEL_VERSION'
  const newer = unsupported && typeof error.fileVersion === 'number' && error.fileVersion > error.supportedVersion
  return <Dialog.Root open={error.open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className={dialogStyles.overlay} />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-base-content/20 bg-base-100 p-6 text-base-content shadow-xl">
        <Dialog.Title className="text-base font-semibold">{newer ? 'Newer Modelizer required' : unsupported ? 'Unsupported model format' : 'Could not open model'}</Dialog.Title>
        <Dialog.Description className="mt-3 break-words text-sm leading-relaxed text-base-content/75">
          {unsupported
            ? `This file uses model format ${String(error.fileVersion)}. This version of Modelizer supports formats 1 and ${error.supportedVersion}.`
            : error.message}
        </Dialog.Description>
        {unsupported && <p className="mt-3 text-sm leading-relaxed text-base-content/75">Open the file in the latest Modelizer online, or update your downloaded copy and try again.</p>}
        <p className="mt-3 text-xs text-base-content/60">The selected file has not been changed.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Dialog.Close className={dialogStyles.cancel}>Close</Dialog.Close>
          {unsupported && <a className={dialogStyles.action} href="https://www.modelizer.lu/" target="_blank" rel="noreferrer">Open latest Modelizer</a>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
