import React, { memo, useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, ChevronUp, ChevronDown, Edit, Check, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ErrorBoundary from './ErrorBoundary';

// A single block holding two independent Markdown columns (left / right). It is ONE
// draggable item so the A4 auto-pagination measures it as one block (height = the
// taller column). Each side is edited as its own textarea and rendered as Markdown.
const markdownFallback = (
    <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
        ⚠️ แสดงผลเนื้อหาไม่ได้ ลองแก้ไขอีกครั้ง
    </div>
);
const SafeColumn = ({ content }) => (
    <ErrorBoundary fallback={markdownFallback}>
        <MarkdownRenderer content={content} />
    </ErrorBoundary>
);

const TEXTAREA_CLASS = 'w-full min-h-[150px] p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y';

const ColumnsItem = memo(({ id, index, left, right, onUpdate, onDelete, onMove, isSelected, onSelect, isExplicitEditing, onEditEnd, canMoveUp, canMoveDown, isViewOnly, frameStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [leftText, setLeftText] = useState(left || '');
    const [rightText, setRightText] = useState(right || '');

    useEffect(() => { setLeftText(left || ''); }, [left]);
    useEffect(() => { setRightText(right || ''); }, [right]);
    useEffect(() => { if (isExplicitEditing) setIsEditing(true); }, [isExplicitEditing]);

    const handleSave = () => {
        onUpdate(id, { left: leftText, right: rightText });
        setIsEditing(false);
        if (onEditEnd) onEditEnd();
    };
    const handleCancel = () => {
        setLeftText(left || '');
        setRightText(right || '');
        setIsEditing(false);
        if (onEditEnd) onEditEnd();
    };

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly || isEditing}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-1 transition-all ${snapshot.isDragging ? 'z-50 opacity-90' : ''} ${isEditing ? 'z-20' : ''}`}
                    onClick={(e) => { if (isViewOnly) return; e.stopPropagation(); if (!isEditing) onSelect && onSelect(id); }}
                >
                    {!isViewOnly && (
                        <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto print:hidden">
                            <div {...provided.dragHandleProps} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab" title="Drag to reorder">
                                <GripVertical size={16} />
                            </div>
                            {!isEditing && canMoveUp && (
                                <button onClick={(e) => { e.stopPropagation(); onMove(id, 'up'); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Move up">
                                    <ChevronUp size={16} />
                                </button>
                            )}
                            {!isEditing && canMoveDown && (
                                <button onClick={(e) => { e.stopPropagation(); onMove(id, 'down'); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Move down">
                                    <ChevronDown size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    <div
                        className={`min-h-[60px] rounded-lg border-2 transition-all relative ${isEditing
                            ? 'bg-white border-blue-400 shadow-md ring-4 ring-blue-50/50 py-3 px-4'
                            : isSelected
                                ? 'bg-blue-50/10 border-blue-400 ring-2 ring-blue-50 py-3 px-4'
                                : 'bg-transparent border-transparent hover:border-gray-200 hover:bg-gray-50/50 py-3 px-4'
                            }`}
                        style={!isEditing && !isSelected && frameStyle ? frameStyle : undefined}
                        onDoubleClick={() => !isViewOnly && !isEditing && setIsEditing(true)}
                    >
                        {isEditing ? (
                            <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">แก้ไข 2 คอลัมน์ (Markdown)</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 mb-1">คอลัมน์ซ้าย</div>
                                        <textarea className={TEXTAREA_CLASS} value={leftText} onChange={(e) => setLeftText(e.target.value)} placeholder="เนื้อหาฝั่งซ้าย..." autoFocus />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 mb-1">คอลัมน์ขวา</div>
                                        <textarea className={TEXTAREA_CLASS} value={rightText} onChange={(e) => setRightText(e.target.value)} placeholder="เนื้อหาฝั่งขวา..." />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-3 gap-2">
                                    <button onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition text-sm flex items-center gap-1">
                                        <X size={14} /><span>ยกเลิก</span>
                                    </button>
                                    <button onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); handleSave(); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-700 transition text-sm flex items-center gap-1 font-medium">
                                        <Check size={14} /><span>บันทึก</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-6 prose max-w-none">
                                <div><SafeColumn content={leftText || '> *คอลัมน์ซ้าย*'} /></div>
                                <div><SafeColumn content={rightText || '> *คอลัมน์ขวา*'} /></div>
                            </div>
                        )}

                        {!isEditing && !isViewOnly && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="bg-white/95 backdrop-blur border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5">
                                    <Edit size={12} /><span>แก้ไข</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default ColumnsItem;
