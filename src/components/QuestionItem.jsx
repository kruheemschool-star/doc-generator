import React, { memo, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import MarkdownRenderer from './MarkdownRenderer';
import SvgRenderer from './SvgRenderer';
import { Trash2, GripVertical, ChevronUp, ChevronDown, X, ImagePlus, Pencil } from 'lucide-react';
import { fileToCompressedDataURL } from '../utils/imageCompression';

// Estimate visible character length of an option (strip LaTeX/Markdown markers)
const estimateVisibleLength = (text) => {
  if (!text) return 0;
  let stripped = text
    .replace(/\$\$([^$]*)\$\$/g, (_, inner) => inner)  // $$...$$ -> inner
    .replace(/\$([^$]*)\$/g, (_, inner) => inner)        // $...$ -> inner
    .replace(/\\frac\{[^}]*\}\{[^}]*\}/g, 'XXXXX')      // \frac{}{} ~5 chars
    .replace(/\\[a-zA-Z]+/g, '')                          // \commands
    .replace(/[{}\\]/g, '')                               // braces
    .replace(/\*\*/g, '')                                 // bold markers
    .replace(/\*/g, '');                                  // italic markers
  return stripped.length;
};

// Strip duplicate ก./ข./ค./ง. prefix that AI may include
const stripOptionPrefix = (text) => {
  if (!text) return text;
  return text.replace(/^[ก-ง]\.\s*/, '').trim();
};

// Strip question number prefix and blockquote wrappers that AI may include
const cleanQuestionText = (text) => {
  if (!text) return text;
  let cleaned = text;
  // Remove leading question numbers: "ข้อที่ 1:", "ข้อ 1:", "ข้อ 1.", "1.", "1)", "1:" at start
  cleaned = cleaned.replace(/^(ข้อที่\s*\d+\s*[:.]?\s*|ข้อ\s*\d+\s*[:.]?\s*|\d+\s*[.):]?\s*)/, '').trim();
  // Remove blockquote "โจทย์:" prefix lines: "> 📘 โจทย์:" or "> โจทย์:" etc.
  cleaned = cleaned.replace(/^>\s*(?:📘|📝|🔢)*\s*โจทย์\s*[:：]\s*/gm, '').trim();
  // Remove remaining empty blockquote markers at start
  cleaned = cleaned.replace(/^>\s*$/gm, '').trim();
  return cleaned;
};

const QuestionItem = React.memo(({ id, index, no, question, options, solution, type, svg, questionImage, spaceNeeded, layoutColumn, isSelected, onSelect, onMove, canMoveUp, canMoveDown, onUpdate, onEdit, isViewOnly, fontSize, showSolution, onDelete, frameStyle }) => {
  const imageInputRef = useRef(null);
  const solutionRef = useRef(null);
  const [solutionHeight, setSolutionHeight] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useLayoutEffect(() => {
    if (showSolution && solutionRef.current) {
      setSolutionHeight(solutionRef.current.offsetHeight);
    }
  }, [showSolution, solution]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpdate) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      onUpdate(id, { questionImage: dataUrl, svg: '' });
    } catch (err) {
      setUploadError(err.message || 'ไม่สามารถประมวลผลรูปภาพได้');
    } finally {
      setIsUploading(false);
    }
  };

  const getSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'xl': return 'text-xl';
      case 'medium': default: return 'text-[15px]';
    }
  };

  // Auto-detect or use manual override: 
  // - If layoutColumn is '1', force 1-column
  // - If layoutColumn is '2', force 2-column
  // - Otherwise, use auto-detection logic
  const useOneColumn = useMemo(() => {
    if (layoutColumn === '1') return true;
    if (layoutColumn === '2') return false;

    if (!options || options.length === 0) return false;
    const THRESHOLD = 35;
    return options.some(opt => estimateVisibleLength(opt) > THRESHOLD);
  }, [options, layoutColumn]);

  return (
    <Draggable draggableId={id} index={index} isDragDisabled={isViewOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style, ...(!isSelected && !snapshot.isDragging && frameStyle ? frameStyle : {}) }}
          onClick={(e) => {
            if (isViewOnly) return;
            e.stopPropagation();
            onSelect && onSelect(id);
          }}
          className={`group relative border rounded-xl p-6 mb-1 transition-all bg-white break-inside-avoid print:border-transparent print:shadow-none print:ring-0
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 z-10 border-transparent' : ''}
            ${isSelected ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/5' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'}
          `}
        >
          {/* Hover Controls (Standardized on Left) */}
          {!isViewOnly && (
            <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto print:hidden">
              <div
                {...provided.dragHandleProps}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab"
                title="Drag to reorder"
              >
                <GripVertical size={18} />
              </div>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                  className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded"
                  title="แก้ไขโจทย์"
                >
                  <Pencil size={18} />
                </button>
              )}
              {canMoveUp && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(id, 'up'); }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                  title="Move up"
                >
                  <ChevronUp size={18} />
                </button>
              )}
              {canMoveDown && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(id, 'down'); }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                  title="Move down"
                >
                  <ChevronDown size={18} />
                </button>
              )}
            </div>
          )}

          {/* Hidden file input for image upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Image upload feedback (paper is always light, so no dark: variants) */}
          {(uploadError || isUploading) && (
            <div className={`mb-2 flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 print:hidden ${uploadError ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-gray-500 bg-gray-50 border border-gray-200'}`}>
              {uploadError ? <><X size={12} /> {uploadError}</> : 'กำลังประมวลผลรูปภาพ...'}
            </div>
          )}

          {/* Question Content */}
          <div className="mb-4">
            <div className="flex gap-3">
              <span className={`font-bold min-w-[24px] flex-shrink-0 select-none ${getSizeClass()}`}>{no}.</span>
              <div className={`flex-1 min-w-0 overflow-hidden relative ${getSizeClass()}`}>
                {/* Question text */}
                <MarkdownRenderer content={cleanQuestionText(question)} />

                {/* SVG Image - below question, above options */}
                {svg && (
                  <div className="relative mt-3 mb-3 flex justify-center group/svg">
                    <div className="border border-gray-100 rounded-lg p-2 bg-white max-w-full print:border-transparent">
                      <SvgRenderer svgString={svg} maxWidth={380} />
                    </div>
                    {/* Image action buttons */}
                    {!isViewOnly && onUpdate && (
                      <div className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover/svg:opacity-100 transition-opacity print:hidden">
                        <button
                          onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                          className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-600"
                          title="แทนที่ด้วยรูปภาพ"
                        >
                          <ImagePlus size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdate(id, { svg: '' }); }}
                          className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
                          title="ลบรูปภาพ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom uploaded image - below question, above options */}
                {!svg && questionImage && (
                  <div className="relative mt-3 mb-3 flex justify-center group/img">
                    <img src={questionImage} alt="รูปประกอบโจทย์" className="max-w-full max-h-[300px] object-contain rounded-lg border border-gray-100" />
                    {!isViewOnly && onUpdate && (
                      <div className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity print:hidden">
                        <button
                          onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                          className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-600"
                          title="เปลี่ยนรูปภาพ"
                        >
                          <ImagePlus size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdate(id, { questionImage: '' }); }}
                          className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
                          title="ลบรูปภาพ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload image icon - absolutely positioned, zero layout impact */}
                {!isViewOnly && !svg && !questionImage && onUpdate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                    className="absolute top-0 right-0 p-1 cursor-pointer text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 print:hidden"
                    title="แทรกรูปภาพ"
                  >
                    <ImagePlus size={14} />
                  </button>
                )}

                {/* Options (if present) */}
                {options && options.length > 0 && (
                  <div className={`grid ${useOneColumn ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mt-3 ml-2`}>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="font-semibold min-w-[20px]">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <MarkdownRenderer content={stripOptionPrefix(opt)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Solution Section - preserve height when hidden for print spacing */}
          {solution && (
            showSolution ? (
              <div ref={solutionRef} className="mt-4 ml-9 relative z-10 rounded-lg transition-all border print:bg-white print:border-l-2 print:border-y-0 print:border-r-0 print:rounded-none print:pl-3" style={{ backgroundColor: '#eaf0dd80', borderColor: '#3d5a2c33' }}>
                <div className={`p-4 print:p-0 print:pl-2 ${getSizeClass()}`}>
                  <MarkdownRenderer content={solution} plainBlockquote />
                </div>
              </div>
            ) : (
              <div className="mt-4 ml-9" style={{ minHeight: solutionHeight > 0 ? solutionHeight : undefined }} />
            )
          )}

        </div>
      )}
    </Draggable>
  );
});

export default QuestionItem;
