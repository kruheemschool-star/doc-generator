import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Sticker, ImagePlus, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { fileToIconDataURL } from '../utils/imageCompression';
import { saveIcon, loadIconLibrary, deleteIcon } from '../firebase';
import { useModalA11y } from '../hooks/useModalA11y';

/**
 * Personal icon/logo/stamp library — reusable across every document, separate
 * from the one-off images a teacher drops into a single worksheet. Stored in
 * its own Firestore collection (see firebase.js) so it survives independent
 * of any one document. Icons load once per modal-open and are cached in
 * local state; upload/delete write straight through to Firestore.
 */
const IconLibraryModal = ({ isOpen, onClose, onSelect }) => {
    const [icons, setIcons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null); // { done, total }
    const [error, setError] = useState('');
    const modalRef = useModalA11y(isOpen, onClose);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setIsLoading(true);
        loadIconLibrary().then(loaded => {
            if (cancelled) return;
            setIcons(loaded.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, [isOpen]);

    const handleUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        e.target.value = '';
        if (files.length === 0) return;
        setError('');
        setIsUploading(true);
        setUploadProgress({ done: 0, total: files.length });

        const failed = [];
        for (const file of files) {
            try {
                const src = await fileToIconDataURL(file);
                const icon = { id: uuidv4(), name: file.name.replace(/\.[^.]+$/, '') || 'ไอคอนใหม่', src };
                await saveIcon(icon);
                setIcons(prev => [icon, ...prev]);
            } catch (err) {
                failed.push(`${file.name} (${err.message || 'อัปโหลดไม่สำเร็จ'})`);
            }
            setUploadProgress(prev => ({ done: prev.done + 1, total: files.length }));
        }

        if (failed.length > 0) {
            setError(`อัปโหลดไม่สำเร็จ ${failed.length} จาก ${files.length} ไฟล์ — ${failed.join(', ')}`);
        }
        setIsUploading(false);
        setUploadProgress(null);
    }, []);

    const handleRename = useCallback((iconId, name) => {
        setIcons(prev => prev.map(ic => ic.id === iconId ? { ...ic, name } : ic));
    }, []);

    const handleRenameCommit = useCallback((icon) => {
        saveIcon(icon).catch(() => setError('บันทึกชื่อไม่สำเร็จ'));
    }, []);

    const handleDelete = useCallback(async (iconId) => {
        if (!window.confirm('ลบไอคอนนี้จากคลังหรือไม่? (ไอคอนที่ใช้ในเอกสารเดิมจะไม่หายไป)')) return;
        setIcons(prev => prev.filter(ic => ic.id !== iconId));
        try {
            await deleteIcon(iconId);
        } catch {
            setError('ลบไอคอนไม่สำเร็จ — โปรดลองอีกครั้ง');
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="icon-library-title"
                tabIndex={-1}
                className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-7 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between">
                    <div>
                        <h3 id="icon-library-title" className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600">
                                <Sticker size={16} />
                            </div>
                            คลังไอคอนของฉัน
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 ml-[42px]">
                            เก็บโลโก้/ตรา/ไอคอนที่ใช้ซ้ำได้ทุกเอกสาร — อัปโหลดครั้งเดียว ใช้ได้ตลอด
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-300 dark:text-slate-600 hover:text-gray-500 transition-colors" aria-label="ปิด">
                        <X size={18} />
                    </button>
                </div>

                {/* Upload */}
                <div className="px-7 pt-4">
                    <label className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-bold cursor-pointer transition-colors ${isUploading ? 'border-gray-200 text-gray-300' : 'border-teal-200 text-teal-700 hover:border-teal-400 hover:bg-teal-50/50'}`}>
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                        {isUploading ? `กำลังอัปโหลด... (${uploadProgress?.done ?? 0}/${uploadProgress?.total ?? 0})` : 'อัปโหลดไอคอนใหม่'}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={isUploading} />
                    </label>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 text-center">เลือกได้ทีละหลายไฟล์ (กด Ctrl/Cmd หรือ Shift ค้างตอนเลือกไฟล์)</p>
                    {error && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                            <AlertCircle size={13} /> {error}
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div className="px-7 py-5 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 text-gray-300 dark:text-slate-600">
                            <Loader2 size={22} className="animate-spin" />
                        </div>
                    ) : icons.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm font-medium">
                            ยังไม่มีไอคอนในคลัง — อัปโหลดไอคอนแรกของคุณด้านบน
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {icons.map(icon => (
                                <div key={icon.id} className="group relative flex flex-col items-center gap-1.5">
                                    <button
                                        onClick={() => onSelect?.(icon.src)}
                                        className="w-full aspect-square rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-teal-400 hover:shadow-md transition-all bg-white dark:bg-slate-950 flex items-center justify-center p-2.5 overflow-hidden"
                                        title={`ใช้ไอคอนนี้: ${icon.name}`}
                                    >
                                        <img src={icon.src} alt={icon.name} className="max-w-full max-h-full object-contain" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(icon.id)}
                                        className="absolute top-1 right-1 p-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        aria-label={`ลบไอคอน ${icon.name}`}
                                        title="ลบจากคลัง"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                    <input
                                        value={icon.name}
                                        onChange={(e) => handleRename(icon.id, e.target.value)}
                                        onBlur={() => handleRenameCommit(icon)}
                                        className="w-full text-[11px] text-center text-gray-600 dark:text-slate-300 bg-transparent outline-none focus:bg-gray-50 dark:focus:bg-slate-800 rounded px-1 py-0.5 truncate"
                                        aria-label="ชื่อไอคอน"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IconLibraryModal;
