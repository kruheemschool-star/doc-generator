/**
 * Per-document design theme ("Tweaks").
 *
 * The document body (sheet + MarkdownRenderer + page header) reads its colors,
 * fonts and paper grid from CSS custom properties. This module is the single
 * source of truth for the default values and for turning a saved theme object
 * into the inline `--doc-*` variables applied on the editor's zoom-container.
 *
 * Live editing works without re-rendering the document: the Tweaks panel just
 * updates the theme object → new CSS variables cascade → the sheet repaints.
 */
import { getFontStack } from './documentFonts';

export const DEFAULT_DOC_THEME = {
    headFontId: 'itim',     // heading font (document headings + brand name)
    accent: '#0f766e',      // primary/brand — h1 rule, h3 dot, links, header divider
    heading: '#0b5a54',     // h1/h2 text
    subhead: '#3a5ba0',     // h3 sub-heading text
    highlight: '#ffe27a',   // marker-pen highlight under h2
    paper: '#ffffff',       // sheet background
    gridOn: false,          // notebook grid on/off
    gridAlpha: 0.07,        // grid line opacity (0–0.2)
    gridSize: 26,           // grid cell size in px
    headerRule: 'single',   // page-header divider: 'single' or 'double' (Editorial)
};

// Selectable presets shown at the top of the Tweaks panel. Picking one applies the
// whole theme object; the user can then fine-tune individual controls.
export const DOC_THEME_PRESETS = [
    {
        id: 'kruheem',
        label: 'ครูฮีม (สมุด)',
        theme: { ...DEFAULT_DOC_THEME },
    },
    {
        id: 'editorial',
        label: 'Editorial',
        theme: {
            headFontId: 'ibm-plex-thai',
            accent: '#ff4d2e',     // orange-red — question numbers, links, emphasis
            heading: '#16130f',    // ink headings
            subhead: '#3a342c',
            highlight: '#ffe0d8',  // soft coral marker
            paper: '#ffffff',
            gridOn: false,         // clean paper, no notebook grid
            gridAlpha: 0.07,
            gridSize: 26,
            headerRule: 'double',  // 3px + 1px ink rule under the running head
        },
    },
];

// Merge a possibly-partial saved theme onto the defaults so every key exists.
export const normalizeTheme = (theme) => ({ ...DEFAULT_DOC_THEME, ...(theme || {}) });

// Turn a theme object into the inline CSS custom properties the document reads.
// Returned object is spread into a React `style={{ ... }}` on an ancestor of the
// sheet and the markdown content (the zoom-container).
export const themeToCssVars = (theme) => {
    const t = normalizeTheme(theme);
    const gridColor = `rgba(74, 115, 196, ${t.gridOn ? t.gridAlpha : 0})`;
    return {
        '--doc-accent': t.accent,
        '--doc-heading': t.heading,
        '--doc-subhead': t.subhead,
        '--doc-highlight': t.highlight,
        '--doc-paper': t.paper,
        '--doc-grid-color': gridColor,
        '--doc-grid-size': `${t.gridSize}px`,
        '--doc-head-font': getFontStack(t.headFontId),
    };
};
