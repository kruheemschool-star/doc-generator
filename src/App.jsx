import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PromptBuilderPage from './pages/PromptBuilderPage';
import WorksheetEditor from './components/WorksheetEditor';
import ErrorBoundary from './components/ErrorBoundary';
import { v4 as uuidv4 } from 'uuid';
import { saveDocument, loadDocuments, deleteDocument as fbDeleteDocument, saveFolders, loadFolders, saveActiveDocId, loadActiveDocId, saveTrash, loadTrash } from './firebase';

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
                setDocuments(docs.length > 0 ? docs : MOCK_DOCS);
                setFolders(flds || []);
                setTrashedDocs(trash || []);
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

    // --- Auto-Save to Firestore ---
    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        documents.forEach(doc => saveDocument(doc));
    }, [documents, isLoading]);

    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        saveFolders(folders);
    }, [folders, isLoading]);

    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        saveTrash(trashedDocs);
    }, [trashedDocs, isLoading]);

    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;
        saveActiveDocId(activeDocumentId);
    }, [activeDocumentId, isLoading]);

    // Derived State
    const activeDocument = documents.find(d => d.id === activeDocumentId) || null;

    // --- Handlers ---
    const handleViewChange = (view) => {
        if (view === 'dashboard') {
            setActiveDocumentId(null);
        }
        setCurrentView(view);
    };

    // Called when clicking a doc in Dashboard
    const handleOpenDocument = (doc) => {
        setActiveDocumentId(doc.id);
        setCurrentView('editor');
    };

    // Called when creating a new doc in Dashboard
    const handleCreateDocument = (newDocInfo) => {
        const newDoc = {
            ...newDocInfo,
            id: newDocInfo.id || uuidv4(),
            pages: [{ id: uuidv4(), questions: [] }] // Initialize with one empty page
        };

        setDocuments(prev => [newDoc, ...prev]);
        setActiveDocumentId(newDoc.id);
        setCurrentView('editor');
    };

    const handleUpdateDocument = (docId, updates) => {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
    };

    const handleDeleteDocument = (docId) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;
        setTrashedDocs(prev => [{ ...doc, deletedAt: new Date().toISOString() }, ...prev]);
        setDocuments(prev => prev.filter(d => d.id !== docId));
        if (activeDocumentId === docId) {
            setActiveDocumentId(null);
            setCurrentView('dashboard');
        }
    };

    const handleBatchDelete = (docIds) => {
        const docsToTrash = documents.filter(d => docIds.includes(d.id));
        setTrashedDocs(prev => [...docsToTrash.map(d => ({ ...d, deletedAt: new Date().toISOString() })), ...prev]);
        setDocuments(prev => prev.filter(d => !docIds.includes(d.id)));
    };

    const handleRestoreDocument = (docId) => {
        const doc = trashedDocs.find(d => d.id === docId);
        if (!doc) return;
        const { deletedAt, ...restoredDoc } = doc;
        setDocuments(prev => [restoredDoc, ...prev]);
        setTrashedDocs(prev => prev.filter(d => d.id !== docId));
    };

    const handlePermanentDelete = async (docId) => {
        setTrashedDocs(prev => prev.filter(d => d.id !== docId));
        await fbDeleteDocument(docId);
    };

    const handleEmptyTrash = async () => {
        for (const doc of trashedDocs) {
            await fbDeleteDocument(doc.id);
        }
        setTrashedDocs([]);
    };

    // --- Folder Handlers ---
    const handleCreateFolder = (folderData) => {
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
    };

    const handleUpdateFolder = (folderId, updates) => {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
    };

    const handleDeleteFolder = (folderId) => {
        // Move docs out of folder before deleting
        setDocuments(prev => prev.map(d => d.folderId === folderId ? { ...d, folderId: null } : d));
        setFolders(prev => prev.filter(f => f.id !== folderId));
    };

    const handleMoveDocToFolder = (docId, folderId) => {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, folderId: folderId || null } : d));
    };

    const handleDuplicateDocument = (docId) => {
        const original = documents.find(d => d.id === docId);
        if (!original) return;
        const copy = {
            ...original,
            id: uuidv4(),
            title: original.title + ' (Copy)',
            date: new Date().toISOString().split('T')[0],
            pages: JSON.parse(JSON.stringify(original.pages || []))
        };
        setDocuments(prev => [copy, ...prev]);
    };

    const handleSaveDocument = (updatedPages, subtitle) => {
        if (!activeDocumentId) return;

        setDocuments(prev => prev.map(doc => {
            if (doc.id === activeDocumentId) {
                return { ...doc, pages: updatedPages, subtitle: subtitle || '' };
            }
            return doc;
        }));
    };

    const handleBackToDashboard = () => {
        handleViewChange('dashboard');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm font-medium">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <Navbar currentView={currentView} onViewChange={handleViewChange} />

            {/* --- Main Content Area --- */}
            <div className="flex-1">

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
                    <PromptBuilderPage />
                )}

                {/* Editor View */}
                {currentView === 'editor' && (
                    <ErrorBoundary>
                        <WorksheetEditor
                            key={activeDocumentId}
                            activeDocument={activeDocument}
                            initialData={activeDocument?.pages || []}
                            onSave={handleSaveDocument}
                            onBack={handleBackToDashboard}
                        />
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
};

export default App;
