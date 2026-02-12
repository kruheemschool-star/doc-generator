import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, FilePlus, ArrowLeft, Printer, Layout, StickyNote, Eye, EyeOff, Type, Image as ImageIcon, RotateCcw, RotateCw, Cloud, Check, Save, X, Edit, Maximize, ArrowDownToLine, FileJson, RefreshCw, Eraser, ChevronUp, ChevronDown, ZoomIn, ZoomOut, FileText, ALargeSmall, BookOpen, PenTool, Zap, Search, ArrowDown, Sparkles } from 'lucide-react';
import QuestionItem from './QuestionItem';
import kruheemLogo from '../assets/kruheem-logo.png';
import TextItem from './TextItem';
import ImageItem from './ImageItem';
import SpacerItem from './SpacerItem';
import MarkdownItem from './MarkdownItem';
import QuestionEditorModal from './QuestionEditorModal';
import ErrorBoundary from './ErrorBoundary';
import useAutoPagination from '../hooks/useAutoPagination';
import useHistory from '../hooks/useHistory';

const WorksheetEditor = ({ activeDocument, initialData, onSave, onBack }) => {
    // --- History State Management ---
    const {
        state: pages,
        set: setPages,
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

    // --- Auto-Save Effect ---
    const [saveStatus, setSaveStatus] = useState('saved');

    useEffect(() => {
        if (onSave && pages && pages.length > 0) {
            setSaveStatus('saving');
            const timer = setTimeout(() => {
                onSave(pages);
                setSaveStatus('saved');
            }, 1000); // 1s debounce
            return () => clearTimeout(timer);
        }
    }, [pages, onSave]);

    // View Mode & Zoom
    const [showSolution, setShowSolution] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [globalFontSize, setGlobalFontSize] = useState('medium');
    const [showDebug, setShowDebug] = useState(false);

    // --- Selection & Editing State ---
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);

    // --- Document Title State ---
    const [documentTitle, setDocumentTitle] = useState('');

    // --- Import Modal State ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importSectionType, setImportSectionType] = useState('content');
    const [importQuestionType, setImportQuestionType] = useState('objective');

    // --- Pagination Hook ---
    const { pageRefs } = useAutoPagination(pages, setPages);

    // --- State Cleanup & Recovery ---
    const handleTrimEmptyPages = useCallback(() => {
        setPages(prev => {
            if (!Array.isArray(prev)) return prev;
            // Keep pages that HAVE questions, or the VERY FIRST page
            const cleaned = prev.filter((p, idx) => p.questions.length > 0 || idx === 0);
            // If we filtered everything (somehow), ensure at least one
            if (cleaned.length === 0) return [{ id: uuidv4(), questions: [] }];
            return cleaned;
        });
    }, [setPages]);

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

    const handleAddText = () => handleAddQuestion({ id: uuidv4(), type: 'text', content: '', size: 'medium' });
    const handleAddImage = () => handleAddQuestion({ id: uuidv4(), type: 'image', src: '', size: 'medium' });
    const handleAddSpacer = () => handleAddQuestion({ id: uuidv4(), type: 'spacer', height: 100 });
    const handleAddMarkdown = () => handleAddQuestion({ id: uuidv4(), type: 'markdown', content: '> พิมพ์เนื้อหา Markdown ที่นี่...', size: 'medium' });

    const handleUpdateItem = useCallback((itemId, updates) => {
        setPages(prevPages => prevPages.map(page => ({
            ...page,
            questions: page.questions.map(q =>
                q.id === itemId ? { ...q, ...(typeof updates === 'string' ? { content: updates } : updates) } : q
            )
        })));
    }, [setPages]);

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

    const handleDeleteQuestion = (questionId) => {
        setPages((prevPages) => prevPages.map(page => ({
            ...page,
            questions: page.questions.filter(q => q.id !== questionId)
        })));
        if (selectedItemId === questionId) setSelectedItemId(null);
    };

    // --- Build Section Header Markdown ---
    const buildSectionHeader = (sectionType, questionType) => {
        const sectionMap = {
            content: { icon: '📖', label: 'บทเรียน' },
            practice: { icon: '✏️', label: 'แบบฝึกหัด' },
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

    const handleImport = () => {
        if (!importText.trim()) return;
        console.group("🚀 Import Process");

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
                parsed.forEach(q => itemsToAdd.push({
                    id: uuidv4(),
                    type: 'question',
                    question: q.question || '*(Question)*',
                    options: q.options || [],
                    solution: q.solution || '',
                    answer: q.answer || '',
                    spaceNeeded: q.space || 'medium'
                }));
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
        } finally {
            console.groupEnd();
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
            onEditEnd: () => setEditingItemId(null),
            canMoveUp: !isFirstItem,
            canMoveDown: !isLastItem
        };

        if (q.type === 'text') return (
            <ErrorBoundary key={q.id}>
                <TextItem {...commonProps} content={q.content} size={globalFontSize} />
            </ErrorBoundary>
        );
        if (q.type === 'markdown') return (
            <ErrorBoundary key={q.id}>
                <MarkdownItem {...commonProps} content={q.content} size={q.size || globalFontSize} />
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

        const qCountBefore = pages.slice(0, pageIndex).reduce((acc, p) => acc + (p.questions || []).filter(i => !['text', 'image', 'spacer', 'markdown'].includes(i.type)).length, 0);
        const qCountOnPageBefore = (pages[pageIndex]?.questions || []).slice(0, index).filter(i => !['text', 'image', 'spacer', 'markdown'].includes(i.type)).length;
        return (
            <ErrorBoundary key={q.id}>
                <QuestionItem {...commonProps} no={qCountBefore + qCountOnPageBefore + 1} question={q.question} type={q.type} options={q.options} solution={q.solution} spaceNeeded={q.spaceNeeded} fontSize={globalFontSize} showSolution={showSolution} />
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

    return (
        <div className="min-h-screen bg-[#f1f5f9] font-sans print:bg-white relative">
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
                            <button onClick={() => { console.log("Current Pages Store:", pages); alert("Logged to Browser Console (F12)"); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                                <FileJson size={14} /> LOG TO CONSOLE
                            </button>
                        </div>
                        <div className="mb-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 border-l-4 border-blue-500">
                            💡 <strong>Tip:</strong> หากเห็นหน้าจอว่างเปล่า ให้กดปุ่ม <strong>TRIM EMPTY PAGES</strong> เพื่อลบหน้าที่ว่างทิ้ง ข้อมูลจะกลับมาแสดงผลปกติ
                        </div>
                        <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-4 border border-white/5">{JSON.stringify(pages, null, 2)}</pre>
                    </div>
                </div>
            )}

            <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 h-16 shadow-sm print:hidden">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><ArrowLeft size={20} /></button>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-outfit">
                            <Layout size={18} className="text-blue-600" />
                            {activeDocument?.title || 'Untitled'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {saveStatus === 'saving' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold animate-pulse uppercase tracking-wider">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Saved</span>}
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-64px)] overflow-hidden print:h-auto print:block print:overflow-visible">
                <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-100/50 print:p-0 print:overflow-visible" onClick={() => setSelectedItemId(null)}>
                    <div className="max-w-[210mm] mx-auto space-y-10 print:space-y-0" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            {Array.isArray(pages) && pages.map((page, pIdx) => (
                                <div key={page.id} ref={el => pageRefs.current[page.id] = el} className="w-[210mm] min-h-[297mm] bg-white shadow-xl relative print:shadow-none print:break-after-page m-auto print:m-0 print:h-[297mm] print:overflow-hidden">
                                    <div className="absolute top-4 left-4 text-[10px] text-gray-300 font-bold print:hidden">PAGE {pIdx + 1}</div>
                                    {/* Page Header - คณิตครูฮีม */}
                                    <div className="absolute top-[8mm] left-[20mm] right-[20mm] flex items-center justify-between pointer-events-none select-none">
                                        <div className="flex items-center gap-2">
                                            <img src={kruheemLogo} alt="คณิตครูฮีม" className="w-5 h-5 object-contain" />
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
                                        </div>
                                    </div>
                                    <div className="p-[20mm] pt-[16mm]">
                                        <Droppable droppableId={page.id}>
                                            {(provided, snapshot) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className={`min-h-[200px] rounded-xl transition-all ${snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-200 ring-dashed' : ''}`}>
                                                    {page.questions.length === 0 ? (
                                                        <div className="h-64 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
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

                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 print:hidden floating-toolbar">
                    <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl p-2.5 flex items-center gap-2">
                        {!selectedItemId ? (
                            <>
                                <button onClick={handleAddText} className="p-3 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-xl transition-all" title="เพิ่มกล่องข้อความ"><Type size={20} /></button>
                                <button onClick={handleAddMarkdown} className="p-3 hover:bg-teal-50 text-gray-500 hover:text-teal-600 rounded-xl transition-all" title="เพิ่ม Markdown"><FileText size={20} /></button>
                                <button onClick={handleAddImage} className="p-3 hover:bg-purple-50 text-gray-500 hover:text-purple-600 rounded-xl transition-all" title="เพิ่มรูปภาพ"><ImageIcon size={20} /></button>
                                <button onClick={() => setShowImportModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all" title="Import จาก Gemini"><FileJson size={20} /></button>
                                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                <button onClick={undo} disabled={!canUndo} className={`p-3 rounded-xl transition-all ${canUndo ? 'hover:bg-amber-50 text-gray-500 hover:text-amber-600' : 'text-gray-200 cursor-not-allowed'}`} title="ย้อนกลับ (Undo)"><RotateCcw size={20} /></button>
                                <button onClick={redo} disabled={!canRedo} className={`p-3 rounded-xl transition-all ${canRedo ? 'hover:bg-amber-50 text-gray-500 hover:text-amber-600' : 'text-gray-200 cursor-not-allowed'}`} title="ทำซ้ำ (Redo)"><RotateCw size={20} /></button>
                                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-3 hover:bg-gray-100 text-gray-500 rounded-xl transition-all" title="ซูมออก"><ZoomOut size={20} /></button>
                                <span className="text-xs text-gray-400 font-medium min-w-[40px] text-center select-none">{zoomLevel}%</span>
                                <button onClick={() => setZoomLevel(z => Math.min(150, z + 10))} className="p-3 hover:bg-gray-100 text-gray-500 rounded-xl transition-all" title="ซูมเข้า"><ZoomIn size={20} /></button>
                                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                <div className="relative group/font">
                                    <button className="p-3 hover:bg-gray-100 text-gray-500 rounded-xl transition-all" title="ขนาดฟอนต์"><ALargeSmall size={20} /></button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/font:flex flex-col bg-white border border-gray-200 rounded-xl shadow-xl p-1 min-w-[120px]">
                                        {[{label: 'เล็ก', value: 'small'}, {label: 'ปกติ', value: 'medium'}, {label: 'ใหญ่', value: 'large'}, {label: 'ใหญ่มาก', value: 'xl'}].map(f => (
                                            <button key={f.value} onClick={() => setGlobalFontSize(f.value)} className={`text-left px-3 py-1.5 rounded-lg text-sm transition-all ${globalFontSize === f.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                <button onClick={() => setShowSolution(!showSolution)} className={`p-3 rounded-xl transition-all ${showSolution ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`} title="ซ่อน/แสดงเฉลย">{showSolution ? <Eye size={20} /> : <EyeOff size={20} />}</button>
                                <button onClick={() => window.print()} className="p-3 hover:bg-gray-100 text-gray-400 rounded-xl" title="พิมพ์"><Printer size={20} /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setSelectedItemId(null)} className="p-2 bg-gray-100 text-gray-400 rounded-lg mr-2 hover:bg-gray-200 transition-colors"><X size={16} /></button>

                                <button
                                    onClick={() => handleMoveItem(selectedItemId, 'up')}
                                    disabled={!selectedItemStatus.up}
                                    className={`p-3 rounded-xl transition-all ${selectedItemStatus.up ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-gray-200 cursor-not-allowed'}`}
                                    title="Move Up"
                                >
                                    <ChevronUp size={20} />
                                </button>

                                <button
                                    onClick={() => handleMoveItem(selectedItemId, 'down')}
                                    disabled={!selectedItemStatus.down}
                                    className={`p-3 rounded-xl transition-all ${selectedItemStatus.down ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-gray-200 cursor-not-allowed'}`}
                                    title="Move Down"
                                >
                                    <ChevronDown size={20} />
                                </button>

                                <div className="w-px h-8 bg-gray-100 mx-1"></div>

                                <button onClick={() => handleAddQuestionBelow(selectedItemId, { id: uuidv4(), type: 'image', src: '', size: 'medium' })} className="p-3 hover:bg-purple-50 text-gray-500 hover:text-purple-600 rounded-xl transition-all" title="แทรกรูปภาพ"><ImageIcon size={20} /></button>

                                <button onClick={() => setShowImportModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all" title="แทรกเนื้อหาตรงนี้"><Plus size={20} /></button>

                                <div className="w-px h-8 bg-gray-100 mx-1"></div>

                                <button onClick={() => handleDeleteQuestion(selectedItemId)} className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all" title="Delete"><Trash2 size={20} /></button>
                            </>
                        )}
                    </div>
                </div>

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={(e) => e.target === e.currentTarget && setShowImportModal(false)}>
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                            {/* Header */}
                            <div className="px-8 pt-8 pb-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 font-outfit flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <Sparkles size={16} className="text-white" />
                                            </div>
                                            นำเข้าเนื้อหา
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1.5 ml-[46px]">วางข้อมูลจาก Gemini AI แล้วเลือกประเภท</p>
                                    </div>
                                    <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-300 hover:text-gray-500 transition-colors"><X size={18} /></button>
                                </div>
                            </div>

                            <div className="px-8 pb-6 space-y-5">
                                {/* Section Type Selector - Pill style like Image 2 */}
                                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl">
                                    {[
                                        { id: 'content', icon: BookOpen, label: 'บทเรียน' },
                                        { id: 'practice', icon: PenTool, label: 'แบบฝึกหัด' },
                                        { id: 'summary', icon: Zap, label: 'สรุปสูตร' },
                                        { id: 'analysis', icon: Search, label: 'วิเคราะห์' },
                                    ].map(s => {
                                        const Icon = s.icon;
                                        const isActive = importSectionType === s.id;
                                        return (
                                            <button key={s.id} onClick={() => setImportSectionType(s.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-slate-800 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
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
                                    className="w-full h-56 p-4 bg-gray-50 border-2 border-gray-100 focus:border-blue-500 rounded-2xl font-mono text-sm outline-none resize-none transition-all placeholder:text-gray-300"
                                    placeholder="วางข้อมูล JSON หรือข้อความจาก Gemini ที่นี่..."
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] text-gray-300 font-medium">
                                    {!selectedItemId ? 'วางท้ายเอกสาร' : '📌 แทรกที่ตำแหน่ง'}
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowImportModal(false)} className="px-5 py-2.5 rounded-xl text-gray-400 font-bold hover:bg-gray-200 transition-all text-xs">ยกเลิก</button>
                                    <button onClick={handleImport} disabled={!importText.trim()}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 ${importText.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                                        <Sparkles size={14} />
                                        นำเข้า
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorksheetEditor;
