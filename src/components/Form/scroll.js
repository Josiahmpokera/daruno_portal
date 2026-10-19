/** Smoothly scroll a form section (by element id) into view. */
export const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
