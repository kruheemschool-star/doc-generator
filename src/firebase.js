import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCY4SrCmkjRk82BBB5KNorIVNlxXXqXmdg",
  authDomain: "kruheem-doc-generator.firebaseapp.com",
  projectId: "kruheem-doc-generator",
  storageBucket: "kruheem-doc-generator.firebasestorage.app",
  messagingSenderId: "385829860524",
  appId: "1:385829860524:web:e4f8d0ae402a63ac5bdb09"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Document CRUD ---
export const saveDocument = async (docData) => {
  try {
    await setDoc(doc(db, "documents", docData.id), {
      ...docData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving document:", error);
  }
};

export const loadDocuments = async () => {
  try {
    const snapshot = await getDocs(collection(db, "documents"));
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    console.error("Error loading documents:", error);
    return [];
  }
};

export const deleteDocument = async (docId) => {
  try {
    await deleteDoc(doc(db, "documents", docId));
  } catch (error) {
    console.error("Error deleting document:", error);
  }
};

// --- Folders CRUD ---
export const saveFolders = async (folders) => {
  try {
    await setDoc(doc(db, "settings", "folders"), { data: folders });
  } catch (error) {
    console.error("Error saving folders:", error);
  }
};

export const loadFolders = async () => {
  try {
    const snap = await getDoc(doc(db, "settings", "folders"));
    return snap.exists() ? snap.data().data : [];
  } catch (error) {
    console.error("Error loading folders:", error);
    return [];
  }
};

// --- Active Document ---
export const saveActiveDocId = async (activeId) => {
  try {
    await setDoc(doc(db, "settings", "activeDoc"), { id: activeId || null });
  } catch (error) {
    console.error("Error saving active doc:", error);
  }
};

export const loadActiveDocId = async () => {
  try {
    const snap = await getDoc(doc(db, "settings", "activeDoc"));
    return snap.exists() ? snap.data().id : null;
  } catch (error) {
    console.error("Error loading active doc:", error);
    return null;
  }
};

// --- Trash ---
export const saveTrash = async (trashedDocs) => {
  try {
    await setDoc(doc(db, "settings", "trash"), { data: trashedDocs });
  } catch (error) {
    console.error("Error saving trash:", error);
  }
};

export const loadTrash = async () => {
  try {
    const snap = await getDoc(doc(db, "settings", "trash"));
    return snap.exists() ? snap.data().data : [];
  } catch (error) {
    console.error("Error loading trash:", error);
    return [];
  }
};

// --- Prompt Settings ---
export const savePromptSettings = async (settings) => {
  try {
    await setDoc(doc(db, "settings", "promptSettings"), { data: settings });
  } catch (error) {
    console.error("Error saving prompt settings:", error);
  }
};

export const loadPromptSettings = async () => {
  try {
    const snap = await getDoc(doc(db, "settings", "promptSettings"));
    return snap.exists() ? snap.data().data : null;
  } catch (error) {
    console.error("Error loading prompt settings:", error);
    return null;
  }
};

// --- Prompt Templates CRUD (Item 5) ---
export const savePromptTemplate = async (template) => {
  try {
    await setDoc(doc(db, "promptTemplates", template.id), {
      ...template,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving prompt template:", error);
    throw error;
  }
};

export const loadPromptTemplates = async () => {
  try {
    const snapshot = await getDocs(collection(db, "promptTemplates"));
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    console.error("Error loading prompt templates:", error);
    return [];
  }
};

export const deletePromptTemplate = async (templateId) => {
  try {
    await deleteDoc(doc(db, "promptTemplates", templateId));
  } catch (error) {
    console.error("Error deleting prompt template:", error);
    throw error;
  }
};

export { db };
