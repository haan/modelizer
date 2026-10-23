import { useId, useLayoutEffect, useRef } from 'react'
import { observeAssociationLabelMask } from './associationLabelMask.js'

export default function AssociationLabelMask() {
  const id = `association-label-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const svgRef = useRef(null)
  const maskRef = useRef(null)

  useLayoutEffect(() => observeAssociationLabelMask(svgRef.current, maskRef.current, id), [id])

  return <svg ref={svgRef} data-association-label-mask="true" aria-hidden="true"
    width="0" height="0" className="pointer-events-none absolute">
    <defs><mask ref={maskRef} id={id} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"
      style={{ maskType: 'luminance' }} /></defs>
  </svg>
}
