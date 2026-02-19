import React, { memo, useMemo, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import MarkdownRenderer from './MarkdownRenderer';
import SvgRenderer from './SvgRenderer';
import { Trash2, GripVertical, ChevronUp, ChevronDown, X, ImagePlus } from 'lucide-react';

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
  cleaned = cleaned.replace(/^>\s*[📘📝🔢]*\s*โจทย์\s*[:：]\s*/gm, '').trim();
  // Remove remaining empty blockquote markers at start
  cleaned = cleaned.replace(/^>\s*$/gm, '').trim();
  return cleaned;
};

const QuestionItem = memo(({ id, index, no, question, type, options, solution, svg, questionImage, spaceNeeded, fontSize = 'default', showSolution, onDelete, onUpdate, onMove, isSelected, onSelect, canMoveUp, canMoveDown }) => {

  const imageInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdate) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate(id, { questionImage: ev.target.result, svg: '' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper for font size
  const getSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'xl': return 'text-xl';
      case 'medium': default: return 'text-[15px]';
    }
  };

  // Auto-detect: use 1-column if any option is too long for 2-column layout
  const useOneColumn = useMemo(() => {
    if (!options || options.length === 0) return false;
    const THRESHOLD = 35;
    return options.some(opt => estimateVisibleLength(opt) > THRESHOLD);
  }, [options]);

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(id);
          }}
          className={`group relative border rounded-xl p-6 mb-1 transition-all bg-white break-inside-avoid print:border-transparent print:shadow-none print:ring-0
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 z-10 border-transparent' : ''}
            ${isSelected ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/5' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'}
          `}
        >
          {/* Hover Controls (Standardized on Left) */}
          <div className="absolute right-full top-0 w-10 flex flex-col gap-1 items-center pt-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto print:hidden">
            <div
              {...provided.dragHandleProps}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab"
              title="Drag to reorder"
            >
              <GripVertical size={18} />
            </div>
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

          {/* Hidden file input for image upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Question Content */}
          <div className="mb-4">
            <div className="flex gap-3">
              <span className={`font-bold min-w-[24px] flex-shrink-0 select-none font-prompt ${getSizeClass()}`}>{no}.</span>
              <div className={`flex-1 min-w-0 overflow-hidden ${getSizeClass()}`}>
                {/* Question text */}
                <MarkdownRenderer content={cleanQuestionText(question)} />

                {/* SVG Image - below question, above options */}
                {svg && (
                  <div className="relative mt-3 mb-3 flex justify-center group/svg">
                    <div className="border border-gray-100 rounded-lg p-2 bg-white max-w-full print:border-transparent">
                      <SvgRenderer svgString={svg} maxWidth={380} />
                    </div>
                    {/* Image action buttons */}
                    {onUpdate && (
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
                    {onUpdate && (
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

                {/* Upload image icon - when no svg and no image (zero-height, no layout impact) */}
                {!svg && !questionImage && onUpdate && (
                  <span
                    onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                    className="inline-block cursor-pointer text-gray-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 print:invisible ml-1"
                    title="แทรกรูปภาพ"
                  >
                    <ImagePlus size={14} className="inline" />
                  </span>
                )}

                {/* Options (if present) */}
                {options && options.length > 0 && (
                  <div className={`grid ${useOneColumn ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mt-4 ml-2`}>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="font-semibold min-w-[20px]">{['ก.', 'ข.', 'ค.', 'ง.'][idx] || `${idx + 1}.`}</span>
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

          {/* Solution Section */}
          <div className={`mt-4 ml-9 relative z-10 rounded-lg transition-all print:border-transparent print:bg-transparent ${showSolution ? 'bg-green-50/50 border border-green-100' : 'border-2 border-dashed border-gray-300 bg-gray-50/30'}`}>
            <div className={`p-4 ${getSizeClass()} ${showSolution ? '' : 'invisible'}`}>
              <MarkdownRenderer content={solution || '> ℹ️ ยังไม่มีเฉลย'} />
            </div>
          </div>

        </div>
      )}
    </Draggable>
  );
});

export default QuestionItem;
