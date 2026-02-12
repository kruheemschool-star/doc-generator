import React, { memo, useState, useEffect, useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Check, Edit, X, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

// Safe wrapper to prevent MarkdownRenderer crash from taking down the whole component
class SafeMarkdownPreview extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.error('MarkdownRenderer error:', error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
                    ⚠️ ไม่สามารถแสดงผลเนื้อหาได้ ลองแก้ไข Markdown อีกครั้ง
                </div>
            );
        }
        return <MarkdownRenderer content={this.props.content} />;
    }
}

const splitAnswerContent = (content) => {
    if (!content) return { mainContent: content, answerContent: null };
    const lines = content.split('\n');
    const answerIdx = lines.findIndex(line => /^\s*\d+\.\s*\*{0,2}ตอบ/.test(line) || /^\s*\*{0,2}ตอบ/.test(line));
    if (answerIdx === -1) return { mainContent: content, answerContent: null };
    return {
        mainContent: lines.slice(0, answerIdx).join('\n'),
        answerContent: lines.slice(answerIdx).join('\n')
    };
};

const MarkdownItem = memo(({ id, index, content, size = 'medium', showSolution = true, onDelete, onUpdate, onMove, isSelected, onSelect, isExplicitEditing, onEditEnd, canMoveUp, canMoveDown }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(content || '');
    const [showPreview, setShowPreview] = useState(false);

    // Sync with external content updates (Crucial for Import)
    useEffect(() => {
        setText(content || '');
    }, [content]);

    // Sync with external edit trigger
    useEffect(() => {
        if (isExplicitEditing) {
            setIsEditing(true);
        }
    }, [isExplicitEditing]);

    const handleSave = () => {
        onUpdate(id, text);
        setIsEditing(false);
        if (onEditEnd) onEditEnd();
    };

    const handleCancel = () => {
        setText(content || '');
        setIsEditing(false);
        if (onEditEnd) onEditEnd();
    };

    const getSizeClass = () => {
        switch (size) {
            case 'small': return 'text-sm';
            case 'large': return 'text-lg';
            case 'xl': return 'text-xl';
            case 'medium': default: return 'text-base';
        }
    };

    return (
        <Draggable draggableId={id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-2 transition-all ${snapshot.isDragging ? 'z-50 opacity-90' : ''
                        } ${isEditing ? 'z-20' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Only trigger select if not already editing
                        if (!isEditing) onSelect && onSelect(id);
                    }}
                >
                    {/* Hover Controls (Only when not editing) */}
                    {!isEditing && (
                        <div className="absolute right-full top-0 h-full w-10 hidden group-hover:flex flex-col gap-1 items-center pt-2 print:hidden">
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
                        className={`min-h-[60px] rounded-lg border-2 transition-all relative ${isEditing
                            ? 'bg-white border-blue-400 shadow-md ring-4 ring-blue-50/50 py-3 px-4'
                            : isSelected
                                ? 'bg-blue-50/10 border-blue-400 ring-2 ring-blue-50 py-3 px-4'
                                : 'bg-transparent border-transparent hover:border-gray-200 hover:bg-gray-50/50 py-3 px-4'
                            }`}
                        onDoubleClick={() => !isEditing && setIsEditing(true)}
                    >
                        {isEditing ? (
                            <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        แก้ไข Markdown
                                    </label>
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => { e.stopPropagation(); setShowPreview(!showPreview); }}
                                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-all ${showPreview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        <Eye size={12} />
                                        <span>ดูตัวอย่าง</span>
                                    </button>
                                </div>
                                <div className={showPreview ? 'grid grid-cols-2 gap-3' : ''}>
                                    <textarea
                                        className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="พิมพ์เนื้อหา Markdown ที่นี่..."
                                        autoFocus
                                    />
                                    {showPreview && (
                                        <div className="border border-gray-200 rounded-lg p-3 overflow-auto min-h-[200px] bg-gray-50/50">
                                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">ตัวอย่าง</div>
                                            <SafeMarkdownPreview content={text} getSizeClass={getSizeClass} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end mt-3 gap-2">
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
                        ) : (() => {
                            const { mainContent, answerContent } = splitAnswerContent(text);
                            return (
                                <div className={`prose max-w-none ${getSizeClass()}`}>
                                    <SafeMarkdownPreview content={mainContent || '> *Empty Markdown Content*'} getSizeClass={getSizeClass} />
                                    {answerContent && (
                                        <div className={`relative transition-all ${showSolution ? '' : 'mt-2'}`}>
                                            {showSolution ? (
                                                <SafeMarkdownPreview content={answerContent} getSizeClass={getSizeClass} />
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">
                                                    <EyeOff size={14} />
                                                    <span>เฉลยถูกซ่อนอยู่</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Edit Button Overlay */}
                        {!isEditing && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                    className="bg-white/95 backdrop-blur border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5"
                                >
                                    <Edit size={12} />
                                    <span>แก้ไข</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default MarkdownItem;
