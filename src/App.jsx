import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';
import { v4 as uuidv4 } from 'uuid';
import { saveDocument, loadDocuments, deleteDocument as fbDeleteDocument, saveFolders, loadFolders, saveActiveDocId, loadActiveDocId, saveTrash, loadTrash } from './firebase';
import { DEFAULT_FONT_ID } from './data/documentFonts';

/**
 * Schema migration — ensures older documents loaded from Firestore have all
 * required fields. Add new fields here whenever the doc schema evolves.
 */
const migrateDocument = (doc) => {
    if (!doc || typeof doc !== 'object') return doc;
    return {
        subtitle: '',
        folderId: null,
        ...doc,
        // Guaranteed-valid fields (override even if doc has nullish/invalid values)
        pages: Array.isArray(doc.pages) ? doc.pages : [],
        fontId: doc.fontId || DEFAULT_FONT_ID,
    };
};

// Code-split heavy routes — PromptBuilderPage (1k+ lines) and WorksheetEditor (1.2k+ lines)
const PromptBuilderPage = lazy(() => import('./pages/PromptBuilderPage'));
const WorksheetEditor = lazy(() => import('./components/WorksheetEditor'));

const LoadingScreen = ({ label = 'กำลังโหลด...' }) => (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gray-50 dark:bg-[#1e1e2f]">
        <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{label}</p>
        </div>
    </div>
);

// --- Mock Initial Documents (Fallback) ---
const MOCK_DOCS = [
    { id: 'doc-1', title: 'Integer Practice', grade: 'M1', term: 'Term 1', topic: 'Integers', date: '2023-10-25', pages: [] },
    { id: 'doc-2', title: 'Final Exam M1', grade: 'M1', term: 'Term 2', topic: 'Linear Equations', date: '2023-11-10', pages: [] },
    { id: 'doc-3', title: 'Pythagoras Quiz', grade: 'M2', term: 'Term 1', topic: 'Pythagoras', date: '2023-12-05', pages: [] },
];

const App = () => {
    // --- View State ---
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'editor' | 'prompt-builder'

    // --- Data Persistence State ---
    const [documents, setDocuments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [trashedDocs, setTrashedDocs] = useState([]);
    const [activeDocumentId, setActiveDocumentId] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoad = useRef(true);

    // Toast notifications (surfaces otherwise-silent Firestore write failures)
    const { toasts, addToast, removeToast } = useToast();
    // Content the editor already persisted directly (handleSaveDocument); the
    // auto-save effect skips these so the same doc isn't written twice.
    const lastDirectSaveRef = useRef(new Map());

    // --- Load Data from Firestore on Startup ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [docs, flds, activeId, trash] = await Promise.all([
                    loadDocuments(),
                    loadFolders(),
                    loadActiveDocId(),
                    loadTrash()
                ]);
                setDocuments(docs.length > 0 ? docs.map(migrateDocument) : MOCK_DOCS);
                setFolders(flds || []);
                setTrashedDocs((trash || []).map(migrateDocument));
                if (activeId) setActiveDocumentId(activeId);
            } catch (error) {
                console.error('Failed to load from Firestore:', error);
                setDocuments(MOCK_DOCS);
            } finally {
                setIsLoading(false);
                setTimeout(() => { isInitialLoad.current = false; }, 500);
            }
        };
        loadData();
    }, []);

    // --- Auto-Save to Firestore (only changed docs to reduce Firestore writes) ---
    const prevDocumentsRef = useRef([]);
    useEffect(() => {
        if (isInitialLoad.current || isLoading) {
            prevDocumentsRef.current = documents;
            return;
        }
        const prevMap = new Map(prevDocumentsRef.current.map(d => [d.id, d]));
        const changedDocs = documents.filter(d => {
            const prev = prevMap.get(d.id);
            if (prev === d) return false; // unchanged reference → no write
            const json = JSON.stringify(d);
            if (lastDirectSaveRef.current.get(d.id) === json) return false; // editor already wrote it
            return !prev || JSON.stringify(prev) !== json;
        });
        prevDocumentsRef.current = documents;
        if (changedDocs.length === 0) return;

        // Surface failures (incl. DocumentTooLargeError) via toast instead of failing
        // silently and losing the user's work. Covers Dashboard-originated changes
        // (rename/move/duplicate/delete); editor saves report via handleSaveDocument.
        let cancelled = false;
        Promise.allSettled(changedDocs.map(doc => saveDocument(doc))).then(results => {
            if (cancelled) return;
            const failed = results.find(r => r.status === 'rejected');
            if (failed) {
                console.error('Auto-save failed:', failed.reason);
                addToast(failed.reason?.message || 'บันทึกไม่สำเร็จ — โปรดลองอีกครั้ง', 'error', 6000);
            }
        });
        return () => { cancelled = true; };
    }, [documents, isLoading, addToast]);

    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        saveFolders(folders).catch(e => {
            console.error('Folder save failed:', e);
            addToast('บันทึกโฟลเดอร์ไม่สำเร็จ', 'error', 5000);
        });
    }, [folders, isLoading, addToast]);

    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        saveTrash(trashedDocs).catch(e => {
            console.error('Trash save failed:', e);
            addToast('บันทึกถังขยะไม่สำเร็จ', 'error', 5000);
        });
    }, [trashedDocs, isLoading, addToast]);

    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        saveActiveDocId(activeDocumentId).catch(e => console.error('Active-doc save failed:', e));
    }, [activeDocumentId, isLoading]);

    // Derived State
    const activeDocument = documents.find(d => d.id === activeDocumentId) || null;

    // --- Handlers ---
    const handleViewChange = useCallback((view) => {
        if (view === 'dashboard') {
            setActiveDocumentId(null);
        }
        setCurrentView(view);
    }, []);

    // Called when clicking a doc in Dashboard
    const handleOpenDocument = useCallback((doc) => {
        setActiveDocumentId(doc.id);
        setCurrentView('editor');
    }, []);

    // Called when creating a new doc in Dashboard
    const handleCreateDocument = useCallback((newDocInfo) => {
        const newDoc = {
            ...newDocInfo,
            id: newDocInfo.id || uuidv4(),
            pages: [{ id: uuidv4(), questions: [] }] // Initialize with one empty page
        };
        setDocuments(prev => [newDoc, ...prev]);
        setActiveDocumentId(newDoc.id);
        setCurrentView('editor');
    }, []);

    const handleUpdateDocument = useCallback((docId, updates) => {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
    }, []);

    const handleDeleteDocument = useCallback((docId) => {
        setDocuments(prev => {
            const doc = prev.find(d => d.id === docId);
            if (!doc) return prev;
            setTrashedDocs(t => {
                // Guard against duplicate trash entries
                if (t.some(d => d.id === docId)) return t;
                return [{ ...doc, deletedAt: new Date().toISOString() }, ...t];
            });
            return prev.filter(d => d.id !== docId);
        });
        setActiveDocumentId(prev => {
            if (prev === docId) { setCurrentView('dashboard'); return null; }
            return prev;
        });
    }, []);

    const handleBatchDelete = useCallback((docIds) => {
        setDocuments(prev => {
            const docsToTrash = prev.filter(d => docIds.includes(d.id));
            setTrashedDocs(t => [...docsToTrash.map(d => ({ ...d, deletedAt: new Date().toISOString() })), ...t]);
            return prev.filter(d => !docIds.includes(d.id));
        });
    }, []);

    const handleRestoreDocument = useCallback((docId) => {
        setTrashedDocs(prev => {
            const doc = prev.find(d => d.id === docId);
            if (!doc) return prev;
            const { deletedAt, ...restoredDoc } = doc;
            setDocuments(docs => [restoredDoc, ...docs]);
            return prev.filter(d => d.id !== docId);
        });
    }, []);

    const handlePermanentDelete = useCallback(async (docId) => {
        // Delete from Firestore first; only drop from local state on success so a
        // failed delete doesn't leave a "zombie" that reappears on reload.
        try {
            await fbDeleteDocument(docId);
            setTrashedDocs(prev => prev.filter(d => d.id !== docId));
        } catch (e) {
            console.error('Permanent delete failed:', e);
            addToast('ลบถาวรไม่สำเร็จ — โปรดลองอีกครั้ง', 'error', 5000);
        }
    }, [addToast]);

    const handleEmptyTrash = useCallback(async () => {
        const docs = trashedDocs;
        const results = await Promise.allSettled(docs.map(doc => fbDeleteDocument(doc.id)));
        // Keep only docs whose Firestore delete actually failed (stay consistent with the DB).
        const deletedIds = new Set(docs.filter((_, i) => results[i].status === 'fulfilled').map(d => d.id));
        setTrashedDocs(prev => prev.filter(d => !deletedIds.has(d.id)));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            console.error('Empty trash: some deletes failed', results);
            addToast(`ลบถาวรไม่สำเร็จ ${failed} รายการ — โปรดลองอีกครั้ง`, 'error', 5000);
        }
    }, [trashedDocs, addToast]);

    // --- Folder Handlers ---
    const handleCreateFolder = useCallback((folderData) => {
        const newFolder = {
            id: uuidv4(),
            name: folderData.name,
            color: folderData.color || 'blue',
            icon: folderData.icon || 'folder',
            grade: folderData.grade,
            term: folderData.term,
            createdAt: new Date().toISOString()
        };
        setFolders(prev => [newFolder, ...prev]);
    }, []);

    const handleUpdateFolder = useCallback((folderId, updates) => {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
    }, []);

    const handleDeleteFolder = useCallback((folderId) => {
        // Move docs out of folder before deleting
        setDocuments(prev => prev.map(d => d.folderId === folderId ? { ...d, folderId: null } : d));
        setFolders(prev => prev.filter(f => f.id !== folderId));
    }, []);

    const handleMoveDocToFolder = useCallback((docId, folderId) => {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, folderId: folderId || null } : d));
    }, []);

    const handleDuplicateDocument = useCallback((docId) => {
        setDocuments(prev => {
            const original = prev.find(d => d.id === docId);
            if (!original) return prev;
            const copy = {
                ...original,
                id: uuidv4(),
                title: original.title + ' (Copy)',
                date: new Date().toISOString().split('T')[0],
                pages: JSON.parse(JSON.stringify(original.pages || []))
            };
            return [copy, ...prev];
        });
    }, []);

    const handleSaveDocument = useCallback(async (updatedPages, subtitle, settings = {}) => {
        if (!activeDocumentId) return;
        let updatedDoc = null;
        setDocuments(prev => prev.map(doc => {
            if (doc.id === activeDocumentId) {
                updatedDoc = { ...doc, pages: updatedPages, subtitle: subtitle || '', ...settings };
                return updatedDoc;
            }
            return doc;
        }));
        if (!updatedDoc) return;
        // Record before awaiting so the auto-save effect (which runs on the resulting
        // re-render) skips this doc instead of double-writing it.
        lastDirectSaveRef.current.set(updatedDoc.id, JSON.stringify(updatedDoc));
        try {
            await saveDocument(updatedDoc); // throws on failure → editor catches & shows error
        } catch (e) {
            lastDirectSaveRef.current.delete(updatedDoc.id); // allow a later edit to retry
            throw e;
        }
    }, [activeDocumentId]);

    const handleBackToDashboard = useCallback(() => {
        handleViewChange('dashboard');
    }, [handleViewChange]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e2f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e2f] flex flex-col">
            {/* Navbar */}
            <Navbar currentView={currentView} onViewChange={handleViewChange} />

            {/* --- Main Content Area --- */}
            <div className={`flex-1 ${currentView !== 'dashboard' ? 'animate-page-fade-in' : ''}`} key={currentView}>

                {/* Dashboard View */}
                {currentView === 'dashboard' && (
                    <Dashboard
                        documents={documents}
                        folders={folders}
                        trashedDocs={trashedDocs}
                        onOpenDocument={handleOpenDocument}
                        onCreateDocument={handleCreateDocument}
                        onDeleteDocument={handleDeleteDocument}
                        onUpdateDocument={handleUpdateDocument}
                        onBatchDelete={handleBatchDelete}
                        onRestoreDocument={handleRestoreDocument}
                        onPermanentDelete={handlePermanentDelete}
                        onEmptyTrash={handleEmptyTrash}
                        onCreateFolder={handleCreateFolder}
                        onUpdateFolder={handleUpdateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onMoveDocToFolder={handleMoveDocToFolder}
                        onDuplicateDocument={handleDuplicateDocument}
                    />
                )}

                {/* Prompt Builder View */}
                {currentView === 'prompt-builder' && (
                    <Suspense fallback={<LoadingScreen label="กำลังโหลด Prompt Builder..." />}>
                        <PromptBuilderPage />
                    </Suspense>
                )}

                {/* Editor View */}
                {currentView === 'editor' && (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingScreen label="กำลังโหลด Editor..." />}>
                            <WorksheetEditor
                                key={activeDocumentId}
                                activeDocument={activeDocument}
                                initialData={activeDocument?.pages || []}
                                onSave={handleSaveDocument}
                                onBack={handleBackToDashboard}
                            />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default App;
