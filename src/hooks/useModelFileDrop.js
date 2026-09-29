import { useEffect, useRef, useState } from 'react'

const isFileDrag = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files') ||
  event.dataTransfer?.files?.length > 0

export function useModelFileDrop({ onOpenModelFile, onFileError, disabled = false }) {
  const [isFileOver, setIsFileOver] = useState(false)
  const depth = useRef(0)
  useEffect(() => {
    const blocked = () => disabled || Boolean(document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [aria-modal="true"]',
    ))
    const reset = () => { depth.current = 0; setIsFileOver(false) }
    const enter = (event) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      depth.current += 1
      if (!blocked()) setIsFileOver(true)
    }
    const over = (event) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = blocked() ? 'none' : 'copy'
      if (blocked()) reset()
    }
    const leave = (event) => {
      if (!isFileDrag(event)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) reset()
    }
    const drop = (event) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      reset()
      if (blocked()) return
      const files = Array.from(event.dataTransfer.files ?? [])
      const folders = Array.from(event.dataTransfer.items ?? []).some(
        (item) => item.webkitGetAsEntry?.()?.isDirectory,
      )
      if (folders || files.length !== 1 || !/\.mdlz$/i.test(files[0].name)) {
        onFileError('Drop exactly one .mdlz file. Folders and other file types are not supported.')
        return
      }
      const item = Array.from(event.dataTransfer.items ?? []).find((entry) => entry.kind === 'file')
      if (typeof item?.getAsFileSystemHandle === 'function') {
        try {
          // Capture during the drop event; browsers clear the drag data after it returns.
          const handle = Promise.resolve(item.getAsFileSystemHandle()).catch(() => null)
          onOpenModelFile(files[0], handle)
          return
        } catch {
          // Reading the File still works when acquiring a persistent handle does not.
        }
      }
      onOpenModelFile(files[0])
    }
    const handlers = { dragenter: enter, dragover: over, dragleave: leave, drop, blur: reset }
    for (const [name, handler] of Object.entries(handlers)) window.addEventListener(name, handler, true)
    return () => {
      for (const [name, handler] of Object.entries(handlers)) window.removeEventListener(name, handler, true)
    }
  }, [disabled, onFileError, onOpenModelFile])
  return isFileOver && !disabled
}
