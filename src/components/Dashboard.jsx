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
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.topic?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : null,
        [documents, searchQuery]
    );

    const docsToShow = useMemo(() => {
        const arr = searchResults || filteredDocs;
        const sorted = [...arr];
        if (sortBy === 'newest') sorted.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        else if (sortBy === 'oldest') sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
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
    const handleDrop = (e, folderId) => { e.preventDefault(); if (draggedDocId && folderId) onMoveDocToFolder && onMoveDocToFolder(draggedDocId, folderId); setDraggedDocId(null); setDragOverFolderId(null); };
    const handleDropOutside = (e) => { if (draggedDocId && currentFolderId) onMoveDocToFolder && onMoveDocToFolder(draggedDocId, null); setDraggedDocId(null); setDragOverFolderId(null); };

    const startEditDoc = (doc) => { setEditingDocId(doc.id); setEditingDocData({ title: doc.title || '', topic: doc.topic || '' }); };
    const saveEditDoc = () => { if (editingDocId && editingDocData.title.trim()) onUpdateDocument && onUpdateDocument(editingDocId, editingDocData); setEditingDocId(null); };

    const toggleSelectDoc = (docId) => { setSelectedDocs(prev => { const next = new Set(prev); if (next.has(docId)) next.delete(docId); else next.add(docId); return next; }); };
    const toggleSelectAll = () => { if (selectedDocs.size === docsToShow.length) setSelectedDocs(new Set()); else setSelectedDocs(new Set(docsToShow.map(d => d.id))); };
    const handleBatchDeleteSelected = () => { if (selectedDocs.size === 0) return; onBatchDelete && onBatchDelete([...selectedDocs]); setSelectedDocs(new Set()); setIsSelectMode(false); };

    return (
        <div className="flex bg-gray-50 dark:bg-[#1e1e2f] min-h-screen font-sans" onClick={() => setContextMenuFolder(null)}>
            {/* ═══════ SIDEBAR ═══════ */}
            <aside className="w-64 bg-white dark:bg-[#16162a] fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                {/* Brand */}
                <div className="p-5 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-purple-500/20">K</div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-base leading-none tracking-tight font-outfit">KruHeem</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase mt-0.5">MATH AI ASSISTANT</span>
                        </div>
                    </div>
                </div>

                {/* Workspace */}
                <div className="p-4 border-b border-gray-100 dark:border-white/[0.06]">
                    <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">Workspace</h2>
                    <div className="space-y-1">
                        <div
                            onClick={() => { setShowTrash(false); setSelectedDocs(new Set()); setIsSelectMode(false); }}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                                !showTrash
                                    ? 'bg-blue-50 text-blue-700 dark:bg-white/[0.08] dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Folder size={16} />
                                <span className="text-sm font-medium">My Documents</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">{documents.length}</span>
                        </div>
                        <div
                            onClick={() => { setShowTrash(true); setSelectedDocs(new Set()); setIsSelectMode(false); setCurrentFolderId(null); setSearchQuery(''); }}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                                showTrash
                                    ? 'bg-rose-50 text-rose-700 dark:bg-white/[0.08] dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 size={16} />
                                <span className="text-sm font-medium">Trash</span>
                            </div>
                            {trashedDocs.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">{trashedDocs.length}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Class Levels */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">Class Levels</div>
                    {Object.keys(CURRICULUM_DATA).map(grade => (
                        <button
                            key={grade}
                            onClick={() => { setSelectedGrade(grade); setSelectedTerm('Term 1'); setCurrentFolderId(null); setSearchQuery(''); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                selectedGrade === grade
                                    ? 'bg-blue-50 text-blue-700 dark:bg-white/[0.08] dark:text-white'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-white/[0.04] dark:hover:text-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${selectedGrade === grade ? 'bg-blue-500 dark:bg-rose-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                {grade}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                selectedGrade === grade
                                    ? 'bg-blue-100 text-blue-600 dark:bg-white/[0.1] dark:text-gray-300'
                                    : 'bg-gray-100 text-gray-400 dark:bg-transparent dark:text-gray-600'
                            }`}>{docCountByGrade(grade)}</span>
                        </button>
                    ))}
                </nav>

                {/* Sync Status */}
                <div className="p-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-transparent">
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <Clock size={12} />
                        <span>Last sync: Just now</span>
                    </div>
                </div>
            </aside>

            {/* ═══════ MAIN CONTENT ═══════ */}
            <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto" onDragOver={(e) => { if (draggedDocId) e.preventDefault(); }} onDrop={handleDropOutside}>

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1 font-medium">
                            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-white transition-colors" onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}>My Documents</span>
                            <ChevronRight size={14} />
                            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-white transition-colors" onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}>{selectedGrade}</span>
                            {currentFolder && (<><ChevronRight size={14} /><span className="text-gray-600 dark:text-gray-300 font-semibold">{currentFolder.name}</span></>)}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-outfit">
                            {currentFolder ? currentFolder.name : (
                                <>{selectedGrade} — <span className="inline-flex items-center px-3 py-0.5 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-lg font-bold">{selectedTerm}</span></>
                            )}
                        </h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            {currentFolder ? `${docsToShow.length} documents` : 'จัดการแบบทดสอบ แบบฝึกหัด และแผนการสอน'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            <input type="text" placeholder="ค้นหาเอกสาร..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-64 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent outline-none transition-all shadow-sm dark:shadow-none" />
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white"><X size={14} /></button>}
                        </div>
                        {!currentFolderId && !searchQuery && (
                            <div className="bg-white dark:bg-white/[0.06] p-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-none flex gap-1">
                                {['Term 1', 'Term 2'].map(term => (
                                    <button key={term} onClick={() => setSelectedTerm(term)}
                                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                                            selectedTerm === term
                                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                                        }`}>{term}</button>
                                ))}
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

                        {/* ═══ FOLDERS GRID ═══ */}
                        {!currentFolderId && !searchQuery && (
                            <div className="mb-8">
                                <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Folders</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {gradeFolders.map(folder => {
                                        const colors = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;
                                        const IconComponent = FOLDER_ICONS[folder.icon] || Folder;
                                        const folderDocCount = documents.filter(d => d.folderId === folder.id).length;
                                        const isDragOver = dragOverFolderId === folder.id;
                                        return (
                                            <div key={folder.id} onClick={() => setCurrentFolderId(folder.id)}
                                                onDragOver={(e) => handleDragOver(e, folder.id)} onDragLeave={handleDragLeave}
                                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
                                                className={`relative group cursor-pointer rounded-2xl p-5 transition-all duration-200 bg-gradient-to-br ${colors.gradient} ${isDragOver ? `ring-4 ${colors.ring} scale-105` : 'hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/20 hover:scale-[1.02]'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white"><IconComponent size={20} /></div>
                                                    <button onClick={(e) => { e.stopPropagation(); setContextMenuFolder(contextMenuFolder === folder.id ? null : folder.id); }}
                                                        className="p-1 rounded-lg text-white/50 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                                                </div>
                                                <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">{folder.name}</h4>
                                                <p className="text-white/70 text-xs">{folderDocCount} {folderDocCount === 1 ? 'document' : 'documents'}</p>
                                                {contextMenuFolder === folder.id && (
                                                    <div className="absolute top-12 right-2 bg-white dark:bg-[#2a2a42] rounded-xl shadow-xl border border-gray-200 dark:border-white/[0.1] py-1 z-20 min-w-[140px]" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => openEditFolder(folder)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] flex items-center gap-2"><Pencil size={14} /> Edit</button>
                                                        <button onClick={() => { onDeleteFolder && onDeleteFolder(folder.id); setContextMenuFolder(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <button onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                        className="group rounded-2xl p-5 border-2 border-dashed border-gray-300 dark:border-white/[0.1] hover:border-gray-400 dark:hover:border-white/[0.2] transition-all flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/[0.06] rounded-xl flex items-center justify-center mb-2 group-hover:bg-gray-200 dark:group-hover:bg-white/[0.1] transition-all">
                                            <Plus size={20} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                        </div>
                                        <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">New Folder</span>
                                        <span className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">สร้างโฟลเดอร์ใหม่</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ═══ DOCUMENTS SECTION ═══ */}
                        <div>
                            {!searchQuery && (
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Documents</h3>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedDocs(new Set()); }}
                                            className={`p-2 rounded-lg text-sm font-medium transition-all ${isSelectMode ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}
                                            title="Select multiple"><CheckSquare size={16} /></button>
                                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                            className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-2 outline-none cursor-pointer hover:border-gray-300 dark:hover:border-white/[0.15] transition-all">
                                            <option value="newest">ล่าสุด</option>
                                            <option value="oldest">เก่าสุด</option>
                                            <option value="alphabetical">A → Z</option>
                                        </select>
                                        <div className="bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded-lg flex p-0.5">
                                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}><List size={14} /></button>
                                            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}><LayoutGrid size={14} /></button>
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

                            {/* LIST VIEW */}
                            {viewMode === 'list' ? (
                                <div className="space-y-1">
                                    {!searchQuery && (
                                        <>
                                            <button onClick={() => setIsDocModalOpen(true)}
                                                className="w-full flex items-center gap-4 p-3 border-2 border-dashed border-gray-200 dark:border-white/[0.08] rounded-xl hover:border-blue-400 dark:hover:border-blue-400/40 hover:bg-blue-50/30 dark:hover:bg-blue-500/[0.04] transition-all group">
                                                <div className="w-8 h-8 bg-white dark:bg-white/[0.06] text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center border border-gray-100 dark:border-transparent group-hover:shadow-sm"><Plus size={16} /></div>
                                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400">New Document</span>
                                            </button>
                                            {!currentFolderId && (
                                                <button onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                                    className="w-full flex items-center gap-4 p-3 border-2 border-dashed border-gray-200 dark:border-white/[0.08] rounded-xl hover:border-purple-400 dark:hover:border-purple-400/40 hover:bg-purple-50/30 dark:hover:bg-purple-500/[0.04] transition-all group">
                                                    <div className="w-8 h-8 bg-white dark:bg-white/[0.06] text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center border border-gray-100 dark:border-transparent group-hover:shadow-sm"><FolderPlus size={16} /></div>
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-400">New Folder</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {docsToShow.map(doc => (
                                        <div key={doc.id} draggable onDragStart={(e) => handleDragStart(e, doc.id)} onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                            className={`bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-xl p-3 flex items-center gap-4 group hover:shadow-md dark:hover:shadow-none hover:border-blue-200 dark:hover:border-white/[0.1] transition-all cursor-pointer ${draggedDocId === doc.id ? 'opacity-50 scale-95' : ''} ${selectedDocs.has(doc.id) ? 'ring-2 ring-blue-400 dark:ring-blue-400/50 bg-blue-50/30 dark:bg-blue-500/[0.06]' : ''}`}>
                                            {isSelectMode && (
                                                <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="flex-shrink-0">
                                                    {selectedDocs.has(doc.id) ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" /> : <Square size={18} className="text-gray-300 dark:text-gray-600" />}
                                                </button>
                                            )}
                                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-transparent dark:to-transparent dark:bg-white/[0.06] text-indigo-600 dark:text-gray-400 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={16} /></div>
                                            <div className="flex-1 min-w-0" onClick={() => { if (!isSelectMode) onOpenDocument && onOpenDocument(doc); else toggleSelectDoc(doc.id); }}>
                                                {editingDocId === doc.id ? (
                                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                        <input value={editingDocData.title} onChange={e => setEditingDocData({ ...editingDocData, title: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} autoFocus className="text-sm font-bold text-gray-800 dark:text-white bg-blue-50 dark:bg-white/[0.08] border border-blue-200 dark:border-white/[0.15] rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400/40 flex-1" />
                                                        <input value={editingDocData.topic} onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} placeholder="Description" className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400/40 w-40" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-white transition-colors">{doc.title}</h4>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{doc.topic}{searchResults ? ` · ${doc.grade} · ${doc.term}` : ''}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 uppercase tracking-wide flex-shrink-0">{doc.term?.replace('Term ', 'T')}</div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"><Calendar size={11} />{doc.date}</div>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                <button onClick={(e) => { e.stopPropagation(); startEditDoc(doc); }} className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all" title="Rename"><Pencil size={13} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all" title="Duplicate"><Copy size={13} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all" title="Delete"><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    ))}
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
