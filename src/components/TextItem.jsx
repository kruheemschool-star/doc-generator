import React, { memo, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Check, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { FONT_WHITELIST, registerQuillFonts } from '../data/documentFonts';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

// Force any target=_blank link to carry rel=noopener (prevents reverse tabnabbing).
// Registered once at module load; only acts on anchor elements opening new tabs.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

// Whitelist tags Quill produces — prevents XSS via pasted/imported HTML.
// `style` is kept because Quill stores text/background color as inline styles.
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'sub', 'sup', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
    ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title', 'target', 'rel'],
};
const sanitize = (html) => DOMPurify.sanitize(html, SANITIZE_CONFIG);

// Custom Toolbar Options
// Defined outside to prevent re-creation
const toolbarOptions = [
    [{ 'font': FONT_WHITELIST }],
    ['bold', 'italic', 'underline'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['clean']
];

const formats = [
    'font',
    'bold', 'italic', 'underline',
    'color', 'background',
    'align', 'script', 'size'
];

const TextItem = memo(({ id, index, content, size = 'medium', fontScale, onDelete, onUpdate, onMove, isSelected, onSelect, isExplicitEditing, onEditEnd, canMoveUp, canMoveDown, isViewOnly, frameStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(content || '');
    const [QuillComponent, setQuillComponent] = useState(null);
    const [quillLoading, setQuillLoading] = useState(false);
    const quillRef = useRef(null);
    // Guards against setState after unmount if the dynamic import resolves late
    // (e.g. the item is deleted while react-quill is still loading).
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    // Memoize modules using named hook
    const modules = useMemo(() => ({
        toolbar: toolbarOptions
    }), []);

    // Dynamic import ReactQuill only when entering edit mode
    const loadQuill = useCallback(async () => {
        if (QuillComponent) return;
        setQuillLoading(true);
        try {
            const mod = await import('react-quill');
            // Register document fonts so the per-selection font dropdown works
            registerQuillFonts(mod.default.Quill);
            if (mountedRef.current) setQuillComponent(() => mod.default);
        } catch (err) {
            console.error('Failed to load ReactQuill:', err);
        } finally {
            if (mountedRef.current) setQuillLoading(false);
        }
    }, [QuillComponent]);

    // Sync with external edit trigger
    useEffect(() => {
        if (isExplicitEditing) {
            setIsEditing(true);
            loadQuill();
        }
    }, [isExplicitEditing, loadQuill]);

    const handleSave = () => {
        // Read HTML straight from the Quill DOM. react-quill's onChange value can
        // drop inline color/background styles on the controlled round-trip, so the
        // editor's root.innerHTML is the source of truth for what the user sees.
        let html = text;
        try {
            const editor = quillRef.current?.getEditor?.();
            if (editor) html = editor.root.innerHTML;
        } catch (e) {
            console.warn('Could not read Quill editor HTML, falling back to state', e);
        }
        setText(html);
        onUpdate(id, html);
        setIsEditing(false);
        if (onEditEnd) onEditEnd();
    };

    // Check if text contains LaTeX delimiters
    const hasLatex = (str) => {
        if (!str) return false;
        return str.includes('$') || str.includes('\\(') || str.includes('\\[');
    };

    const getSizeClass = () => {
        switch (size) {
            case 'small': return 'prose-sm';
            case 'large': return 'prose-lg';
            case 'xl': return 'prose-xl';
            case 'full': return 'prose-xl'; // Legacy support
            case 'medium': default: return 'prose-base';
        }
    };

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly}>
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
                        className={`min-h-[60px] rounded-lg border-2 transition-all relative ${isEditing
                            ? 'bg-white border-blue-400 shadow-md ring-4 ring-blue-50/50 p-2'
                            : isSelected
                                ? 'bg-blue-50/10 border-blue-400 ring-2 ring-blue-50 p-4'
                                : 'bg-transparent border-transparent hover:border-gray-200 hover:bg-gray-50/50 p-4'
                            }`}
                        style={!isEditing && !isSelected && frameStyle ? frameStyle : undefined}
                        onDoubleClick={() => { if (!isViewOnly) { setIsEditing(true); loadQuill(); } }}
                    >
                        {isEditing ? (
                            <div className="w-full">
                                {QuillComponent ? (
                                    <QuillComponent
                                        ref={quillRef}
                                        theme="snow"
                                        value={text}
                                        onChange={setText}
                                        modules={modules}
                                        formats={formats}
                                        className="bg-white"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                                        <Loader2 size={18} className="animate-spin" />
                                        <span className="text-sm">กำลังโหลดตัวแก้ไข...</span>
                                    </div>
                                )}
                                <div className="flex justify-end mt-2 gap-2">
                                    <button
                                        onMouseDown={(e) => e.preventDefault()} // Prevent blur
                                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                                        className="bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm hover:bg-blue-700 transition text-sm flex items-center gap-1"
                                    >
                                        <Check size={14} />
                                        <span>บันทึก</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 pointer-events-none">
                                <div
                                    className={`prose max-w-none text-gray-800 whitespace-pre-wrap cursor-text ql-editor p-0 ${getSizeClass()}`}
                                    style={typeof fontScale === 'number' ? { fontSize: `${fontScale}px`, lineHeight: 1.2 } : undefined}
                                    dangerouslySetInnerHTML={{ __html: text ? sanitize(text) : '<span class="text-gray-400 italic">คลิกเพื่อเพิ่มข้อความ...</span>' }}
                                />
                                {/* LaTeX Preview Rendering */}
                                {hasLatex(text) && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600 bg-gray-50/50 p-2 rounded">
                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Math Preview</div>
                                        <Latex>{(text || '').replace(/<[^>]+>/g, '')}</Latex>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default TextItem;
