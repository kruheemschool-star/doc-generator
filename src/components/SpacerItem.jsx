import React, { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, MoveVertical, ChevronUp, ChevronDown, PenTool, NotebookPen } from 'lucide-react';
import { Resizable } from 're-resizable';

// Grid/line colour is a hardcoded stroke (not `color`), so it survives both the
// print stylesheet's `background-image: none !important` (it's real SVG, not a
// CSS background) and the black-and-white print toggle (which only forces text
// `color`, not `stroke`) — the faint pattern keeps printing exactly like real paper.
const PAPER_LINE_COLOR = '#9fb3c8';

// Header-bar colours match LESSON_BOX_TYPES' palette (src/data/pageTemplates.js)
// so a scratch/notes box reads as part of the same design language as the
// ```box:TYPE markdown cards, even though this is its own component.
const PAPER_STYLES = {
    scratch: { headerBar: '#64748b', title: 'พื้นที่ทดเลข', subtitle: 'Scratch work', Icon: PenTool },
    lined: { headerBar: '#15803d', title: 'จดบันทึกเพิ่มเติม', subtitle: 'My notes', Icon: NotebookPen },
};

const ScratchGrid = ({ patternId }) => (
    <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
    >
        <defs>
            <pattern id={patternId} width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M 22 0 L 0 0 0 22" fill="none" stroke={PAPER_LINE_COLOR} strokeWidth="1" opacity="0.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
);

const LinedPaper = ({ patternId }) => (
    <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
    >
        <defs>
            <pattern id={patternId} width="100%" height="32" patternUnits="userSpaceOnUse">
                <line x1="0" y1="31.5" x2="100%" y2="31.5" stroke={PAPER_LINE_COLOR} strokeWidth="1" opacity="0.6" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
);

// Solid-colour title bar shared by scratch/lined paper — same visual language
// (and same print-safety trick, see .lesson-box-bar-text in index.css) as the
// ```box:TYPE lesson cards in MarkdownRenderer.jsx.
const PaperHeader = ({ title, subtitle, bar, Icon }) => (
    <div
        className="lesson-box-bar-text flex items-center justify-between gap-3 px-4 py-2 text-white font-bold text-sm rounded-t-lg"
        style={{ backgroundColor: bar, '--box-print-color': bar }}
    >
        <span className="flex items-center gap-1.5"><Icon size={14} />{title}</span>
        <span className="lesson-box-bar-text text-xs font-normal opacity-90">{subtitle}</span>
    </div>
);

const SpacerItem = memo(({ id, index, height, paperStyle, onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown, isViewOnly, frameStyle }) => {
    const [currentHeight, setCurrentHeight] = useState(height || 50);
    const paper = PAPER_STYLES[paperStyle];

    const handleResizeStop = (e, direction, ref, d) => {
        const newHeight = currentHeight + d.height;
        setCurrentHeight(newHeight);
        onUpdate(id, { height: newHeight }); // Persist new height
    };

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-1 transition-all ${snapshot.isDragging ? 'z-50 opacity-90' : ''
                        }`}
                    onClick={(e) => {
                        if (isViewOnly) return;
                        e.stopPropagation();
                        onSelect && onSelect(id);
                    }}
                >
                    {/* Hover Controls */}
                    {!isViewOnly && (
                        <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-2 print:hidden">
                            <div
                                {...provided.dragHandleProps}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab"
                                title="Drag to reorder"
                            >
                                <GripVertical size={16} />
                            </div>
                            {canMoveUp && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, 'up'); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="Move up"
                                >
                                    <ChevronUp size={16} />
                                </button>
                            )}
                            {canMoveDown && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, 'down'); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="Move down"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    <Resizable
                        size={{ width: '100%', height: currentHeight }}
                        onResizeStop={handleResizeStop}
                        minHeight={paper ? 70 : 20}
                        maxHeight={800}
                        enable={{ bottom: !isViewOnly }}
                        className="relative mx-auto"
                        handleComponent={{
                            bottom: (
                                <div className="w-12 h-4 bg-gray-200 rounded-full mx-auto -mb-2 flex items-center justify-center cursor-row-resize hover:bg-blue-200">
                                    <MoveVertical size={12} className="text-gray-500" />
                                </div>
                            )
                        }}
                    >
                        <div
                            className={`relative w-full h-full rounded-lg transition-colors ${paper
                                ? `overflow-hidden border-2 flex flex-col ${isSelected ? 'border-blue-400' : ''}`
                                : `flex items-center justify-center border-2 border-dashed print:border-transparent ${isSelected
                                    ? 'border-blue-400 bg-blue-50/20'
                                    : 'border-gray-300 bg-gray-50/30 group-hover:bg-gray-50 group-hover:border-gray-400'
                                }`
                                }`}
                            style={{
                                height: '100%',
                                borderColor: paper && !isSelected ? paper.headerBar : undefined,
                                ...(!paper && !isSelected ? frameStyle : undefined),
                            }}
                        >
                            {paper ? (
                                <>
                                    <PaperHeader title={paper.title} subtitle={paper.subtitle} bar={paper.headerBar} Icon={paper.Icon} />
                                    <div className="relative flex-1 bg-white">
                                        {paperStyle === 'scratch'
                                            ? <ScratchGrid patternId={`scratch-grid-${id}`} />
                                            : <LinedPaper patternId={`lined-${id}`} />}
                                    </div>
                                </>
                            ) : (
                                <span className="text-gray-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity select-none flex items-center gap-2">
                                    <MoveVertical size={14} />
                                    พื้นที่ว่าง (Spacer)
                                </span>
                            )}
                        </div>
                    </Resizable>
                </div>
            )}
        </Draggable>
    );
});

export default SpacerItem;
