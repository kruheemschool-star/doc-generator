import React, { memo, useMemo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import MarkdownRenderer from './MarkdownRenderer';
import { Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

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

const QuestionItem = memo(({ id, index, no, question, type, options, solution, spaceNeeded, fontSize = 'default', showSolution, onDelete, onMove, isSelected, onSelect, canMoveUp, canMoveDown }) => {

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
          className={`group relative border rounded-xl p-6 mb-4 transition-all bg-white break-inside-avoid print:border-transparent print:shadow-none print:ring-0
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 z-10 border-transparent' : ''}
            ${isSelected ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/5' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'}
          `}
        >
          {/* Hover Controls (Standardized on Left) */}
          <div className="absolute right-full top-0 h-full w-10 hidden group-hover:flex flex-col gap-1 items-center pt-4 print:hidden">
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

          {/* Question Content */}
          <div className="mb-4">
            <div className="flex gap-3">
              <span className={`font-bold min-w-[24px] select-none font-prompt ${getSizeClass()}`}>{no}.</span>
              <div className={`flex-1 overflow-x-auto ${getSizeClass()}`}>
                <MarkdownRenderer content={question} />

                {/* Options (if present) */}
                {options && options.length > 0 && (
                  <div className={`grid ${useOneColumn ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mt-4 ml-2`}>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="font-semibold min-w-[20px]">{['ก.', 'ข.', 'ค.', 'ง.'][idx] || `${idx + 1}.`}</span>
                        <div className="flex-1">
                          <MarkdownRenderer content={opt} />
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
