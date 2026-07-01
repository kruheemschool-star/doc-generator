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

// --- Anonymous auth (best-effort) ---
// We sign in anonymously once and reuse the session, so that a locked-down
// `firestore.rules` (request.auth != null) works. IMPORTANT: this is best-effort
// — ensureAuth() NEVER rejects. If Anonymous sign-in is disabled in the Firebase
// Console the Firestore call still runs afterwards, so a project whose rules are
// still open keeps reading/writing exactly as before (no "my documents vanished").
// Only locked rules + no auth will deny the op, which each CRUD already handles.
//
// To turn on real protection: enable Authentication → Anonymous in the Console,
// then deploy rules that require `request.auth != null`. Reload to pick up auth.
let authReadyPromise = null;
const ensureAuth = () => {
  if (!authReadyPromise) {
    authReadyPromise = (auth.currentUser
      ? Promise.resolve(auth.currentUser)
      : signInAnonymously(auth).then(cred => cred.user)
    ).catch(error => {
      // Sign-in attempted once per session. Log once, then resolve to null so the
      // Firestore operation proceeds regardless (works under open rules).
      if (error?.code === 'auth/configuration-not-found') {
        console.warn("Anonymous sign-in is not enabled in the Firebase Console — continuing without auth (works while Firestore rules are open).");
      } else {
        console.error("Anonymous auth failed:", error);
      }
      return null;
    });
  }
  return authReadyPromise;
};

// Kick off sign-in eagerly so it's usually ready by the time the app reads data.
ensureAuth();

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

// --- Icon Library CRUD ---
// Personal, reusable icon/logo/stamp collection — separate from the one-off
// images embedded directly inside a document's pages/questions.
export const saveIcon = async (icon) => {
  try {
    await ensureAuth();
    await setDoc(doc(db, "iconLibrary", icon.id), {
      ...icon,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving icon:", error);
    throw error;
  }
};

export const loadIconLibrary = async () => {
  try {
    await ensureAuth();
    const snapshot = await getDocs(collection(db, "iconLibrary"));
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    console.error("Error loading icon library:", error);
    return [];
  }
};

export const deleteIcon = async (iconId) => {
  try {
    await ensureAuth();
    await deleteDoc(doc(db, "iconLibrary", iconId));
  } catch (error) {
    console.error("Error deleting icon:", error);
    throw error;
  }
};

export { db, auth, ensureAuth };
