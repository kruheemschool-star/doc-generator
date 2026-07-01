import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Eye, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { useModalA11y } from '../hooks/useModalA11y';
import RichMathEditor from './RichMathEditor';
import MarkdownRenderer from './MarkdownRenderer';

// Normalize solution: if string, keep as string; if object, ensure all fields
const normalizeSolution = (sol) => {
    if (typeof sol === 'string') return sol;
    if (sol && typeof sol === 'object') {
        return {
            answer: sol.answer || '',
            principle: sol.principle || '',
            steps: Array.isArray(sol.steps) ? sol.steps : [],
            caution: sol.caution || ''
        };
    }
    return '';
};

const QuestionEditorModal = ({ isOpen, onClose, onSave, initialData, addToast }) => {
    // Hooks must run unconditionally (Rules of Hooks) — do NOT return early before hooks
    const [activeTab, setActiveTab] = useState('question'); // 'question', 'options', 'solution'
    const [formData, setFormData] = useState({
        question: '',
        options: [],
        layoutColumn: 'auto', // 'auto', '1', '2'
        ...initialData,
        solution: normalizeSolution(initialData?.solution)
    });

    useEffect(() => {
        setFormData({
            question: '',
            options: [],
            layoutColumn: 'auto',
            ...initialData,
            solution: normalizeSolution(initialData?.solution)
        });
        setActiveTab('question');
    }, [initialData]);

    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const isSolutionString = typeof formData.solution === 'string';

    const updateSolution = (field, value) => {
        if (isSolutionString) {
            // For string solutions, just replace the whole string
            setFormData(prev => ({ ...prev, solution: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                solution: { ...prev.solution, [field]: value }
            }));
        }
    };

    const addOption = () => {
        setFormData(prev => ({ ...prev, options: [...(prev.options || []), ''] }));
    };

    const updateOption = (index, value) => {
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            newOptions[index] = value;
            return { ...prev, options: newOptions };
        });
    };

    const removeOption = (index) => {
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            newOptions.splice(index, 1);
            return { ...prev, options: newOptions };
        });
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            solution: { ...prev.solution, steps: [...(prev.solution.steps || []), ''] }
        }));
    };

    const updateStep = (index, value) => {
        setFormData(prev => {
            const newSteps = [...(prev.solution.steps || [])];
            newSteps[index] = value;
            return { ...prev, solution: { ...prev.solution, steps: newSteps } };
        });
    };

    const removeStep = (index) => {
        setFormData(prev => {
            const newSteps = [...(prev.solution.steps || [])];
            newSteps.splice(index, 1);
            return { ...prev, solution: { ...prev.solution, steps: newSteps } };
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 print:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="question-editor-title"
                tabIndex={-1}
                className="bg-white/95 backdrop-blur-xl w-full max-w-[1700px] h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200"
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h2 id="question-editor-title" className="font-bold text-gray-800 dark:text-slate-200 text-lg font-outfit">Edit Question</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Edit content, options, and solution details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Tabs */}
                    <div className="w-48 bg-gray-50/50 border-r border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('question')}
                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === 'question' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-100 text-gray-600 dark:text-slate-400'}`}
                        >
                            Question
                        </button>
                        <button
                            onClick={() => setActiveTab('options')}
                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === 'options' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-100 text-gray-600 dark:text-slate-400'}`}
                        >
                            Options
                        </button>
                        <button
                            onClick={() => setActiveTab('solution')}
                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === 'solution' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-100 text-gray-600 dark:text-slate-400'}`}
                        >
                            Solution
                        </button>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Input Area */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-gray-100 dark:border-slate-800">
                            {activeTab === 'question' && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">โจทย์คำถาม</label>
                                    <RichMathEditor
                                        variant="multiline"
                                        value={formData.question}
                                        onChange={(v) => setFormData(prev => ({ ...prev, question: v }))}
                                        addToast={addToast}
                                        placeholder="พิมพ์โจทย์ที่นี่... กด “แทรกสมการ” เพื่อใส่สมการแบบเห็นภาพ"
                                        ariaLabel="โจทย์คำถาม"
                                    />
                                </div>
                            )}

                            {activeTab === 'options' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Multiple Choice Options</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setFormData({ ...formData, layoutColumn: 'auto' })}
                                                    className={`px-2 py-1 text-[10px] rounded-md transition-all ${formData.layoutColumn === 'auto' || !formData.layoutColumn ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
                                                >
                                                    Auto
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, layoutColumn: '1' })}
                                                    className={`px-2 py-1 text-[10px] rounded-md transition-all ${formData.layoutColumn === '1' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
                                                >
                                                    1 Col
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, layoutColumn: '2' })}
                                                    className={`px-2 py-1 text-[10px] rounded-md transition-all ${formData.layoutColumn === '2' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
                                                >
                                                    2 Col
                                                </button>
                                            </div>
                                            <button onClick={addOption} className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                                                <Plus size={14} /> Add Option
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.options?.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2 group">
                                                <span className="w-6 font-bold text-gray-400 dark:text-slate-500 text-sm">{idx + 1}.</span>
                                                <div className="flex-1">
                                                    <RichMathEditor
                                                        variant="inline"
                                                        value={opt}
                                                        onChange={(v) => updateOption(idx, v)}
                                                        addToast={addToast}
                                                        placeholder={`ตัวเลือกที่ ${idx + 1}`}
                                                        ariaLabel={`ตัวเลือกที่ ${idx + 1}`}
                                                    />
                                                </div>
                                                <button onClick={() => removeOption(idx)} aria-label={`ลบตัวเลือกที่ ${idx + 1}`} className="p-2 text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.options?.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm italic border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
                                                No options added yet. Click "Add Option" to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'solution' && (
                                <div className="space-y-6">
                                    {isSolutionString ? (
                                        /* String solution: WYSIWYG editor */
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">เฉลย</label>
                                            <RichMathEditor
                                                variant="multiline"
                                                value={formData.solution}
                                                onChange={(v) => setFormData(prev => ({ ...prev, solution: v }))}
                                                addToast={addToast}
                                                placeholder="พิมพ์เฉลยที่นี่... กด “แทรกสมการ” เพื่อใส่สมการ"
                                                ariaLabel="เฉลย"
                                            />
                                        </div>
                                    ) : (
                                        /* Object solution: structured fields */
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">คำตอบที่ถูกต้อง</label>
                                                <RichMathEditor
                                                    variant="inline"
                                                    value={formData.solution.answer}
                                                    onChange={(v) => updateSolution('answer', v)}
                                                    addToast={addToast}
                                                    placeholder="เช่น 2x + 5"
                                                    ariaLabel="คำตอบที่ถูกต้อง"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">หลักการ / แนวคิด</label>
                                                <RichMathEditor
                                                    variant="multiline"
                                                    value={formData.solution.principle}
                                                    onChange={(v) => updateSolution('principle', v)}
                                                    addToast={addToast}
                                                    placeholder="อธิบายแนวคิดหลัก..."
                                                    ariaLabel="หลักการ / แนวคิด"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">ขั้นตอนการทำ</label>
                                                    <button onClick={addStep} className="text-xs flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100 transition">
                                                        <Plus size={14} /> เพิ่มขั้นตอน
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.solution.steps?.map((step, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 group">
                                                            <span className="w-6 font-bold text-gray-400 dark:text-slate-500 text-sm pt-3">{idx + 1}.</span>
                                                            <div className="flex-1">
                                                                <RichMathEditor
                                                                    variant="multiline"
                                                                    value={step}
                                                                    onChange={(v) => updateStep(idx, v)}
                                                                    addToast={addToast}
                                                                    placeholder={`ขั้นตอนที่ ${idx + 1}`}
                                                                    ariaLabel={`ขั้นตอนที่ ${idx + 1}`}
                                                                />
                                                            </div>
                                                            <button onClick={() => removeStep(idx)} aria-label={`ลบขั้นตอนที่ ${idx + 1}`} className="p-2 text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mt-2">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 text-red-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> ข้อควรระวัง</label>
                                                <RichMathEditor
                                                    variant="multiline"
                                                    value={formData.solution.caution}
                                                    onChange={(v) => updateSolution('caution', v)}
                                                    addToast={addToast}
                                                    placeholder="ข้อผิดพลาดที่พบบ่อย..."
                                                    ariaLabel="ข้อควรระวัง"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Preview Area */}
                        <div className="w-full md:w-[40%] bg-gray-50/80 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                                <Eye size={14} /> Live Preview
                            </h3>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px]">
                                {/* Question Preview */}
                                <div className="font-sarabun text-lg leading-relaxed border-b border-gray-100 pb-4 mb-4">
                                    <MarkdownRenderer content={formData.question || 'เริ่มพิมพ์...'} />
                                </div>

                                {/* Options Preview */}
                                {formData.options?.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 mb-6">
                                        {formData.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-gray-700 font-sarabun">
                                                <span className="font-semibold text-gray-400 pt-0.5">{idx + 1}.</span>
                                                <div className="flex-1"><MarkdownRenderer content={opt || ''} /></div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Solution Preview */}
                                {activeTab === 'solution' && (
                                    <div className="bg-green-50/50 rounded-lg border border-green-100 p-4 text-sm">
                                        <h4 className="font-bold text-green-700 mb-2">เฉลยละเอียด</h4>
                                        {isSolutionString ? (
                                            <div className="text-gray-700">
                                                <MarkdownRenderer content={formData.solution || 'ยังไม่มีเฉลย...'} plainBlockquote />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    {formData.solution.answer && <div><span className="font-semibold text-green-800">คำตอบ: </span><Latex>{formData.solution.answer}</Latex></div>}
                                                    {formData.solution.principle && <div className="text-gray-700"><span className="font-semibold text-green-800">หลักการ:</span><MarkdownRenderer content={formData.solution.principle} plainBlockquote /></div>}
                                                    {formData.solution.steps?.length > 0 && (
                                                        <ol className="list-decimal list-inside pl-2 space-y-1 mt-1 text-gray-700">
                                                            {formData.solution.steps.map((step, i) => (
                                                                <li key={i}><MarkdownRenderer content={step || ''} plainBlockquote /></li>
                                                            ))}
                                                        </ol>
                                                    )}
                                                </div>
                                                {formData.solution.caution && (
                                                    <div className="bg-red-50 p-2 rounded border border-red-100 text-red-800 mt-2 text-xs">
                                                        <span className="font-bold">ข้อควรระวัง: </span><Latex>{formData.solution.caution}</Latex>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95 flex items-center gap-2">
                        <Check size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionEditorModal;
