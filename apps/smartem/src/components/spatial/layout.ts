// Shared layout constants for the side-by-side spatial panes (atlas + grid-square panel).

// Both panes share this footer height so their control bars line up exactly, mirroring the matched
// header bars - together the two panes read as one symmetric split. The grid-square panel's footer
// (metric selector row + toggles/legend row) is the taller of the two and sets the floor; the atlas
// footer, a single row, pads up to it and centres its content.
export const SPATIAL_FOOTER_MIN_HEIGHT = 60
