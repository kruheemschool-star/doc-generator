import React, { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, MoveVertical, ChevronUp, ChevronDown, Check, X, Edit, Minus } from 'lucide-react';

const DividerItem = memo(({ id, index, style = 'solid', thickness = 2, color = '#e5e7eb', onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown, isViewOnly }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempStyle, setTempStyle] = useState(style);
    const [tempThickness, setTempThickness] = useState(thickness);
    const [tempColor, setTempColor] = useState(color);

    const handleSave = () => {
        onUpdate(id, { style: tempStyle, thickness: tempThickness, color: tempColor });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempStyle(style);
        setTempThickness(thickness);
        setTempColor(color);
        setIsEditing(false);
    };

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-1 transition-all flex items-center justify-center min-h-[40px] px-4 py-2 ${snapshot.isDragging ? 'z-50 opacity-90' : ''
                        } ${isEditing ? 'z-20' : ''}`}
                    onClick={(e) => {
                        if (isViewOnly) return;
                        e.stopPropagation();
                        // Only trigger select if not already editing
                        if (!isEditing) onSelect && onSelect(id);
                    }}
                    onDoubleClick={() => { if (!isViewOnly) setIsEditing(true); }}
                >
                    {/* Hover Controls (Only when not editing) */}
                    {!isEditing && !isViewOnly && (
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

                    <div
                        className={`w-full rounded-lg border-2 transition-all relative flex flex-col items-center justify-center ${isEditing
                            ? 'bg-white border-blue-400 shadow-md ring-4 ring-blue-50/50 py-3 px-4'
                            : isSelected
                                ? 'bg-blue-50/10 border-blue-400 ring-2 ring-blue-50'
                                : 'bg-transparent border-transparent hover:border-gray-200 hover:bg-gray-50/50'
                            }`}
                    >
                        {isEditing ? (
                            <div className="w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Minus size={14} /> ปรับแต่งเส้นคั่น</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-medium tracking-wide">รูปแบบเส้น</label>
                                        <select
                                            value={tempStyle}
                                            onChange={(e) => setTempStyle(e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 font-sans"
                                        >
                                            <option value="solid">เส้นทึบ (Solid)</option>
                                            <option value="dashed">เส้นประแคบ (Dashed)</option>
                                            <option value="dotted">เส้นประจุด (Dotted)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-medium tracking-wide">ความหนา (px)</label>
                                        <input
                                            type="number"
                                            value={tempThickness}
                                            onChange={(e) => setTempThickness(Number(e.target.value))}
                                            min="1"
                                            max="20"
                                            className="w-full border border-gray-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-sm font-sans"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-medium tracking-wide">สี</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={tempColor}
                                                onChange={(e) => setTempColor(e.target.value)}
                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <input
                                                type="text"
                                                value={tempColor}
                                                onChange={(e) => setTempColor(e.target.value)}
                                                className="flex-1 w-full border border-gray-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-sm font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                                        className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition text-sm flex items-center gap-1"
                                    >
                                        <X size={14} />
                                        <span>ยกเลิก</span>
                                    </button>
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-700 transition text-sm flex items-center gap-1 font-medium"
                                    >
                                        <Check size={14} />
                                        <span>บันทึก</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full py-2">
                                <div
                                    style={{
                                        borderTopStyle: style,
                                        borderTopWidth: `${thickness}px`,
                                        borderTopColor: color,
                                    }}
                                    className="w-full transition-all"
                                />
                            </div>
                        )}

                        {/* Edit Button Overlay */}
                        {!isEditing && !isViewOnly && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                    className="bg-white/95 backdrop-blur border border-gray-200 shadow-sm rounded-lg px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5"
                                >
                                    <Edit size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default DividerItem;
