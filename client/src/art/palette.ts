/**
 * The house palette. Warm and flat: coral, salmon, pink and peach, tan wood,
 * mustard, a lime green for anything that grows, and periwinkle and denim as the
 * only cool notes. Walls stay close to white so the furniture carries the colour.
 *
 * Outlines are not listed here: the pen derives them from the fill (see
 * outlineFor in sketch.ts), so brown wood gets a brown line and a coral curtain
 * a deep red one. INK is kept for the structure of the house itself.
 */
export const C = {
  /* wood */
  oak: '#EDCB94',
  oakDark: '#DDA968',
  walnut: '#C48D61',
  walnutDark: '#9A6642',
  pine: '#F6E0B5',

  /* neutrals */
  white: '#FFFDF8',
  cream: '#FCEFD9',
  steel: '#E1E3EE',
  steelDark: '#A3A9C2',
  charcoal: '#5A4B5E',
  night: '#3B3043',

  /* colour */
  coral: '#E9635C',
  salmon: '#F48E84',
  pink: '#F7AEBB',
  blush: '#FBD5D8',
  peach: '#F6BD9B',
  rose: '#DC7F98',
  mustard: '#F4C45F',
  peri: '#B3BEE8',
  denim: '#7486C2',
  leaf: '#93CB55',
  leafDark: '#5F9E3B',
  red: '#DD4F4C',

  /* things */
  paper: '#FFFDF6',
  paperPink: '#FFE8E4',
  cork: '#E6B981',
  card: '#E5BD88',
  cardDark: '#D1A06A',
  lamp: '#FFDB7A',
  cavity: '#7A5443',
  soil: '#8A6247',
  screen: '#CFE0F5',
  glass: 'var(--glass)',
} as const;

/** Beams, outer walls and the slabs between floors. */
export const FRAME = '#9A6642';
export const FRAME_DARK = '#7D5034';

/** Spines on a shelf, clothes on a rail, jars in a pantry. */
export const BOOKS: string[] = [C.coral, C.denim, C.peri, C.mustard, C.rose, C.leaf, C.walnut, C.cream, C.pink, C.salmon, C.peach];
