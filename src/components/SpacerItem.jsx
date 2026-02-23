import React, { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, MoveVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Resizable } from 're-resizable';

const SpacerItem = memo(({ id, index, height, onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown, isViewOnly }) => {
    const [currentHeight, setCurrentHeight] = useState(height || 50);

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
                        <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto print:hidden">
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
                        minHeight={20}
                        maxHeight={800}
                        enable={{ bottom: !isViewOnly }}
                        className="relative mx-auto"
                        handleComponent={{
                            bottom: (
                                <div className="w-12 h-4 bg-gray-200 rounded-full mx-auto -mb-2 flex items-center justify-center cursor-row-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-200">
                                    <MoveVertical size={12} className="text-gray-500" />
                                </div>
                            )
                        }}
                    >
                        <div
                            className={`w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center transition-colors print:border-transparent ${isSelected
                                ? 'border-blue-400 bg-blue-50/20'
                                : 'border-gray-300 bg-gray-50/30 group-hover:bg-gray-50 group-hover:border-gray-400'
                                }`}
                            style={{ height: '100%' }}
                        >
                            <span className="text-gray-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity select-none flex items-center gap-2">
                                <MoveVertical size={14} />
                                พื้นที่ว่าง (Spacer)
                            </span>
                        </div>
                    </Resizable>
                </div>
            )}
        </Draggable>
    );
});

export default SpacerItem;
