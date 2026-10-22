import { forwardRef, useState } from 'react'
import { Panel } from '@xyflow/react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import { dialogStyles } from '../dialogs/dialogStyles.js'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#000000', '#ffffff']
const SHAPES = ['arrow', 'line', 'rectangle', 'ellipse']
const BUTTON_CLASS = 'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base-content/75 transition-colors hover:bg-base-200 hover:text-base-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-25'

function Icon({ name }) {
  const paths = {
    pointer: <path d="m5 3 14 9-7 1-3 7z" />,
    select: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><path d="m9 8 8 5-4 1-2 4z" /></>,
    pen: <><path d="m4 16 11-11 4 4L8 20l-5 1zM13 7l4 4" /><path d="m15 5 2-2a1.5 1.5 0 0 1 2 0l2 2a1.5 1.5 0 0 1 0 2l-2 2" /></>,
    marker: <><path d="m14 3 7 7-8 8-7-7zM6 11l-2 5 4 4 5-2M4 16l-2 5h6" /><path d="m12 5 7 7" /></>,
    text: <><path d="M5 5h14M12 5v15M8 20h8M5 5v3m14-3v3" /></>,
    eraser: <><path d="m14 3 7 7-10 10H6l-4-4zM8 10l7 7M11 20h10" /></>,
    arrow: <path d="M4 20 20 4M9 4h11v11" />,
    line: <path d="m4 20 16-16" />,
    rectangle: <rect x="4" y="5" width="16" height="14" rx="2" />,
    ellipse: <ellipse cx="12" cy="12" rx="9" ry="7" />,
    laser: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" strokeDasharray="2 4" /><path d="m4 20 4-4" /></>,
    undo: <path d="m8 5-5 5 5 5M3 10h10a7 7 0 0 1 7 7v2" />,
    redo: <path d="m16 5 5 5-5 5m5-5H11a7 7 0 0 0-7 7v2" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    hidden: <><path d="m3 3 18 18M10 5c7-2 12 7 12 7a18 18 0 0 1-4 4M6 6a19 19 0 0 0-4 6s4 7 10 7a12 12 0 0 0 4-1" /></>,
    duplicate: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>,
    export: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
    settings: <><path d="M4 6h16M4 12h16M4 18h16" /><path d="M8 4v4m8 2v4m-6 2v4" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 3m0 3v.1" /></>,
  }
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Hint({ label, children }) {
  return <Tooltip.Root>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content side="left" sideOffset={10} className="z-50 rounded-md border border-base-content/10 bg-base-100 px-2.5 py-1.5 text-xs text-base-content shadow-md">
        {label}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
}

const RailButton = forwardRef(function RailButton({ label, active, children, onClick, ...props }, ref) {
  return <button {...props} ref={ref} type="button" aria-label={label} aria-pressed={active}
    className={BUTTON_CLASS + (active ? ' bg-primary/10 !text-primary ring-1 ring-inset ring-primary/20' : '')}
    onClick={(e) => { onClick?.(e); if (e.detail > 0) e.currentTarget.blur() }}>
    {children}
  </button>
})

function ToolButton({ label, hint = label, icon, ...props }) {
  return <Hint label={hint}><RailButton label={label} {...props}><Icon name={icon} /></RailButton></Hint>
}

function Separator() {
  return <div className="mx-1 my-1 h-px shrink-0 bg-base-content/10" role="separator" />
}

function FlyoutContent({ children, label }) {
  return <Popover.Portal>
    <Popover.Content side="left" align="start" sideOffset={10} collisionPadding={12} aria-label={label}
      className="z-50 w-60 rounded-xl border border-base-content/10 bg-base-100 p-3 text-base-content shadow-lg outline-none"
      style={{ maxHeight: 'var(--radix-popover-content-available-height)', overflowY: 'auto' }}>
      {children}
    </Popover.Content>
  </Popover.Portal>
}

function Slider({ label, min, max, step = 1, value, displayValue = value, onChange }) {
  return <label className="mt-3 block text-xs">
    <span className="mb-2 flex items-center justify-between"><span className="text-base-content/70">{label}</span><span className="tabular-nums">{displayValue}</span></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))} className="block w-full accent-primary" />
  </label>
}

function ColorPresetRow({ color, onChange }) {
  return <div className="grid grid-cols-5 gap-1.5" aria-label="Annotation colors">
    {COLORS.map((value) => <button key={value} type="button" aria-label={value} aria-pressed={color === value}
      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary/10 aria-pressed:ring-1 aria-pressed:ring-primary/30"
      onClick={() => onChange(value)}>
      <span className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: value }} />
    </button>)}
    <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-base-200" title="Custom color">
      <span className="h-5 w-5 rounded-full border border-black/15" style={{ background: 'conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)' }} />
      <input type="color" aria-label="Custom color" value={color} onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
    </label>
  </div>
}

function CheckOption({ label, checked, onChange }) {
  return <label className="mt-3 flex items-center justify-between gap-3 text-xs text-base-content/80">
    {label}<input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
  </label>
}

function ClearAnnotationsDialog({ open, onOpenChange, onConfirm }) {
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className={dialogStyles.overlay} />
      <AlertDialog.Content className={dialogStyles.content}>
        <AlertDialog.Title className={dialogStyles.title}>Clear annotations?</AlertDialog.Title>
        <AlertDialog.Description className={dialogStyles.description}>This removes all annotations in the current view. You can undo this action.</AlertDialog.Description>
        <div className={dialogStyles.actions}>
          <AlertDialog.Cancel className={dialogStyles.cancel}>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action className={dialogStyles.action} onClick={onConfirm}>Clear</AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
}

export default function AnnotationToolbox({
  activeTool, onSetTool, penSettings, onPenSettingsChange, markerSettings, onMarkerSettingsChange,
  textSettings, onTextSettingsChange, eraserSettings, onEraserSettingsChange, onClearView,
  selectedItem, onSelectedChange, onDeleteSelected, onDuplicateSelected,
  canUndo, canRedo, onUndo, onRedo, annotationsVisible = true, onToggleVisibility, onExportPng,
}) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [shapesOpen, setShapesOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [lastShape, setLastShape] = useState(SHAPES.includes(activeTool) ? activeTool : 'arrow')
  const isText = activeTool === 'text' || (activeTool === 'select' && selectedItem?.kind === 'text')
  const isMarker = activeTool === 'marker' || (activeTool === 'select' && selectedItem?.tool === 'marker')
  const isShape = SHAPES.includes(activeTool)
  const canStyle = isText || isMarker || activeTool === 'pen' || isShape || (activeTool === 'select' && selectedItem)
  const settings = activeTool === 'select' && selectedItem ? selectedItem : isText ? textSettings : isMarker ? markerSettings : penSettings
  const change = activeTool === 'select' && selectedItem ? onSelectedChange : isText ? onTextSettingsChange : isMarker ? onMarkerSettingsChange : onPenSettingsChange
  const optionLabel = isText ? 'Text options' : isMarker ? 'Marker options' : activeTool === 'pen' ? 'Pen options' : isShape ? 'Shape options' : 'Annotation options'
  const selectedShape = isShape ? activeTool : lastShape
  const action = (callback) => { setActionsOpen(false); callback?.() }
  const actionClass = 'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-xs hover:bg-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:pointer-events-none'

  return <Panel position="top-right" style={{ zIndex: 20, maxHeight: 'calc(100% - 72px)', overflowY: 'auto' }}
    onKeyDown={(e) => { if ([' ', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.stopPropagation() }}
    className="m-2 flex w-12 flex-col rounded-xl border border-base-content/10 bg-base-100 p-[5px] shadow-md">
    <Tooltip.Provider delayDuration={350}>
      <div className="flex flex-col gap-0.5" role="group" aria-label="Navigation and selection">
        <ToolButton label="Pointer (V)" hint="Pointer: interact with diagram (V)" icon="pointer" active={activeTool === 'pointer'} onClick={() => onSetTool('pointer')} />
        <ToolButton label="Select annotation (S)" hint="Select annotations: move and resize (S)" icon="select" active={activeTool === 'select'} onClick={() => onSetTool('select')} />
      </div>
      <Separator />
      <div className="flex flex-col gap-0.5" role="group" aria-label="Drawing tools">
        <ToolButton label="Pen (P)" icon="pen" active={activeTool === 'pen'} onClick={() => onSetTool('pen')} />
        <ToolButton label="Marker (M)" icon="marker" active={activeTool === 'marker'} onClick={() => onSetTool('marker')} />
        <ToolButton label="Text (T)" icon="text" active={activeTool === 'text'} onClick={() => onSetTool('text')} />
        <Popover.Root open={shapesOpen} onOpenChange={setShapesOpen}>
          <Hint label="Shapes">
            <Popover.Trigger asChild>
              <RailButton label="Choose shape" active={isShape}>
                <Icon name={selectedShape} /><span aria-hidden="true" className="absolute bottom-1.5 right-1.5 h-0 w-0 border-b-[4px] border-l-[4px] border-b-current border-l-transparent opacity-60" />
              </RailButton>
            </Popover.Trigger>
          </Hint>
          <FlyoutContent label="Shapes">
            <p className="mb-3 text-xs font-semibold">Shapes</p>
            <div className="grid grid-cols-2 gap-1">
              {SHAPES.map((shape) => <button key={shape} type="button" aria-label={shape[0].toUpperCase() + shape.slice(1)} aria-pressed={activeTool === shape}
                className="flex items-center gap-2 rounded-lg px-2 py-3 text-xs hover:bg-base-200 aria-pressed:bg-primary/10 aria-pressed:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => { setLastShape(shape); onSetTool(shape); setShapesOpen(false) }}>
                <Icon name={shape} />{shape[0].toUpperCase() + shape.slice(1)}
              </button>)}
            </div>
            <p className="mt-3 text-xs text-base-content/50">Hold Shift to constrain.</p>
          </FlyoutContent>
        </Popover.Root>
        <ToolButton label="Ink eraser (E)" icon="eraser" active={activeTool === 'eraser'} onClick={() => onSetTool('eraser')} />
        <ToolButton label="Laser pointer (L)" icon="laser" active={activeTool === 'laser'} onClick={() => onSetTool('laser')} />
      </div>
      <Separator />
      <div className="flex h-9 items-center justify-center">
        <Popover.Root>
          <Hint label={activeTool === 'eraser' ? 'Eraser options' : optionLabel}>
            <Popover.Trigger asChild>
              <RailButton label={activeTool === 'eraser' ? 'Eraser options' : optionLabel} disabled={!canStyle && activeTool !== 'eraser'}>
                {activeTool === 'eraser'
                  ? <span className="rounded-full border border-base-content/50 bg-base-content/10" style={{ width: Math.max(8, Math.min(20, eraserSettings.size / 3)), height: Math.max(8, Math.min(20, eraserSettings.size / 3)) }} />
                  : canStyle ? <span className="h-[18px] w-[18px] rounded-full border border-black/20" style={{ backgroundColor: settings.color }} /> : <Icon name="settings" />}
                {(canStyle || activeTool === 'eraser') && <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 h-0 w-0 border-b-[4px] border-l-[4px] border-b-current border-l-transparent opacity-60" />}
              </RailButton>
            </Popover.Trigger>
          </Hint>
          <FlyoutContent label={activeTool === 'eraser' ? 'Eraser options' : optionLabel}>
            <p className="mb-3 text-xs font-semibold">{activeTool === 'eraser' ? 'Ink eraser' : optionLabel.replace(' options', '')}</p>
            {activeTool === 'eraser' ? <>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-base-200 p-1">
                {['whole', 'partial'].map((mode) => <button key={mode} type="button" aria-pressed={eraserSettings.mode === mode}
                  className="rounded-md py-2 text-xs aria-pressed:bg-base-100 aria-pressed:shadow-sm"
                  onClick={() => onEraserSettingsChange({ mode })}>{mode === 'whole' ? 'Whole' : 'Partial'}</button>)}
              </div>
              <Slider label="Size" min={10} max={60} value={eraserSettings.size} onChange={(size) => onEraserSettingsChange({ size })} />
              <p className="mt-3 text-xs leading-relaxed text-base-content/50">Erases ink only. Select text or shapes to delete them.</p>
            </> : canStyle ? <>
              <ColorPresetRow color={settings.color} onChange={(color) => change({ color })} />
              {isText ? <>
                <Slider label="Font size" min={10} max={32} value={settings.fontSize} onChange={(fontSize) => change({ fontSize })} />
                <CheckOption label="Wrap text" checked={Boolean(settings.width)} onChange={(checked) => change({ width: checked ? 220 : undefined })} />
                {settings.width && <Slider label="Text box width" min={60} max={600} step={10} value={settings.width} displayValue={Math.trunc(settings.width)} onChange={(width) => change({ width })} />}
                <CheckOption label="Background" checked={Boolean(settings.background)} onChange={(checked) => change({ background: checked ? '#ffffff' : '', ...(checked && !settings.padding ? { padding: 6 } : {}) })} />
                {settings.background && <label className="mt-3 flex items-center justify-between text-xs">Background color<input aria-label="Text background color" type="color" value={settings.background} onChange={(e) => change({ background: e.target.value })} /></label>}
                <Slider label="Padding" min={0} max={24} value={settings.padding ?? 0} onChange={(padding) => change({ padding })} />
                <CheckOption label="Border" checked={Boolean(settings.border)} onChange={(border) => change({ border })} />
              </> : <>
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-base-200 p-1">
                  {(isMarker ? [8, 16, 28] : [2, 4, 8]).map((thickness, index) => <button key={thickness} type="button"
                    aria-label={['Thin stroke', 'Medium stroke', 'Thick stroke'][index]} aria-pressed={settings.thickness === thickness}
                    className="flex h-8 items-center justify-center rounded-md aria-pressed:bg-base-100 aria-pressed:shadow-sm"
                    onClick={() => change({ thickness })}>
                    <span className="w-6 rounded-full bg-base-content/80" style={{ height: [1, 3, 5][index] }} />
                  </button>)}
                </div>
                <Slider label="Thickness" min={isMarker ? 8 : 1} max={isMarker ? 40 : 10} value={settings.thickness} onChange={(thickness) => change({ thickness })} />
                {isMarker && <Slider label="Opacity" min={10} max={80} value={Math.round((settings.opacity ?? 0.35) * 100)} onChange={(opacity) => change({ opacity: opacity / 100 })} />}
              </>}
            </> : null}
          </FlyoutContent>
        </Popover.Root>
      </div>
      <Separator />
      <div className="flex flex-col gap-0.5" role="group" aria-label="Annotation actions">
        <ToolButton label="Undo" icon="undo" disabled={!canUndo} onClick={onUndo} />
        <ToolButton label="Redo" icon="redo" disabled={!canRedo} onClick={onRedo} />
        <ToolButton label={annotationsVisible ? 'Hide annotations' : 'Show annotations'} icon={annotationsVisible ? 'eye' : 'hidden'} active={!annotationsVisible} onClick={onToggleVisibility} />
        <Popover.Root open={actionsOpen} onOpenChange={setActionsOpen}>
          <Hint label="More annotation actions"><Popover.Trigger asChild><RailButton label="More annotation actions"><Icon name="more" /></RailButton></Popover.Trigger></Hint>
          <FlyoutContent label="Annotation actions">
            <p className="mb-2 px-2 py-1 text-xs font-semibold">Annotations</p>
            <button type="button" className={actionClass} disabled={!selectedItem} onClick={() => action(onDuplicateSelected)}><Icon name="duplicate" />Duplicate annotation</button>
            <button type="button" className={actionClass} disabled={!selectedItem} onClick={() => action(onDeleteSelected)}><Icon name="trash" />Delete annotation</button>
            <Separator />
            <button type="button" className={actionClass} onClick={() => action(onExportPng)}><Icon name="export" />Export PNG…</button>
            <button type="button" aria-label="Clear annotations in this view" className={actionClass} onClick={() => action(() => setIsClearDialogOpen(true))}><Icon name="eraser" />Clear current view…</button>
            <details className="group/shortcuts">
              <summary className={actionClass + ' cursor-pointer list-none [&::-webkit-details-marker]:hidden'}>
                <Icon name="help" />Keyboard shortcuts
                <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" className="ml-auto shrink-0 text-base-content/50 group-open/shortcuts:rotate-180">
                  <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-2 pb-2 pt-1 text-xs">
                <dt className="font-medium">Space + drag</dt><dd className="text-base-content/70">Pan</dd>
                <dt className="font-medium">Wheel</dt><dd className="text-base-content/70">Zoom</dd>
                <dt className="font-medium">Shift</dt><dd className="text-base-content/70">Constrain shapes or highlights</dd>
                <dt className="font-medium">Ctrl/Cmd + D</dt><dd className="text-base-content/70">Duplicate</dd>
                <dt className="font-medium">Delete</dt><dd className="text-base-content/70">Delete selection</dd>
              </dl>
            </details>
          </FlyoutContent>
        </Popover.Root>
      </div>
    </Tooltip.Provider>
    <ClearAnnotationsDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen} onConfirm={() => { setIsClearDialogOpen(false); onClearView() }} />
  </Panel>
}
