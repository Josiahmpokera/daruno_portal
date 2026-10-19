/**
 * Shared overlay motion for HeroUI popovers, dropdowns and drawers.
 *
 * HeroUI's defaults zoom popovers from 80% with a spring and blur the page
 * behind drawers. Both read as a "flash": the zoom pops on small menus, and
 * Chrome cannot blur smoothly while the backdrop's opacity is animating, so
 * the blur snaps in at the end. These presets use short, opacity-led motion.
 */

/** Dropdowns / select menus: quick fade with a 4px drop, no scale. */
export const POPOVER_MOTION = {
  variants: {
    exit: {
      opacity: 0,
      y: -4,
      transition: { duration: 0.08, ease: 'easeIn' },
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.12, ease: 'easeOut' },
    },
  },
}

/** Right-side sheet: slide from the edge with a short ease-out, no bounce. */
export const SHEET_MOTION = {
  variants: {
    exit: {
      x: '100%',
      opacity: 1,
      transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
    },
    enter: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.24, ease: [0, 0, 0.2, 1] },
    },
  },
}
