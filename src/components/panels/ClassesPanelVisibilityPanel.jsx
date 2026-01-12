export default function ClassesPanelVisibilityPanel({
  accentColor,
  showAccentColors = true,
}) {
  const accentBorderColor = showAccentColors ? accentColor : 'transparent'
  return (
    <div className="w-full">
      <div
        className="border-l-[6px] px-2 py-2 text-xs"
        style={{ borderColor: accentBorderColor }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
          Visibility
        </div>
        <div className="mt-1 text-xs opacity-70">All views</div>
      </div>
    </div>
  )
}
