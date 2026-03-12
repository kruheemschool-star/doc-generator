import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Eye, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

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

const QuestionEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('question'); // 'question', 'options', 'solution'
    const [formData, setFormData] = useState({
        question: '',
        options: [],
        solution: '',
        layoutColumn: 'auto', // 'auto', '1', '2'
        ...initialData,
        solution: normalizeSolution(initialData?.solution)
    });

    useEffect(() => {
        setFormData({
            question: '',
            options: [],
            solution: '',
            layoutColumn: 'auto',
            ...initialData,
            solution: normalizeSolution(initialData?.solution)
        });
        setActiveTab('question');
    }, [initialData]);

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
        const newOptions = [...(formData.options || [])];
        newOptions[index] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const removeOption = (index) => {
        const newOptions = [...(formData.options || [])];
        newOptions.splice(index, 1);
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            solution: { ...prev.solution, steps: [...(prev.solution.steps || []), ''] }
        }));
    };

    const updateStep = (index, value) => {
        const newSteps = [...(formData.solution.steps || [])];
        newSteps[index] = value;
        setFormData(prev => ({
            ...prev,
            solution: { ...prev.solution, steps: newSteps }
        }));
    };

    const removeStep = (index) => {
        const newSteps = [...(formData.solution.steps || [])];
        newSteps.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            solution: { ...prev.solution, steps: newSteps }
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg font-outfit">Edit Question</h2>
                            <p className="text-xs text-gray-500">Edit content, options, and solution details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Tabs */}
                    <div className="w-48 bg-gray-50/50 border-r border-gray-100 p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('question')}
                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === 'question' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-100 text-gray-600'}`}
                        >
                            Question
                        </button>
                        <button
                            onClick={() => setActiveTab('options')}
                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === 'options' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-100 text-gray-600'}`}
                        >
                            Options
                        </button>
                        <button
                            onClick={() => setActiveTab('solution')}
                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === 'solution' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-100 text-gray-600'}`}
                        >
                            Solution
                        </button>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Input Area */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-gray-100">
                            {activeTab === 'question' && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Question Text (Latex supported)</label>
                                    <textarea
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none font-sarabun text-base leading-relaxed bg-white"
                                        placeholder="Enter your question here..."
                                    />
                                    <div className="text-xs text-gray-400">
                                        Tip: Use standard LaTeX syntax like $x^2$ or \[ ... \]
                                    </div>
                                </div>
                            )}

                            {activeTab === 'options' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-gray-700">Multiple Choice Options</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setFormData({ ...formData, layoutColumn: 'auto' })}
                                                    className={`px-2 py-1 text-[10px] rounded-md transition-all ${formData.layoutColumn === 'auto' || !formData.layoutColumn ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    Auto
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, layoutColumn: '1' })}
                                                    className={`px-2 py-1 text-[10px] rounded-md transition-all ${formData.layoutColumn === '1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    1 Col
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, layoutColumn: '2' })}
                                                    className={`px-2 py-1 text-[10px] rounded-md transition-all ${formData.layoutColumn === '2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
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
                                                <span className="w-6 font-bold text-gray-400 text-sm">{idx + 1}.</span>
                                                <input
                                                    value={opt}
                                                    onChange={(e) => updateOption(idx, e.target.value)}
                                                    className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-sarabun"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                                <button onClick={() => removeOption(idx)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.options?.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-xl">
                                                No options added yet. Click "Add Option" to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'solution' && (
                                <div className="space-y-6">
                                    {isSolutionString ? (
                                        /* String solution: single textarea for raw markdown */
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">เฉลย (Markdown)</label>
                                            <textarea
                                                value={formData.solution}
                                                onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                                                className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-mono text-sm resize-none bg-white"
                                                placeholder="พิมพ์เฉลยในรูปแบบ Markdown..."
                                            />
                                            <div className="text-xs text-gray-400 mt-1">
                                                Tip: ใช้ LaTeX syntax เช่น $x^2$ หรือ $$\frac{'{1}'}{'{2}'}$$
                                            </div>
                                        </div>
                                    ) : (
                                        /* Object solution: structured fields */
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                                                <input
                                                    value={formData.solution.answer}
                                                    onChange={(e) => updateSolution('answer', e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-sarabun"
                                                    placeholder="e.g. 2x + 5"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Principle / Concept</label>
                                                <textarea
                                                    value={formData.solution.principle}
                                                    onChange={(e) => updateSolution('principle', e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-sarabun h-24 resize-none"
                                                    placeholder="Explain the core concept..."
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">Solution Steps</label>
                                                    <button onClick={addStep} className="text-xs flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100 transition">
                                                        <Plus size={14} /> Add Step
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.solution.steps?.map((step, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 group">
                                                            <span className="w-6 font-bold text-gray-400 text-sm pt-3">{idx + 1}.</span>
                                                            <textarea
                                                                value={step}
                                                                onChange={(e) => updateStep(idx, e.target.value)}
                                                                className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-sarabun resize-none h-16 text-sm"
                                                                placeholder={`Step ${idx + 1}`}
                                                            />
                                                            <button onClick={() => removeStep(idx)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 mt-2">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 text-red-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Caution / Warning</label>
                                                <textarea
                                                    value={formData.solution.caution}
                                                    onChange={(e) => updateSolution('caution', e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-red-200 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-sarabun h-20 resize-none"
                                                    placeholder="Common mistakes to avoid..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Preview Area */}
                        <div className="w-full md:w-[40%] bg-gray-50/80 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                <Eye size={14} /> Live Preview
                            </h3>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px]">
                                {/* Question Preview */}
                                <div className="text-gray-900 font-sarabun text-lg leading-relaxed border-b border-gray-100 pb-4 mb-4">
                                    <Latex>{formData.question || 'Start typing...'}</Latex>
                                </div>

                                {/* Options Preview */}
                                {formData.options?.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 mb-6">
                                        {formData.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-gray-700 font-sarabun">
                                                <span className="font-semibold text-gray-400">{idx + 1}.</span>
                                                <div><Latex>{opt}</Latex></div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Solution Preview */}
                                {activeTab === 'solution' && (
                                    <div className="bg-green-50/50 rounded-lg border border-green-100 p-4 text-sm">
                                        <h4 className="font-bold text-green-700 mb-2">เฉลยละเอียด</h4>
                                        {isSolutionString ? (
                                            <div className="text-gray-700 whitespace-pre-wrap">
                                                <Latex>{formData.solution || 'ยังไม่มีเฉลย...'}</Latex>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    {formData.solution.answer && <div><span className="font-semibold text-green-800">คำตอบ: </span><Latex>{formData.solution.answer}</Latex></div>}
                                                    {formData.solution.principle && <div><span className="font-semibold text-green-800">หลักการ: </span><Latex>{formData.solution.principle}</Latex></div>}
                                                    {formData.solution.steps?.length > 0 && (
                                                        <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-gray-700">
                                                            {formData.solution.steps.map((step, i) => (
                                                                <li key={i}><Latex>{step}</Latex></li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                {formData.solution.caution && (
                                                    <div className="bg-red-50 p-2 rounded border border-red-100 text-red-800 mt-2 text-xs">
                                                        <span className="font-bold">Caution: </span><Latex>{formData.solution.caution}</Latex>
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
                <div className="p-4 border-t border-gray-100 bg-white/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
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
