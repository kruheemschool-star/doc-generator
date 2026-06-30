/**
 * Per-item "frame" (border) — a box outline the user can turn on for any content
 * item (text / markdown / image / question) and style independently.
 *
 * The fields live on the item itself (borderStyle / borderWidth / borderColor /
 * borderRadius) so they save with the document. buildFrameStyle() turns them into
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

// Returns an inline style object for the frame, or null when no frame is set.
export const buildFrameStyle = (item) => {
    if (!item || !item.borderStyle || item.borderStyle === 'none') return null;
    return {
        borderStyle: item.borderStyle,
        borderWidth: `${item.borderWidth ?? DEFAULT_FRAME.borderWidth}px`,
        borderColor: item.borderColor || DEFAULT_FRAME.borderColor,
        borderRadius: `${item.borderRadius ?? DEFAULT_FRAME.borderRadius}px`,
    };
};
