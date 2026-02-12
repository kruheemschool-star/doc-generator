import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PromptBuilderPage from './pages/PromptBuilderPage';
import WorksheetEditor from './components/WorksheetEditor';
import ErrorBoundary from './components/ErrorBoundary';
import { v4 as uuidv4 } from 'uuid';

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
    const [activeDocumentId, setActiveDocumentId] = useState(null);

    // --- Load Data on Startup ---
    useEffect(() => {
        const savedDocs = localStorage.getItem('kruheem_documents');
        const savedFolders = localStorage.getItem('kruheem_folders');
        const savedActiveId = localStorage.getItem('kruheem_active_doc');

        if (savedDocs) {
            try {
                setDocuments(JSON.parse(savedDocs));
            } catch (e) {
                console.error("Failed to parse documents", e);
                setDocuments(MOCK_DOCS);
            }
        } else {
            setDocuments(MOCK_DOCS);
        }

        if (savedFolders) {
            try {
                setFolders(JSON.parse(savedFolders));
            } catch (e) {
                console.error("Failed to parse folders", e);
                setFolders([]);
            }
        }

        if (savedActiveId) {
            setActiveDocumentId(savedActiveId);
        }
    }, []);

    // --- Auto-Save Effect ---
    useEffect(() => {
        if (documents.length > 0) {
            localStorage.setItem('kruheem_documents', JSON.stringify(documents));
        }
    }, [documents]);

    useEffect(() => {
        localStorage.setItem('kruheem_folders', JSON.stringify(folders));
    }, [folders]);

    useEffect(() => {
        if (activeDocumentId) {
            localStorage.setItem('kruheem_active_doc', activeDocumentId);
        } else {
            localStorage.removeItem('kruheem_active_doc');
        }
    }, [activeDocumentId]);

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

    const handleDeleteDocument = (docId) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            setDocuments(prev => prev.filter(d => d.id !== docId));
            if (activeDocumentId === docId) {
                setActiveDocumentId(null);
                setCurrentView('dashboard');
            }
        }
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

    const handleSaveDocument = (updatedPages) => {
        if (!activeDocumentId) return;

        setDocuments(prev => prev.map(doc => {
            if (doc.id === activeDocumentId) {
                return { ...doc, pages: updatedPages };
            }
            return doc;
        }));
    };

    const handleBackToDashboard = () => {
        handleViewChange('dashboard');
    };

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
                        onOpenDocument={handleOpenDocument}
                        onCreateDocument={handleCreateDocument}
                        onDeleteDocument={handleDeleteDocument}
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
