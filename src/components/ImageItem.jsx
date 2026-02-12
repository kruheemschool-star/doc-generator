import React, { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Image as ImageIcon, Upload, ChevronUp, ChevronDown } from 'lucide-react';

const ImageItem = memo(({ id, index, src, content, size = 'medium', onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown }) => {
    // content can be used for caption if needed, src is the image source
    const [isHovered, setIsHovered] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdate(id, { src: reader.result }); // Save base64 for now (or URL if persistence allowed)
            };
            reader.readAsDataURL(file);
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
        <Draggable draggableId={id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative mb-2 transition-all flex flex-col items-center ${snapshot.isDragging ? 'z-50 opacity-90' : ''
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
                                <Upload size={32} className="mb-2" />
                                <span className="text-sm font-medium">Click to upload image</span>
                                <input
                                    id={`upload-${id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default ImageItem;
