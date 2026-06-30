import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
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
const auth = getAuth(app);

// --- Anonymous auth ---
// firestore.rules require `request.auth != null`, so every read/write must run
// inside an authenticated session. There is no login UI; we sign in anonymously
// once and reuse the same session. ensureAuth() is awaited before any Firestore
// call so the first operations don't race the sign-in.
//
// Prerequisite: enable Anonymous sign-in in Firebase Console → Authentication.
// If it is disabled, sign-in rejects; we log it (not throw at module load, so the
// app still renders) and Firestore reads fall back to their safe defaults.
let authReadyPromise = null;
const ensureAuth = () => {
  if (!authReadyPromise) {
    authReadyPromise = (auth.currentUser
      ? Promise.resolve(auth.currentUser)
      : signInAnonymously(auth).then(cred => cred.user)
    ).catch(error => {
      // Attempt sign-in only ONCE per session. The most common cause is Anonymous
      // sign-in not being enabled in the Firebase Console — retrying on every
      // Firestore call would flood the console and hammer the network for nothing.
      // After this, reads fall back to safe defaults and writes surface a toast.
      // (Re-enable auth in the Console, then reload to retry.)
      if (error?.code === 'auth/configuration-not-found') {
        console.warn("Anonymous sign-in is not enabled in the Firebase Console — running without persistence. Enable Authentication → Anonymous, then reload.");
      } else {
        console.error("Anonymous auth failed:", error);
      }
      throw error;
    });
  }
  return authReadyPromise;
};

// Kick off sign-in eagerly so it's usually ready by the time the app reads data.
ensureAuth().catch(() => { /* already logged in ensureAuth */ });

// --- Document CRUD ---
// Mutations throw on failure so callers can show user-facing errors.
// Reads return safe defaults but also log to console.

// Firestore rejects any document larger than 1 MiB. We guard a bit below that
// so the user gets a clear warning instead of a silent write failure + lost work.
export const FIRESTORE_DOC_LIMIT = 1048576;        // 1 MiB hard limit
export const SAFE_DOC_SIZE = 950000;               // headroom below the hard limit

export class DocumentTooLargeError extends Error {
  constructor(size) {
    super(`เอกสารมีขนาด ${Math.round(size / 1024)} KB เกินขีดจำกัดของ Firestore (1 MB) — ลองลดจำนวน/ขนาดรูปภาพในเอกสาร`);
    this.name = 'DocumentTooLargeError';
    this.code = 'doc-too-large';
    this.size = size;
  }
}

// Byte length of the JSON payload (Blob handles multibyte Thai/base64 correctly).
const estimateDocSize = (obj) => {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch (_) {
    return JSON.stringify(obj).length; // fallback when Blob is unavailable
  }
};

export const saveDocument = async (docData) => {
  const payload = { ...docData, updatedAt: new Date().toISOString() };
  const size = estimateDocSize(payload);
  if (size > SAFE_DOC_SIZE) {
    // Throw before hitting the network so the UI can warn and the user can act.
    throw new DocumentTooLargeError(size);
  }
  try {
    await ensureAuth();
    await setDoc(doc(db, "documents", docData.id), payload);
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
};

export const loadDocuments = async () => {
  try {
    await ensureAuth();
    const snapshot = await getDocs(collection(db, "documents"));
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    console.error("Error loading documents:", error);
    return [];
  }
};

export const deleteDocument = async (docId) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, "documents", docId));
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// --- Folders CRUD ---
export const saveFolders = async (folders) => {
  try {
    await ensureAuth();
    await setDoc(doc(db, "settings", "folders"), { data: folders });
  } catch (error) {
    console.error("Error saving folders:", error);
    throw error;
  }
};

export const loadFolders = async () => {
  try {
    await ensureAuth();
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
    await ensureAuth();
    await setDoc(doc(db, "settings", "activeDoc"), { id: activeId || null });
  } catch (error) {
    console.error("Error saving active doc:", error);
    throw error;
  }
};

export const loadActiveDocId = async () => {
  try {
    await ensureAuth();
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
    await ensureAuth();
    await setDoc(doc(db, "settings", "trash"), { data: trashedDocs });
  } catch (error) {
    console.error("Error saving trash:", error);
    throw error;
  }
};

export const loadTrash = async () => {
  try {
    await ensureAuth();
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
    await ensureAuth();
    await setDoc(doc(db, "settings", "promptSettings"), { data: settings });
  } catch (error) {
    console.error("Error saving prompt settings:", error);
    throw error;
  }
};

export const loadPromptSettings = async () => {
  try {
    await ensureAuth();
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
    await ensureAuth();
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
    await ensureAuth();
    const snapshot = await getDocs(collection(db, "promptTemplates"));
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    console.error("Error loading prompt templates:", error);
    return [];
  }
};

export const deletePromptTemplate = async (templateId) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, "promptTemplates", templateId));
  } catch (error) {
    console.error("Error deleting prompt template:", error);
    throw error;
  }
};

export { db, auth, ensureAuth };
