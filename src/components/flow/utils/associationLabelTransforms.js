export function getEndpointLabelTransform(position, x, y) {
  const offset = 0

  switch (position) {
    case 'left':
      return `translate(-100%, 0%) translate(${x - offset}px, ${y + 1}px)`
    case 'right':
      return `translate(0%, 0%) translate(${x + offset}px, ${y + 1}px)`
    case 'top':
      return `translate(0%, -100%) translate(${x + 1}px, ${y - offset}px)`
    case 'bottom':
      return `translate(0%, 0%) translate(${x + 1}px, ${y + offset}px)`
    default:
      return `translate(-50%, -50%) translate(${x}px, ${y}px)`
  }
}

export function getRoleLabelTransform(position, x, y) {
  const offset = 0

  switch (position) {
    case 'left':
      return `translate(-100%, -100%) translate(${x - offset}px, ${y - 1}px)`
    case 'right':
      return `translate(0%, -100%) translate(${x + offset}px, ${y - 1}px)`
    case 'top':
      return `translate(-100%, -100%) translate(${x - 1}px, ${y - offset}px)`
    case 'bottom':
      return `translate(-100%, 0%) translate(${x - 1}px, ${y + offset}px)`
    default:
      return `translate(-50%, -50%) translate(${x}px, ${y}px)`
  }
}
