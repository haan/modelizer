export default function EndpointConnector({ directional = false, composition = false }) {
  return (
    <svg viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.25"
      className="h-3.5 w-4 shrink-0 opacity-70" aria-hidden="true">
      {composition ? <>
        <path d="M9 8h10" />
        <polygon points="1,8 5,4 9,8 5,12" fill="currentColor" strokeLinejoin="round" />
      </> : directional ? (
        <path d="M2 8h16m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : <>
        <circle cx="3" cy="8" r="2" />
        <path d="M5 8h10" />
        <circle cx="17" cy="8" r="2" />
      </>}
    </svg>
  )
}
