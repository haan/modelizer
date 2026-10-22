import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { exportFlowPng } from '../../model/pngExport.jsx'
import { getPngExportNodes } from '../../model/pngExportUtils.js'
import { sanitizeFileName } from '../../model/fileUtils.js'
import { AREA_NODE_TYPE, NOTE_NODE_TYPE } from '../../model/constants.js'
import { dialogStyles } from './dialogStyles.js'

const MARGINS = { small: 32, medium: 64, large: 96 }
const INPUT_CLASS = 'mt-1 w-full min-w-0 rounded-md border border-base-content/20 bg-base-100 px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

function Toggle({ label, checked, onChange }) {
  return <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" />
    {label}
  </label>
}

export default function PngExportDialog({ source, onClose, onAccentColorsChange }) {
  const hasAnnotations = Boolean(source.annotations?.[source.activeView]?.items?.length)
  const hasNotes = source.nodes.some((node) => node.type === NOTE_NODE_TYPE && !node.hidden)
  const hasAreas = source.nodes.some((node) => node.type === AREA_NODE_TYPE && !node.hidden)
  const [options, setOptions] = useState(() => ({
    ...source.defaults,
    includeAnnotations: hasAnnotations && source.defaults.includeAnnotations,
    resolution: 'standard', background: 'white', margin: 'medium',
  }))
  const [fileName, setFileName] = useState(source.fileName)
  const [attempt, setAttempt] = useState(0)
  const [preview, setPreview] = useState(null)
  const [imageSize, setImageSize] = useState(null)
  const ready = preview?.options === options && preview?.attempt === attempt
  const loading = !ready
  const change = (key, value) => setOptions((current) => ({ ...current, [key]: value }))
  const downloadName = sanitizeFileName(fileName.trim().replace(/\.png$/i, ''))
  const viewLabel = source.activeView[0].toUpperCase() + source.activeView.slice(1)
  const exportArgs = useMemo(() => {
    const nodes = getPngExportNodes(source.nodes, options)
    const ids = new Set(nodes.map((node) => node.id))
    return {
      ...source,
      nodes,
      edges: source.edges.filter((edge) => !edge.hidden && ids.has(edge.source) && ids.has(edge.target))
        .map((edge) => ({ ...edge, selected: false })),
      showAnnotations: options.includeAnnotations,
      currentStroke: null,
      includeAccentColorsInExport: options.includeAccentColors,
      background: options.background,
      resolution: options.resolution,
      padding: MARGINS[options.margin],
    }
  }, [source, options])

  useEffect(() => {
    let cancelled = false
    exportFlowPng(exportArgs).then(
      (url) => { if (!cancelled) setPreview({ options, attempt, url, imageOptions: options }) },
      (error) => { if (!cancelled) setPreview((previous) => ({ options, attempt, url: previous?.url, imageOptions: previous?.imageOptions, error: error?.message || 'Please try again.' })) },
    )
    return () => { cancelled = true }
  }, [exportArgs, options, attempt])

  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className={dialogStyles.overlay} />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[min(760px,92dvh)] w-[min(1040px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-base-content/20 bg-base-100 text-base-content shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-base-content/10 px-5 py-4">
          <div>
          <Dialog.Title className="text-lg font-semibold">Export PNG</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-base-content/70">{viewLabel} view</Dialog.Description>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-auto p-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:grid-rows-[minmax(0,1fr)] sm:overflow-hidden">
          <div className="flex h-[320px] min-w-0 flex-col sm:h-full sm:min-h-0">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-base-content/15 bg-base-200">
              <div className="relative min-h-0 flex-1" aria-busy={loading}>
              <div role="region" aria-label="Image preview" className="absolute inset-3 overflow-hidden">
              <div className="flex h-full w-full items-center justify-center">
              {!preview?.url && loading && <svg aria-hidden="true" width="56" height="64" viewBox="0 0 56 64" fill="none" className="text-base-content/15">
                <path d="M12 3h22l12 12v44a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
                <path d="M34 3v12h12M19 29h18M19 38h18M19 47h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>}
              {preview?.url && <img src={preview.url} alt="PNG export preview"
                className="m-auto block max-h-full max-w-full object-contain shadow-sm"
                onLoad={(event) => {
                  const image = event.currentTarget
                  setImageSize({ url: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight })
                }}
                style={{
                  ...(preview.imageOptions.background === 'transparent' ? {
                  backgroundColor: '#ffffff',
                  backgroundImage: 'conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0)',
                  backgroundSize: '16px 16px',
                } : { backgroundColor: '#ffffff' }),
                }} />}
              </div>
              </div>
              {ready && preview.error && <div className="absolute inset-3 flex items-center justify-center">
                <div role="alert" className="max-w-sm rounded-lg border border-base-content/15 bg-base-100 p-4 text-sm shadow-md">
                  <p className="font-medium">Could not export the PNG.</p>
                  <p className="mt-1 break-words text-base-content/70">{preview.error}</p>
                  <button type="button" className={dialogStyles.cancel + ' mt-3'} onClick={() => setAttempt((current) => current + 1)}>Try again</button>
                </div>
              </div>}
              </div>
            </div>
          </div>
          <div className="min-h-0 min-w-0 space-y-3 sm:overflow-y-auto sm:pr-2 sm:[scrollbar-gutter:stable]">
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">Content &amp; appearance</legend>
              {hasAnnotations && <Toggle label="Include annotations" checked={options.includeAnnotations} onChange={(value) => change('includeAnnotations', value)} />}
              {hasNotes && <Toggle label="Include notes" checked={options.includeNotes} onChange={(value) => change('includeNotes', value)} />}
              {hasAreas && <Toggle label="Include areas" checked={options.includeAreas} onChange={(value) => change('includeAreas', value)} />}
              <Toggle label="Accent colors" checked={options.includeAccentColors} onChange={(value) => { change('includeAccentColors', value); onAccentColorsChange?.(value) }} />
            </fieldset>
            <label className="block text-sm font-medium">Resolution
              <select className={INPUT_CLASS} value={options.resolution} onChange={(event) => change('resolution', event.target.value)}>
                <option value="standard">Standard (1×)</option><option value="high">High (2×)</option>
              </select>
            </label>
            <details className="border-t border-base-content/10 pt-3">
              <summary className="cursor-pointer text-sm font-medium">More options</summary>
              <div className="mt-3 space-y-2.5">
                <label className="block text-sm">Background
                  <select className={INPUT_CLASS} value={options.background} onChange={(event) => change('background', event.target.value)}>
                    <option value="white">White</option><option value="transparent">Transparent</option>
                  </select>
                </label>
                <label className="block text-sm">Margin
                  <select className={INPUT_CLASS} value={options.margin} onChange={(event) => change('margin', event.target.value)}>
                    <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
                  </select>
                </label>
                <label className="block text-sm">Filename
                  <input className={INPUT_CLASS} value={fileName} onChange={(event) => setFileName(event.target.value)} spellCheck={false} />
                </label>
              </div>
            </details>
            {options.includeAnnotations && <p className="text-xs leading-relaxed text-base-content/60">Check pale annotations against the background.</p>}
            {options.background === 'transparent' && <p className="text-xs leading-relaxed text-base-content/60">Checkerboard indicates transparency; it won’t be exported.</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-base-content/10 px-5 py-4">
          <div className="min-w-0 flex-1">
            {loading && <div role="status" aria-atomic="true" className="flex items-center gap-2 text-xs text-base-content/60">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{preview?.url ? 'Updating preview…' : 'Preparing preview…'}</span>
            </div>}
            {ready && !preview.error && imageSize?.url === preview.url && imageSize.width > 0 && imageSize.height > 0 &&
              <p className="text-xs tabular-nums text-base-content/60">{imageSize.width} × {imageSize.height} px</p>}
          </div>
          <Dialog.Close className={dialogStyles.cancel}>Close</Dialog.Close>
          {ready && preview.url && !preview.error && downloadName
            ? <a href={preview.url} download={downloadName + '.png'} className={dialogStyles.action}>Download PNG</a>
            : <button type="button" disabled className={dialogStyles.action + ' opacity-40'}>Download PNG</button>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
