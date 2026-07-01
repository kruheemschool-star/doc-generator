import React, { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, GripVertical, Image as ImageIcon, Upload, ChevronUp, ChevronDown, AlertCircle, Sticker, BookmarkPlus, Check } from 'lucide-react';
import { fileToCompressedDataURL } from '../utils/imageCompression';
import { saveIcon } from '../firebase';
import IconLibraryModal from './IconLibraryModal';

const ImageItem = memo(({ id, index, src, content, size = 'medium', onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown, isViewOnly, frameStyle, addToast }) => {
    // content can be used for caption if needed, src is the image source
    const [isHovered, setIsHovered] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const handleSaveToLibrary = async () => {
        if (!src) return;
        const name = window.prompt('ตั้งชื่อไอคอนนี้ (สำหรับค้นหาในคลังทีหลัง):', 'ไอคอนของฉัน');
        if (name === null) return; // cancelled
        try {
            await saveIcon({ id: uuidv4(), name: name.trim() || 'ไอคอนของฉัน', src });
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 1800);
        } catch {
            const msg = 'บันทึกลงคลังไอคอนไม่สำเร็จ — โปรดลองอีกครั้ง';
            setUploadError(msg);
            addToast?.(msg, 'error', 4000);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        setUploadError('');
        setIsUploading(true);
        try {
            const dataUrl = await fileToCompressedDataURL(file);
            onUpdate(id, { src: dataUrl });
        } catch (error) {
            console.error('Image processing error:', error);
            const msg = error.message || 'ไม่สามารถประมวลผลรูปภาพได้';
            setUploadError(msg);
            addToast?.(msg, 'error', 4000);
        } finally {
            setIsUploading(false);
        }
    };

    const handleResize = (newSize) => {
        onUpdate(id, { size: newSize });
    };

    const getSizeClass = () => {
        switch (size) {
            case 'small': return 'max-w-[200px]';
            case 'large': return 'max-w-full';
            case 'medium': default: return 'max-w-[400px]';
        }
    };

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-1 transition-all flex flex-col items-center ${snapshot.isDragging ? 'z-50 opacity-90' : ''
                        }`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={(e) => {
                        if (isViewOnly) return;
                        e.stopPropagation();
                        onSelect && onSelect(id);
                    }}
                >
                    {/* Hover Controls */}
                    {!isViewOnly && (
                        <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-2 print:hidden">
                            <div
                                {...provided.dragHandleProps}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab"
                                title="Drag to reorder"
                            >
                                <GripVertical size={16} />
                            </div>
                            {canMoveUp && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, 'up'); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="Move up"
                                >
                                    <ChevronUp size={16} />
                                </button>
                            )}
                            {canMoveDown && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, 'down'); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="Move down"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    <div
                        className={`relative rounded-lg overflow-hidden border-2 transition-all p-2 ${isSelected
                        ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/10'
                        : 'border-transparent hover:border-blue-200'
                        } ${!src ? 'w-full bg-gray-50 border-dashed border-gray-300' : ''}`}
                        style={!isSelected && src && frameStyle ? frameStyle : undefined}
                    >

                        {src ? (
                            <div className="relative group/image">
                                <img
                                    src={src}
                                    alt="Content"
                                    className={`rounded-md shadow-sm object-contain mx-auto ${getSizeClass()}`}
                                />
                                {/* Resize + library controls overlay */}
                                {!isViewOnly && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm p-1 rounded-lg flex gap-1 print:hidden">
                                        <button onClick={() => handleResize('small')} className={`p-1 hover:text-white ${size === 'small' ? 'text-white' : 'text-gray-400'}`} title="Small"><ImageIcon size={14} /></button>
                                        <button onClick={() => handleResize('medium')} className={`p-1 hover:text-white ${size === 'medium' ? 'text-white' : 'text-gray-400'}`} title="Medium"><ImageIcon size={18} /></button>
                                        <button onClick={() => handleResize('large')} className={`p-1 hover:text-white ${size === 'large' ? 'text-white' : 'text-gray-400'}`} title="Large"><ImageIcon size={22} /></button>
                                        <span className="w-px bg-white/20 mx-0.5" />
                                        <button onClick={() => setShowLibrary(true)} className="p-1 text-gray-400 hover:text-white" title="เลือกรูปอื่นจากคลังไอคอน"><Sticker size={16} /></button>
                                        <button onClick={handleSaveToLibrary} className="p-1 text-gray-400 hover:text-white" title="บันทึกรูปนี้ลงคลังไอคอน (ใช้ซ้ำได้ทุกเอกสาร)">
                                            {justSaved ? <Check size={16} className="text-emerald-400" /> : <BookmarkPlus size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`flex flex-col items-center justify-center py-8 text-gray-400 ${!isViewOnly ? 'cursor-pointer' : ''}`} onClick={() => !isViewOnly && document.getElementById(`upload-${id}`).click()}>
                                {isUploading ? (
                                    <>
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <span className="text-sm font-medium">กำลังประมวลผล...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} className="mb-2" />
                                        <span className="text-sm font-medium">คลิกอัปโหลดรูปภาพ</span>
                                        <span className="text-xs text-gray-400 mt-1">(สูงสุด 5MB)</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowLibrary(true); }}
                                            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700"
                                        >
                                            <Sticker size={13} /> หรือเลือกจากคลังไอคอน
                                        </button>
                                    </>
                                )}
                                <input
                                    id={`upload-${id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        )}

                        {/* Error Message */}
                        {uploadError && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                                <AlertCircle size={14} />
                                <span>{uploadError}</span>
                            </div>
                        )}
                    </div>

                    <IconLibraryModal
                        isOpen={showLibrary}
                        onClose={() => setShowLibrary(false)}
                        addToast={addToast}
                        onSelect={(iconSrc) => { onUpdate(id, { src: iconSrc }); setShowLibrary(false); }}
                    />
                </div>
            )}
        </Draggable>
    );
});

export default ImageItem;
