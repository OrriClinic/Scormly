// Class names shared by the editor canvas and the learner preview for block
// styling. The SCORM player (public/scorm-player) builds the same class names
// and attributes, and player.css mirrors the rules from index.css.

import type { BlockBackground, BlockSettings, ImageSize, TextAlign } from '../types/course'

/** Backgrounds with light text on a dark/saturated fill. */
export const DARK_BACKGROUNDS: readonly BlockBackground[] = ['accent', 'gradient', 'dark']

export const BLOCK_BACKGROUNDS: readonly BlockBackground[] = [
  'none',
  'muted',
  'soft',
  'accent',
  'gradient',
  'dark',
]

/**
 * Wrapper attributes for a block: `blk` + padding class, plus `data-bg` when
 * the block has a background (neighbours with the same background are joined
 * into one panel by CSS).
 */
export function blockWrapperProps(settings: BlockSettings | undefined): {
  className: string
  'data-bg'?: BlockBackground
} {
  const bg = settings?.background ?? 'none'
  const pad = settings?.spacing ?? 'normal'
  let className = `blk blk-pad-${pad}`
  if (settings?.width === 'full') className += ' blk-full'
  if (bg === 'none') return { className }
  className += ' blk-has-bg'
  if (DARK_BACKGROUNDS.includes(bg)) className += ' blk-on-dark'
  return { className, 'data-bg': bg }
}

/** Classes for a sized image figure. */
export function imageFigureClass(size: ImageSize = 'large', align: TextAlign = 'center') {
  return `sc-img sc-img-${size}${size === 'small' || size === 'medium' ? ` sc-img-${align}` : ''}`
}
