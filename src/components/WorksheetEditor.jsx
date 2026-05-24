import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Minus, Trash2, FilePlus, ArrowLeft, Printer, Layout, StickyNote, Eye, EyeOff, Type, Image as ImageIcon, RotateCcw, RotateCw, Cloud, Check, Save, X, Edit, Maximize, ArrowDownToLine, FileJson, RefreshCw, Eraser, ChevronUp, ChevronDown, ZoomIn, ZoomOut, FileText, ALargeSmall, BookOpen, PenTool, Zap, Search, ArrowDown, Sparkles, MoveVertical, FileQuestion, AlertTriangle, Copy, Grid3X3, Hand, MousePointer2, Bug, Droplets, Upload, LayoutTemplate } from 'lucide-react';
import QuestionItem from './QuestionItem';
// import kruheemLogo from '../assets/kruheem-logo.png'; // No longer used, using public path
import TextItem from './TextItem';
import ImageItem from './ImageItem';
import SpacerItem from './SpacerItem';
import DividerItem from './DividerItem';
import MarkdownItem from './MarkdownItem';
import QuestionEditorModal from './QuestionEditorModal';
import ErrorBoundary from './ErrorBoundary';
import TemplatePicker from './TemplatePicker';
import FontPicker from './FontPicker';
import { useToast, ToastContainer } from './Toast';
import useAutoPagination from '../hooks/useAutoPagination';
import useHistory from '../hooks/useHistory';
import { useModalA11y } from '../hooks/useModalA11y';
import { expandDocumentTemplate } from '../data/pageTemplates';
import { DEFAULT_FONT_ID, getFontStack, getEffectiveFontPx } from '../data/documentFonts';

// Font-size slider bounds (SIZE_TO_PX + getEffectiveFontPx are shared via documentFonts).
const FONT_SCALE_MIN = 12;
const FONT_SCALE_MAX = 96;

const WorksheetEditor = ({ activeDocument, initialData, onSave, onBack }) => {
    // --- History State Management ---
    const {
        state: pages,
        set: setPages,
        replace: replacePages,
        undo,
        redo,
        canUndo,
        canRedo,
        clear: resetHistory
    } = useHistory(
        Array.isArray(initialData) && initialData.length > 0
            ? initialData
            : [
                {
                    id: uuidv4(),
                    questions: [
                        { id: uuidv4(), type: 'text', content: `<h1 class="ql-align-center"><strong>${activeDocument?.title || 'Main Title'}</strong></h1>`, size: 'xl' },
                        { id: uuidv4(), type: 'text', content: `<p class="ql-align-center">${activeDocument?.grade || 'Grade'} • ${activeDocument?.term || 'Term'} • ${activeDocument?.topic || 'Topic'}</p>`, size: 'medium' }
                    ]
                }
            ]
    );

    // --- Document Font State (persisted on document) ---
    const [fontId, setFontId] = useState(activeDocument?.fontId || DEFAULT_FONT_ID);
    const fontStack = getFontStack(fontId);

    // --- Toast notifications ---
    const { toasts, addToast, removeToast } = useToast();

    // --- Manual Save State ---
    const [saveStatus, setSaveStatus] = useState('saved');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Track unsaved changes
    useEffect(() => {
        setHasUnsavedChanges(true);
        setSaveStatus('unsaved');
    }, [pages, fontId]);

    const handleManualSave = async () => {
        if (!onSave || !pages) return;
        setSaveStatus('saving');
        try {
            // Awaits the real Firestore write so success/failure is reported accurately.
            await onSave(pages, documentTitle, { fontId });
            setSaveStatus('saved');
            setHasUnsavedChanges(false);
            addToast('บันทึกเรียบร้อย', 'success', 2000);
        } catch (e) {
            console.error('Manual save failed:', e);
            setSaveStatus('error');
            addToast(e?.message || 'บันทึกไม่สำเร็จ — โปรดลองอีกครั้ง', 'error', 5000);
        }
    };

    const handleBackWithConfirmation = () => {
        if (hasUnsavedChanges) {
            if (window.confirm('คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกโดยไม่บันทึกหรือไม่?')) {
                onBack();
            }
        } else {
            onBack();
        }
    };

    // View Mode & Zoom
    const [showSolution, setShowSolution] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(() => {
        // Auto-fit on mobile: A4 = 210mm ≈ 793px. On viewport < 800px, scale down.
        if (typeof window === 'undefined') return 100;
        const vw = window.innerWidth;
        if (vw < 480) return Math.max(50, Math.round((vw - 32) / 793 * 100));
        if (vw < 800) return Math.max(60, Math.round((vw - 64) / 793 * 100));
        return 100;
    });
    const [globalFontSize, setGlobalFontSize] = useState('medium');
    const [showDebug, setShowDebug] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const gridSize = 'medium';
    const gridOpacity = 5;

    // --- Watermark State ---
    const [watermark, setWatermark] = useState({
        enabled: false,
        type: 'text', // 'text' | 'image'
        text: 'คณิตครูฮีม',
        imageUrl: '',
        opacity: 8,
        fontSize: 48,
        rotation: -30,
        tile: true
    });
    const [showWatermarkPanel, setShowWatermarkPanel] = useState(false);
    const watermarkImageInputRef = useRef(null);

    const handleWatermarkImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Validate size — base64 DataURL inflates ~33%, limit raw to 2MB
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            addToast(`ไฟล์ใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)}MB) — โปรดเลือกไฟล์ไม่เกิน 2MB`, 'error', 4000);
            e.target.value = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
            addToast('โปรดเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, SVG)', 'error', 4000);
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setWatermark(prev => ({ ...prev, imageUrl: ev.target.result, type: 'image' }));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };


    // --- Selection & Editing State ---
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);

    // --- Document Title State (Subtitle) ---
    const [documentTitle, setDocumentTitle] = useState(activeDocument?.subtitle || '');

    // --- Import Modal State ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importSectionType, setImportSectionType] = useState('content');
    const [importQuestionType, setImportQuestionType] = useState('objective');

    // --- Import Modal A11y (must come after showImportModal is declared) ---
    const importModalRef = useModalA11y(showImportModal, () => setShowImportModal(false));

    // --- Template Picker State ---
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    // --- Question Editor Modal State ---
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    // --- Pagination Hook ---
    const { pageRefs, overflowPages, isPageOverflow } = useAutoPagination(pages, setPages, replacePages);

    // --- State Cleanup & Recovery ---
    const handleTrimEmptyPages = useCallback(() => {
        replacePages(prev => {
            if (!Array.isArray(prev)) return prev;
            // Keep pages that HAVE questions, or the VERY FIRST page
            const cleaned = prev.filter((p, idx) => p.questions.length > 0 || idx === 0);
            // If we filtered everything (somehow), ensure at least one
            if (cleaned.length === 0) return [{ id: uuidv4(), questions: [] }];
            return cleaned;
        });
    }, [replacePages]);

    const handleFactoryReset = useCallback(() => {
        if (window.confirm("⚠️ คำเตือน: ระบบจะลบข้อมูลทั้งหมดในเอกสารนี้และกู้คืนค่าเริ่มต้น (Factory Reset)\n\nคุณแน่ใจใช่หรือไม่?")) {
            const resetState = [
                {
                    id: uuidv4(),
                    questions: [
                        { id: uuidv4(), type: 'text', content: `<h1 class="ql-align-center"><strong>${activeDocument?.title || 'Main Title'}</strong></h1>`, size: 'xl' },
                        { id: uuidv4(), type: 'text', content: `<p class="ql-align-center">${activeDocument?.grade || 'Grade'} • ${activeDocument?.term || 'Term'} • ${activeDocument?.topic || 'Topic'}</p>`, size: 'medium' }
                    ]
                }
            ];
            setPages(resetState);
            resetHistory(resetState);
            setShowDebug(false);
        }
    }, [setPages, resetHistory, activeDocument]);

    // --- Handlers ---
    const handleAddQuestion = useCallback((newQuestion) => {
        setPages((prevPages) => {
            const currentPages = Array.isArray(prevPages) ? [...prevPages] : [{ id: uuidv4(), questions: [] }];
            const lastPageIdx = currentPages.length - 1;
            const lastPage = currentPages[lastPageIdx];
            currentPages[lastPageIdx] = { ...lastPage, questions: [...lastPage.questions, newQuestion] };
            return [...currentPages];
        });
        setTimeout(() => setSelectedItemId(newQuestion.id), 50);
    }, [setPages]);

    const handleAddQuestionBelow = useCallback((targetId, newQuestion) => {
        setPages((prevPages) => {
            return prevPages.map(page => {
                const index = page.questions.findIndex(q => q.id === targetId);
                if (index === -1) return page;
                const newQuestions = [...page.questions];
                newQuestions.splice(index + 1, 0, newQuestion);
                return { ...page, questions: newQuestions };
            });
        });
        setTimeout(() => setSelectedItemId(newQuestion.id), 50);
    }, [setPages]);

    const handleAddText = () => {
        const newItem = { id: uuidv4(), type: 'text', content: '', size: 'medium' };
        if (selectedItemId) {
            handleAddQuestionBelow(selectedItemId, newItem);
        } else {
            handleAddQuestion(newItem);
        }
    };
    const handleAddImage = () => {
        const newItem = { id: uuidv4(), type: 'image', src: '', size: 'medium' };
        if (selectedItemId) {
            handleAddQuestionBelow(selectedItemId, newItem);
        } else {
            handleAddQuestion(newItem);
        }
    };
    const handleAddSpacer = () => {
        const newItem = { id: uuidv4(), type: 'spacer', height: 100 };
        if (selectedItemId) {
            handleAddQuestionBelow(selectedItemId, newItem);
        } else {
            handleAddQuestion(newItem);
        }
    };
    const handleAddDivider = () => {
        const newItem = { id: uuidv4(), type: 'divider', style: 'solid', thickness: 2, color: '#e5e7eb' };
        if (selectedItemId) {
            handleAddQuestionBelow(selectedItemId, newItem);
        } else {
            handleAddQuestion(newItem);
        }
    };
    const handleAddMarkdown = () => {
        const newItem = { id: uuidv4(), type: 'markdown', content: '> พิมพ์เนื้อหา Markdown ที่นี่...', size: 'medium' };
        if (selectedItemId) {
            handleAddQuestionBelow(selectedItemId, newItem);
        } else {
            handleAddQuestion(newItem);
        }
    };

    const handleUpdateItem = useCallback((itemId, updates) => {
        setPages(prevPages => prevPages.map(page => ({
            ...page,
            questions: page.questions.map(q =>
                q.id === itemId ? { ...q, ...(typeof updates === 'string' ? { content: updates } : updates) } : q
            )
        })));
    }, [setPages]);

    // --- Question Editor Handlers ---
    const handleEditQuestion = useCallback((questionId) => {
        setEditingQuestionId(questionId);
    }, []);

    const editingQuestionData = editingQuestionId ? (() => {
        for (const page of pages) {
            const q = page.questions.find(q => q.id === editingQuestionId);
            if (q) return q;
        }
        return null;
    })() : null;

    const handleSaveEditedQuestion = useCallback((updatedData) => {
        if (!editingQuestionId) return;
        setPages(prevPages => prevPages.map(page => ({
            ...page,
            questions: page.questions.map(q =>
                q.id === editingQuestionId
                    ? { ...q, question: updatedData.question, options: updatedData.options, solution: updatedData.solution, layoutColumn: updatedData.layoutColumn }
                    : q
            )
        })));
        setEditingQuestionId(null);
    }, [editingQuestionId, setPages]);

    // --- Smart Distribution Algorithm ---
    const distributeBlocksToPages = useCallback((blocks) => {
        const MAX_HEIGHT = 1000; // Content area height limit (Approx for A4)
        const newPages = [{ id: uuidv4(), questions: [] }];
        let currentPageIdx = 0;
        let currentHeight = 0;

        blocks.forEach(block => {
            let estimatedHeight = 25; // Base padding/margin (Reduced from 40)
            const content = block.content || '';

            if (block.type === 'header') {
                estimatedHeight = 60; // Reduced from 80
            } else if (block.type === 'image') {
                estimatedHeight = 350;
            } else if (block.type === 'spacer') {
                estimatedHeight = block.height || 100;
            } else {
                // Heuristic for text/markdown: ~0.4px per character + lines
                const lines = content.split('\n').length;
                estimatedHeight = (content.length * 0.4) + (lines * 22) + 20; // Reduced line height and base
                if (block.type === 'callout' || block.type === 'example') {
                    estimatedHeight += 20; // Extra padding for box (Reduced from 40)
                }
            }

            // If appending this block overflows the current page, start a new one
            // (Unless the page is currently empty, in which case we must allow it)
            if (currentHeight + estimatedHeight > MAX_HEIGHT && newPages[currentPageIdx].questions.length > 0) {
                newPages.push({ id: uuidv4(), questions: [] });
                currentPageIdx++;
                currentHeight = 0;
            }

            const item = {
                id: uuidv4(),
                type: 'markdown',
                content: block.content,
                size: 'medium'
            };

            newPages[currentPageIdx].questions.push(item);
            currentHeight += estimatedHeight;
        });

        return newPages;
    }, []);

    const handleMoveItem = useCallback((itemId, direction) => {
        setPages(prevPages => {
            let itemPageIdx = -1;
            let itemInPageIdx = -1;

            for (let i = 0; i < prevPages.length; i++) {
                const qIdx = prevPages[i].questions.findIndex(q => q.id === itemId);
                if (qIdx !== -1) {
                    itemPageIdx = i;
                    itemInPageIdx = qIdx;
                    break;
                }
            }

            if (itemPageIdx === -1) return prevPages;

            const newPages = prevPages.map(p => ({ ...p, questions: [...p.questions] }));

            if (direction === 'up') {
                if (itemInPageIdx > 0) {
                    // Swap within page
                    const p = newPages[itemPageIdx];
                    [p.questions[itemInPageIdx - 1], p.questions[itemInPageIdx]] = [p.questions[itemInPageIdx], p.questions[itemInPageIdx - 1]];
                } else if (itemPageIdx > 0) {
                    // Move to previous page
                    const prevPage = newPages[itemPageIdx - 1];
                    const currPage = newPages[itemPageIdx];
                    const [item] = currPage.questions.splice(itemInPageIdx, 1);
                    prevPage.questions.push(item);
                }
            } else if (direction === 'down') {
                if (itemInPageIdx < newPages[itemPageIdx].questions.length - 1) {
                    // Swap within page
                    const p = newPages[itemPageIdx];
                    [p.questions[itemInPageIdx + 1], p.questions[itemInPageIdx]] = [p.questions[itemInPageIdx], p.questions[itemInPageIdx + 1]];
                } else if (itemPageIdx < newPages.length - 1) {
                    // Move to next page
                    const nextPage = newPages[itemPageIdx + 1];
                    const currPage = newPages[itemPageIdx];
                    const [item] = currPage.questions.splice(itemInPageIdx, 1);
                    nextPage.questions.unshift(item);
                }
            }

            // Scroll into view after state update
            setTimeout(() => {
                const element = document.querySelector(`[data-rfd-draggable-id="${itemId}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

            return newPages;
        });
    }, []);

    const handleDuplicateItem = useCallback((itemId) => {
        setPages(prevPages => {
            const newPages = prevPages.map(p => ({ ...p, questions: [...p.questions] }));
            let found = false;
            let newItemId = null;

            for (let i = 0; i < newPages.length; i++) {
                const qIdx = newPages[i].questions.findIndex(q => q.id === itemId);
                if (qIdx !== -1) {
                    const originalItem = newPages[i].questions[qIdx];
                    const newItem = {
                        ...originalItem,
                        id: uuidv4()
                    };
                    // Insert immediately after
                    newPages[i].questions.splice(qIdx + 1, 0, newItem);
                    newItemId = newItem.id;
                    found = true;
                    break;
                }
            }

            if (found && newItemId) {
                setTimeout(() => setSelectedItemId(newItemId), 50);
            }
            return newPages;
        });
    }, [setPages]);

    const handleDeleteQuestion = useCallback((questionId) => {
        setPages((prevPages) => prevPages.map(page => ({
            ...page,
            questions: page.questions.filter(q => q.id !== questionId)
        })));
        setSelectedItemId(prev => prev === questionId ? null : prev);
    }, [setPages]);

    const handleEditEnd = useCallback(() => setEditingItemId(null), []);

    const handleDeletePage = useCallback((pageIndex) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบหน้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

        setPages(prevPages => {
            const newPages = [...prevPages];
            newPages.splice(pageIndex, 1);
            // Ensure at least one page remains
            if (newPages.length === 0) {
                return [{ id: uuidv4(), questions: [] }];
            }
            return newPages;
        });
    }, [setPages]);

    // --- Keyboard shortcuts (work even when an item is selected, where the toolbar
    //     hides undo/redo). Guarded so they never hijack typing inside editors. ---
    useEffect(() => {
        const onKeyDown = (e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;
            const k = e.key.toLowerCase();
            const t = e.target;
            const isEditing = !!(t && (
                t.tagName === 'INPUT' ||
                t.tagName === 'TEXTAREA' ||
                t.isContentEditable ||
                (t.closest && t.closest('.ql-editor, math-field, [contenteditable="true"]'))
            ));

            // Save works even while editing (and stops the browser's own save dialog).
            if (k === 's') { e.preventDefault(); if (hasUnsavedChanges) handleManualSave(); return; }
            if (isEditing) return; // let the editor handle its own shortcuts/typing

            if (k === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); return; }
            if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); if (canRedo) redo(); return; }
            if (k === 'd' && selectedItemId) { e.preventDefault(); handleDuplicateItem(selectedItemId); return; }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [hasUnsavedChanges, handleManualSave, canUndo, canRedo, undo, redo, selectedItemId, handleDuplicateItem]);

    // --- Build Section Header Markdown ---
    const buildSectionHeader = (sectionType, questionType) => {
        const sectionMap = {
            content: { icon: '📖', label: 'บทเรียน' },
            practice: { icon: '✏️', label: 'แบบฝึกหัด' },
            exam: { icon: '📝', label: 'แนวข้อสอบ' },
            summary: { icon: '⚡', label: 'สรุปสูตร' },
            analysis: { icon: '🔍', label: 'วิเคราะห์' }
        };
        const section = sectionMap[sectionType] || sectionMap.content;
        return `## ${section.icon} ${section.label}`;
    };

    // --- Insert items at selected position or end ---
    const insertItemsIntoPages = useCallback((itemsToAdd) => {
        setPages(prev => {
            const newPages = prev.map(p => ({ ...p, questions: [...p.questions] }));

            // Find selected item position
            if (selectedItemId) {
                for (let pIdx = 0; pIdx < newPages.length; pIdx++) {
                    const qIdx = newPages[pIdx].questions.findIndex(q => q.id === selectedItemId);
                    if (qIdx !== -1) {
                        // Insert AFTER the selected item
                        newPages[pIdx].questions.splice(qIdx + 1, 0, ...itemsToAdd);
                        return newPages;
                    }
                }
            }

            // Fallback: append to last page
            const cleanedPages = newPages.filter((p, idx) => p.questions.length > 0 || idx === 0);
            const lastIdx = cleanedPages.length - 1;
            cleanedPages[lastIdx].questions.push(...itemsToAdd);
            return cleanedPages;
        });
    }, [setPages, selectedItemId]);

    // --- Template Insertion Helpers ---
    const assignIdsToItems = (items) => items.map(it => ({ ...it, id: uuidv4() }));

    // A: Section — แทรกหลัง item ที่เลือก (หรือท้ายเอกสาร)
    const handleInsertSectionTemplate = useCallback((template) => {
        if (!template?.items?.length) return;
        const newItems = assignIdsToItems(template.items);
        insertItemsIntoPages(newItems);
    }, [insertItemsIntoPages]);

    // B: Page — เพิ่มเป็นหน้าใหม่ต่อท้าย (ถ้าหน้าสุดท้ายว่างก็แทนที่หน้าสุดท้าย)
    const handleInsertPageTemplate = useCallback((template) => {
        if (!template?.items?.length) return;
        const newPageItems = assignIdsToItems(template.items);
        setPages(prev => {
            const lastIdx = prev.length - 1;
            const lastEmpty = lastIdx >= 0 && (prev[lastIdx]?.questions?.length ?? 0) === 0;
            if (lastEmpty) {
                const next = prev.map((p, i) => i === lastIdx ? { ...p, questions: newPageItems } : p);
                return next;
            }
            return [...prev, { id: uuidv4(), questions: newPageItems }];
        });
    }, [setPages]);

    // C: Document — สร้างหลายหน้า แทนที่หน้าว่างปัจจุบันถ้ามี
    const handleInsertDocumentTemplate = useCallback((template) => {
        const pageItemArrays = expandDocumentTemplate(template);
        if (!pageItemArrays.length) return;
        const newPages = pageItemArrays
            .filter(items => items && items.length > 0)
            .map(items => ({ id: uuidv4(), questions: assignIdsToItems(items) }));

        setPages(prev => {
            // ถ้าเอกสารปัจจุบันมีเพียงหน้าว่าง 1 หน้า ให้แทนที่ทั้งหมด
            const onlyEmpty = prev.length === 1 && (prev[0]?.questions?.length ?? 0) === 0;
            if (onlyEmpty) return newPages;

            // ถ้าหน้าสุดท้ายว่าง drop มันก่อนค่อย append
            const lastIdx = prev.length - 1;
            const cleaned = (lastIdx >= 0 && (prev[lastIdx]?.questions?.length ?? 0) === 0)
                ? prev.slice(0, lastIdx)
                : prev;
            return [...cleaned, ...newPages];
        });
    }, [setPages]);

    const handleImport = () => {
        if (!importText.trim()) return;

        try {
            let jsonString = importText.replace(/```json/g, '').replace(/```/g, '').trim();
            let parsed = null;

            try {
                parsed = JSON.parse(jsonString);
            } catch (e) {
                const startArr = jsonString.indexOf('[');
                const startObj = jsonString.indexOf('{');
                const start = startArr !== -1 ? startArr : startObj;
                const endArr = jsonString.lastIndexOf(']');
                const endObj = jsonString.lastIndexOf('}');
                const end = startArr !== -1 ? endArr : endObj;
                if (start !== -1 && end !== -1 && end > start) {
                    parsed = JSON.parse(jsonString.substring(start, end + 1));
                } else {
                    throw e;
                }
            }

            if (!parsed) throw new Error("Could not parse data.");

            const sectionHeaderItem = {
                id: uuidv4(),
                type: 'markdown',
                content: buildSectionHeader(importSectionType, importQuestionType),
                size: 'medium'
            };

            const itemsToAdd = [sectionHeaderItem];

            if (Array.isArray(parsed)) {
                // Coerce field shapes — malformed AI output (e.g. options as a string)
                // must not reach QuestionItem where .map/.length would throw.
                parsed.forEach(q => {
                    if (!q || typeof q !== 'object') return;
                    itemsToAdd.push({
                        id: uuidv4(),
                        type: 'question',
                        question: typeof q.question === 'string' ? q.question : '*(Question)*',
                        options: Array.isArray(q.options) ? q.options.filter(o => typeof o === 'string') : [],
                        // AI output uses "explanation"; fall back to it so the เฉลย renders. Keep "solution" for older pastes.
                        solution: typeof q.solution === 'string' ? q.solution : (typeof q.explanation === 'string' ? q.explanation : ''),
                        answer: typeof q.answer === 'string' ? q.answer : '',
                        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : undefined,
                        svg: typeof q.svg === 'string' ? q.svg : '',
                        spaceNeeded: q.space || 'medium'
                    });
                });
                insertItemsIntoPages(itemsToAdd);
            } else if (parsed.type === 'lesson' && parsed.blocks) {
                const distributed = distributeBlocksToPages(parsed.blocks);
                if (distributed.length > 0) {
                    distributed[0].questions.unshift(sectionHeaderItem);
                }
                // For lesson blocks, if selected item exists insert at position, otherwise append
                if (selectedItemId) {
                    const allItems = distributed.flatMap(p => p.questions);
                    insertItemsIntoPages(allItems);
                } else {
                    setPages(prev => {
                        const cleanedPrev = prev.filter((p, idx) => p.questions.length > 0 || idx === 0);
                        if (cleanedPrev.length > 0 && cleanedPrev[cleanedPrev.length - 1].questions.length === 0) {
                            const head = distributed.shift();
                            cleanedPrev[cleanedPrev.length - 1].questions = head.questions;
                        }
                        return [...cleanedPrev, ...distributed];
                    });
                }
            } else {
                itemsToAdd.push({
                    id: uuidv4(),
                    type: 'markdown',
                    content: parsed.content || parsed.text || importText,
                    size: 'medium'
                });
                insertItemsIntoPages(itemsToAdd);
            }

            setShowImportModal(false);
            setImportText('');

        } catch (err) {
            if (window.confirm("รูปแบบ JSON ไม่ถูกต้อง ต้องการนำเข้าเป็นข้อความดิบ (Markdown) ใช่หรือไม่?")) {
                const sectionHeaderItem = {
                    id: uuidv4(),
                    type: 'markdown',
                    content: buildSectionHeader(importSectionType, importQuestionType),
                    size: 'medium'
                };
                insertItemsIntoPages([sectionHeaderItem, { id: uuidv4(), type: 'markdown', content: importText, size: 'medium' }]);
                setShowImportModal(false);
                setImportText('');
            }
        }
    };

    const handleOnDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourcePage = pages.find(p => p.id === source.droppableId);
        const destPage = pages.find(p => p.id === destination.droppableId);
        if (!sourcePage || !destPage) return;

        const sourceQuestions = Array.from(sourcePage.questions);
        const destQuestions = (source.droppableId === destination.droppableId) ? sourceQuestions : Array.from(destPage.questions);
        const [removed] = sourceQuestions.splice(source.index, 1);
        destQuestions.splice(destination.index, 0, removed);

        setPages(prev => prev.map(p => {
            if (p.id === source.droppableId) return { ...p, questions: sourceQuestions };
            if (p.id === destination.droppableId) return { ...p, questions: destQuestions };
            return p;
        }));
    };

    const renderContentItem = (q, index, pageIndex) => {
        const isFirstItem = pageIndex === 0 && index === 0;
        const isLastItem = pageIndex === pages.length - 1 && index === pages[pageIndex].questions.length - 1;

        const commonProps = {
            id: q.id,
            index,
            onDelete: handleDeleteQuestion,
            onUpdate: handleUpdateItem,
            onMove: handleMoveItem,
            isSelected: q.id === selectedItemId,
            onSelect: setSelectedItemId,
            isExplicitEditing: q.id === editingItemId,
            onEditEnd: handleEditEnd,
            canMoveUp: !isFirstItem,
            canMoveDown: !isLastItem,
            isViewOnly
        };

        if (q.type === 'text') return (
            <ErrorBoundary key={q.id}>
                <TextItem {...commonProps} content={q.content} size={globalFontSize} fontScale={q.fontScale} />
            </ErrorBoundary>
        );
        if (q.type === 'markdown') return (
            <ErrorBoundary key={q.id}>
                <MarkdownItem {...commonProps} content={q.content} size={q.size || globalFontSize} fontScale={q.fontScale} showSolution={showSolution} />
            </ErrorBoundary>
        );
        if (q.type === 'image') return (
            <ErrorBoundary key={q.id}>
                <ImageItem {...commonProps} src={q.src} size={q.size} />
            </ErrorBoundary>
        );
        if (q.type === 'spacer') return (
            <ErrorBoundary key={q.id}>
                <SpacerItem {...commonProps} height={q.height} />
            </ErrorBoundary>
        );
        if (q.type === 'divider') return (
            <ErrorBoundary key={q.id}>
                <DividerItem {...commonProps} style={q.style} thickness={q.thickness} color={q.color} />
            </ErrorBoundary>
        );

        // Smart numbering reset logic: Reset counter to 1 if we find a header like "แบบฝึกหัด" or "แนวข้อสอบ"
        const allItemsUpToMe = [];
        for (let i = 0; i <= pageIndex; i++) {
            const pageQuestions = pages[i]?.questions || [];
            if (i < pageIndex) {
                allItemsUpToMe.push(...pageQuestions);
            } else {
                allItemsUpToMe.push(...pageQuestions.slice(0, index));
            }
        }

        const resetKeywords = ['แบบฝึกหัด', 'แนวข้อสอบ', 'ข้อสอบ'];
        let lastResetIdx = -1;
        for (let i = allItemsUpToMe.length - 1; i >= 0; i--) {
            const item = allItemsUpToMe[i];
            if (item.type === 'markdown' && resetKeywords.some(kw => (item.content || '').includes(kw))) {
                lastResetIdx = i;
                break;
            }
        }

        const qCountSinceReset = allItemsUpToMe
            .slice(Math.max(0, lastResetIdx))
            .filter(i => !['text', 'image', 'spacer', 'markdown', 'divider'].includes(i.type))
            .length;

        return (
            <ErrorBoundary key={q.id}>
                <QuestionItem {...commonProps} no={qCountSinceReset + 1} question={q.question} type={q.type} options={q.options} solution={q.solution} svg={q.svg} questionImage={q.questionImage} spaceNeeded={q.spaceNeeded} layoutColumn={q.layoutColumn} fontSize={globalFontSize} showSolution={showSolution} onEdit={handleEditQuestion} />
            </ErrorBoundary>
        );
    };

    // Calculate canMoveUp/canMoveDown for selection toolbar
    const selectedItemStatus = (() => {
        if (!selectedItemId) return { up: false, down: false };
        let sPageIdx = -1;
        let sItemIdx = -1;
        for (let i = 0; i < pages.length; i++) {
            const idx = (pages[i]?.questions || []).findIndex(q => q.id === selectedItemId);
            if (idx !== -1) {
                sPageIdx = i;
                sItemIdx = idx;
                break;
            }
        }
        if (sPageIdx === -1) return { up: false, down: false };
        return {
            up: !(sPageIdx === 0 && sItemIdx === 0),
            down: !(sPageIdx === pages.length - 1 && sItemIdx === pages[sPageIdx].questions.length - 1)
        };
    })();

    // Selected item object — used by the font-size slider (text/markdown only)
    const selectedItem = (() => {
        if (!selectedItemId) return null;
        for (const page of pages) {
            const found = (page.questions || []).find(q => q.id === selectedItemId);
            if (found) return found;
        }
        return null;
    })();
    const isTextLikeSelected = selectedItem && (selectedItem.type === 'text' || selectedItem.type === 'markdown');

    return (
        <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-950 font-sans print:bg-white relative">
            {/* Debug Overlay */}
            {showDebug && (
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl p-6 text-green-400 font-mono text-sm border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-4 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Bug /> System State Debugger</h2>
                            <button onClick={() => setShowDebug(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X /></button>
                        </div>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <button onClick={handleFactoryReset} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                                <Eraser size={14} /> FACTORY RESET
                            </button>
                            <button onClick={handleTrimEmptyPages} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                                <RefreshCw size={14} /> TRIM EMPTY PAGES
                            </button>
                        </div>
                        <div className="mb-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 dark:text-slate-500 border-l-4 border-blue-500">
                            💡 <strong>Tip:</strong> หากเห็นหน้าจอว่างเปล่า ให้กดปุ่ม <strong>TRIM EMPTY PAGES</strong> เพื่อลบหน้าที่ว่างทิ้ง ข้อมูลจะกลับมาแสดงผลปกติ
                        </div>
                        <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-4 border border-white/5">{JSON.stringify(pages, null, 2)}</pre>
                    </div>
                </div>
            )}

            <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 h-14 sm:h-16 shadow-sm print:hidden">
                <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-full flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <button onClick={handleBackWithConfirmation} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 dark:text-slate-500 transition-colors flex-shrink-0"><ArrowLeft size={20} /></button>
                        <h1 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 font-outfit truncate">
                            <Layout size={18} className="text-blue-600 flex-shrink-0" />
                            <span className="truncate">{activeDocument?.title || 'Untitled'}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Save button removed from here and moved to floating toolbar */}
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden print:h-auto print:block print:overflow-visible">
                <main className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 lg:p-12 custom-scrollbar bg-slate-100/50 dark:bg-slate-950 print:p-0 print:overflow-visible" onClick={() => { setSelectedItemId(null); setShowWatermarkPanel(false); }}>
                    <div className="max-w-[210mm] mx-auto space-y-10 print:space-y-0 zoom-container origin-top" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', fontFamily: fontStack }}>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            {Array.isArray(pages) && pages.map((page, pIdx) => (
                                <div key={page.id} ref={el => pageRefs.current[page.id] = el} className={`w-[210mm] min-h-[297mm] bg-white shadow-xl relative print:shadow-none print:break-after-page m-auto print:m-0 print:h-[297mm] print:overflow-hidden ${showGrid ? 'grid-active' : ''}`}>
                                    {/* Grid Overlay */}
                                    {showGrid && (
                                        <div
                                            className="absolute inset-0 pointer-events-none z-0 grid-overlay"
                                            style={{
                                                backgroundImage: `
                                                    linear-gradient(to right, rgba(0,0,0,${gridOpacity / 100}) 1px, transparent 1px),
                                                    linear-gradient(to bottom, rgba(0,0,0,${gridOpacity / 100}) 1px, transparent 1px)
                                                `,
                                                backgroundSize: `${{ small: '5mm 5mm', medium: '8mm 8mm', large: '12mm 12mm' }[gridSize]}`,
                                            }}
                                        />
                                    )}
                                    {/* Watermark Overlay */}
                                    {watermark.enabled && (
                                        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden watermark-overlay" style={{ opacity: watermark.opacity / 100 }}>
                                            {watermark.type === 'text' && watermark.text && (
                                                watermark.tile ? (
                                                    <div className="absolute inset-0" style={{ transform: `rotate(${watermark.rotation}deg)`, transformOrigin: 'center center' }}>
                                                        <div className="absolute" style={{ top: '-50%', left: '-50%', right: '-50%', bottom: '-50%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: `${Math.max(40, watermark.fontSize * 1.5)}px ${Math.max(60, watermark.fontSize * 2)}px` }}>
                                                            {Array.from({ length: 64 }).map((_, i) => (
                                                                <span key={i} className="select-none whitespace-nowrap text-gray-900 dark:text-slate-100" style={{ fontSize: `${watermark.fontSize}px`, fontWeight: 700, fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif" }}>{watermark.text}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="select-none whitespace-nowrap text-gray-900 dark:text-slate-100" style={{ fontSize: `${watermark.fontSize * 2}px`, fontWeight: 700, transform: `rotate(${watermark.rotation}deg)`, fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif" }}>{watermark.text}</span>
                                                    </div>
                                                )
                                            )}
                                            {watermark.type === 'image' && watermark.imageUrl && (
                                                watermark.tile ? (
                                                    <div className="absolute inset-0" style={{ transform: `rotate(${watermark.rotation}deg)`, transformOrigin: 'center center' }}>
                                                        <div className="absolute" style={{ top: '-50%', left: '-50%', right: '-50%', bottom: '-50%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: `${Math.max(40, watermark.fontSize)}px` }}>
                                                            {Array.from({ length: 36 }).map((_, i) => (
                                                                <img key={i} src={watermark.imageUrl} alt="" className="select-none" style={{ width: `${watermark.fontSize * 2}px`, height: 'auto', objectFit: 'contain' }} draggable={false} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <img src={watermark.imageUrl} alt="" className="select-none" style={{ width: `${watermark.fontSize * 4}px`, height: 'auto', objectFit: 'contain', transform: `rotate(${watermark.rotation}deg)` }} draggable={false} />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 text-[10px] text-gray-300 dark:text-slate-600 font-bold print:hidden">PAGE {pIdx + 1}</div>
                                    {/* A4 Boundary Guide Line - visual indicator of printable area */}
                                    <div className="absolute left-0 right-0 pointer-events-none print:hidden" style={{ top: '287mm' }}>
                                        <div className="border-t-2 border-dashed border-rose-300/50 mx-[10mm]" />
                                        <span className="absolute right-[12mm] -top-[14px] text-[9px] text-rose-400/70 font-medium select-none bg-white dark:bg-slate-900 px-1">ขอบ A4 ↓</span>
                                    </div>
                                    {/* Overflow Warning Badge */}
                                    {isPageOverflow(page.id) && (
                                        <div className="absolute top-4 right-4 z-20 print:hidden">
                                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5 shadow-sm">
                                                <AlertTriangle size={13} />
                                                <span className="text-[10px] font-semibold">เนื้อหาเกินหน้า A4</span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Page Header - คณิตครูฮีม */}
                                    <div className="absolute top-[8mm] left-[20mm] right-[20mm] flex items-center justify-between pointer-events-none select-none">
                                        <div className="flex items-center gap-2">
                                            <img src="/kruheem-logo.png" alt="คณิตครูฮีม" className="w-5 h-5 object-contain" />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold tracking-wide text-black" style={{ fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif" }}>คณิตครูฮีม</span>
                                                <span className="text-[8px] text-black/60" style={{ fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif" }}>line @kruheem | www.kruheemmath.com</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pointer-events-auto">
                                            <input
                                                type="text"
                                                value={documentTitle}
                                                onChange={e => setDocumentTitle(e.target.value)}
                                                placeholder="ชื่อเรื่อง..."
                                                className="text-[9px] text-black/50 font-medium bg-transparent border-none outline-none text-right w-[120px] placeholder:text-black/20 print:placeholder:text-transparent"
                                                style={{ fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif" }}
                                            />
                                            <span className="text-[9px] text-black/30 font-medium select-none">|</span>
                                            <span className="text-[9px] text-black/40 font-medium select-none">{pIdx + 1}</span>
                                            <button
                                                onClick={() => handleDeletePage(pIdx)}
                                                className="ml-1 p-1 text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors print:hidden"
                                                aria-label="ลบหน้านี้" title="ลบหน้านี้"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-[20mm] pt-[16mm] pb-[10mm]" data-page-content>
                                        <Droppable droppableId={page.id}>
                                            {(provided, snapshot) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className={`min-h-[200px] rounded-xl transition-all ${snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-200 ring-dashed' : ''}`}>
                                                    {page.questions.length === 0 ? (
                                                        <div className="h-64 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-gray-300 dark:text-slate-600">
                                                            <Plus size={32} className="mb-2" />
                                                            <p className="text-sm font-medium">Empty Page - Add items or import</p>
                                                        </div>
                                                    ) : (
                                                        page.questions.map((q, qIdx) => renderContentItem(q, qIdx, pIdx))
                                                    )}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                </div>
                            ))}
                        </DragDropContext>
                    </div>
                </main>

                {/* Hidden file input for watermark image */}
                <input
                    ref={watermarkImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleWatermarkImageUpload}
                />

                {/* Watermark Settings Panel */}
                {showWatermarkPanel && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 print:hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-5 w-[380px] animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                                    <Droplets size={16} className="text-cyan-500" />
                                    ลายน้ำ (Watermark)
                                </h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={watermark.enabled}
                                        onChange={(e) => setWatermark(prev => ({ ...prev, enabled: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                                </label>
                            </div>

                            {/* Type selector */}
                            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-4">
                                <button
                                    onClick={() => setWatermark(prev => ({ ...prev, type: 'text' }))}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${watermark.type === 'text' ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
                                >
                                    📝 ข้อความ
                                </button>
                                <button
                                    onClick={() => setWatermark(prev => ({ ...prev, type: 'image' }))}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${watermark.type === 'image' ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
                                >
                                    🖼️ รูปภาพ
                                </button>
                            </div>

                            {/* Text input or Image upload */}
                            {watermark.type === 'text' ? (
                                <div className="mb-4">
                                    <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1.5">ข้อความลายน้ำ</label>
                                    <input
                                        type="text"
                                        value={watermark.text}
                                        onChange={(e) => setWatermark(prev => ({ ...prev, text: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                                        placeholder="ข้อความลายน้ำ..."
                                    />
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1.5">รูปภาพลายน้ำ</label>
                                    {watermark.imageUrl ? (
                                        <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                                            <img src={watermark.imageUrl} alt="watermark" className="w-12 h-12 object-contain rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-1" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">รูปภาพที่เลือก</p>
                                            </div>
                                            <button
                                                onClick={() => watermarkImageInputRef.current?.click()}
                                                className="text-[10px] text-cyan-600 font-bold hover:underline"
                                            >เปลี่ยน</button>
                                            <button
                                                onClick={() => setWatermark(prev => ({ ...prev, imageUrl: '' }))}
                                                className="text-[10px] text-red-500 font-bold hover:underline"
                                            >ลบ</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => watermarkImageInputRef.current?.click()}
                                            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 dark:text-slate-500 hover:text-cyan-500 hover:border-cyan-300 transition-all flex items-center justify-center gap-2 text-xs font-medium"
                                        >
                                            <Upload size={16} />
                                            เลือกรูปภาพ
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Opacity slider */}
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">ความเข้ม</label>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">{watermark.opacity}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="40"
                                    value={watermark.opacity}
                                    onChange={(e) => setWatermark(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>

                            {/* Size slider */}
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">ขนาด</label>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">{watermark.fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="16"
                                    max="120"
                                    value={watermark.fontSize}
                                    onChange={(e) => setWatermark(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>

                            {/* Rotation slider */}
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">มุมเอียง</label>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">{watermark.rotation}°</span>
                                </div>
                                <input
                                    type="range"
                                    min="-90"
                                    max="90"
                                    value={watermark.rotation}
                                    onChange={(e) => setWatermark(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>

                            {/* Tile toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                                <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">เรียงซ้ำเต็มหน้า</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={watermark.tile}
                                        onChange={(e) => setWatermark(prev => ({ ...prev, tile: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 print:hidden floating-toolbar max-w-[calc(100vw-1rem)]">
                    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
                        {!selectedItemId ? (
                            <>
                                <button onClick={handleAddText} className="p-3 hover:bg-blue-50 text-gray-500 dark:text-slate-400 hover:text-blue-600 rounded-xl transition-all" aria-label="เพิ่มกล่องข้อความ" title="เพิ่มกล่องข้อความ"><Type size={20} /></button>
                                <button onClick={handleAddMarkdown} className="p-3 hover:bg-teal-50 text-gray-500 dark:text-slate-400 hover:text-teal-600 rounded-xl transition-all" aria-label="เพิ่ม Markdown" title="เพิ่ม Markdown"><FileText size={20} /></button>
                                <button onClick={handleAddImage} className="p-3 hover:bg-purple-50 text-gray-500 dark:text-slate-400 hover:text-purple-600 rounded-xl transition-all" aria-label="เพิ่มรูปภาพ" title="เพิ่มรูปภาพ"><ImageIcon size={20} /></button>
                                <button onClick={handleAddDivider} className="p-3 hover:bg-rose-50 text-gray-500 dark:text-slate-400 hover:text-rose-600 rounded-xl transition-all" aria-label="เพิ่มเส้นคั่น" title="เพิ่มเส้นคั่น"><Minus size={20} /></button>
                                <button onClick={() => setShowTemplatePicker(true)} className="p-3 hover:bg-green-50 text-gray-500 dark:text-slate-400 hover:text-green-700 rounded-xl transition-all" aria-label="เทมเพลตหน้า (Templates)" title="เทมเพลตหน้า (Templates)"><LayoutTemplate size={20} /></button>
                                <button onClick={() => setShowImportModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all" aria-label="Import จาก Gemini" title="Import จาก Gemini"><FileJson size={20} /></button>
                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>
                                <button onClick={undo} disabled={!canUndo} className={`p-3 rounded-xl transition-all ${canUndo ? 'hover:bg-amber-50 text-gray-500 dark:text-slate-400 hover:text-amber-600' : 'text-gray-200 cursor-not-allowed'}`} aria-label="ย้อนกลับ (Undo)" title="ย้อนกลับ (Undo)"><RotateCcw size={20} /></button>
                                <button onClick={redo} disabled={!canRedo} className={`p-3 rounded-xl transition-all ${canRedo ? 'hover:bg-amber-50 text-gray-500 dark:text-slate-400 hover:text-amber-600' : 'text-gray-200 cursor-not-allowed'}`} aria-label="ทำซ้ำ (Redo)" title="ทำซ้ำ (Redo)"><RotateCw size={20} /></button>
                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>
                                <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-3 hover:bg-gray-100 text-gray-500 dark:text-slate-400 rounded-xl transition-all" aria-label="ซูมออก" title="ซูมออก"><ZoomOut size={20} /></button>
                                <span className="text-xs text-gray-400 dark:text-slate-500 font-medium min-w-[40px] text-center select-none">{zoomLevel}%</span>
                                <button onClick={() => setZoomLevel(z => Math.min(150, z + 10))} className="p-3 hover:bg-gray-100 text-gray-500 dark:text-slate-400 rounded-xl transition-all" aria-label="ซูมเข้า" title="ซูมเข้า"><ZoomIn size={20} /></button>

                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>

                                <FontPicker value={fontId} onChange={setFontId} />

                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>
                                <button onClick={() => setIsViewOnly(!isViewOnly)} className={`p-3 rounded-xl transition-all ${isViewOnly ? 'bg-orange-50 text-orange-600' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100'}`} title={isViewOnly ? "โหมดมุมมอง (ดูอย่างเดียว)" : "โหมดแก้ไข"}>{isViewOnly ? <Hand size={20} /> : <MousePointer2 size={20} />}</button>
                                <button onClick={() => setShowSolution(!showSolution)} className={`p-3 rounded-xl transition-all ${showSolution ? 'bg-blue-50 text-blue-600' : 'text-gray-400 dark:text-slate-500'}`} aria-label="ซ่อน/แสดงเฉลย" title="ซ่อน/แสดงเฉลย">{showSolution ? <Eye size={20} /> : <EyeOff size={20} />}</button>
                                <button onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }} className={`p-3 rounded-xl transition-all ${showGrid ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100'}`} aria-label="เปิด/ปิดตารางกริด" title="เปิด/ปิดตารางกริด"><Grid3X3 size={20} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setShowWatermarkPanel(!showWatermarkPanel); }} className={`p-3 rounded-xl transition-all ${watermark.enabled ? 'bg-cyan-50 text-cyan-600' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100'}`} aria-label="ลายน้ำ" title="ลายน้ำ"><Droplets size={20} /></button>
                                <button onClick={() => window.print()} className="p-3 hover:bg-gray-100 text-gray-400 dark:text-slate-500 rounded-xl" aria-label="พิมพ์" title="พิมพ์"><Printer size={20} /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setSelectedItemId(null)} className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded-lg mr-2 hover:bg-gray-200 transition-colors" aria-label="ยกเลิกการเลือก" title="ยกเลิกการเลือก"><X size={16} /></button>

                                <button
                                    onClick={() => handleMoveItem(selectedItemId, 'up')}
                                    disabled={!selectedItemStatus.up}
                                    className={`p-3 rounded-xl transition-all ${selectedItemStatus.up ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-gray-200 cursor-not-allowed'}`}
                                    aria-label="เลื่อนขึ้น" title="เลื่อนขึ้น"
                                >
                                    <ChevronUp size={20} />
                                </button>

                                <button
                                    onClick={() => handleMoveItem(selectedItemId, 'down')}
                                    disabled={!selectedItemStatus.down}
                                    className={`p-3 rounded-xl transition-all ${selectedItemStatus.down ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-gray-200 cursor-not-allowed'}`}
                                    aria-label="เลื่อนลง" title="เลื่อนลง"
                                >
                                    <ChevronDown size={20} />
                                </button>

                                {isTextLikeSelected && (
                                    <>
                                        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>
                                        <div className="flex items-center gap-1.5 px-1 flex-shrink-0" title="ปรับขนาดตัวอักษร">
                                            <ALargeSmall size={18} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
                                            <input
                                                type="range"
                                                min={FONT_SCALE_MIN}
                                                max={FONT_SCALE_MAX}
                                                step={1}
                                                value={getEffectiveFontPx(selectedItem)}
                                                onChange={(e) => handleUpdateItem(selectedItemId, { fontScale: Number(e.target.value) })}
                                                className="w-20 sm:w-28 accent-blue-600 cursor-pointer"
                                                aria-label="ขนาดตัวอักษร"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium min-w-[34px] text-center select-none tabular-nums">{getEffectiveFontPx(selectedItem)}px</span>
                                            {typeof selectedItem.fontScale === 'number' && (
                                                <button
                                                    onClick={() => handleUpdateItem(selectedItemId, { fontScale: null })}
                                                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    aria-label="ขนาดอัตโนมัติ" title="กลับเป็นขนาดอัตโนมัติ"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>

                                <button onClick={handleAddText} className="p-3 hover:bg-blue-50 text-gray-500 dark:text-slate-400 hover:text-blue-600 rounded-xl transition-all" aria-label="แทรกข้อความ" title="แทรกข้อความ"><Type size={20} /></button>

                                <button onClick={handleAddMarkdown} className="p-3 hover:bg-teal-50 text-gray-500 dark:text-slate-400 hover:text-teal-600 rounded-xl transition-all" aria-label="แทรก Markdown" title="แทรก Markdown"><FileText size={20} /></button>

                                <button onClick={() => handleAddQuestionBelow(selectedItemId, { id: uuidv4(), type: 'image', src: '', size: 'medium' })} className="p-3 hover:bg-purple-50 text-gray-500 dark:text-slate-400 hover:text-purple-600 rounded-xl transition-all" aria-label="แทรกรูปภาพ" title="แทรกรูปภาพ"><ImageIcon size={20} /></button>

                                <button onClick={() => handleAddQuestionBelow(selectedItemId, { id: uuidv4(), type: 'divider', style: 'solid', thickness: 2, color: '#e5e7eb' })} className="p-3 hover:bg-gray-100 text-gray-500 dark:text-slate-400 hover:text-gray-700 rounded-xl transition-all" aria-label="แทรกเส้นคั่น" title="แทรกเส้นคั่น"><Minus size={20} /></button>

                                <button onClick={() => handleAddQuestionBelow(selectedItemId, { id: uuidv4(), type: 'spacer', height: 100 })} className="p-3 hover:bg-amber-50 text-gray-500 dark:text-slate-400 hover:text-amber-600 rounded-xl transition-all" aria-label="แทรกช่องว่าง" title="แทรกช่องว่าง"><MoveVertical size={20} /></button>

                                <button onClick={() => setShowTemplatePicker(true)} className="p-3 hover:bg-green-50 text-gray-500 dark:text-slate-400 hover:text-green-700 rounded-xl transition-all" aria-label="แทรกเทมเพลต (Templates)" title="แทรกเทมเพลต (Templates)"><LayoutTemplate size={20} /></button>

                                <button onClick={() => setShowImportModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all" aria-label="แทรกเนื้อหาด้วย AI (Gemini)" title="แทรกเนื้อหาด้วย AI (Gemini)"><Sparkles size={20} /></button>

                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>

                                <button onClick={() => handleDuplicateItem(selectedItemId)} className="p-3 hover:bg-gray-100 text-gray-500 dark:text-slate-400 hover:text-gray-700 rounded-xl transition-all" aria-label="ทำสำเนา (Duplicate)" title="ทำสำเนา (Duplicate)"><Copy size={20} /></button>

                                <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>

                                <button onClick={() => handleDeleteQuestion(selectedItemId)} className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all" aria-label="ลบรายการ" title="ลบรายการ"><Trash2 size={20} /></button>
                            </>
                        )}

                        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 mx-1"></div>

                        <div className="flex items-center gap-2 pr-1">
                            <button
                                onClick={handleManualSave}
                                disabled={!hasUnsavedChanges}
                                className={`h-11 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ${hasUnsavedChanges
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                    }`}
                                aria-label="บันทึกการเปลี่ยนแปลง" title="บันทึกการเปลี่ยนแปลง"
                            >
                                <Save size={18} />
                                บันทึก
                            </button>
                            <div className="flex flex-col min-w-[64px]">
                                {saveStatus === 'saving' && <span className="text-[11px] text-yellow-600 font-bold animate-pulse">กำลังบันทึก…</span>}
                                {saveStatus === 'saved' && <span className="text-[11px] text-green-600 font-bold">บันทึกแล้ว</span>}
                                {saveStatus === 'error' && <span className="text-[11px] text-red-600 font-bold">บันทึกไม่สำเร็จ</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={(e) => e.target === e.currentTarget && setShowImportModal(false)}>
                        <div
                            ref={importModalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="นำเข้าเนื้อหาจาก Gemini"
                            tabIndex={-1}
                            className="bg-white dark:bg-slate-900 w-full max-w-[1700px] h-[96vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200"
                        >
                            {/* Header */}
                            <div className="px-8 pt-8 pb-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 font-outfit flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <Sparkles size={16} className="text-white" />
                                            </div>
                                            นำเข้าเนื้อหา
                                        </h3>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 ml-[46px]">วางข้อมูลจาก Gemini AI แล้วเลือกประเภท</p>
                                    </div>
                                    <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-300 dark:text-slate-600 hover:text-gray-500 transition-colors"><X size={18} /></button>
                                </div>
                            </div>

                            <div className="px-8 pb-6 space-y-5 flex-1 flex flex-col min-h-0">
                                {/* Section Type Selector - Pill style like Image 2 */}
                                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                                    {[
                                        { id: 'content', icon: BookOpen, label: 'บทเรียน' },
                                        { id: 'practice', icon: PenTool, label: 'แบบฝึกหัด' },
                                        { id: 'exam', icon: FileQuestion, label: 'ข้อสอบ' },
                                        { id: 'summary', icon: Zap, label: 'สรุปสูตร' },
                                        { id: 'analysis', icon: Search, label: 'วิเคราะห์' },
                                    ].map(s => {
                                        const Icon = s.icon;
                                        const isActive = importSectionType === s.id;
                                        return (
                                            <button key={s.id} onClick={() => setImportSectionType(s.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-slate-800 text-white shadow-lg' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}>
                                                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Insert Position Indicator */}
                                {selectedItemId && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                        <ArrowDown size={14} className="text-amber-500" />
                                        <span className="text-[11px] font-bold text-amber-700">แทรกต่อจากตำแหน่งที่เลือก</span>
                                    </div>
                                )}

                                {/* Textarea */}
                                <textarea
                                    className="w-full flex-1 min-h-0 p-4 bg-gray-50 dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 focus:border-blue-500 rounded-2xl font-mono text-sm outline-none resize-none transition-all placeholder:text-gray-300"
                                    placeholder="วางข้อมูล JSON หรือข้อความจาก Gemini ที่นี่..."
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-[10px] text-gray-300 dark:text-slate-600 font-medium">
                                    {!selectedItemId ? 'วางท้ายเอกสาร' : '📌 แทรกที่ตำแหน่ง'}
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowImportModal(false)} className="px-5 py-2.5 rounded-xl text-gray-400 dark:text-slate-500 font-bold hover:bg-gray-200 transition-all text-xs">ยกเลิก</button>
                                    <button onClick={handleImport} disabled={!importText.trim()}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 ${importText.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700' : 'bg-gray-200 text-gray-400 dark:text-slate-500 cursor-not-allowed'}`}>
                                        <Sparkles size={14} />
                                        นำเข้า
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Question Editor Modal */}
                <QuestionEditorModal
                    isOpen={!!editingQuestionId}
                    onClose={() => setEditingQuestionId(null)}
                    onSave={handleSaveEditedQuestion}
                    initialData={editingQuestionData}
                    addToast={addToast}
                />

                {/* Template Picker Modal */}
                <TemplatePicker
                    isOpen={showTemplatePicker}
                    onClose={() => setShowTemplatePicker(false)}
                    onInsertSection={handleInsertSectionTemplate}
                    onInsertPage={handleInsertPageTemplate}
                    onInsertDocument={handleInsertDocumentTemplate}
                />

                {/* Toast Notifications */}
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </div>
        </div>
    );
};

export default WorksheetEditor;
