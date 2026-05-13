import { useRef, useState } from 'react'
import { Panel } from 'reactflow'
import * as Tooltip from '@radix-ui/react-tooltip'
import { CirclePicker } from 'react-color'

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#000000',
  '#ffffff',
]

const TOOLTIP_CLASS =
  'rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg'

function ToolTip({ label, children, side = 'left' }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side={side} sideOffset={8} className={TOOLTIP_CLASS}>
          {label}
          <Tooltip.Arrow className="fill-base-100" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function ToolButton({ label, active, disabled, onClick, children }) {
  return (
    <ToolTip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-content/20 disabled:cursor-not-allowed disabled:opacity-40 ${
          active
            ? 'bg-primary text-primary-content shadow-sm'
            : 'text-base-content hover:bg-base-300'
        }`}
      >
        {children}
      </button>
    </ToolTip>
  )
}

function ColorPresetRow({ color, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)

  const isCustom = !PRESET_COLORS.includes(color)

  return (
    <div className="relative flex flex-wrap gap-1 p-1">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
            color === c ? 'ring-2 ring-primary ring-offset-1' : 'border-base-content/20'
          }`}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className={`h-5 w-5 rounded-full border border-base-content/30 transition-transform hover:scale-110 ${
          isCustom ? 'ring-2 ring-primary ring-offset-1' : ''
        }`}
        style={{
          background:
            'conic-gradient(red, orange, yellow, green, blue, violet, red)',
        }}
        aria-label="Custom color"
      />
      {pickerOpen && (
        <div
          className="absolute right-0 top-8 z-50 rounded-lg border border-base-content/20 bg-base-100 p-2 shadow-xl"
          ref={pickerRef}
        >
          <button
            type="button"
            className="fixed inset-0 z-[-1]"
            tabIndex={-1}
            onClick={() => setPickerOpen(false)}
            aria-label="Close color picker"
          />
          <CirclePicker
            color={color}
            onChange={(c) => {
              onChange(c.hex)
              setPickerOpen(false)
            }}
            circleSize={20}
            circleSpacing={6}
            width="148px"
          />
        </div>
      )}
    </div>
  )
}

function Slider({ label, min, max, step = 1, value, onChange }) {
  return (
    <div className="flex flex-col gap-0.5 px-1 pb-1">
      <div className="flex items-center justify-between text-[10px] text-base-content/60">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}

function SubPanel({ children }) {
  return (
    <div className="mt-1 w-40 rounded-md border border-base-content/10 bg-base-100 shadow-md">
      {children}
    </div>
  )
}

// Bootstrap Icons
const PointerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52z"/>
  </svg>
)

const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
  </svg>
)

const MarkerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M11.096.644a2 2 0 0 1 2.791.036l1.433 1.433a2 2 0 0 1 .035 2.791l-.413.435-8.07 8.995a.5.5 0 0 1-.372.166h-3a.5.5 0 0 1-.234-.058l-.412.412A.5.5 0 0 1 2.5 15h-2a.5.5 0 0 1-.354-.854l1.412-1.412A.5.5 0 0 1 1.5 12.5v-3a.5.5 0 0 1 .166-.372l8.995-8.07zm-.115 1.47L2.727 9.52l3.753 3.753 7.406-8.254zm3.585 2.17.064-.068a1 1 0 0 0-.017-1.396L13.18 1.387a1 1 0 0 0-1.396-.018l-.068.065zM5.293 13.5 2.5 10.707v1.586L3.707 13.5z"/>
  </svg>
)

const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z"/>
  </svg>
)

const EraserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
  </svg>
)

export default function AnnotationToolbox({
  activeTool,
  onSetTool,
  penSettings,
  onPenSettingsChange,
  markerSettings,
  onMarkerSettingsChange,
  textSettings,
  onTextSettingsChange,
  eraserSettings,
  onEraserSettingsChange,
  onClearView,
}) {
  const [clearArmed, setClearArmed] = useState(false)
  const clearTimerRef = useRef(null)

  const handleClear = () => {
    if (clearArmed) {
      clearTimeout(clearTimerRef.current)
      setClearArmed(false)
      onClearView()
    } else {
      setClearArmed(true)
      clearTimerRef.current = setTimeout(() => setClearArmed(false), 2000)
    }
  }

  return (
    <Panel
      position="top-right"
      style={{ zIndex: 20 }}
      className="m-2 flex flex-col gap-0.5 rounded-lg border border-base-content/10 bg-base-100 p-1 shadow-lg"
    >
      <Tooltip.Provider delayDuration={100}>
        <ToolButton
          label="Pointer (interact with diagram)"
          active={activeTool === 'pointer'}
          onClick={() => onSetTool('pointer')}
        >
          <PointerIcon />
        </ToolButton>

        <div className="my-0.5 h-px bg-base-content/10" />

        <ToolButton
          label="Pen"
          active={activeTool === 'pen'}
          onClick={() => onSetTool('pen')}
        >
          <PenIcon />
        </ToolButton>
        {activeTool === 'pen' && (
          <SubPanel>
            <ColorPresetRow
              color={penSettings.color}
              onChange={(c) => onPenSettingsChange({ color: c })}
            />
            <Slider
              label="Thickness"
              min={1}
              max={10}
              value={penSettings.thickness}
              onChange={(v) => onPenSettingsChange({ thickness: v })}
            />
          </SubPanel>
        )}

        <ToolButton
          label="Marker"
          active={activeTool === 'marker'}
          onClick={() => onSetTool('marker')}
        >
          <MarkerIcon />
        </ToolButton>
        {activeTool === 'marker' && (
          <SubPanel>
            <ColorPresetRow
              color={markerSettings.color}
              onChange={(c) => onMarkerSettingsChange({ color: c })}
            />
            <Slider
              label="Thickness"
              min={8}
              max={40}
              value={markerSettings.thickness}
              onChange={(v) => onMarkerSettingsChange({ thickness: v })}
            />
            <Slider
              label="Opacity"
              min={10}
              max={80}
              value={Math.round(markerSettings.opacity * 100)}
              onChange={(v) => onMarkerSettingsChange({ opacity: v / 100 })}
            />
          </SubPanel>
        )}

        <ToolButton
          label="Text"
          active={activeTool === 'text'}
          onClick={() => onSetTool('text')}
        >
          <TextIcon />
        </ToolButton>
        {activeTool === 'text' && (
          <SubPanel>
            <ColorPresetRow
              color={textSettings.color}
              onChange={(c) => onTextSettingsChange({ color: c })}
            />
            <Slider
              label="Font size"
              min={10}
              max={32}
              value={textSettings.fontSize}
              onChange={(v) => onTextSettingsChange({ fontSize: v })}
            />
          </SubPanel>
        )}

        <ToolButton
          label="Eraser"
          active={activeTool === 'eraser'}
          onClick={() => onSetTool('eraser')}
        >
          <EraserIcon />
        </ToolButton>
        {activeTool === 'eraser' && (
          <SubPanel>
            <Slider
              label="Size"
              min={10}
              max={60}
              value={eraserSettings.size}
              onChange={(v) => onEraserSettingsChange({ size: v })}
            />
            <div className="flex gap-1 px-1 pb-1">
              <button
                type="button"
                onClick={() => onEraserSettingsChange({ mode: 'whole' })}
                className={`flex-1 rounded px-1 py-0.5 text-[10px] transition-colors ${
                  eraserSettings.mode === 'whole'
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-200 text-base-content hover:bg-base-300'
                }`}
              >
                Whole
              </button>
              <button
                type="button"
                onClick={() => onEraserSettingsChange({ mode: 'partial' })}
                className={`flex-1 rounded px-1 py-0.5 text-[10px] transition-colors ${
                  eraserSettings.mode === 'partial'
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-200 text-base-content hover:bg-base-300'
                }`}
              >
                Partial
              </button>
            </div>
          </SubPanel>
        )}

        <div className="my-0.5 h-px bg-base-content/10" />

        <ToolTip label={clearArmed ? 'Click again to confirm' : 'Clear all annotations in this view'}>
          <button
            type="button"
            onClick={handleClear}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-content/20 ${
              clearArmed
                ? 'bg-error text-error-content'
                : 'text-base-content hover:bg-base-300'
            }`}
          >
            <TrashIcon />
          </button>
        </ToolTip>
      </Tooltip.Provider>
    </Panel>
  )
}
