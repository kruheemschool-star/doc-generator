import React, { memo, useState, useEffect, useLayoutEffect, useCallback, useRef, useId } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Check, Edit, X, ChevronUp, ChevronDown, Eye, EyeOff, Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Sigma, Link2, Sticker } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ErrorBoundary from './ErrorBoundary';
import IconLibraryModal from './IconLibraryModal';
import { SIZE_TO_PX } from '../data/documentFonts';
import { splitSolution } from '../utils/solutionMarkers';

// Safe wrapper: a bad Markdown string renders a compact inline error instead of
// crashing the whole item. Reuses the shared ErrorBoundary.
const markdownFallback = (
    <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
        ⚠️ ไม่สามารถแสดงผลเนื้อหาได้ ลองแก้ไข Markdown อีกครั้ง
    </div>
);
const SafeMarkdownPreview = ({ content, baseFontPx, plainBlockquote }) => (
    <ErrorBoundary fallback={markdownFallback}>
        <MarkdownRenderer content={content} baseFontPx={baseFontPx} plainBlockquote={plainBlockquote} />
    </ErrorBoundary>
);

const MarkdownItem = memo(({ id, index, content, size = 'medium', fontScale, showSolution = true, onDelete, onUpdate, onMove, isSelected, onSelect, isExplicitEditing, onEditStart, onEditEnd, canMoveUp, canMoveDown, isViewOnly, frameStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(content || '');
    const [showPreview, setShowPreview] = useState(true);
    const [showIconLibrary, setShowIconLibrary] = useState(false);
    const textAreaRef = useRef(null);
    const textareaId = useId();
    const answerRef = useRef(null);
    const [answerHeight, setAnswerHeight] = useState(0);

    // Measure the solution block while it's shown so that, once hidden, we can
    // leave an equal amount of blank writing space (student version keeps layout).
    useLayoutEffect(() => {
        if (showSolution && answerRef.current) {
            setAnswerHeight(answerRef.current.offsetHeight);
        }
    }, [showSolution, content, text]);

    const EDUCATION_ICONS = [
        '📚', '📖', '✏️', '📝', '📐', '📏', '🎒', '🎓', '💡', '🧠',
        '🔢', '✖️', '➗', '🧩', '🏫', '🖍️', '🖌️', '🔍', '🔬', '🧪',
        '⭐', '🌟', '🔥', '✅', '❌', '❓', '❗', '💯', '🏆', '🥇',
        '🚨', '⚠️', '😉', '🐷'
    ];

    const handleInsertIcon = (icon) => {
        const textarea = textAreaRef.current;
        if (!textarea) {
            setText(prev => prev + icon);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.substring(0, start) + icon + text.substring(end);

        setText(newText);

        // Restore focus and cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + icon.length, start + icon.length);
        }, 0);
    };

    // Word-like formatting buttons — apply markdown to the current textarea selection.
    const applyFormat = (type) => {
        const ta = textAreaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const sel = text.slice(start, end);
        let next = text, selStart = start, selEnd = end;

        // Toggle a wrapping mark (bold/italic/math): add it, or remove it if the
        // selection is already wrapped — so clicking again turns the format OFF.
        const wrap = (mark, placeholder) => {
            const ml = mark.length;
            // markers sit just OUTSIDE the selection → strip them
            if (start >= ml && text.slice(start - ml, start) === mark && text.slice(end, end + ml) === mark) {
                next = text.slice(0, start - ml) + sel + text.slice(end + ml);
                selStart = start - ml; selEnd = end - ml;
                return;
            }
            // markers are INSIDE the selection → strip them
            if (sel.length >= 2 * ml && sel.startsWith(mark) && sel.endsWith(mark)) {
                const inner = sel.slice(ml, sel.length - ml);
                next = text.slice(0, start) + inner + text.slice(end);
                selStart = start; selEnd = start + inner.length;
                return;
            }
            const inner = sel || placeholder;
            next = text.slice(0, start) + mark + inner + mark + text.slice(end);
            selStart = start + ml; selEnd = selStart + inner.length;
        };
        // Toggle a line prefix (heading/list/quote): remove if present, switch from
        // an alternate (e.g. H2↔H3, bullet↔numbered), else add.
        const linePrefix = (prefix, alts = []) => {
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            const rest = text.slice(lineStart);
            if (rest.startsWith(prefix)) {
                next = text.slice(0, lineStart) + rest.slice(prefix.length);
                selStart = selEnd = Math.max(lineStart, start - prefix.length);
                return;
            }
            for (const alt of alts) {
                if (rest.startsWith(alt)) {
                    next = text.slice(0, lineStart) + prefix + rest.slice(alt.length);
                    selStart = selEnd = start + (prefix.length - alt.length);
                    return;
                }
            }
            next = text.slice(0, lineStart) + prefix + text.slice(lineStart);
            selStart = selEnd = start + prefix.length;
        };

        switch (type) {
            case 'bold': wrap('**', 'ข้อความ'); break;
            case 'italic': wrap('*', 'ข้อความ'); break;
            case 'imath': wrap('$', 'x'); break;
            case 'bmath': wrap('$$', 'x = y'); break;
            case 'h2': linePrefix('## ', ['### ', '# ']); break;
            case 'h3': linePrefix('### ', ['## ', '# ']); break;
            case 'ul': linePrefix('- ', ['1. ']); break;
            case 'ol': linePrefix('1. ', ['- ']); break;
            case 'quote': linePrefix('> '); break;
            case 'link': {
                const label = sel || 'ข้อความ';
                next = text.slice(0, start) + '[' + label + '](https://)' + text.slice(end);
                selStart = start + 1; selEnd = selStart + label.length;
                break;
            }
            default: return;
        }
        setText(next);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(selStart, selEnd); }, 0);
    };

    const FORMAT_BUTTONS = [
        { type: 'bold', icon: Bold, title: 'ตัวหนา' },
        { type: 'italic', icon: Italic, title: 'ตัวเอียง' },
        { type: 'h2', icon: Heading2, title: 'หัวข้อใหญ่' },
        { type: 'h3', icon: Heading3, title: 'หัวข้อรอง' },
        { type: 'ul', icon: List, title: 'รายการจุด' },
        { type: 'ol', icon: ListOrdered, title: 'รายการตัวเลข' },
        { type: 'quote', icon: Quote, title: 'กล่องคำพูด/โน้ต' },
        { type: 'imath', icon: Sigma, title: 'สมการในบรรทัด' },
        { type: 'link', icon: Link2, title: 'ลิงก์' },
    ];

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

    // Open the editor AND tell the parent (so pagination pauses and the item
    // can't be reflowed onto another page mid-edit, which would remount it).
    const beginEdit = () => {
        if (isViewOnly || isEditing) return;
        if (onEditStart) onEditStart(id);
        setIsEditing(true);
    };

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

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly || isEditing}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-1 transition-all ${snapshot.isDragging ? 'z-50 opacity-90' : ''
                        } ${isEditing ? 'z-20' : ''}`}
                    onClick={(e) => {
                        if (isViewOnly) return;
                        e.stopPropagation();
                        // Only trigger select if not already editing
                        if (!isEditing) onSelect && onSelect(id);
                    }}
                >
                    {/* Hover Controls — drag handle stays mounted (dnd needs it); move buttons hide while editing */}
                    {!isViewOnly && (
                        <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto print:hidden">
                            <div
                                {...provided.dragHandleProps}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab"
                                title="Drag to reorder"
                            >
                                <GripVertical size={16} />
                            </div>
                            {!isEditing && canMoveUp && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, 'up'); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="Move up"
                                >
                                    <ChevronUp size={16} />
                                </button>
                            )}
                            {!isEditing && canMoveDown && (
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
                        style={!isEditing && frameStyle ? frameStyle : undefined}
                        onDoubleClick={beginEdit}
                    >
                        {isEditing ? (
                            <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor={textareaId} className="text-xs font-bold text-gray-500 uppercase">
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
                                    <div className="flex flex-col gap-2">
                                        {/* Formatting toolbar — Word-like buttons that apply to the selection */}
                                        <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                                            {FORMAT_BUTTONS.map(b => {
                                                const Icon = b.icon;
                                                return (
                                                    <button
                                                        key={b.type}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={(e) => { e.stopPropagation(); applyFormat(b.type); }}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-md transition-all"
                                                        title={b.title}
                                                    >
                                                        <Icon size={16} />
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={(e) => { e.stopPropagation(); applyFormat('bmath'); }}
                                                className="h-8 px-2 flex items-center justify-center text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-md transition-all font-mono text-xs font-bold"
                                                title="สมการแยกบรรทัด"
                                            >
                                                $$
                                            </button>
                                        </div>
                                        {/* Icon Toolbar */}
                                        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 shadow-inner max-h-[100px] overflow-y-auto custom-scrollbar">
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={(e) => { e.stopPropagation(); setShowIconLibrary(true); }}
                                                className="h-7 px-2 flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded transition-all"
                                                title="แทรกไอคอนของฉันจากคลัง"
                                            >
                                                <Sticker size={13} /> จากคลังไอคอน
                                            </button>
                                            {EDUCATION_ICONS.map((icon, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); handleInsertIcon(icon); }}
                                                    className="w-7 h-7 flex items-center justify-center text-lg hover:bg-white hover:scale-110 hover:shadow-sm rounded transition-all cursor-pointer select-none"
                                                    title="แทรกไอคอน"
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            ref={textAreaRef}
                                            id={textareaId}
                                            className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="พิมพ์เนื้อหา Markdown ที่นี่..."
                                            autoFocus
                                        />
                                    </div>
                                    {showPreview && (
                                        <div className="border border-gray-200 rounded-lg p-3 overflow-auto min-h-[200px] bg-gray-50/50">
                                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">ตัวอย่าง</div>
                                            <SafeMarkdownPreview content={text} />
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
                            const { problem, solution } = splitSolution(text);
                            // Effective base size: per-item slider wins, else map from size, else 16
                            const baseFontPx = typeof fontScale === 'number' ? fontScale : (SIZE_TO_PX[size] || 16);
                            const hasProblem = !!(problem && problem.trim());
                            const isEmpty = !hasProblem && !solution;
                            return (
                                <div className="prose max-w-none">
                                    {hasProblem && (
                                        <SafeMarkdownPreview content={problem} baseFontPx={baseFontPx} />
                                    )}
                                    {/* Empty box: friendly hint on screen only — never leaks into print. */}
                                    {isEmpty && (
                                        <p className="text-gray-400 italic text-sm m-0 print:hidden">คลิก “แก้ไข” เพื่อเพิ่มเนื้อหา…</p>
                                    )}
                                    {solution && (
                                        <div className="relative transition-all">
                                            {showSolution ? (
                                                // Tinted "เฉลย" block (matches QuestionItem) so the teacher can see
                                                // exactly what the ซ่อนเฉลย toggle will hide for the student copy.
                                                <div
                                                    ref={answerRef}
                                                    className="mt-3 rounded-lg border px-3 py-2 print:rounded-none print:border-y-0 print:border-r-0 print:border-l-2 print:pl-3"
                                                    style={{ backgroundColor: '#eaf0dd80', borderColor: '#3d5a2c33' }}
                                                >
                                                    <div className="text-[10px] font-bold uppercase tracking-wide mb-1 print:hidden" style={{ color: '#3d5a2c' }}>เฉลย</div>
                                                    <SafeMarkdownPreview content={solution} baseFontPx={baseFontPx} plainBlockquote />
                                                </div>
                                            ) : (
                                                // Hidden: leave equal blank space so students have room to solve.
                                                <div style={{ minHeight: answerHeight > 0 ? answerHeight : undefined }} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Edit Button Overlay */}
                        {!isEditing && !isViewOnly && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <button
                                    onClick={(e) => { e.stopPropagation(); beginEdit(); }}
                                    className="bg-white/95 backdrop-blur border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5"
                                >
                                    <Edit size={12} />
                                    <span>แก้ไข</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <IconLibraryModal
                        isOpen={showIconLibrary}
                        onClose={() => setShowIconLibrary(false)}
                        onSelect={(iconSrc) => { handleInsertIcon(`![](${iconSrc})`); setShowIconLibrary(false); }}
                    />
                </div>
            )}
        </Draggable>
    );
});

export default MarkdownItem;
