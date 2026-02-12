import React, { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Image as ImageIcon, Upload, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';

const ImageItem = memo(({ id, index, src, content, size = 'medium', onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown }) => {
    // content can be used for caption if needed, src is the image source
    const [isHovered, setIsHovered] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Compress image before converting to base64
    const compressImage = (file, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('รูปภาพใหญ่เกินไป (สูงสุด 5MB)');
            return;
        }
        
        setIsUploading(true);
        setUploadError('');
        
        try {
            // Compress image
            const compressedBlob = await compressImage(file);
            
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                
                // Check base64 size (Firestore limit ~1MB per document)
                if (base64.length > 800000) {
                    setUploadError('รูปภาพยังใหญ่เกินไปหลังบีบอัด ลองใช้รูปที่เล็กกว่า');
                    setIsUploading(false);
                    return;
                }
                
                onUpdate(id, { src: base64 });
                setIsUploading(false);
                setUploadError('');
            };
            reader.readAsDataURL(compressedBlob);
        } catch (error) {
            console.error('Image compression error:', error);
            setUploadError('ไม่สามารถประมวลผลรูปภาพได้');
            setIsUploading(false);
        }
        
        // Reset file input
        e.target.value = '';
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
        <Draggable draggableId={id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-1 transition-all flex flex-col items-center ${snapshot.isDragging ? 'z-50 opacity-90' : ''
                        }`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect && onSelect(id);
                    }}
                >
                    {/* Hover Controls */}
                    <div className="absolute right-full top-0 h-full w-10 hidden group-hover:flex flex-col gap-1 items-center pt-2 print:hidden">
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

                    <div className={`relative rounded-lg overflow-hidden border-2 transition-all p-2 ${isSelected
                        ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/10'
                        : 'border-transparent hover:border-blue-200'
                        } ${!src ? 'w-full bg-gray-50 border-dashed border-gray-300' : ''}`}>

                        {src ? (
                            <div className="relative group/image">
                                <img
                                    src={src}
                                    alt="Content"
                                    className={`rounded-md shadow-sm object-contain mx-auto ${getSizeClass()}`}
                                />
                                {/* Resize Controls Overlay */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm p-1 rounded-lg flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity print:hidden">
                                    <button onClick={() => handleResize('small')} className={`p-1 hover:text-white ${size === 'small' ? 'text-white' : 'text-gray-400'}`} title="Small"><ImageIcon size={14} /></button>
                                    <button onClick={() => handleResize('medium')} className={`p-1 hover:text-white ${size === 'medium' ? 'text-white' : 'text-gray-400'}`} title="Medium"><ImageIcon size={18} /></button>
                                    <button onClick={() => handleResize('large')} className={`p-1 hover:text-white ${size === 'large' ? 'text-white' : 'text-gray-400'}`} title="Large"><ImageIcon size={22} /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400 cursor-pointer" onClick={() => document.getElementById(`upload-${id}`).click()}>
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
                </div>
            )}
        </Draggable>
    );
});

export default ImageItem;
