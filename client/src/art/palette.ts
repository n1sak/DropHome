/**
 * The house palette. Warm, flat and pale: coral, salmon, pink and peach, tan wood,
 * mustard, a lime green for anything that grows, and periwinkle and denim as the
 * only cool notes. Walls stay close to white so the furniture carries the colour.
 *
 * Outlines are not listed here: the pen derives them from the fill (see
 * outlineFor in sketch.ts), so brown wood gets a brown line and a coral curtain
 * a deep red one. INK is kept for the structure of the house itself.
 */
export const C = {
  /* wood */
  oak: '#F1D6AA',
  oakDark: '#E5BC88',
  walnut: '#D2A47F',
  walnutDark: '#B18463',
  pine: '#F8E6C3',

  /* neutrals */
  white: '#FFFDF8',
  cream: '#FCEFD9',
  steel: '#E8EAF3',
  steelDark: '#B4B9CE',
  charcoal: '#7A6C7E',
  night: '#57495E',

  /* colour */
  coral: '#EE8A82',
  salmon: '#F6A69C',
  pink: '#F9C2CB',
  blush: '#FCE1E2',
  peach: '#F8CDB2',
  rose: '#E59CAE',
  mustard: '#F6D48A',
  peri: '#C7CFEE',
  denim: '#97A5D2',
  leaf: '#AED581',
  leafDark: '#7FB35A',
  red: '#E5736F',

  /* things */
  paper: '#FFFDF6',
  paperPink: '#FFE8E4',
  cork: '#EDC99B',
  card: '#EBCBA0',
  cardDark: '#DDB688',
  lamp: '#FFE39A',
  cavity: '#9A7562',
  soil: '#8A6247',
  screen: '#DCE8F7',
  glass: 'var(--glass)',
} as const;

/** Beams, outer walls and the slabs between floors. */
export const FRAME = '#B58A66';
export const FRAME_DARK = '#9A7150';

/** Spines on a shelf. Kept short on purpose: a shelf in a few colours reads as a shelf, a shelf in eleven reads as noise. */
export const BOOKS: string[] = [C.coral, C.peri, C.mustard, C.pink, C.cream, C.leaf];
