import React, { useState, useRef } from 'react';
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
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100', accent: 'bg-blue-500', ring: 'ring-blue-200' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100', accent: 'bg-purple-500', ring: 'ring-purple-200' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100', accent: 'bg-emerald-500', ring: 'ring-emerald-200' },
    red: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', iconBg: 'bg-rose-100', accent: 'bg-rose-500', ring: 'ring-rose-200' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', iconBg: 'bg-orange-100', accent: 'bg-orange-500', ring: 'ring-orange-200' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', iconBg: 'bg-pink-100', accent: 'bg-pink-500', ring: 'ring-pink-200' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100', accent: 'bg-amber-500', ring: 'ring-amber-200' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', iconBg: 'bg-gray-100', accent: 'bg-gray-500', ring: 'ring-gray-200' },
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

const Dashboard = ({ documents, folders = [], trashedDocs = [], onOpenDocument, onCreateDocument, onDeleteDocument, onUpdateDocument, onBatchDelete, onRestoreDocument, onPermanentDelete, onEmptyTrash, onCreateFolder, onUpdateFolder, onDeleteFolder, onMoveDocToFolder, onDuplicateDocument }) => {
    // --- State ---
    const [selectedGrade, setSelectedGrade] = useState('M1');
    const [selectedTerm, setSelectedTerm] = useState('Term 1');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newDocData, setNewDocData] = useState({ title: '', topic: '' });
    const [newFolderData, setNewFolderData] = useState({ name: '', color: 'blue', icon: 'folder' });
    const [editingFolder, setEditingFolder] = useState(null);
    const [contextMenuFolder, setContextMenuFolder] = useState(null);

    // Drag State
    const [draggedDocId, setDraggedDocId] = useState(null);
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    // New Feature States
    const [viewMode, setViewMode] = useState('list');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedDocs, setSelectedDocs] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [editingDocId, setEditingDocId] = useState(null);
    const [editingDocData, setEditingDocData] = useState({ title: '', topic: '' });

    // --- Derived Data ---
    const availableTopics = CURRICULUM_DATA[selectedGrade]?.[selectedTerm] || [];
    const currentFolder = folders.find(f => f.id === currentFolderId);

    const gradeFolders = folders.filter(f => f.grade === selectedGrade && f.term === selectedTerm);

    const filteredDocs = documents.filter(doc => {
        if (doc.grade !== selectedGrade || doc.term !== selectedTerm) return false;
        if (currentFolderId) return doc.folderId === currentFolderId;
        return !doc.folderId || !folders.some(f => f.id === doc.folderId && f.grade === selectedGrade && f.term === selectedTerm);
    });

    const searchResults = searchQuery.trim()
        ? documents.filter(doc =>
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.topic?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : null;

    const sortedDocs = (arr) => {
        const sorted = [...arr];
        if (sortBy === 'newest') sorted.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        else if (sortBy === 'oldest') sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        else if (sortBy === 'alphabetical') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        return sorted;
    };

    const docsToShow = sortedDocs(searchResults || filteredDocs);
    const docCountByGrade = (grade) => documents.filter(d => d.grade === grade).length;

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

    // Drag & Drop
    const handleDragStart = (e, docId) => {
        setDraggedDocId(docId);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e, folderId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolderId(folderId);
    };
    const handleDragLeave = () => setDragOverFolderId(null);
    const handleDrop = (e, folderId) => {
        e.preventDefault();
        if (draggedDocId && folderId) {
            onMoveDocToFolder && onMoveDocToFolder(draggedDocId, folderId);
        }
        setDraggedDocId(null);
        setDragOverFolderId(null);
    };
    const handleDropOutside = (e) => {
        if (draggedDocId && currentFolderId) {
            onMoveDocToFolder && onMoveDocToFolder(draggedDocId, null);
        }
        setDraggedDocId(null);
        setDragOverFolderId(null);
    };

    // Inline Edit
    const startEditDoc = (doc) => {
        setEditingDocId(doc.id);
        setEditingDocData({ title: doc.title || '', topic: doc.topic || '' });
    };
    const saveEditDoc = () => {
        if (editingDocId && editingDocData.title.trim()) {
            onUpdateDocument && onUpdateDocument(editingDocId, editingDocData);
        }
        setEditingDocId(null);
    };

    // Multi-select
    const toggleSelectDoc = (docId) => {
        setSelectedDocs(prev => {
            const next = new Set(prev);
            if (next.has(docId)) next.delete(docId); else next.add(docId);
            return next;
        });
    };
    const toggleSelectAll = () => {
        if (selectedDocs.size === docsToShow.length) setSelectedDocs(new Set());
        else setSelectedDocs(new Set(docsToShow.map(d => d.id)));
    };
    const handleBatchDeleteSelected = () => {
        if (selectedDocs.size === 0) return;
        onBatchDelete && onBatchDelete([...selectedDocs]);
        setSelectedDocs(new Set());
        setIsSelectMode(false);
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-[calc(100vh-64px)] font-sans" onClick={() => setContextMenuFolder(null)}>
            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-100 flex flex-col fixed h-[calc(100vh-64px)] z-10 shadow-sm">
                <div className="p-6 border-b border-gray-50 bg-white/50">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Workspace</h2>
                    <div className="space-y-1">
                        <div onClick={() => { setShowTrash(false); setSelectedDocs(new Set()); setIsSelectMode(false); }} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${!showTrash ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Folder size={18} />
                            <span className="text-sm font-semibold">My Documents</span>
                        </div>
                        <div onClick={() => { setShowTrash(true); setSelectedDocs(new Set()); setIsSelectMode(false); setCurrentFolderId(null); setSearchQuery(''); }} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${showTrash ? 'bg-rose-50 text-rose-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <Trash2 size={18} />
                                <span className="text-sm font-semibold">Trash</span>
                            </div>
                            {trashedDocs.length > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{trashedDocs.length}</span>
                            )}
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 mt-2">Class Levels</div>
                    {Object.keys(CURRICULUM_DATA).map(grade => (
                        <button
                            key={grade}
                            onClick={() => { setSelectedGrade(grade); setSelectedTerm('Term 1'); setCurrentFolderId(null); setSearchQuery(''); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${selectedGrade === grade
                                ? 'bg-gradient-to-r from-blue-50 to-white border-l-4 border-blue-500 text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${selectedGrade === grade ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
                                {grade}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedGrade === grade ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{docCountByGrade(grade)}</span>
                                {selectedGrade === grade && <ChevronRight size={14} className="text-blue-400" />}
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>Last sync: Just now</span>
                    </div>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto" onDragOver={(e) => { if (draggedDocId) e.preventDefault(); }} onDrop={handleDropOutside}>

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1 font-medium">
                            <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}>My Documents</span>
                            <ChevronRight size={14} />
                            <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { setCurrentFolderId(null); setSearchQuery(''); }}>{selectedGrade}</span>
                            {currentFolder && (
                                <>
                                    <ChevronRight size={14} />
                                    <span className="text-gray-600 font-semibold">{currentFolder.name}</span>
                                </>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-outfit">
                            {currentFolder ? currentFolder.name : <>{selectedGrade} - <span className="text-blue-600">{selectedTerm}</span></>}
                        </h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            {currentFolder ? `${docsToShow.length} documents` : 'Manage your worksheets, exams, and lesson plans.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            )}
                        </div>

                        {/* Term Filter */}
                        {!currentFolderId && !searchQuery && (
                            <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex gap-1">
                                {['Term 1', 'Term 2'].map(term => (
                                    <button key={term} onClick={() => setSelectedTerm(term)}
                                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${selectedTerm === term ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                                        {term}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                {/* === TRASH VIEW === */}
                {showTrash ? (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 font-outfit">🗑️ Trash</h3>
                                <p className="text-sm text-gray-500 mt-1">{trashedDocs.length} items in trash</p>
                            </div>
                            {trashedDocs.length > 0 && (
                                <button onClick={() => { if (window.confirm('ลบเอกสารทั้งหมดในถังขยะอย่างถาวร?')) onEmptyTrash && onEmptyTrash(); }}
                                    className="px-4 py-2 bg-rose-50 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2">
                                    <Trash2 size={14} /> ล้างถังขยะ
                                </button>
                            )}
                        </div>
                        {trashedDocs.length === 0 ? (
                            <div className="mt-16 flex flex-col items-center justify-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Trash2 size={24} className="text-gray-300" /></div>
                                <p className="text-lg font-medium text-gray-500">ถังขยะว่างเปล่า</p>
                                <p className="text-sm">เอกสารที่ลบจะปรากฎที่นี่</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {trashedDocs.map(doc => (
                                    <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 group hover:shadow-md transition-all">
                                        <div className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0"><FileText size={18} /></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-gray-700 truncate">{doc.title}</h4>
                                            <p className="text-xs text-gray-400">{doc.topic} · ลบเมื่อ {new Date(doc.deletedAt).toLocaleDateString('th-TH')}</p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => onRestoreDocument && onRestoreDocument(doc.id)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1"><RotateCcw size={12} /> กู้คืน</button>
                                            <button onClick={() => { if (window.confirm('ลบอย่างถาวร?')) onPermanentDelete && onPermanentDelete(doc.id); }}
                                                className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-all flex items-center gap-1"><Trash2 size={12} /> ลบถาวร</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Back button when inside folder */}
                        {currentFolderId && (
                            <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">
                                <ArrowLeft size={16} /><span>Back to all folders</span>
                            </button>
                        )}

                        {/* Search results label */}
                        {searchResults && (
                            <div className="mb-6 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Found <strong className="text-gray-700">{searchResults.length}</strong> results for "<em>{searchQuery}</em>"</span>
                            </div>
                        )}

                        {/* Folders Grid */}
                        {!currentFolderId && !searchQuery && gradeFolders.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Folders</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {gradeFolders.map(folder => {
                                        const colors = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;
                                        const IconComponent = FOLDER_ICONS[folder.icon] || Folder;
                                        const folderDocCount = documents.filter(d => d.folderId === folder.id).length;
                                        const isDragOver = dragOverFolderId === folder.id;
                                        return (
                                            <div key={folder.id} onClick={() => setCurrentFolderId(folder.id)}
                                                onDragOver={(e) => handleDragOver(e, folder.id)} onDragLeave={handleDragLeave}
                                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
                                                className={`relative group cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 ${colors.bg} ${isDragOver ? `${colors.border} ring-4 ${colors.ring} scale-105` : `${colors.border} border-opacity-50 hover:border-opacity-100 hover:shadow-lg`}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`w-10 h-10 ${colors.iconBg} ${colors.text} rounded-xl flex items-center justify-center`}><IconComponent size={20} /></div>
                                                    <button onClick={(e) => { e.stopPropagation(); setContextMenuFolder(contextMenuFolder === folder.id ? null : folder.id); }}
                                                        className="p-1 rounded-lg text-gray-400 hover:bg-white/80 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{folder.name}</h4>
                                                <p className="text-xs text-gray-500">{folderDocCount} {folderDocCount === 1 ? 'document' : 'documents'}</p>
                                                {contextMenuFolder === folder.id && (
                                                    <div className="absolute top-12 right-2 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20 min-w-[140px]" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => openEditFolder(folder)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={14} /> Edit</button>
                                                        <button onClick={() => { onDeleteFolder && onDeleteFolder(folder.id); setContextMenuFolder(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Documents Section */}
                        <div>
                            {!searchQuery && (
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Documents</h3>
                                    <div className="flex items-center gap-2">
                                        {/* Select Mode */}
                                        <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedDocs(new Set()); }}
                                            className={`p-2 rounded-lg text-sm font-medium transition-all ${isSelectMode ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                            title="Select multiple">
                                            <CheckSquare size={16} />
                                        </button>
                                        {/* Sort */}
                                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                            className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-2 outline-none cursor-pointer hover:border-gray-300 transition-all">
                                            <option value="newest">ล่าสุด</option>
                                            <option value="oldest">เก่าสุด</option>
                                            <option value="alphabetical">A → Z</option>
                                        </select>
                                        {/* View Toggle */}
                                        <div className="bg-white border border-gray-200 rounded-lg flex p-0.5">
                                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><List size={14} /></button>
                                            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Select All bar */}
                            {isSelectMode && docsToShow.length > 0 && (
                                <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 rounded-xl">
                                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                                        {selectedDocs.size === docsToShow.length ? <CheckSquare size={14} /> : <Square size={14} />}
                                        {selectedDocs.size === docsToShow.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                    </button>
                                    {selectedDocs.size > 0 && <span className="text-xs text-blue-600">เลือกแล้ว {selectedDocs.size} รายการ</span>}
                                </div>
                            )}

                            {/* === LIST VIEW === */}
                            {viewMode === 'list' ? (
                                <div className="space-y-1">
                                    {/* Create buttons as rows */}
                                    {!searchQuery && (
                                        <>
                                            <button onClick={() => setIsDocModalOpen(true)}
                                                className="w-full flex items-center gap-4 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                                                <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center border border-gray-100 group-hover:shadow-sm"><Plus size={16} /></div>
                                                <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-700">New Document</span>
                                            </button>
                                            {!currentFolderId && (
                                                <button onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                                    className="w-full flex items-center gap-4 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/30 transition-all group">
                                                    <div className="w-8 h-8 bg-white text-purple-600 rounded-lg flex items-center justify-center border border-gray-100 group-hover:shadow-sm"><FolderPlus size={16} /></div>
                                                    <span className="text-sm font-semibold text-gray-600 group-hover:text-purple-700">New Folder</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {/* Document rows */}
                                    {docsToShow.map(doc => (
                                        <div key={doc.id} draggable onDragStart={(e) => handleDragStart(e, doc.id)} onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                            className={`bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-4 group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer ${draggedDocId === doc.id ? 'opacity-50 scale-95' : ''} ${selectedDocs.has(doc.id) ? 'ring-2 ring-blue-400 bg-blue-50/30' : ''}`}>
                                            {isSelectMode && (
                                                <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="flex-shrink-0">
                                                    {selectedDocs.has(doc.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-gray-300" />}
                                                </button>
                                            )}
                                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={16} /></div>
                                            <div className="flex-1 min-w-0" onClick={() => { if (!isSelectMode) onOpenDocument && onOpenDocument(doc); else toggleSelectDoc(doc.id); }}>
                                                {editingDocId === doc.id ? (
                                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                        <input value={editingDocData.title} onChange={e => setEditingDocData({ ...editingDocData, title: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} autoFocus className="text-sm font-bold text-gray-800 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 flex-1" />
                                                        <input value={editingDocData.topic} onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} placeholder="Description" className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 w-40" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-blue-700 transition-colors">{doc.title}</h4>
                                                        <p className="text-xs text-gray-400 truncate">{doc.topic}{searchResults ? ` · ${doc.grade} · ${doc.term}` : ''}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 uppercase tracking-wide flex-shrink-0">{doc.term?.replace('Term ', 'T')}</div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0"><Calendar size={11} />{doc.date}</div>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                <button onClick={(e) => { e.stopPropagation(); startEditDoc(doc); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Rename"><Pencil size={13} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Duplicate"><Copy size={13} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* === CARD VIEW === */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {!searchQuery && (
                                        <>
                                            <button onClick={() => setIsDocModalOpen(true)}
                                                className="group flex flex-col items-center justify-center h-52 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer bg-white/50">
                                                <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border border-gray-100"><Plus size={24} /></div>
                                                <span className="font-bold text-gray-700 group-hover:text-blue-700">New Document</span>
                                                <span className="text-xs text-gray-400 mt-1">Create a worksheet or exam</span>
                                            </button>
                                            {!currentFolderId && (
                                                <button onClick={() => { setEditingFolder(null); setNewFolderData({ name: '', color: 'blue', icon: 'folder' }); setIsFolderModalOpen(true); }}
                                                    className="group flex flex-col items-center justify-center h-52 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer bg-white/50">
                                                    <div className="w-12 h-12 bg-white text-purple-600 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border border-gray-100"><FolderPlus size={24} /></div>
                                                    <span className="font-bold text-gray-700 group-hover:text-purple-700">New Folder</span>
                                                    <span className="text-xs text-gray-400 mt-1">Organize your documents</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {docsToShow.map(doc => (
                                        <div key={doc.id} draggable onDragStart={(e) => handleDragStart(e, doc.id)} onDragEnd={() => { setDraggedDocId(null); setDragOverFolderId(null); }}
                                            className={`bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 relative group border-b-4 border-b-transparent hover:border-b-blue-500 flex flex-col h-52 cursor-grab active:cursor-grabbing ${draggedDocId === doc.id ? 'opacity-50 scale-95' : ''} ${selectedDocs.has(doc.id) ? 'ring-2 ring-blue-400' : ''}`}>
                                            {isSelectMode && (
                                                <button onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="absolute top-3 left-3 z-10">
                                                    {selectedDocs.has(doc.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-gray-300" />}
                                                </button>
                                            )}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm"><FileText size={20} /></div>
                                                <div className="flex items-center gap-1">
                                                    <div className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 uppercase tracking-wide">{doc.term?.replace('Term ', 'T')}</div>
                                                    <button onClick={(e) => { e.stopPropagation(); startEditDoc(doc); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Rename"><Pencil size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDuplicateDocument && onDuplicateDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Duplicate"><Copy size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteDocument && onDeleteDocument(doc.id); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="mb-auto">
                                                {editingDocId === doc.id ? (
                                                    <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                                        <input value={editingDocData.title} onChange={e => setEditingDocData({ ...editingDocData, title: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} autoFocus className="w-full text-sm font-bold text-gray-800 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400" />
                                                        <input value={editingDocData.topic} onChange={e => setEditingDocData({ ...editingDocData, topic: e.target.value })}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveEditDoc(); if (e.key === 'Escape') setEditingDocId(null); }}
                                                            onBlur={saveEditDoc} placeholder="Description" className="w-full text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="font-bold text-base text-gray-800 mb-1 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors font-outfit" title={doc.title}>{doc.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{doc.topic}</p>
                                                        {searchResults && <p className="text-xs text-gray-400 mt-1">{doc.grade} · {doc.term}</p>}
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium"><Calendar size={12} />{doc.date}</div>
                                                <button onClick={() => onOpenDocument && onOpenDocument(doc)}
                                                    className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors uppercase tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 duration-200">Open</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {docsToShow.length === 0 && !searchQuery && (
                                <div className="mt-16 flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><BookOpen size={24} className="text-gray-300" /></div>
                                    <p className="text-lg font-medium text-gray-500">No documents found</p>
                                    <p className="text-sm">Create a new document or drag files into a folder.</p>
                                </div>
                            )}
                            {searchResults && searchResults.length === 0 && (
                                <div className="mt-16 flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Search size={24} className="text-gray-300" /></div>
                                    <p className="text-lg font-medium text-gray-500">No results</p>
                                    <p className="text-sm">Try a different search term.</p>
                                </div>
                            )}
                        </div>

                        {/* Floating Multi-Select Action Bar */}
                        {isSelectMode && selectedDocs.size > 0 && (
                            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
                                <span className="text-sm font-medium">เลือกแล้ว {selectedDocs.size} รายการ</span>
                                <button onClick={handleBatchDeleteSelected} className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2"><Trash2 size={14} /> ลบทั้งหมด</button>
                                <button onClick={() => { setSelectedDocs(new Set()); setIsSelectMode(false); }} className="px-3 py-2 text-gray-400 hover:text-white text-sm font-medium transition-all"><X size={14} /></button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* --- Create Document Modal --- */}
            {isDocModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsDocModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-outfit">Create New Worksheet</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Midterm Exam 2024" value={newDocData.title} onChange={e => setNewDocData({ ...newDocData, title: e.target.value })} autoFocus />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-white">{selectedGrade.replace('M', '')}</div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold tracking-wide">Target Class</span>
                                    <span className="font-bold text-gray-800 text-sm">{selectedGrade} - {selectedTerm}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                            <button onClick={() => setIsDocModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                            <button onClick={handleCreateDoc} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95">Create Document</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Create/Edit Folder Modal --- */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-outfit">{editingFolder ? 'Edit Folder' : 'Create New Folder'}</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Folder Name</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Chapter 1 - Integers" value={newFolderData.name} onChange={e => setNewFolderData({ ...newFolderData, name: e.target.value })} autoFocus />
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {Object.entries(FOLDER_COLORS).map(([key, c]) => (
                                        <button key={key} onClick={() => setNewFolderData({ ...newFolderData, color: key })}
                                            className={`w-9 h-9 rounded-full ${c.accent} transition-all ${newFolderData.color === key ? 'ring-4 ring-offset-2 ' + c.ring + ' scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Icon</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(FOLDER_ICONS).map(([key, Icon]) => {
                                        const colors = FOLDER_COLORS[newFolderData.color] || FOLDER_COLORS.blue;
                                        return (
                                            <button key={key} onClick={() => setNewFolderData({ ...newFolderData, icon: key })}
                                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${newFolderData.icon === key ? `${colors.iconBg} ${colors.text} ring-2 ${colors.ring} scale-110` : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
                                                <Icon size={20} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Preview</label>
                                {(() => {
                                    const colors = FOLDER_COLORS[newFolderData.color] || FOLDER_COLORS.blue;
                                    const Icon = FOLDER_ICONS[newFolderData.icon] || Folder;
                                    return (
                                        <div className={`rounded-2xl p-5 border-2 ${colors.bg} ${colors.border} inline-flex items-center gap-3`}>
                                            <div className={`w-10 h-10 ${colors.iconBg} ${colors.text} rounded-xl flex items-center justify-center`}><Icon size={20} /></div>
                                            <span className="font-bold text-gray-800 text-sm">{newFolderData.name || 'Folder Name'}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                            <button onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
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
