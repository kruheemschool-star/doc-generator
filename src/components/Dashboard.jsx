import React, { useState, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Folder, FolderOpen, FileText, Plus, Calendar, Search, BookOpen,
    MoreVertical, Clock, ChevronRight, Trash2, Copy, Star, Target,
    Calculator, Ruler, ClipboardList, BookMarked, GraduationCap,
    Pencil, X, ArrowLeft, FolderPlus, LayoutGrid, List, Check,
    CheckSquare, Square, RotateCcw, AlertTriangle, ArrowUpDown,
    SortAsc, SortDesc
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

// Deep Space folder palette — flat solid color + glow for the portrait card top block.
// Maps the legacy FOLDER_COLORS keys (set when the user picked a color) to fixed
// hues that read well on the dark surface. Independent of the accent theme so
// folder identity stays consistent if the user switches violet/cyan/amber.
const FOLDER_COLOR_MAP = {
    blue:   { bg: '#7856f4', glow: 'rgba(120, 86, 244, 0.38)' },
    purple: { bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.38)' },
    pink:   { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.38)' },
    red:    { bg: '#f05a5a', glow: 'rgba(240, 90, 90, 0.38)' },
    orange: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.38)' },
    yellow: { bg: '#fbbf24', glow: 'rgba(251, 191, 36, 0.38)' },
    green:  { bg: '#059669', glow: 'rgba(5, 150, 105, 0.38)' },
    gray:   { bg: '#64748b', glow: 'rgba(100, 116, 139, 0.38)' },
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
    const colors = FOLDER_COLORS[color] || FOLDER_COLORS.blue;
    const Icon = FOLDER_ICONS[icon] || Folder;
    return (
        <div className={`rounded-2xl p-5 bg-gradient-to-br ${colors.gradient} inline-flex items-center gap-3`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white"><Icon size={20} /></div>
            <span className="font-bold text-white text-sm">{name || 'Folder Name'}</span>
        </div>
    );
};

const Dashboard = ({ documents, folders = [], trashedDocs = [], onOpenDocument, onCreateDocument, onDeleteDocument, onUpdateDocument, onBatchDelete, onRestoreDocument, onPermanentDelete, onEmptyTrash, onCreateFolder, onUpdateFolder, onDeleteFolder, onMoveDocToFolder, onDuplicateDocument }) => {
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

    // Deep Space Sidebar — section label with gradient fade line (design §5.9)
    const SectionLabel = ({ children }) => (
        <div className="flex items-center gap-2 px-3 mb-2.5 mt-4">
            <span
                className="text-[10px] font-bold uppercase font-noto-thai"
                style={{ color: 'var(--text-6)', letterSpacing: '0.12em' }}
            >{children}</span>
            <div
                className="h-px flex-1 max-w-[48px]"
                style={{ background: 'linear-gradient(to right, var(--border-3), transparent)' }}
            />
        </div>
    );

    return (
        <div className="flex min-h-screen font-noto-thai" style={{ backgroundColor: 'var(--bg)' }} onClick={() => setContextMenuFolder(null)}>
            {/* ═══════ DEEP SPACE SIDEBAR (230px) ═══════ */}
            <aside
                className="w-[230px] fixed top-0 left-0 h-screen z-50 flex flex-col print:hidden"
                style={{ backgroundColor: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
            >
                {/* Profile (design §5.1) */}
                <div className="px-5 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 flex items-center justify-center text-white text-base font-extrabold"
                            style={{
                                borderRadius: 13,
                                background: 'linear-gradient(135deg, var(--accent), var(--accent-b))',
                                boxShadow: '0 0 0 2px var(--sidebar), 0 0 0 3px color-mix(in srgb, var(--accent) 33%, transparent)',
                                fontFamily: 'Sora, sans-serif'
                            }}
                        >K</div>
                        <div className="flex flex-col">
                            <span
                                className="text-base font-extrabold leading-none tracking-tight"
                                style={{ color: 'var(--text-1)', fontFamily: 'Sora, sans-serif' }}
                            >KruHeem</span>
                            <span
                                className="text-[10px] font-medium uppercase mt-1.5"
                                style={{ color: 'var(--text-5)', letterSpacing: '0.12em' }}
                            >Math AI Assistant</span>
                        </div>
                    </div>
                </div>

                {/* Workspace nav */}
                <SectionLabel>Workspace</SectionLabel>
                <div className="px-2.5 space-y-0.5">
                    {[
                        { id: 'docs', icon: Folder, label: 'My Documents', count: documents.length, active: !showTrash,
                          onClick: () => { setShowTrash(false); setSelectedDocs(new Set()); setIsSelectMode(false); } },
                        { id: 'trash', icon: Trash2, label: 'Trash', count: trashedDocs.length, active: showTrash,
                          onClick: () => { setShowTrash(true); setSelectedDocs(new Set()); setIsSelectMode(false); setCurrentFolderId(null); setSearchQuery(''); } },
                    ].map(item => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.id}
                                onClick={item.onClick}
                                className="flex items-center justify-between px-3 py-2 cursor-pointer transition-all"
                                style={{
                                    borderRadius: 8,
                                    backgroundColor: item.active ? 'var(--accent-dim)' : 'transparent',
                                    color: item.active ? 'var(--text-1)' : 'var(--text-3)',
                                    borderLeft: item.active ? '2px solid var(--accent)' : '2px solid transparent',
                                    paddingLeft: item.active ? 10 : 12,
                                }}
                                onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
                                onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon size={15} strokeWidth={1.8} />
                                    <span className="text-[13px] font-medium">{item.label}</span>
                                </div>
                                {item.count > 0 && (
                                    <span
                                        className="text-[10px] font-bold px-1.5 py-0.5"
                                        style={{
                                            color: item.active ? 'var(--accent-b)' : 'var(--text-5)',
                                            borderRadius: 5,
                                        }}
                                    >{item.count}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Class Levels (design §5.2 — dot glow on active) */}
                <SectionLabel>Class Levels</SectionLabel>
                <nav className="flex-1 overflow-y-auto custom-scrollbar px-2.5 space-y-0.5 pb-4">
                    {Object.keys(CURRICULUM_DATA).map(grade => {
                        const active = selectedGrade === grade && !showTrash;
                        const count = docCountByGrade(grade);
                        return (
                            <button
                                key={grade}
                                onClick={() => { setSelectedGrade(grade); setSelectedTerm('Term 1'); setCurrentFolderId(null); setSearchQuery(''); setShowTrash(false); }}
                                className="w-full flex items-center justify-between py-2 text-[13px] font-medium transition-all"
                                style={{
                                    borderRadius: 8,
                                    backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
                                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                                    borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                                    paddingLeft: active ? 10 : 12,
                                    paddingRight: 10,
                                }}
                                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
                                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            backgroundColor: active ? 'var(--accent)' : 'var(--border-3)',
                                            boxShadow: active ? '0 0 6px var(--accent)' : 'none',
                                        }}
                                    />
                                    {grade}
                                </div>
                                <span
                                    className="text-[10px] font-bold"
                                    style={{ color: active ? 'var(--accent-b)' : 'var(--text-5)' }}
                                >{count}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Sync footer */}
                <div className="px-5 py-3.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-5)' }}>
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}
                        />
                        <span>Last sync: Just now</span>
                    </div>
                </div>
            </aside>

            {/* ═══════ MAIN CONTENT ═══════ */}
            <main
                className="flex-1 overflow-y-auto"
                style={{ marginLeft: '230px', padding: 'var(--content-pad)', color: 'var(--text-2)' }}
                onDragOver={(e) => { if (draggedDocId) e.preventDefault(); }}
                onDrop={handleDropOutside}
            >

                {/* ═══════ PAGE HEADER (Deep Space §4) ═══════ */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4" style={{ marginBottom: 32 }}>
                    <div>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: 'var(--text-3)' }}>
                            <span
                                className="cursor-pointer transition-colors"
                                style={{ color: 'var(--text-3)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-1)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
                                onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}
                            >My Documents</span>
                            <ChevronRight size={14} style={{ color: 'var(--text-5)' }} />
                            <span
                                className="cursor-pointer transition-colors"
                                style={{ color: 'var(--text-3)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-1)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
                                onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}
                            >{selectedGrade}</span>
                            {currentFolder && (<>
                                <ChevronRight size={14} style={{ color: 'var(--text-5)' }} />
                                <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{currentFolder.name}</span>
                            </>)}
                        </div>

                        {/* Display title (64px Sora gradient) */}
                        <h2
                            className="flex items-center gap-4 tracking-tight"
                            style={{
                                fontFamily: 'Sora, sans-serif',
                                fontSize: 64,
                                fontWeight: 800,
                                lineHeight: 1,
                                letterSpacing: '-0.04em',
                                background: 'var(--head-grad)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {currentFolder ? currentFolder.name : (
                                <>
                                    {selectedGrade}
                                    <span style={{ color: 'var(--text-5)', WebkitTextFillColor: 'var(--text-5)' }}>—</span>
                                    <span
                                        className="inline-flex items-center font-extrabold"
                                        style={{
                                            background: 'var(--danger-bg)',
                                            color: 'var(--danger)',
                                            WebkitTextFillColor: 'var(--danger)',
                                            fontSize: 18,
                                            padding: '4px 12px',
                                            borderRadius: 8,
                                            fontFamily: "'Noto Sans Thai', sans-serif",
                                            letterSpacing: 0,
                                        }}
                                    >{selectedTerm}</span>
                                </>
                            )}
                        </h2>

                        <p className="text-[13px] mt-3" style={{ color: 'var(--text-4)' }}>
                            {currentFolder ? `${docsToShow.length} documents` : 'จัดการแบบทดสอบ แบบฝึกหัด และแผนการสอน'}
                        </p>
                    </div>

                    {/* Right cluster: Search + Term toggle */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-5)' }} />
                            <input
                                type="text"
                                placeholder="ค้นหาเอกสาร..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 text-[13px] w-64 outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-2)',
                                    borderRadius: 10,
                                    color: 'var(--text-2)',
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--border-4)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-2)'}
                            />
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-5)' }}><X size={14} /></button>}
                        </div>
                        {!currentFolderId && !searchQuery && (
                            <div
                                className="flex gap-0.5"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-2)',
                                    borderRadius: 10,
                                    padding: 3,
                                }}
                            >
                                {['Term 1', 'Term 2'].map(term => {
                                    const active = selectedTerm === term;
                                    return (
                                        <button
                                            key={term}
                                            onClick={() => setSelectedTerm(term)}
                                            className="text-[13px] font-bold transition-all"
                                            style={{
                                                padding: '7px 18px',
                                                borderRadius: 7,
                                                background: active
                                                    ? (term === 'Term 1' ? 'var(--term-1-bg)' : 'var(--term-2-bg)')
                                                    : 'transparent',
                                                color: active ? '#fff' : 'var(--text-4)',
                                            }}
                                        >{term}</button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </header>

                {/* ═══ TRASH VIEW ═══ */}
                {showTrash ? (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">Trash</h3>
                                <p className="text-sm text-gray-500 mt-1">{trashedDocs.length} items in trash</p>
                            </div>
                            {trashedDocs.length > 0 && (
                                pendingEmptyTrash ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">ล้างทั้งหมด?</span>
                                        <button onClick={() => { onEmptyTrash && onEmptyTrash(); setPendingEmptyTrash(false); }} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all">ยืนยัน</button>
                                        <button onClick={() => setPendingEmptyTrash(false)} className="px-3 py-1.5 bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all">ยกเลิก</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setPendingEmptyTrash(true)} className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-2"><Trash2 size={14} /> ล้างถังขยะ</button>
                                )
                            )}
                        </div>
                        {trashedDocs.length === 0 ? (
                            <div className="mt-16 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-full flex items-center justify-center mb-4"><Trash2 size={24} className="text-gray-300 dark:text-gray-600" /></div>
                                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">ถังขยะว่างเปล่า</p>
                                <p className="text-sm">เอกสารที่ลบจะปรากฎที่นี่</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {trashedDocs.map(doc => (
                                    <div key={doc.id} className="bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl p-4 flex items-center gap-4 group hover:shadow-md dark:hover:shadow-none hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all">
                                        <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0"><FileText size={18} /></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 truncate">{doc.title}</h4>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{doc.topic} · ลบเมื่อ {new Date(doc.deletedAt).toLocaleDateString('th-TH')}</p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => onRestoreDocument && onRestoreDocument(doc.id)} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all flex items-center gap-1"><RotateCcw size={12} /> กู้คืน</button>
                                            {pendingDeleteId === doc.id ? (
                                                <>
                                                    <button onClick={() => { onPermanentDelete && onPermanentDelete(doc.id); setPendingDeleteId(null); }} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all flex items-center gap-1"><Trash2 size={12} /> ยืนยัน</button>
                                                    <button onClick={() => setPendingDeleteId(null)} className="px-3 py-1.5 bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all">ยกเลิก</button>
                                                </>
                                            ) : (
                                                <button onClick={() => setPendingDeleteId(doc.id)} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1"><Trash2 size={12} /> ลบถาวร</button>
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
                            <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-white mb-6 transition-colors"><ArrowLeft size={16} /><span>Back to all folders</span></button>
                        )}

                        {searchResults && (
                            <div className="mb-6 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Found <strong className="text-gray-700 dark:text-gray-300">{searchResults.length}</strong> results for "<em>{searchQuery}</em>"</span>
                            </div>
                        )}

                        {/* ═══ DEEP SPACE FOLDERS (portrait 172×210) ═══ */}
                        {!currentFolderId && !searchQuery && (
                            <div style={{ marginBottom: 36 }}>
                                <SectionLabel>Folders</SectionLabel>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    {gradeFolders.map(folder => {
                                        const fc = FOLDER_COLOR_MAP[folder.color] || FOLDER_COLOR_MAP.blue;
                                        const IconComponent = FOLDER_ICONS[folder.icon] || Folder;
                                        const folderDocCount = documents.filter(d => d.folderId === folder.id).length;
                                        const isDragOver = dragOverFolderId === folder.id;
                                        return (
                                            <div
                                                key={folder.id}
                                                onClick={() => setCurrentFolderId(folder.id)}
                                                onDragOver={(e) => handleDragOver(e, folder.id)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
                                                className="relative group cursor-pointer overflow-hidden"
                                                style={{
                                                    width: 172,
                                                    height: 210,
                                                    borderRadius: 18,
                                                    border: `1px solid ${isDragOver ? fc.bg : 'var(--border-2)'}`,
                                                    backgroundColor: 'var(--surface)',
                                                    transform: isDragOver ? 'translateY(-3px)' : 'none',
                                                    boxShadow: isDragOver ? `0 12px 32px ${fc.glow}, 0 0 0 1px ${fc.bg}22` : 'none',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (isDragOver) return;
                                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                                    e.currentTarget.style.borderColor = fc.bg;
                                                    e.currentTarget.style.boxShadow = `0 12px 32px ${fc.glow}, 0 0 0 1px ${fc.bg}22`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (isDragOver) return;
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.borderColor = 'var(--border-2)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                {/* Top 44% — color block with decorative circles + count */}
                                                <div
                                                    className="absolute top-0 left-0 right-0 overflow-hidden"
                                                    style={{ height: '44%', backgroundColor: fc.bg }}
                                                >
                                                    {/* Decorative circles (design §5.3) */}
                                                    <div
                                                        className="absolute rounded-full"
                                                        style={{ top: -18, left: -18, width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.14)' }}
                                                    />
                                                    <div
                                                        className="absolute rounded-full"
                                                        style={{ top: 10, left: 30, width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                    />
                                                    {/* Icon (top-left) */}
                                                    <div
                                                        className="absolute flex items-center justify-center text-white backdrop-blur-sm"
                                                        style={{ top: 14, left: 14, width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)' }}
                                                    >
                                                        <IconComponent size={16} strokeWidth={2.2} />
                                                    </div>
                                                    {/* Count (top-right) — 48px Sora */}
                                                    <span
                                                        className="absolute text-white"
                                                        style={{
                                                            bottom: 8,
                                                            right: 14,
                                                            fontSize: 48,
                                                            fontWeight: 800,
                                                            fontFamily: 'Sora, sans-serif',
                                                            lineHeight: 1,
                                                            letterSpacing: '-0.04em',
                                                        }}
                                                    >{folderDocCount}</span>
                                                    {/* More button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setContextMenuFolder(contextMenuFolder === folder.id ? null : folder.id); }}
                                                        className="absolute opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all"
                                                        style={{ top: 12, right: 12, padding: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.18)' }}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </div>

                                                {/* Bottom 56% — name + accent line + subtitle */}
                                                <div className="absolute bottom-0 left-0 right-0 p-4" style={{ height: '56%' }}>
                                                    <h4
                                                        className="line-clamp-2 mb-3"
                                                        style={{
                                                            color: 'var(--text-1)',
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            lineHeight: 1.3,
                                                        }}
                                                    >{folder.name}</h4>
                                                    <div className="absolute left-4 right-4" style={{ bottom: 14 }}>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="block h-0.5 rounded-full"
                                                                style={{ width: 18, backgroundColor: fc.bg }}
                                                            />
                                                            <span style={{ color: 'var(--text-5)', fontSize: 11 }}>
                                                                {folderDocCount} {folderDocCount === 1 ? 'document' : 'documents'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {contextMenuFolder === folder.id && (
                                                    <div
                                                        className="absolute z-20 py-1 min-w-[140px]"
                                                        style={{
                                                            top: 50, right: 8,
                                                            backgroundColor: 'var(--surface)',
                                                            border: '1px solid var(--border-3)',
                                                            borderRadius: 10,
                                                            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => openEditFolder(folder)}
                                                            className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 transition-colors"
                                                            style={{ color: 'var(--text-2)' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        ><Pencil size={13} /> Edit</button>
                                                        <button
                                                            onClick={() => { onDeleteFolder && onDeleteFolder(folder.id); setContextMenuFolder(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 transition-colors"
                                                            style={{ color: 'var(--danger)' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        ><Trash2 size={13} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* New Folder card (design §5.4) */}
                                    <button
                                        onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                        className="group flex flex-col items-center justify-center cursor-pointer transition-all"
                                        style={{
                                            width: 172,
                                            height: 210,
                                            borderRadius: 18,
                                            border: '1.5px dashed var(--border-2)',
                                            backgroundColor: 'transparent',
                                            color: 'var(--text-4)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--accent)';
                                            e.currentTarget.style.color = 'var(--accent-b)';
                                            e.currentTarget.style.backgroundColor = 'var(--accent-dim)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border-2)';
                                            e.currentTarget.style.color = 'var(--text-4)';
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <div
                                            className="flex items-center justify-center mb-3"
                                            style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px dashed currentColor' }}
                                        ><Plus size={20} strokeWidth={2.2} /></div>
                                        <span className="text-[13px] font-bold">New Folder</span>
                                        <span className="text-[11px] mt-1" style={{ color: 'var(--text-5)' }}>สร้างโฟลเดอร์ใหม่</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ═══ DEEP SPACE DOCUMENTS SECTION ═══ */}
                        <div>
                            {!searchQuery && (
                                <div className="flex items-center justify-between mb-4">
                                    <SectionLabel>Documents</SectionLabel>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setIsSelectMode(!isSelectMode); setSelectedDocs(new Set()); }}
                                            className="flex items-center justify-center transition-all"
                                            style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                backgroundColor: isSelectMode ? 'var(--accent-dim)' : 'transparent',
                                                color: isSelectMode ? 'var(--accent-b)' : 'var(--text-4)',
                                                border: '1px solid ' + (isSelectMode ? 'var(--accent)' : 'var(--border-2)'),
                                            }}
                                            title="Select multiple"
                                        ><CheckSquare size={14} /></button>
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value)}
                                            className="text-[12px] font-medium outline-none cursor-pointer transition-all"
                                            style={{
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border-2)',
                                                borderRadius: 8,
                                                color: 'var(--text-3)',
                                                padding: '7px 8px',
                                            }}
                                        >
                                            <option value="newest">ล่าสุด</option>
                                            <option value="oldest">เก่าสุด</option>
                                            <option value="alphabetical">A → Z</option>
                                        </select>
                                        <div
                                            className="flex"
                                            style={{
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border-2)',
                                                borderRadius: 8,
                                                padding: 2,
                                            }}
                                        >
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
                                                        className="transition-all flex items-center justify-center"
                                                        style={{
                                                            padding: 5,
                                                            borderRadius: 6,
                                                            backgroundColor: active ? 'var(--surface-3)' : 'transparent',
                                                            color: active ? 'var(--text-1)' : 'var(--text-4)',
                                                        }}
                                                    ><Icon size={13} /></button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isSelectMode && docsToShow.length > 0 && (
                                <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                                        {selectedDocs.size === docsToShow.length ? <CheckSquare size={14} /> : <Square size={14} />}
                                        {selectedDocs.size === docsToShow.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                    </button>
                                    {selectedDocs.size > 0 && <span className="text-xs text-blue-600 dark:text-blue-400">เลือกแล้ว {selectedDocs.size} รายการ</span>}
                                </div>
                            )}

                            {/* DEEP SPACE LIST VIEW */}
                            {viewMode === 'list' ? (
                                <div className="space-y-2">
                                    {!searchQuery && (
                                        <>
                                            {[
                                                { id: 'new-doc', icon: Plus, label: 'New Document', onClick: () => setIsDocModalOpen(true) },
                                                ...(!currentFolderId ? [{ id: 'new-folder', icon: FolderPlus, label: 'New Folder',
                                                    onClick: () => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); } }] : []),
                                            ].map(b => {
                                                const Icon = b.icon;
                                                return (
                                                    <button
                                                        key={b.id}
                                                        onClick={b.onClick}
                                                        className="w-full flex items-center gap-3 transition-all"
                                                        style={{
                                                            padding: '11px 16px',
                                                            border: '1.5px dashed var(--border-2)',
                                                            borderRadius: 12,
                                                            color: 'var(--text-4)',
                                                            backgroundColor: 'transparent',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--accent)';
                                                            e.currentTarget.style.color = 'var(--accent-b)';
                                                            e.currentTarget.style.backgroundColor = 'var(--accent-dim)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--border-2)';
                                                            e.currentTarget.style.color = 'var(--text-4)';
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                    >
                                                        <Icon size={16} strokeWidth={2} />
                                                        <span className="text-[13px] font-bold">{b.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                    {docsToShow.map(doc => {
                                        const isT2 = (doc.term || '').endsWith('2');
                                        const accentBar = isT2 ? 'var(--cyan)' : 'var(--accent)';
                                        const accentGlow = isT2 ? 'rgba(6, 214, 247, 0.45)' : 'var(--accent-glow)';
                                        const sel = selectedDocs.has(doc.id);
                                        return (
                                            <div
                                                key={doc.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, doc.id)}
                                                onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                                className="group flex items-center gap-3 cursor-pointer transition-all"
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: 10,
                                                    backgroundColor: sel ? 'var(--accent-dim)' : 'var(--surface)',
                                                    border: '1px solid ' + (sel ? 'var(--accent)' : 'var(--border-2)'),
                                                    opacity: draggedDocId === doc.id ? 0.5 : 1,
                                                }}
                                                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = 'var(--border-3)'; }}
                                                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                                            >
                                                {/* Left accent bar (design §5.5) */}
                                                <span
                                                    className="block flex-shrink-0 transition-all"
                                                    style={{ width: 3, height: 30, borderRadius: 2, backgroundColor: accentBar, boxShadow: `0 0 8px ${accentGlow}` }}
                                                />
                                                {isSelectMode && (
                                                    <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="flex-shrink-0" style={{ color: sel ? 'var(--accent)' : 'var(--text-5)' }}>
                                                        {sel ? <CheckSquare size={16} /> : <Square size={16} />}
                                                    </button>
                                                )}
                                                {/* File icon */}
                                                <div
                                                    className="flex items-center justify-center flex-shrink-0"
                                                    style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'var(--surface-2)', color: 'var(--text-3)' }}
                                                ><FileText size={15} strokeWidth={2} /></div>
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
                                                                className="text-[13px] font-bold outline-none flex-1"
                                                                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-3)', borderRadius: 6, padding: '2px 8px', color: 'var(--text-1)' }}
                                                            />
                                                            <input
                                                                value={editingDocData.topic}
                                                                onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                                onBlur={saveEditDoc}
                                                                placeholder="Description"
                                                                className="text-[11px] outline-none w-40"
                                                                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-3)', borderRadius: 6, padding: '2px 8px', color: 'var(--text-3)' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h4
                                                                className="truncate transition-colors"
                                                                style={{ color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}
                                                            >{doc.title}</h4>
                                                            <p className="truncate" style={{ color: 'var(--text-5)', fontSize: 11, marginTop: 1 }}>
                                                                {doc.topic}{searchResults ? ` · ${doc.grade} · ${doc.term}` : ''}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Term badge (design §5.6) */}
                                                <span
                                                    className="flex-shrink-0 uppercase"
                                                    style={{
                                                        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                                                        background: 'var(--danger-bg)', color: 'var(--danger)',
                                                        borderRadius: 5, padding: '2px 7px',
                                                    }}
                                                >{doc.term?.replace('Term ', 'T')}</span>
                                                {/* Date */}
                                                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--text-6)', fontSize: 11, fontFamily: 'Sora, sans-serif' }}>
                                                    <Calendar size={10} />{doc.date}
                                                </div>
                                                {/* Hover actions */}
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                    {[
                                                        { icon: Pencil, title: 'Rename', onClick: (e) => { e.stopPropagation(); startEditDoc(doc); }, hover: 'var(--accent-b)' },
                                                        { icon: Copy, title: 'Duplicate', onClick: (e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }, hover: 'var(--accent-b)' },
                                                        { icon: Trash2, title: 'Delete', onClick: (e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }, hover: 'var(--danger)' },
                                                    ].map(a => {
                                                        const I = a.icon;
                                                        return (
                                                            <button
                                                                key={a.title}
                                                                onClick={a.onClick}
                                                                className="flex items-center justify-center transition-all"
                                                                style={{ width: 26, height: 26, borderRadius: 6, color: 'var(--text-5)' }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.color = a.hover; e.currentTarget.style.backgroundColor = 'var(--surface-2)'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-5)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                                title={a.title}
                                                            ><I size={12} /></button>
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
                                                className="group flex flex-col items-center justify-center h-52 border-2 border-dashed border-gray-300 dark:border-white/[0.1] rounded-2xl hover:border-blue-500 dark:hover:border-blue-400/40 hover:bg-blue-50/30 dark:hover:bg-blue-500/[0.04] transition-all cursor-pointer bg-white/50 dark:bg-transparent">
                                                <div className="w-12 h-12 bg-white dark:bg-white/[0.06] text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border border-gray-100 dark:border-transparent"><Plus size={24} /></div>
                                                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">New Document</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create a worksheet or exam</span>
                                            </button>
                                            {!currentFolderId && (
                                                <button onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                                    className="group flex flex-col items-center justify-center h-52 border-2 border-dashed border-gray-300 dark:border-white/[0.1] rounded-2xl hover:border-purple-500 dark:hover:border-purple-400/40 hover:bg-purple-50/30 dark:hover:bg-purple-500/[0.04] transition-all cursor-pointer bg-white/50 dark:bg-transparent">
                                                    <div className="w-12 h-12 bg-white dark:bg-white/[0.06] text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border border-gray-100 dark:border-transparent"><FolderPlus size={24} /></div>
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">New Folder</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Organize your documents</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {docsToShow.map(doc => (
                                        <div key={doc.id} draggable onDragStart={(e) => handleDragStart(e, doc.id)} onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                            className={`bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-blue-200 dark:hover:border-white/[0.1] transition-all duration-300 relative group border-b-4 border-b-transparent hover:border-b-blue-500 flex flex-col h-52 cursor-grab active:cursor-grabbing ${draggedDocId === doc.id ? 'opacity-50 scale-95' : ''} ${selectedDocs.has(doc.id) ? 'ring-2 ring-blue-400 dark:ring-blue-400/50' : ''}`}>
                                            {isSelectMode && (
                                                <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="absolute top-3 left-3 z-10">
                                                    {selectedDocs.has(doc.id) ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" /> : <Square size={18} className="text-gray-300 dark:text-gray-600" />}
                                                </button>
                                            )}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-transparent dark:to-transparent dark:bg-white/[0.06] text-indigo-600 dark:text-gray-400 rounded-xl flex items-center justify-center shadow-sm dark:shadow-none"><FileText size={20} /></div>
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 uppercase tracking-wide">{doc.term?.replace('Term ', 'T')}</div>
                                                    <button onClick={(e) => { e.stopPropagation(); startEditDoc(doc); }} className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Rename"><Pencil size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Duplicate"><Copy size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="mb-auto">
                                                {editingDocId === doc.id ? (
                                                    <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                                        <input value={editingDocData.title} onChange={e => setEditingDocData({ ...editingDocData, title: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} autoFocus className="w-full text-sm font-bold text-gray-800 dark:text-white bg-blue-50 dark:bg-white/[0.08] border border-blue-200 dark:border-white/[0.15] rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400/40" />
                                                        <input value={editingDocData.topic} onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} placeholder="Description" className="w-full text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400/40" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mb-1 leading-tight line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-white transition-colors font-outfit" title={doc.title}>{doc.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{doc.topic}</p>
                                                        {searchResults && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{doc.grade} · {doc.term}</p>}
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/[0.06] mt-3">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium"><Calendar size={12} />{doc.date}</div>
                                                <button onClick={() => onOpenDocument && onOpenDocument(doc)}
                                                    className="px-3 py-1.5 bg-gray-50 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 duration-200">Open</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {docsToShow.length === 0 && !searchQuery && (
                                <div className="mt-16 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-full flex items-center justify-center mb-4"><BookOpen size={24} className="text-gray-300 dark:text-gray-600" /></div>
                                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No documents found</p>
                                    <p className="text-sm">Create a new document or drag files into a folder.</p>
                                </div>
                            )}
                            {searchResults && searchResults.length === 0 && (
                                <div className="mt-16 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-full flex items-center justify-center mb-4"><Search size={24} className="text-gray-300 dark:text-gray-600" /></div>
                                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No results</p>
                                    <p className="text-sm">Try a different search term.</p>
                                </div>
                            )}
                        </div>

                        {isSelectMode && selectedDocs.size > 0 && (
                            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-[#2a2a42] border border-gray-800 dark:border-white/[0.1] text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 z-[70]">
                                <span className="text-sm font-medium">เลือกแล้ว {selectedDocs.size} รายการ</span>
                                <button onClick={handleBatchDeleteSelected} className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2"><Trash2 size={14} /> ลบทั้งหมด</button>
                                <button onClick={() => { setSelectedDocs(new Set()); setIsSelectMode(false); }} className="px-3 py-2 text-gray-400 hover:text-white text-sm font-medium transition-all"><X size={14} /></button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* ═══ CREATE DOCUMENT MODAL ═══ */}
            {isDocModalOpen && (
                <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={() => setIsDocModalOpen(false)}>
                    <div className="bg-white dark:bg-[#2a2a42] border border-gray-200 dark:border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-outfit">Create New Worksheet</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                <input type="text" className="w-full p-3 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/40 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Midterm Exam 2024" value={newDocData.title} onChange={e => setNewDocData({ ...newDocData, title: e.target.value })} autoFocus />
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs ring-4 ring-white dark:ring-transparent">{selectedGrade.replace('M', '')}</div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold tracking-wide">Target Class</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{selectedGrade} - {selectedTerm}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                            <button onClick={() => setIsDocModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors">Cancel</button>
                            <button onClick={handleCreateDoc} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95">Create Document</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CREATE/EDIT FOLDER MODAL ═══ */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); }}>
                    <div className="bg-white dark:bg-[#2a2a42] border border-gray-200 dark:border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-outfit">{editingFolder ? 'Edit Folder' : 'Create New Folder'}</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Folder Name</label>
                                <input type="text" className="w-full p-3 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/40 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Chapter 1 - Integers" value={newFolderData.name} onChange={e => setNewFolderData({ ...newFolderData, name: e.target.value })} autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {Object.entries(FOLDER_COLORS).map(([key, c]) => (
                                        <button key={key} onClick={() => setNewFolderData({ ...newFolderData, color: key })}
                                            className={`w-9 h-9 rounded-full ${c.accent} transition-all ${newFolderData.color === key ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-[#2a2a42] ring-gray-300 dark:ring-white/30 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Icon</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(FOLDER_ICONS).map(([key, Icon]) => (
                                        <button key={key} onClick={() => setNewFolderData({ ...newFolderData, icon: key })}
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                                newFolderData.icon === key
                                                    ? 'bg-blue-50 dark:bg-white/[0.15] text-blue-600 dark:text-white ring-2 ring-blue-200 dark:ring-white/20 scale-110'
                                                    : 'bg-gray-50 dark:bg-white/[0.04] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-600 dark:hover:text-gray-300'
                                            }`}>
                                            <Icon size={20} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Preview</label>
                                <FolderPreview color={newFolderData.color} icon={newFolderData.icon} name={newFolderData.name} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                            <button onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); }} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors">Cancel</button>
                            <button onClick={handleCreateFolder} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95">
                                {editingFolder ? 'Save Changes' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
