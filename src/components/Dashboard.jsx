import React, { useState, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Folder, FolderOpen, FileText, Plus, Calendar, Search, BookOpen,
    MoreVertical, Clock, ChevronRight, Trash2, Copy, Star, Target,
    Calculator, Ruler, ClipboardList, BookMarked, GraduationCap,
    Pencil, X, ArrowLeft, FolderPlus, LayoutGrid, List, Check,
    CheckSquare, Square, RotateCcw, AlertTriangle, ArrowUpDown,
    SortAsc, SortDesc, Sparkles
} from 'lucide-react';

// --- Curriculum Data ---
const CURRICULUM_DATA = {
    "M1": { "Term 1": ["Integers", "Fractions", "Decimals", "Indices"], "Term 2": ["Ratios", "Linear Equations", "Geometry Basics"] },
    "M2": { "Term 1": ["Exponents", "Real Numbers", "Pythagoras", "Surface Area"], "Term 2": ["Polynomials", "Factorization", "Parallel Lines"] },
    "M3": { "Term 1": ["Linear Inequalities", "Quadratic Equations", "Probability"], "Term 2": ["Similarity", "Trigonometry", "Circle Geometry"] },
    "M4": { "Term 1": ["Sets", "Logic", "Real Number System"], "Term 2": ["Relations & Functions", "Conic Sections"] },
    "M5": { "Term 1": ["Exponential & Logarithmic", "Trigonometric Functions"], "Term 2": ["Vectors", "Complex Numbers", "Permutation & Combination"] },
    "M6": { "Term 1": ["Statistics", "Calculus I (Limit & Continuity)"], "Term 2": ["Calculus II (Integrals)", "Probability Distribution"] }
};

// --- Folder Colors & Icons ---
const FOLDER_COLORS = {
    blue: { gradient: 'from-cyan-400 to-teal-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100', accent: 'bg-blue-500', ring: 'ring-blue-400/30' },
    purple: { gradient: 'from-purple-400 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100', accent: 'bg-purple-500', ring: 'ring-purple-400/30' },
    green: { gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100', accent: 'bg-emerald-500', ring: 'ring-emerald-400/30' },
    red: { gradient: 'from-rose-400 to-red-500', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', iconBg: 'bg-rose-100', accent: 'bg-rose-500', ring: 'ring-rose-400/30' },
    orange: { gradient: 'from-orange-400 to-amber-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', iconBg: 'bg-orange-100', accent: 'bg-orange-500', ring: 'ring-orange-400/30' },
    pink: { gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', iconBg: 'bg-pink-100', accent: 'bg-pink-500', ring: 'ring-pink-400/30' },
    yellow: { gradient: 'from-yellow-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100', accent: 'bg-amber-500', ring: 'ring-amber-400/30' },
    gray: { gradient: 'from-slate-400 to-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', iconBg: 'bg-gray-100', accent: 'bg-gray-500', ring: 'ring-gray-400/30' },
};

const FOLDER_ICONS = {
    folder: Folder,
    book: BookOpen,
    file: FileText,
    calculator: Calculator,
    ruler: Ruler,
    target: Target,
    star: Star,
    clipboard: ClipboardList,
};

const FolderPreview = ({ color, icon, name }) => {
    const Icon = FOLDER_ICONS[icon] || Folder;
    return (
        <div className="inline-flex items-center gap-3 relative overflow-hidden" style={{ backgroundColor: 'var(--ink)', borderRadius: 16, padding: '16px 18px', minWidth: 200 }}>
            <Icon size={22} strokeWidth={2} style={{ color: 'var(--accent)' }} />
            <span className="font-bold text-[15px] font-thai" style={{ color: '#f6f3ec' }}>{name || 'ชื่อโฟลเดอร์'}</span>
        </div>
    );
};

const Dashboard = ({ documents, folders = [], trashedDocs = [], onViewChange, onOpenDocument, onCreateDocument, onDeleteDocument, onUpdateDocument, onBatchDelete, onRestoreDocument, onPermanentDelete, onEmptyTrash, onCreateFolder, onUpdateFolder, onDeleteFolder, onMoveDocToFolder, onDuplicateDocument }) => {
    // --- State ---
    const [selectedGrade, setSelectedGrade] = useState('M1');
    const [selectedTerm, setSelectedTerm] = useState('Term 1');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newDocData, setNewDocData] = useState({ title: '', topic: '' });
    const [newFolderData, setNewFolderData] = useState({ name: '', color: 'blue', icon: 'folder' });
    const [editingFolder, setEditingFolder] = useState(null);
    const [contextMenuFolder, setContextMenuFolder] = useState(null);

    const [draggedDocId, setDraggedDocId] = useState(null);
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    const [viewMode, setViewMode] = useState('list');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedDocs, setSelectedDocs] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [editingDocId, setEditingDocId] = useState(null);
    const [editingDocData, setEditingDocData] = useState({ title: '', topic: '' });
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [pendingEmptyTrash, setPendingEmptyTrash] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false); // presentation-only: reveal the search field

    // --- Derived Data ---
    const availableTopics = CURRICULUM_DATA[selectedGrade]?.[selectedTerm] || [];
    const currentFolder = folders.find(f => f.id === currentFolderId);

    const gradeFolders = useMemo(
        () => folders.filter(f => f.grade === selectedGrade && f.term === selectedTerm),
        [folders, selectedGrade, selectedTerm]
    );

    const filteredDocs = useMemo(() => documents.filter(doc => {
        if (doc.grade !== selectedGrade || doc.term !== selectedTerm) return false;
        if (currentFolderId) return doc.folderId === currentFolderId;
        return !doc.folderId || !folders.some(f => f.id === doc.folderId && f.grade === selectedGrade && f.term === selectedTerm);
    }), [documents, selectedGrade, selectedTerm, currentFolderId, folders]);

    const searchResults = useMemo(() => searchQuery.trim()
        ? documents.filter(doc =>
            // Scope search to the grade/term currently in view so M1 doesn't surface M3 docs.
            doc.grade === selectedGrade && doc.term === selectedTerm && (
                doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.topic?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : null,
        [documents, searchQuery, selectedGrade, selectedTerm]
    );

    const docsToShow = useMemo(() => {
        const arr = searchResults || filteredDocs;
        const sorted = [...arr];
        // Compare as timestamps so malformed/missing dates can't sort lexicographically wrong.
        const ts = (d) => { const n = Date.parse(d?.date); return Number.isNaN(n) ? 0 : n; };
        if (sortBy === 'newest') sorted.sort((a, b) => ts(b) - ts(a));
        else if (sortBy === 'oldest') sorted.sort((a, b) => ts(a) - ts(b));
        else if (sortBy === 'alphabetical') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        return sorted;
    }, [searchResults, filteredDocs, sortBy]);

    const docCountByGrade = useCallback(
        (grade) => documents.filter(d => d.grade === grade).length,
        [documents]
    );

    // --- Handlers ---
    const handleCreateDoc = () => {
        if (!newDocData.title.trim()) return;
        const newDoc = {
            id: uuidv4(),
            title: newDocData.title,
            grade: selectedGrade,
            term: selectedTerm,
            topic: 'Untitled',
            date: new Date().toISOString().split('T')[0],
            folderId: currentFolderId || null
        };
        onCreateDocument && onCreateDocument(newDoc);
        setIsDocModalOpen(false);
        setNewDocData({ title: '', topic: '' });
    };

    const handleCreateFolder = () => {
        if (!newFolderData.name.trim()) return;
        if (editingFolder) {
            onUpdateFolder && onUpdateFolder(editingFolder.id, newFolderData);
            setEditingFolder(null);
        } else {
            onCreateFolder && onCreateFolder({ ...newFolderData, grade: selectedGrade, term: selectedTerm });
        }
        setIsFolderModalOpen(false);
        setNewFolderData({ name: '', color: 'blue', icon: 'folder' });
    };

    const openEditFolder = (folder) => {
        setEditingFolder(folder);
        setNewFolderData({ name: folder.name, color: folder.color, icon: folder.icon });
        setContextMenuFolder(null);
        setIsFolderModalOpen(true);
    };

    const handleDragStart = (e, docId) => { setDraggedDocId(docId); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, folderId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolderId(folderId); };
    const handleDragLeave = () => setDragOverFolderId(null);
    const handleDrop = (e, folderId) => { e.preventDefault(); const folderExists = folders.some(f => f.id === folderId); if (draggedDocId && folderId && folderExists) onMoveDocToFolder && onMoveDocToFolder(draggedDocId, folderId); setDraggedDocId(null); setDragOverFolderId(null); };
    const handleDropOutside = (e) => { if (draggedDocId && currentFolderId) onMoveDocToFolder && onMoveDocToFolder(draggedDocId, null); setDraggedDocId(null); setDragOverFolderId(null); };

    const startEditDoc = (doc) => { setEditingDocId(doc.id); setEditingDocData({ title: doc.title || '', topic: doc.topic || '' }); };
    const saveEditDoc = () => { if (editingDocId && editingDocData.title.trim()) onUpdateDocument && onUpdateDocument(editingDocId, editingDocData); setEditingDocId(null); };

    const toggleSelectDoc = (docId) => { setSelectedDocs(prev => { const next = new Set(prev); if (next.has(docId)) next.delete(docId); else next.add(docId); return next; }); };
    const toggleSelectAll = () => { if (selectedDocs.size === docsToShow.length) setSelectedDocs(new Set()); else setSelectedDocs(new Set(docsToShow.map(d => d.id))); };
    const handleBatchDeleteSelected = () => { if (selectedDocs.size === 0) return; onBatchDelete && onBatchDelete([...selectedDocs]); setSelectedDocs(new Set()); setIsSelectMode(false); };

    // Rail section label (overline) — small uppercase caption inside the dark rail
    const RailLabel = ({ children }) => (
        <div className="px-4 mb-2 mt-5">
            <span
                className="text-[10px] font-bold uppercase font-display"
                style={{ color: '#7d756a', letterSpacing: '0.12em' }}
            >{children}</span>
        </div>
    );

    // Content section label — 13px/700 ink text + a 1px --line rule flowing right (spec §7.2)
    const SectionLabel = ({ children, right }) => (
        <div className="flex items-center gap-4 mb-4">
            <span
                className="font-thai whitespace-nowrap"
                style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 700 }}
            >{children}</span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--line)' }} />
            {right}
        </div>
    );

    // Type tag for recent-doc rows (spec §7.4 / §9.2): ใบงาน=accent, ข้อสอบ=ink, แผน=muted
    const docTypeTag = (doc) => {
        const t = `${doc.title || ''} ${doc.topic || ''}`;
        if (/ข้อสอบ|สอบ|exam|test/i.test(t)) return { label: 'ข้อสอบ', color: 'var(--ink)' };
        if (/แผน|plan|lesson/i.test(t)) return { label: 'แผน', color: 'var(--text-4)' };
        return { label: 'ใบงาน', color: 'var(--accent)' };
    };

    return (
        <div className="flex min-h-screen font-thai" style={{ backgroundColor: 'var(--canvas)' }} onClick={() => setContextMenuFolder(null)}>
            {/* ═══════ EDITORIAL DARK RAIL (228px) ═══════ */}
            <aside
                className="w-[228px] fixed top-0 left-0 h-screen z-50 flex flex-col print:hidden"
                style={{ backgroundColor: 'var(--ink)' }}
            >
                {/* Brand — K mark (accent) + wordmark */}
                <div className="px-5 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center text-white"
                            style={{
                                width: 38, height: 38, borderRadius: 11,
                                backgroundColor: 'var(--accent)',
                                fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18,
                            }}
                        >K</div>
                        <div className="flex flex-col">
                            <span
                                className="leading-none"
                                style={{ color: '#f6f3ec', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}
                            >KruHeem</span>
                            <span
                                className="mt-1.5"
                                style={{ color: '#7d756a', fontFamily: 'Sora, sans-serif', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em' }}
                            >MATHCRAFT AI</span>
                        </div>
                    </div>
                </div>

                {/* Workspace nav */}
                <RailLabel>Workspace</RailLabel>
                <div className="px-3 space-y-1">
                    {[
                        { id: 'docs', icon: LayoutGrid, label: 'เอกสารทั้งหมด', count: documents.length, active: !showTrash,
                          onClick: () => { setShowTrash(false); setSelectedDocs(new Set()); setIsSelectMode(false); } },
                        { id: 'trash', icon: Trash2, label: 'ถังขยะ', count: trashedDocs.length, active: showTrash,
                          onClick: () => { setShowTrash(true); setSelectedDocs(new Set()); setIsSelectMode(false); setCurrentFolderId(null); setSearchQuery(''); } },
                        { id: 'prompt', icon: Sparkles, label: 'Prompt Builder', count: 0, active: false,
                          onClick: () => onViewChange && onViewChange('prompt-builder') },
                    ].map(item => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.id}
                                onClick={item.onClick}
                                className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
                                style={{
                                    borderRadius: 10,
                                    backgroundColor: item.active ? 'var(--ink-soft)' : 'transparent',
                                    color: item.active ? '#f6f3ec' : '#9b9285',
                                }}
                                onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#cabfac'; } }}
                                onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9b9285'; } }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon size={17} strokeWidth={1.9} style={{ color: item.active ? 'var(--accent)' : 'inherit' }} />
                                    <span className="text-[13px] font-medium">{item.label}</span>
                                </div>
                                {item.count > 0 && (
                                    <span
                                        className="text-[11px]"
                                        style={{ color: item.active ? '#cabfac' : '#7d756a', fontFamily: 'Sora, sans-serif', fontWeight: 700 }}
                                    >{item.count}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Class Levels (M1–M6) */}
                <RailLabel>ระดับชั้น</RailLabel>
                <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1 pb-4">
                    {Object.keys(CURRICULUM_DATA).map(grade => {
                        const active = selectedGrade === grade && !showTrash;
                        const count = docCountByGrade(grade);
                        return (
                            <button
                                key={grade}
                                onClick={() => { setSelectedGrade(grade); setSelectedTerm('Term 1'); setCurrentFolderId(null); setSearchQuery(''); setShowTrash(false); }}
                                className="w-full flex items-center justify-between py-2 px-3 transition-colors"
                                style={{
                                    borderRadius: 10,
                                    backgroundColor: active ? 'var(--ink-soft)' : 'transparent',
                                }}
                                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14,
                                        color: active ? '#f6f3ec' : '#9b9285',
                                        letterSpacing: '-0.01em',
                                    }}
                                >{grade.replace('M', 'ม.')}</span>
                                <span
                                    style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: active ? 'var(--accent)' : '#7d756a' }}
                                >{count}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User block */}
                <div className="px-5 py-4" style={{ borderTop: '1px solid var(--ink-soft)' }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--ink-soft)', color: '#cabfac', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13 }}
                        >ค</div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold" style={{ color: '#f6f3ec' }}>ครูฮีม</span>
                            <span className="text-[11px]" style={{ color: '#7d756a' }}>บัญชีของฉัน</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ═══════ MAIN CONTENT ═══════ */}
            <main
                className="flex-1 overflow-y-auto"
                style={{ marginLeft: '228px', padding: 'var(--content-pad)', color: 'var(--text-2)' }}
                onDragOver={(e) => { if (draggedDocId) e.preventDefault(); }}
                onDrop={handleDropOutside}
            >

                {/* ═══════ HERO HEADER (Editorial Bold §7.1) ═══════ */}
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6" style={{ marginBottom: 38 }}>
                    <div className="min-w-0">
                        {/* Overline meta */}
                        <div
                            className="flex items-center gap-2 mb-3 uppercase"
                            style={{ fontFamily: 'Sora, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-4)' }}
                        >
                            <span
                                className="cursor-pointer transition-colors"
                                onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-1)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-4)'}
                            >เอกสารของฉัน</span>
                            <span style={{ color: 'var(--text-5)' }}>·</span>
                            <span>{selectedGrade.replace('M', 'ม.')}</span>
                            {currentFolder && (<>
                                <span style={{ color: 'var(--text-5)' }}>·</span>
                                <span style={{ color: 'var(--text-2)' }}>{currentFolder.name}</span>
                            </>)}
                        </div>

                        {/* Display XL — "ม.X." (trailing dot in accent) */}
                        <h2
                            className="tracking-tight"
                            style={{ fontFamily: 'Sora, sans-serif', fontSize: 60, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.045em', color: 'var(--text-1)' }}
                        >
                            {currentFolder ? (
                                <span className="font-thai" style={{ fontSize: 40, letterSpacing: '-0.02em' }}>{currentFolder.name}</span>
                            ) : (
                                <>
                                    {selectedGrade.replace('M', 'ม.')}
                                    <span style={{ color: 'var(--accent)' }}>.</span>
                                </>
                            )}
                        </h2>

                        {/* Term tabs (pills) */}
                        {!currentFolderId && !searchQuery && (
                            <div className="flex items-center gap-2 mt-5">
                                {[['Term 1', 'เทอม 1'], ['Term 2', 'เทอม 2']].map(([term, label]) => {
                                    const active = selectedTerm === term;
                                    return (
                                        <button
                                            key={term}
                                            onClick={() => setSelectedTerm(term)}
                                            className="font-thai transition-colors"
                                            style={{
                                                fontSize: 12.5, fontWeight: 600,
                                                padding: '7px 16px', borderRadius: 30,
                                                backgroundColor: active ? 'var(--ink)' : 'var(--paper)',
                                                color: active ? '#fff' : 'var(--text-2)',
                                                border: active ? '1px solid var(--ink)' : '1px solid var(--line)',
                                            }}
                                        >{label}</button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right cluster: search icon + primary button + stat block */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {searchOpen || searchQuery ? (
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                                <input
                                    type="text"
                                    placeholder="ค้นหาเอกสาร..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                                    className="pl-9 pr-9 py-2.5 text-[13px] w-56 outline-none font-thai"
                                    style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text-2)' }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--text-4)'}
                                />
                                {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }}><X size={14} /></button>}
                            </div>
                        ) : (
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="flex items-center justify-center transition-colors"
                                style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--line)', backgroundColor: 'var(--paper)', color: 'var(--text-3)' }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-4)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                                title="ค้นหา"
                            ><Search size={16} /></button>
                        )}

                        <button
                            onClick={() => setIsDocModalOpen(true)}
                            className="flex items-center gap-2 font-thai transition-colors"
                            style={{ height: 40, padding: '0 16px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700 }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-press)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                        ><Plus size={17} strokeWidth={2.5} /> สร้างเอกสาร</button>

                        {/* Stat block */}
                        <div className="flex items-center gap-2.5 pl-4" style={{ borderLeft: '1px solid var(--line)' }}>
                            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 34, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>{docsToShow.length}</span>
                            <span className="font-thai" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-4)', lineHeight: 1.25, maxWidth: 76 }}>เอกสารในชั้นนี้</span>
                        </div>
                    </div>
                </header>

                {/* ═══ TRASH VIEW ═══ */}
                {showTrash ? (
                    <div>
                        <SectionLabel
                            right={trashedDocs.length > 0 && (
                                pendingEmptyTrash ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-thai" style={{ color: 'var(--text-3)' }}>ล้างทั้งหมด?</span>
                                        <button onClick={() => { onEmptyTrash && onEmptyTrash(); setPendingEmptyTrash(false); }} className="font-thai" style={{ fontSize: 12, fontWeight: 700, color: '#fff', backgroundColor: 'var(--danger)', borderRadius: 8, padding: '6px 12px' }}>ยืนยัน</button>
                                        <button onClick={() => setPendingEmptyTrash(false)} className="font-thai" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', backgroundColor: 'var(--paper-2)', borderRadius: 8, padding: '6px 12px' }}>ยกเลิก</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setPendingEmptyTrash(true)} className="flex items-center gap-2 font-thai" style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', border: '1px solid var(--line)', borderRadius: 9, padding: '6px 12px' }}><Trash2 size={13} /> ล้างถังขยะ</button>
                                )
                            )}
                        >ถังขยะ · {trashedDocs.length}</SectionLabel>
                        {trashedDocs.length === 0 ? (
                            <div className="mt-16 flex flex-col items-center justify-center">
                                <div className="flex items-center justify-center mb-4" style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--paper-2)' }}><Trash2 size={22} style={{ color: 'var(--text-5)' }} /></div>
                                <p className="font-thai text-[15px] font-medium" style={{ color: 'var(--text-3)' }}>ถังขยะว่างเปล่า</p>
                                <p className="font-thai text-[13px]" style={{ color: 'var(--text-4)' }}>เอกสารที่ลบจะปรากฎที่นี่</p>
                            </div>
                        ) : (
                            <div>
                                {trashedDocs.map(doc => (
                                    <div key={doc.id} className="group flex items-center gap-4 py-3.5 transition-colors" style={{ borderBottom: '1px solid var(--line)' }}>
                                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'var(--paper-2)', color: 'var(--text-4)' }}><FileText size={16} /></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-thai font-bold text-[15px] truncate" style={{ color: 'var(--text-2)' }}>{doc.title}</h4>
                                            <p className="font-thai text-[11.5px]" style={{ color: 'var(--text-4)' }}>{doc.topic} · ลบเมื่อ {new Date(doc.deletedAt).toLocaleDateString('th-TH')}</p>
                                        </div>
                                        <div className="flex items-center gap-2 transition-all">
                                            <button onClick={() => onRestoreDocument && onRestoreDocument(doc.id)} className="flex items-center gap-1 font-thai" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 11px' }}><RotateCcw size={12} /> กู้คืน</button>
                                            {pendingDeleteId === doc.id ? (
                                                <>
                                                    <button onClick={() => { onPermanentDelete && onPermanentDelete(doc.id); setPendingDeleteId(null); }} className="flex items-center gap-1 font-thai" style={{ fontSize: 12, fontWeight: 700, color: '#fff', backgroundColor: 'var(--danger)', borderRadius: 8, padding: '5px 11px' }}><Trash2 size={12} /> ยืนยัน</button>
                                                    <button onClick={() => setPendingDeleteId(null)} className="font-thai" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', backgroundColor: 'var(--paper-2)', borderRadius: 8, padding: '5px 11px' }}>ยกเลิก</button>
                                                </>
                                            ) : (
                                                <button onClick={() => setPendingDeleteId(doc.id)} className="flex items-center gap-1 font-thai" style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 11px' }}><Trash2 size={12} /> ลบถาวร</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {currentFolderId && (
                            <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-2 font-thai text-[13px] font-semibold mb-6 transition-colors" style={{ color: 'var(--text-3)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-1)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}><ArrowLeft size={16} /><span>กลับไปทุกโฟลเดอร์</span></button>
                        )}

                        {searchResults && (
                            <div className="mb-6 font-thai text-[13px]" style={{ color: 'var(--text-3)' }}>
                                พบ <strong style={{ color: 'var(--text-1)', fontFamily: 'Sora, sans-serif' }}>{searchResults.length}</strong> รายการสำหรับ "<em style={{ color: 'var(--text-2)' }}>{searchQuery}</em>"
                            </div>
                        )}

                        {/* ═══ FOLDERS (Editorial §7.3 — 3-col grid, shadow numbers) ═══ */}
                        {!currentFolderId && !searchQuery && (
                            <div style={{ marginBottom: 38 }}>
                                <SectionLabel>โฟลเดอร์</SectionLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {gradeFolders.map((folder, idx) => {
                                        const IconComponent = FOLDER_ICONS[folder.icon] || Folder;
                                        const folderDocCount = documents.filter(d => d.folderId === folder.id).length;
                                        const isDragOver = dragOverFolderId === folder.id;
                                        const dark = idx === 0; // first card = active dark card
                                        return (
                                            <div
                                                key={folder.id}
                                                onClick={() => setCurrentFolderId(folder.id)}
                                                onDragOver={(e) => handleDragOver(e, folder.id)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
                                                className="relative group cursor-pointer overflow-hidden transition-all"
                                                style={{
                                                    height: 120,
                                                    borderRadius: 18,
                                                    backgroundColor: dark ? 'var(--ink)' : 'var(--paper)',
                                                    border: dark ? '1px solid var(--ink)' : '1px solid var(--line)',
                                                    boxShadow: isDragOver ? '0 4px 14px -8px rgba(20,18,15,.5)' : 'none',
                                                    transform: isDragOver ? 'translateY(-2px)' : 'none',
                                                }}
                                            >
                                                {/* Shadow number (top-right) */}
                                                <span
                                                    className="absolute select-none"
                                                    style={{
                                                        top: -14, right: 12,
                                                        fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 80, lineHeight: 1,
                                                        letterSpacing: '-0.05em',
                                                        color: dark ? 'var(--ink-soft)' : 'var(--paper-2)',
                                                    }}
                                                >{folderDocCount}</span>

                                                {/* Folder icon (top-left, accent stroke) */}
                                                <div className="absolute" style={{ top: 16, left: 16 }}>
                                                    <IconComponent size={22} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                                                </div>

                                                {/* Folder name (bottom-left) */}
                                                <h4
                                                    className="absolute line-clamp-2"
                                                    style={{
                                                        left: 16, right: 44, bottom: 16,
                                                        fontFamily: '"IBM Plex Sans Thai", sans-serif',
                                                        fontSize: 17, fontWeight: 700, lineHeight: 1.25,
                                                        color: dark ? '#f6f3ec' : 'var(--text-1)',
                                                    }}
                                                >{folder.name}</h4>

                                                {/* More button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setContextMenuFolder(contextMenuFolder === folder.id ? null : folder.id); }}
                                                    className="absolute transition-all"
                                                    aria-label="ตัวเลือกโฟลเดอร์เพิ่มเติม"
                                                    style={{ bottom: 12, right: 10, padding: 4, borderRadius: 6, color: dark ? '#cabfac' : 'var(--text-4)' }}
                                                >
                                                    <MoreVertical size={15} />
                                                </button>

                                                {contextMenuFolder === folder.id && (
                                                    <div
                                                        className="absolute z-20 py-1 min-w-[140px]"
                                                        style={{
                                                            bottom: 36, right: 8,
                                                            backgroundColor: 'var(--paper)',
                                                            border: '1px solid var(--line)',
                                                            borderRadius: 10,
                                                            boxShadow: '0 4px 14px -8px rgba(40,44,80,.4)',
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => openEditFolder(folder)}
                                                            className="w-full text-left px-3 py-1.5 text-[13px] font-thai flex items-center gap-2 transition-colors"
                                                            style={{ color: 'var(--text-2)' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--paper-2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        ><Pencil size={13} /> แก้ไข</button>
                                                        <button
                                                            onClick={() => { onDeleteFolder && onDeleteFolder(folder.id); setContextMenuFolder(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-[13px] font-thai flex items-center gap-2 transition-colors"
                                                            style={{ color: 'var(--danger)' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        ><Trash2 size={13} /> ลบ</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* New Folder card */}
                                    <button
                                        onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                        className="group flex flex-col items-center justify-center cursor-pointer transition-all"
                                        style={{
                                            height: 120,
                                            borderRadius: 18,
                                            border: '1.5px dashed var(--line-dotted)',
                                            backgroundColor: 'transparent',
                                            color: 'var(--text-4)',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line-dotted)'; e.currentTarget.style.color = 'var(--text-4)'; }}
                                    >
                                        <Plus size={20} strokeWidth={2.4} />
                                        <span className="text-[13px] font-bold font-thai mt-2">สร้างโฟลเดอร์ใหม่</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ═══ RECENT DOCUMENTS SECTION (Editorial §7.4) ═══ */}
                        <div>
                            {!searchQuery && (
                                <SectionLabel
                                    right={
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setIsSelectMode(!isSelectMode); setSelectedDocs(new Set()); }}
                                                className="flex items-center justify-center transition-colors"
                                                style={{
                                                    width: 32, height: 32, borderRadius: 9,
                                                    backgroundColor: isSelectMode ? 'var(--ink)' : 'var(--paper)',
                                                    color: isSelectMode ? '#fff' : 'var(--text-4)',
                                                    border: '1px solid ' + (isSelectMode ? 'var(--ink)' : 'var(--line)'),
                                                }}
                                                title="เลือกหลายรายการ"
                                            ><CheckSquare size={14} /></button>
                                            <select
                                                value={sortBy}
                                                onChange={e => setSortBy(e.target.value)}
                                                className="text-[12px] font-medium font-thai outline-none cursor-pointer"
                                                style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 9, color: 'var(--text-3)', padding: '7px 8px' }}
                                            >
                                                <option value="newest">ล่าสุด</option>
                                                <option value="oldest">เก่าสุด</option>
                                                <option value="alphabetical">A → Z</option>
                                            </select>
                                            <div className="flex" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 9, padding: 2 }}>
                                                {[
                                                    { id: 'list', icon: List },
                                                    { id: 'card', icon: LayoutGrid },
                                                ].map(v => {
                                                    const Icon = v.icon;
                                                    const active = viewMode === v.id;
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => setViewMode(v.id)}
                                                            className="transition-colors flex items-center justify-center"
                                                            style={{ padding: 5, borderRadius: 6, backgroundColor: active ? 'var(--ink)' : 'transparent', color: active ? '#fff' : 'var(--text-4)' }}
                                                        ><Icon size={13} /></button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    }
                                >เอกสารล่าสุด</SectionLabel>
                            )}

                            {isSelectMode && docsToShow.length > 0 && (
                                <div className="flex items-center gap-3 mb-3 p-2.5" style={{ backgroundColor: 'var(--paper-2)', borderRadius: 12, border: '1px solid var(--line)' }}>
                                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-semibold font-thai" style={{ color: 'var(--text-1)' }}>
                                        {selectedDocs.size === docsToShow.length ? <CheckSquare size={14} /> : <Square size={14} />}
                                        {selectedDocs.size === docsToShow.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                    </button>
                                    {selectedDocs.size > 0 && <span className="text-xs font-thai" style={{ color: 'var(--accent)' }}>เลือกแล้ว {selectedDocs.size} รายการ</span>}
                                </div>
                            )}

                            {/* EDITORIAL LIST VIEW — numbered rows separated by 1px line */}
                            {viewMode === 'list' ? (
                                <div style={{ borderTop: docsToShow.length > 0 ? '1px solid var(--line)' : 'none' }}>
                                    {docsToShow.map((doc, idx) => {
                                        const sel = selectedDocs.has(doc.id);
                                        const tag = docTypeTag(doc);
                                        return (
                                            <div
                                                key={doc.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, doc.id)}
                                                onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                                className="group flex items-center gap-4 cursor-pointer transition-colors"
                                                style={{
                                                    padding: '14px 8px',
                                                    borderBottom: '1px solid var(--line)',
                                                    backgroundColor: sel ? 'var(--paper-2)' : 'transparent',
                                                    opacity: draggedDocId === doc.id ? 0.5 : 1,
                                                }}
                                                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.backgroundColor = 'var(--paper)'; }}
                                                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                {isSelectMode ? (
                                                    <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="flex-shrink-0" style={{ color: sel ? 'var(--accent)' : 'var(--text-5)' }}>
                                                        {sel ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                ) : (
                                                    /* Order number "01" */
                                                    <span
                                                        className="flex-shrink-0 text-right"
                                                        style={{ width: 26, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-5)', letterSpacing: '-0.02em' }}
                                                    >{String(idx + 1).padStart(2, '0')}</span>
                                                )}
                                                {/* Title + subtitle */}
                                                <div className="flex-1 min-w-0" onClick={() => { if (!isSelectMode) onOpenDocument && onOpenDocument(doc); else toggleSelectDoc(doc.id); }}>
                                                    {editingDocId === doc.id ? (
                                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                value={editingDocData.title}
                                                                onChange={e => setEditingDocData({ ...editingDocData, title: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                                onBlur={saveEditDoc}
                                                                autoFocus
                                                                className="text-[14px] font-bold outline-none flex-1 font-thai"
                                                                style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-1)' }}
                                                            />
                                                            <input
                                                                value={editingDocData.topic}
                                                                onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                                onBlur={saveEditDoc}
                                                                placeholder="คำอธิบาย"
                                                                className="text-[12px] outline-none w-40 font-thai"
                                                                style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-3)' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h4
                                                                className="truncate font-thai"
                                                                style={{ color: 'var(--text-1)', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}
                                                            >{doc.title}</h4>
                                                            <p className="truncate font-thai" style={{ color: 'var(--text-4)', fontSize: 12, marginTop: 1 }}>
                                                                {doc.topic}{searchResults ? ` · ${doc.grade} · ${doc.term}` : ''}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Type tag */}
                                                <span
                                                    className="flex-shrink-0 font-thai"
                                                    style={{ fontSize: 11, fontWeight: 700, color: tag.color }}
                                                >{tag.label}</span>
                                                {/* Date */}
                                                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--text-4)', fontSize: 12, fontFamily: 'Sora, sans-serif', width: 96, justifyContent: 'flex-end' }}>
                                                    <Calendar size={11} />{doc.date}
                                                </div>
                                                {/* Row actions */}
                                                <div className="flex items-center gap-0.5 transition-all flex-shrink-0">
                                                    {[
                                                        { icon: Pencil, title: 'เปลี่ยนชื่อ', onClick: (e) => { e.stopPropagation(); startEditDoc(doc); }, hover: 'var(--accent)' },
                                                        { icon: Copy, title: 'ทำสำเนา', onClick: (e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }, hover: 'var(--accent)' },
                                                        { icon: Trash2, title: 'ลบ', onClick: (e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }, hover: 'var(--danger)' },
                                                    ].map(a => {
                                                        const I = a.icon;
                                                        return (
                                                            <button
                                                                key={a.title}
                                                                onClick={a.onClick}
                                                                className="flex items-center justify-center transition-colors"
                                                                style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-5)' }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.color = a.hover; e.currentTarget.style.backgroundColor = 'var(--paper-2)'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-5)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                                title={a.title}
                                                            ><I size={13} /></button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* CARD VIEW */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {!searchQuery && (
                                        <>
                                            <button onClick={() => setIsDocModalOpen(true)}
                                                className="group flex flex-col items-center justify-center h-44 transition-colors cursor-pointer"
                                                style={{ border: '1.5px dashed var(--line-dotted)', borderRadius: 18, color: 'var(--text-4)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line-dotted)'; e.currentTarget.style.color = 'var(--text-4)'; }}>
                                                <Plus size={22} strokeWidth={2.4} />
                                                <span className="font-bold font-thai text-[14px] mt-2">สร้างเอกสาร</span>
                                                <span className="text-[12px] font-thai mt-0.5" style={{ color: 'var(--text-5)' }}>ใบงานหรือข้อสอบ</span>
                                            </button>
                                            {!currentFolderId && (
                                                <button onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                                    className="group flex flex-col items-center justify-center h-44 transition-colors cursor-pointer"
                                                    style={{ border: '1.5px dashed var(--line-dotted)', borderRadius: 18, color: 'var(--text-4)' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line-dotted)'; e.currentTarget.style.color = 'var(--text-4)'; }}>
                                                    <FolderPlus size={22} strokeWidth={2.4} />
                                                    <span className="font-bold font-thai text-[14px] mt-2">สร้างโฟลเดอร์</span>
                                                    <span className="text-[12px] font-thai mt-0.5" style={{ color: 'var(--text-5)' }}>จัดระเบียบเอกสาร</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {docsToShow.map(doc => {
                                        const sel = selectedDocs.has(doc.id);
                                        const tag = docTypeTag(doc);
                                        return (
                                        <div key={doc.id} draggable onDragStart={(e) => handleDragStart(e, doc.id)} onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                            className="relative group flex flex-col h-44 cursor-grab active:cursor-grabbing transition-all"
                                            style={{
                                                backgroundColor: 'var(--paper)',
                                                border: '1px solid ' + (sel ? 'var(--accent)' : 'var(--line)'),
                                                borderRadius: 18, padding: 18,
                                                opacity: draggedDocId === doc.id ? 0.5 : 1,
                                            }}
                                            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = 'var(--text-4)'; }}
                                            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = 'var(--line)'; }}>
                                            {isSelectMode && (
                                                <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="absolute top-3 left-3 z-10" style={{ color: sel ? 'var(--accent)' : 'var(--text-5)' }}>
                                                    {sel ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            )}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'var(--paper-2)', color: 'var(--text-3)' }}><FileText size={18} /></div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-thai" style={{ fontSize: 11, fontWeight: 700, color: tag.color }}>{tag.label}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); startEditDoc(doc); }} className="flex items-center justify-center rounded-lg transition-colors" style={{ width: 26, height: 26, color: 'var(--text-5)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--paper-2)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-5)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="เปลี่ยนชื่อ"><Pencil size={13} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }} className="flex items-center justify-center rounded-lg transition-colors" style={{ width: 26, height: 26, color: 'var(--text-5)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--paper-2)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-5)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="ทำสำเนา"><Copy size={13} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }} className="flex items-center justify-center rounded-lg transition-colors" style={{ width: 26, height: 26, color: 'var(--text-5)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-5)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="ลบ"><Trash2 size={13} /></button>
                                                </div>
                                            </div>
                                            <div className="mb-auto">
                                                {editingDocId === doc.id ? (
                                                    <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                                        <input value={editingDocData.title} onChange={e => setEditingDocData({ ...editingDocData, title: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} autoFocus className="w-full text-sm font-bold outline-none font-thai" style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '4px 8px', color: 'var(--text-1)' }} />
                                                        <input value={editingDocData.topic} onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} placeholder="คำอธิบาย" className="w-full text-xs outline-none font-thai" style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '4px 8px', color: 'var(--text-3)' }} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="font-bold text-[16px] mb-1 leading-tight line-clamp-2 font-thai" style={{ color: 'var(--text-1)' }} title={doc.title}>{doc.title}</h3>
                                                        <p className="text-[12px] mt-1 line-clamp-1 font-thai" style={{ color: 'var(--text-4)' }}>{doc.topic}</p>
                                                        {searchResults && <p className="text-[11px] mt-1 font-thai" style={{ color: 'var(--text-5)' }}>{doc.grade} · {doc.term}</p>}
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '1px solid var(--line)' }}>
                                                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-4)', fontFamily: 'Sora, sans-serif' }}><Calendar size={12} />{doc.date}</div>
                                                <button onClick={() => onOpenDocument && onOpenDocument(doc)}
                                                    className="font-thai transition-all"
                                                    style={{ fontSize: 12, fontWeight: 700, color: '#fff', backgroundColor: 'var(--ink)', borderRadius: 8, padding: '5px 12px' }}>เปิด</button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}

                            {docsToShow.length === 0 && !searchQuery && (
                                <div className="mt-16 flex flex-col items-center justify-center">
                                    <div className="flex items-center justify-center mb-4" style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--paper-2)' }}><BookOpen size={22} style={{ color: 'var(--text-5)' }} /></div>
                                    <p className="font-thai text-[15px] font-medium" style={{ color: 'var(--text-3)' }}>ยังไม่มีเอกสาร</p>
                                    <p className="font-thai text-[13px]" style={{ color: 'var(--text-4)' }}>สร้างเอกสารใหม่ หรือลากไฟล์เข้าโฟลเดอร์</p>
                                </div>
                            )}
                            {searchResults && searchResults.length === 0 && (
                                <div className="mt-16 flex flex-col items-center justify-center">
                                    <div className="flex items-center justify-center mb-4" style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--paper-2)' }}><Search size={22} style={{ color: 'var(--text-5)' }} /></div>
                                    <p className="font-thai text-[15px] font-medium" style={{ color: 'var(--text-3)' }}>ไม่พบผลลัพธ์</p>
                                    <p className="font-thai text-[13px]" style={{ color: 'var(--text-4)' }}>ลองค้นด้วยคำอื่น</p>
                                </div>
                            )}
                        </div>

                        {isSelectMode && selectedDocs.size > 0 && (
                            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[70]" style={{ backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 16, padding: '12px 22px', boxShadow: '0 16px 40px -12px rgba(20,18,15,.6)' }}>
                                <span className="text-sm font-medium font-thai">เลือกแล้ว {selectedDocs.size} รายการ</span>
                                <button onClick={handleBatchDeleteSelected} className="flex items-center gap-2 font-thai" style={{ fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: 'var(--danger)', borderRadius: 10, padding: '8px 14px' }}><Trash2 size={14} /> ลบทั้งหมด</button>
                                <button onClick={() => { setSelectedDocs(new Set()); setIsSelectMode(false); }} className="transition-colors" style={{ color: '#9b9285' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9b9285'}><X size={16} /></button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* ═══ CREATE DOCUMENT MODAL ═══ */}
            {isDocModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center font-thai" style={{ backgroundColor: 'rgba(22,19,15,0.35)' }} onClick={() => setIsDocModalOpen(false)}>
                    <div className="w-full max-w-md p-8 m-4" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: '0 20px 50px -18px rgba(20,18,15,.5)' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-[22px] font-bold mb-6" style={{ color: 'var(--text-1)' }}>สร้างเอกสารใหม่</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-2)' }}>ชื่อเอกสาร</label>
                                <input type="text" className="w-full p-3 outline-none transition-all" style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 11, color: 'var(--text-1)' }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                                    placeholder="เช่น ข้อสอบกลางภาค 2567" value={newDocData.title} onChange={e => setNewDocData({ ...newDocData, title: e.target.value })} autoFocus />
                            </div>
                            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 11 }}>
                                <div className="flex items-center justify-center font-bold" style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--ink)', color: '#fff', fontFamily: 'Sora, sans-serif', fontSize: 13 }}>{selectedGrade.replace('M', '')}</div>
                                <div>
                                    <span className="block text-[11px] uppercase font-semibold" style={{ color: 'var(--text-4)', letterSpacing: '0.06em' }}>ชั้นเป้าหมาย</span>
                                    <span className="font-bold text-[14px]" style={{ color: 'var(--text-1)' }}>{selectedGrade.replace('M', 'ม.')} · {selectedTerm.replace('Term', 'เทอม')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                            <button onClick={() => setIsDocModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: 'var(--text-3)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--paper-2)'; e.currentTarget.style.color = 'var(--text-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}>ยกเลิก</button>
                            <button onClick={handleCreateDoc} className="px-5 py-2.5 rounded-xl font-bold transition-colors" style={{ backgroundColor: 'var(--accent)', color: '#fff' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-press)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>สร้างเอกสาร</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CREATE/EDIT FOLDER MODAL ═══ */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center font-thai" style={{ backgroundColor: 'rgba(22,19,15,0.35)' }} onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); }}>
                    <div className="w-full max-w-md p-8 m-4" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: '0 20px 50px -18px rgba(20,18,15,.5)' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-[22px] font-bold mb-6" style={{ color: 'var(--text-1)' }}>{editingFolder ? 'แก้ไขโฟลเดอร์' : 'สร้างโฟลเดอร์ใหม่'}</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-2)' }}>ชื่อโฟลเดอร์</label>
                                <input type="text" className="w-full p-3 outline-none transition-all" style={{ backgroundColor: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 11, color: 'var(--text-1)' }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                                    placeholder="เช่น บทที่ 1 จำนวนเต็ม" value={newFolderData.name} onChange={e => setNewFolderData({ ...newFolderData, name: e.target.value })} autoFocus />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold mb-3" style={{ color: 'var(--text-2)' }}>สี</label>
                                <div className="flex gap-3 flex-wrap">
                                    {Object.entries(FOLDER_COLORS).map(([key, c]) => (
                                        <button key={key} onClick={() => setNewFolderData({ ...newFolderData, color: key })}
                                            className={`w-9 h-9 rounded-full ${c.accent} transition-all ${newFolderData.color === key ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                            style={newFolderData.color === key ? { '--tw-ring-color': 'var(--ink)', '--tw-ring-offset-color': 'var(--paper)' } : undefined} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold mb-3" style={{ color: 'var(--text-2)' }}>ไอคอน</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(FOLDER_ICONS).map(([key, Icon]) => {
                                        const active = newFolderData.icon === key;
                                        return (
                                            <button key={key} onClick={() => setNewFolderData({ ...newFolderData, icon: key })}
                                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                                                style={{
                                                    backgroundColor: active ? 'var(--ink)' : 'var(--paper-2)',
                                                    color: active ? '#fff' : 'var(--text-4)',
                                                    border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
                                                }}>
                                                <Icon size={20} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="block text-[11px] font-semibold uppercase mb-2" style={{ color: 'var(--text-4)', letterSpacing: '0.06em' }}>ตัวอย่าง</label>
                                <FolderPreview color={newFolderData.color} icon={newFolderData.icon} name={newFolderData.name} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                            <button onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); }} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: 'var(--text-3)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--paper-2)'; e.currentTarget.style.color = 'var(--text-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}>ยกเลิก</button>
                            <button onClick={handleCreateFolder} className="px-5 py-2.5 rounded-xl font-bold transition-colors" style={{ backgroundColor: 'var(--accent)', color: '#fff' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-press)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
                                {editingFolder ? 'บันทึก' : 'สร้างโฟลเดอร์'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
