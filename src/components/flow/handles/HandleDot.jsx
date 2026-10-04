// SVG avoids seams in rounded CSS borders inside a zoomed React Flow viewport.
export default function HandleDot({ color }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="pointer-events-none block h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill={`rgb(var(--color-${color}))`}
        stroke="rgb(var(--color-base-100))"
        strokeWidth="2"
      />
    </svg>
  )
}
