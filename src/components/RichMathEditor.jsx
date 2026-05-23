import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Sigma, Sparkles, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';
import Latex from 'react-latex-next';
import MarkdownRenderer from './MarkdownRenderer';
import { markdownToOps, opsToMarkdown } from '../utils/mathMarkdownSerializer';
import { formatText } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';

/**
 * RichMathEditor — WYSIWYG editor that hides LaTeX/Markdown syntax.
 *
 * Prose formatting (bold/italic) is done with react-quill's toolbar; math is
 * entered visually through a MathLive `<math-field>` popover and rendered inline
 * with KaTeX. The teacher never sees `$...$` or `**...**`. Externally the
 * component still speaks the app's plain Markdown+LaTeX string format, so saved
 * documents, MarkdownRenderer, printing and the existing previews are unchanged.
 *
 * Props:
 *  - value: string (Markdown + $...$)
 *  - onChange: (next: string) => void
 *  - variant: 'multiline' | 'inline'
 *  - showPreview?: boolean (built-in preview pane; default false — modals supply their own)
 *  - showAIButton?: boolean (default: true for multiline)
 *  - addToast?: (msg, type, duration) => void
 *  - placeholder?, ariaLabel?
 */

const MATH_FONTS_CONFIGURED = { done: false };

function registerMathBlot(Quill) {
    if (!Quill || Quill.imports?.['formats/mathlive']) return;
    const Embed = Quill.import('blots/embed');

    class MathBlot extends Embed {
        static create(value) {
            const node = super.create(value);
            const latex = (value && value.latex) || '';
            const display = !!(value && value.display);
            node.setAttribute('data-latex', latex);
            node.setAttribute('data-display', display ? '1' : '0');
            node.setAttribute('contenteditable', 'false');
            if (display) node.classList.add('ql-mathlive-display');
            try {
                node.innerHTML = katex.renderToString(latex || '\\;', {
                    throwOnError: false,
                    displayMode: display,
                });
            } catch (e) {
                node.textContent = latex;
            }
            return node;
        }
        static value(node) {
            return {
                latex: node.getAttribute('data-latex') || '',
                display: node.getAttribute('data-display') === '1',
            };
        }
    }
    MathBlot.blotName = 'mathlive';
    MathBlot.tagName = 'SPAN';
    MathBlot.className = 'ql-mathlive';
    Quill.register(MathBlot, true);
}

const RichMathEditor = ({
    value = '',
    onChange,
    variant = 'multiline',
    showPreview = false,
    showAIButton,
    addToast,
    placeholder,
    ariaLabel,
}) => {
    const isInline = variant === 'inline';
    const aiEnabled = showAIButton ?? !isInline;
    const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

    const [QuillComponent, setQuillComponent] = useState(null);
    const QuillClassRef = useRef(null);
    const quillRef = useRef(null);
    const lastEmitted = useRef(null);

    const [mathOpen, setMathOpen] = useState(false);
    const [mathMode, setMathMode] = useState('insert');
    const editTargetRef = useRef({ latex: '', display: false, index: null });
    const savedRangeRef = useRef(null);
    const mathFieldRef = useRef(null);
    const mathContainerRef = useRef(null);

    const [aiLoading, setAiLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(showPreview);
    const debouncedValue = useDebounce(value, 500);

    const getEditor = () => quillRef.current?.getEditor?.() || null;

    // Lazy-load react-quill, register the math blot once.
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const mod = await import('react-quill');
                if (!mounted) return;
                QuillClassRef.current = mod.default.Quill;
                registerMathBlot(mod.default.Quill);
                setQuillComponent(() => mod.default);
            } catch (err) {
                console.error('Failed to load editor:', err);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Load value into the editor on mount and when it changes from outside.
    useEffect(() => {
        const editor = getEditor();
        const Quill = QuillClassRef.current;
        if (!editor || !Quill) return;
        if ((value || '') === lastEmitted.current) return;
        const Delta = Quill.import('delta');
        editor.setContents(new Delta(markdownToOps(value || '')), 'silent');
        lastEmitted.current = value || '';
    }, [value, QuillComponent]);

    const handleChange = useCallback(() => {
        const editor = getEditor();
        if (!editor) return;
        const md = opsToMarkdown(editor.getContents().ops);
        if (md === lastEmitted.current) return;
        lastEmitted.current = md;
        onChange?.(md);
    }, [onChange]);

    // Open the equation popover when an existing math embed is clicked.
    useEffect(() => {
        const editor = getEditor();
        if (!editor) return;
        const root = editor.root;
        const onClick = (e) => {
            const span = e.target.closest?.('.ql-mathlive');
            if (!span) return;
            e.preventDefault();
            e.stopPropagation();
            const Quill = QuillClassRef.current;
            const blot = Quill.find(span);
            if (!blot) return;
            editTargetRef.current = {
                latex: span.getAttribute('data-latex') || '',
                display: span.getAttribute('data-display') === '1',
                index: editor.getIndex(blot),
            };
            setMathMode('edit');
            setMathOpen(true);
        };
        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }, [QuillComponent]);

    // Build the MathLive field whenever the popover opens.
    useEffect(() => {
        if (!mathOpen) return;
        let cancelled = false;
        (async () => {
            try {
                const ml = await import('mathlive');
                if (cancelled) return;
                if (!MATH_FONTS_CONFIGURED.done && ml.MathfieldElement) {
                    // Avoid 404s on MathLive's web fonts/sounds; the inline result
                    // is rendered by KaTeX anyway — the field is input-only.
                    try {
                        ml.MathfieldElement.fontsDirectory = null;
                        ml.MathfieldElement.soundsDirectory = null;
                    } catch (e) { /* noop */ }
                    MATH_FONTS_CONFIGURED.done = true;
                }
                const mf = document.createElement('math-field');
                mf.setAttribute('math-virtual-keyboard-policy', 'manual');
                mf.style.width = '100%';
                mf.style.minHeight = '64px';
                mf.style.fontSize = '1.6rem';
                mf.style.padding = '8px';
                mf.style.border = '1px solid #e5e7eb';
                mf.style.borderRadius = '12px';
                if (mathContainerRef.current) {
                    mathContainerRef.current.innerHTML = '';
                    mathContainerRef.current.appendChild(mf);
                }
                // Set value after the element is connected so the web component keeps it.
                mf.value = editTargetRef.current?.latex || '';
                mathFieldRef.current = mf;
                setTimeout(() => { try { mf.focus(); } catch (e) { /* noop */ } }, 60);
            } catch (err) {
                console.error('Failed to load MathLive:', err);
                addToast?.('โหลดตัวแก้สมการไม่สำเร็จ', 'error', 3000);
                setMathOpen(false);
            }
        })();
        return () => { cancelled = true; mathFieldRef.current = null; };
    }, [mathOpen, addToast]);

    const openInsert = () => {
        const editor = getEditor();
        savedRangeRef.current = editor?.getSelection() || null;
        editTargetRef.current = { latex: '', display: false, index: null };
        setMathMode('insert');
        setMathOpen(true);
    };

    const confirmMath = () => {
        const mf = mathFieldRef.current;
        const latex = (mf ? mf.value : '').trim();
        const editor = getEditor();
        if (!editor || !latex) { setMathOpen(false); return; }
        if (mathMode === 'edit' && typeof editTargetRef.current?.index === 'number') {
            const idx = editTargetRef.current.index;
            const display = editTargetRef.current.display;
            editor.deleteText(idx, 1, 'user');
            editor.insertEmbed(idx, 'mathlive', { latex, display }, 'user');
            editor.setSelection(idx + 1, 0);
        } else {
            const range = savedRangeRef.current || editor.getSelection(true) || { index: Math.max(0, editor.getLength() - 1) };
            const idx = range.index;
            editor.insertEmbed(idx, 'mathlive', { latex, display: false }, 'user');
            editor.setSelection(idx + 1, 0);
        }
        setMathOpen(false);
        handleChange();
    };

    const handleAIFormat = async () => {
        const editor = getEditor();
        if (!editor) return;
        const current = opsToMarkdown(editor.getContents().ops);
        if (!current.trim()) {
            addToast?.('ยังไม่มีข้อความให้จัดรูปแบบ', 'warning', 2500);
            return;
        }
        setAiLoading(true);
        try {
            const res = await formatText(current);
            if (res.usedFallback) {
                addToast?.(res.errorMessage || 'จัดรูปแบบไม่สำเร็จ', hasApiKey ? 'error' : 'warning', 4000);
                return;
            }
            const Quill = QuillClassRef.current;
            const Delta = Quill.import('delta');
            editor.setContents(new Delta(markdownToOps(res.text)), 'silent');
            lastEmitted.current = res.text;
            onChange?.(res.text);
            addToast?.('จัดรูปแบบเรียบร้อย ✨', 'success', 2000);
        } finally {
            setAiLoading(false);
        }
    };

    const modules = useMemo(() => ({
        toolbar: [['bold', 'italic']],
    }), []);
    const formats = useMemo(() => ['bold', 'italic', 'mathlive'], []);

    const wrapperClass = `rich-math-editor ${isInline ? 'rme-inline' : 'rme-multiline'}`;

    return (
        <div className={wrapperClass}>
            {/* Action bar */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <button
                    type="button"
                    onClick={openInsert}
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    title="แทรกสมการ — พิมพ์เห็นเป็นสมการจริง ไม่ต้องใส่โค้ด"
                >
                    <Sigma size={14} /> แทรกสมการ
                </button>

                {aiEnabled && (
                    <button
                        type="button"
                        onClick={handleAIFormat}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={aiLoading || !hasApiKey}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${hasApiKey ? 'bg-violet-50 text-violet-600 hover:bg-violet-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} ${aiLoading ? 'opacity-70 cursor-wait' : ''}`}
                        title={hasApiKey ? 'ให้ AI จัดรูปแบบข้อความเป็นสมการ/ตัวหนาให้อัตโนมัติ' : 'ต้องตั้งค่า Gemini API Key ก่อนจึงจะใช้ได้'}
                    >
                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {aiLoading ? 'กำลังจัด...' : 'จัดรูปแบบด้วย AI'}
                    </button>
                )}

                {showPreview && (
                    <button
                        type="button"
                        onClick={() => setPreviewVisible((v) => !v)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors ml-auto"
                        title="แสดง/ซ่อนตัวอย่างผลลัพธ์"
                    >
                        {previewVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        {previewVisible ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}
                    </button>
                )}
            </div>

            {/* Editor */}
            {QuillComponent ? (
                <QuillComponent
                    ref={quillRef}
                    theme={isInline ? 'bubble' : 'snow'}
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    className="bg-white dark:bg-slate-900 rounded-xl"
                />
            ) : (
                <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">กำลังโหลดตัวแก้ไข...</span>
                </div>
            )}

            {/* Built-in preview (off in modals that already preview) */}
            {showPreview && previewVisible && (
                <div className="mt-2 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">ตัวอย่างผลลัพธ์</div>
                    {isInline
                        ? <div className="text-base"><Latex>{debouncedValue || ''}</Latex></div>
                        : <MarkdownRenderer content={debouncedValue || ''} />}
                </div>
            )}

            {/* Equation popover */}
            {mathOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMathOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg p-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Sigma size={18} className="text-indigo-600" />
                                {mathMode === 'edit' ? 'แก้ไขสมการ' : 'แทรกสมการ'}
                            </h3>
                            <button onClick={() => setMathOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            พิมพ์ได้เลย เช่น <code className="bg-gray-100 px-1 rounded">1/2</code> จะกลายเป็นเศษส่วน, <code className="bg-gray-100 px-1 rounded">x^2</code> จะเป็นยกกำลัง, <code className="bg-gray-100 px-1 rounded">sqrt</code> เป็นรากที่สอง
                        </p>
                        <div ref={mathContainerRef} className="mb-4" />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setMathOpen(false)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmMath}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                            >
                                <Check size={16} /> {mathMode === 'edit' ? 'อัปเดต' : 'เพิ่มสมการ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichMathEditor;
