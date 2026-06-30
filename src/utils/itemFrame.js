/**
 * Per-item "frame" — an outline + fill the user can turn on for any content item
 * (text / markdown / image / question) and style independently.
 *
 * Fields live on the item (borderStyle / borderWidth / borderColor / borderRadius
 * / fillColor) so they save with the document. buildFrameStyle() turns them into
 * an inline style object applied on the item's container when it is not selected
 * (the blue selection outline takes over while selected).
 */

export const FRAME_STYLE_OPTIONS = [
    { value: 'none', label: 'ไม่มี' },
    { value: 'solid', label: 'ทึบ' },
    { value: 'dashed', label: 'ประ' },
    { value: 'dotted', label: 'จุด' },
];

export const DEFAULT_FRAME = {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderRadius: 8,
};

// Starting fill when the user first turns "สีพื้นกล่อง" on (cream, like a note box).
// Default state is NO fill — fillColor stays unset until the user enables it.
export const DEFAULT_FILL = '#fff7d6';

// Inline style for the frame (border and/or fill), or null when neither is set.
export const buildFrameStyle = (item) => {
    if (!item) return null;
    const hasBorder = item.borderStyle && item.borderStyle !== 'none';
    const hasFill = !!item.fillColor;
    if (!hasBorder && !hasFill) return null;

    const style = { borderRadius: `${item.borderRadius ?? DEFAULT_FRAME.borderRadius}px` };
    if (hasBorder) {
        style.borderStyle = item.borderStyle;
        style.borderWidth = `${item.borderWidth ?? DEFAULT_FRAME.borderWidth}px`;
        style.borderColor = item.borderColor || DEFAULT_FRAME.borderColor;
    }
    if (hasFill) style.backgroundColor = item.fillColor;
    return style;
};
