import React, { useState, useEffect, useRef, useCallback } from 'react';
import { savePromptSettings, loadPromptSettings } from '../firebase';
import {
    Sparkles, Copy, Check, Terminal, Zap, FileText,
    BookOpen, Layers, Type, Sliders, Settings, ExternalLink, Brain, ChevronDown, List, PenTool, Paperclip, Undo2, Calendar, Image as ImageIcon, ScanText, AlertCircle, Loader2, Save, ClipboardCopy, Globe
} from 'lucide-react';
import { IPST_CURRICULUM, getChapters, getChapterObject } from '../data/thaiMathCurriculum';
import { useDebounce } from '../hooks/useDebounce';
import { useToast, ToastContainer } from '../components/Toast';
import { usePromptGenerator } from '../hooks/usePromptGenerator';
import PromptPreview from '../components/promptBuilder/PromptPreview';
import TemplateManager from '../components/promptBuilder/TemplateManager';

// --- Mode-specific options configuration (Item 9) ---
const MODE_ALLOWED_OPTIONS = {
    content: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    practice: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    exam: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    web_quiz: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    svg_question: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    transcribe: [],
    summary: ['bulletPoints', 'comparisonTable', 'stepByStep'],
    mistake: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
};

// --- Mode-specific default resets (Item 13) ---
const MODE_DEFAULTS = {
    questionType: 'objective',
    wordProblemType: 'objective',
    questionCount: 10,
    svgImageType: 'geometry',
};

const DEFAULT_FORM_DATA = {
    mode: 'content',
    grade: 'M1',
    term: '1',
    subjectType: 'Basic',
    source: 'ai-free',
    chapter: '',
    selectedTopic: '',
    customTopic: '',
    tone: 'friendly',
    difficulty: 'medium',
    components: {
        dummyChoice: false,
        realWorldApp: false,
        addHint: false,
        crossChapter: false,
        mistake: false,
        bulletPoints: false,
        comparisonTable: false,
        stepByStep: false
    },
    svgImageType: 'geometry',
    contentLength: 'long',
    questionCount: 10,
    questionType: 'objective',
    wordProblemType: 'objective',
    transcribePageRange: '',
    transcribeQuestionRange: '',
    summaryLength: 'medium'
};

const PromptBuilderPage = () => {
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [availableChapters, setAvailableChapters] = useState([]);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);   // Item 1: Loading state
    const [saveStatus, setSaveStatus] = useState('idle'); // Item 1: 'idle' | 'saving' | 'saved' | 'error'
    const [isTemplateOpen, setIsTemplateOpen] = useState(false); // Item 5: Template modal
    const isInitialLoad = useRef(true);
    const { toasts, addToast, removeToast } = useToast(); // Item 1: Toast notifications

    // Item 2: Debounced formData for auto-save
    const debouncedFormData = useDebounce(formData, 800);

    // Item 7: Use extracted prompt generation hook
    const generatedPrompt = usePromptGenerator(formData);

    // Load from Firestore on mount (Item 1: Error Handling)
    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const saved = await loadPromptSettings();
                if (saved) setFormData(saved);
            } catch (error) {
                console.error('Error loading prompt settings:', error);
                addToast('ไม่สามารถโหลดค่าที่บันทึกไว้ได้ ใช้ค่าเริ่มต้นแทน', 'error', 5000);
            } finally {
                setIsLoading(false);
                setTimeout(() => { isInitialLoad.current = false; }, 500);
            }
        };
        load();
    }, []);

    // Item 2: Auto-save to Firestore with debounce + Item 1: Error handling
    useEffect(() => {
        if (isInitialLoad.current) return;
        const save = async () => {
            try {
                setSaveStatus('saving');
                await savePromptSettings(debouncedFormData);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Error saving prompt settings:', error);
                setSaveStatus('error');
                addToast('บันทึกค่าไม่สำเร็จ กรุณาลองอีกครั้ง', 'error', 4000);
            }
        };
        save();
    }, [debouncedFormData]);

    useEffect(() => {
        const chapters = getChapters(formData.grade, formData.term, formData.subjectType);
        setAvailableChapters(chapters);
    }, [formData.grade, formData.term, formData.subjectType]);

    useEffect(() => {
        if (formData.chapter && formData.chapter !== 'custom') {
            const chapterObj = getChapterObject(formData.grade, formData.term, formData.chapter, formData.subjectType);
            if (chapterObj && chapterObj.topics) {
                setAvailableTopics(chapterObj.topics);
            } else {
                setAvailableTopics([]);
            }
        } else {
            setAvailableTopics([]);
        }
    }, [formData.chapter, formData.grade, formData.term, formData.subjectType]);

    const handleReset = () => {
        if (window.confirm("คุณต้องการล้างการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) {
            setFormData(DEFAULT_FORM_DATA);
            savePromptSettings(DEFAULT_FORM_DATA);
            addToast('รีเซ็ตค่าทั้งหมดเรียบร้อย', 'success');
        }
    };

    // Item 13: Mode change reset + Item 3: Validation
    const handleChange = (field, value) => {
        // Item 3: Validate questionCount
        if (field === 'questionCount') {
            const num = parseInt(value, 10);
            if (isNaN(num)) value = 1;
            else value = Math.max(1, Math.min(50, num));
        }
        // Item 3: Validate customTopic max length
        if (field === 'customTopic' && value.length > 200) {
            value = value.slice(0, 200);
        }

        // Item 13: Reset mode-specific values when changing mode
        if (field === 'mode') {
            setFormData(prev => {
                const allowedOpts = MODE_ALLOWED_OPTIONS[value] || [];
                const newComponents = { ...prev.components };
                // Deselect components not allowed in the new mode
                Object.keys(newComponents).forEach(key => {
                    if (!allowedOpts.includes(key)) {
                        newComponents[key] = false;
                    }
                });
                return {
                    ...prev,
                    mode: value,
                    ...MODE_DEFAULTS,
                    components: newComponents,
                };
            });
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Item 9: Get allowed options for current mode
    const allowedComponents = MODE_ALLOWED_OPTIONS[formData.mode] || [];

    const handleComponentChange = (comp) => {
        // Item 9: Only allow toggling components that are allowed for current mode
        if (!allowedComponents.includes(comp)) return;
        setFormData(prev => ({
            ...prev,
            components: { ...prev.components, [comp]: !prev.components[comp] }
        }));
    };

    const handleCopy = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Item 15: Copy as Markdown
    const handleCopyMarkdown = () => {
        if (!generatedPrompt) return;
        const markdownPrompt = `# AI Prompt — ${formData.mode.toUpperCase()}\n\n---\n\n${generatedPrompt}`;
        navigator.clipboard.writeText(markdownPrompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenGemini = () => {
        window.open('https://gemini.google.com/app', '_blank');
    };

    const SelectWrapper = ({ label, value, onChange, options, disabled = false, icon: Icon }) => (
        <div className="relative group transition-all duration-300">
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                {label}
            </label>
            <div className={`relative rounded-xl transition-all duration-300 ${disabled ? 'opacity-50' : 'hover:shadow-lg hover:shadow-blue-500/5'}`}>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors">
                    {Icon ? <Icon size={16} strokeWidth={2.5} /> : <Layers size={16} strokeWidth={2.5} />}
                </div>
                <select
                    className={`w-full p-3 pl-11 pr-10 bg-white border border-slate-200 rounded-xl appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700 text-sm shadow-sm
                    ${disabled ? 'cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 cursor-pointer'} `}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors">
                    <ChevronDown size={18} strokeWidth={3} />
                </div>
            </div>
        </div>
    );

    // Item 1: Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#F1F5F9]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-semibold text-sm">กำลังโหลดค่าที่บันทึกไว้...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-[#F1F5F9] font-sans selection:bg-blue-600 selection:text-white">
            {/* Item 1: Toast Container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            {/* Item 5: Template Manager Modal */}
            <TemplateManager
                isOpen={isTemplateOpen}
                onClose={() => setIsTemplateOpen(false)}
                currentFormData={formData}
                onLoadTemplate={(data) => setFormData(data)}
                addToast={addToast}
            />

            {/* --- Left Panel --- */}
            <div className="w-full lg:w-[62%] h-full overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative z-0">
                <div className="max-w-4xl mx-auto space-y-10 pb-32">

                    {/* Glass Header */}
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 rounded-full text-blue-600 font-bold uppercase tracking-tighter text-[10px] animate-in slide-in-from-left duration-700">
                                    <Sparkles size={12} fill="currentColor" />
                                    <span>Advanced AI Prompt Architecture</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 leading-[1.1] font-outfit tracking-tight">
                                    MathCraft <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">AI</span>
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="group flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                                >
                                    <Undo2 size={14} className="group-hover:-rotate-45 transition-transform" />
                                    RESET
                                </button>
                                <button
                                    onClick={() => setIsTemplateOpen(true)}
                                    aria-label="เปิด Templates"
                                    className="group flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                                >
                                    <FileText size={14} />
                                    TEMPLATES
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-500 max-w-xl text-[15px] font-medium leading-relaxed">
                            สร้างคำสั่งที่ทรงพลังเพื่อเปลี่ยน AI ให้เป็นผู้ช่วยเตรียมเนื้อหาและข้อสอบตามหลักสูตร สสวท. อย่างมืออาชีพ
                        </p>
                    </div>

                    {/* Section 1: Core Configuration */}
                    <section className="bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all hover:shadow-[0_20px_50px_rgba(59,130,246,0.08)] group/card">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover/card:scale-110 transition-transform duration-500">
                                <Layers size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 font-outfit tracking-tight">Core Context</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">ข้อมูลพื้นฐานของเอกสาร</p>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex flex-wrap gap-2.5 mb-8 bg-slate-50/50 p-2 rounded-2xl border border-slate-100" role="tablist" aria-label="เลือกโหมดการสร้างคำสั่ง">
                            {[
                                { id: 'content', label: 'บทเรียน', icon: <BookOpen size={16} />, color: 'blue' },
                                { id: 'practice', label: 'แบบฝึกหัด', icon: <PenTool size={16} />, color: 'teal' },
                                { id: 'exam', label: 'ข้อสอบ', icon: <FileText size={16} />, color: 'indigo' },
                                { id: 'web_quiz', label: 'แนวข้อสอบเว็บ', icon: <Globe size={16} />, color: 'sky' },
                                { id: 'svg_question', label: 'โจทย์+รูป', icon: <ImageIcon size={16} />, color: 'purple' },
                                { id: 'transcribe', label: 'พิมพ์ตาม', icon: <ScanText size={16} />, color: 'cyan' },
                                { id: 'summary', label: 'สรุปสูตร', icon: <Zap size={16} />, color: 'amber' },
                                { id: 'mistake', label: 'วิเคราะห์', icon: <Brain size={16} />, color: 'rose' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleChange('mode', item.id)}
                                    role="tab"
                                    aria-selected={formData.mode === item.id}
                                    aria-label={`โหมด ${item.label}`}
                                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2.5 
                                    ${formData.mode === item.id
                                            ? `bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.03]`
                                            : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-md'
                                        } `}
                                >
                                    <span className={`transition-transform duration-300 ${formData.mode === item.id ? 'scale-110 text-blue-400' : 'text-slate-400'} `}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Main Grid - Hidden for Transcribe */}
                        {formData.mode !== 'transcribe' && (<>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <SelectWrapper
                                    label="ระดับชั้น"
                                    icon={Type}
                                    value={formData.grade}
                                    onChange={(e) => handleChange('grade', e.target.value)}
                                    options={[
                                        { value: 'ENTRANCE_M1', label: 'สอบเข้า ม.1' },
                                        ...['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map(g => ({ value: g, label: g.replace('M', 'มัธยมศึกษาปีที่ ') }))
                                    ]}
                                />
                                <SelectWrapper
                                    label="ภาคเรียน"
                                    icon={Calendar}
                                    value={formData.term}
                                    onChange={(e) => handleChange('term', e.target.value)}
                                    disabled={formData.grade === 'ENTRANCE_M1'}
                                    options={[{ value: '1', label: 'เทอม 1' }, { value: '2', label: 'เทอม 2' }]}
                                />
                                <SelectWrapper
                                    label="ประเภทวิชา"
                                    icon={Settings}
                                    value={formData.subjectType}
                                    onChange={(e) => handleChange('subjectType', e.target.value)}
                                    disabled={['M1', 'M2', 'M3', 'ENTRANCE_M1'].includes(formData.grade)}
                                    options={[{ value: 'Basic', label: 'พื้นฐาน' }, { value: 'Additional', label: 'เพิ่มเติม' }]}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="relative group">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                                        บทเรียน (Chapter)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500">
                                            <BookOpen size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            className="w-full p-4 pl-12 pr-10 bg-white border border-slate-200 rounded-2xl appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-base font-bold text-slate-800 shadow-sm hover:border-blue-300 cursor-pointer"
                                            value={formData.chapter}
                                            onChange={(e) => handleChange('chapter', e.target.value)}
                                            aria-label="เลือกบทเรียน"
                                        >
                                            <option value="">-- เลือกบทเรียน --</option>
                                            {availableChapters.map((chapter, idx) => (
                                                <option key={idx} value={chapter}>{chapter}</option>
                                            ))}
                                            <option value="custom" className="text-blue-600 font-bold">+ ระบุบทเรียนเอง</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} strokeWidth={3} />
                                    </div>
                                </div>

                                {formData.chapter && formData.chapter !== 'custom' && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                                            เจาะจงเนื้อหา (Sub-Topic)
                                            <span className="ml-2 text-slate-300 font-medium normal-case">(ทางเลือก)</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <List size={18} strokeWidth={2.5} />
                                            </div>
                                            <select
                                                className="w-full p-3.5 pl-12 pr-10 bg-slate-50/50 border border-slate-200 rounded-2xl appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-semibold text-slate-600 hover:border-blue-300 cursor-pointer"
                                                value={formData.selectedTopic}
                                                onChange={(e) => handleChange('selectedTopic', e.target.value)}
                                            >
                                                <option value="">-- ทุกหัวข้อในบทนี้ --</option>
                                                {availableTopics.map((topic, idx) => (
                                                    <option key={idx} value={topic}>{topic}</option>
                                                ))}
                                                <option value="custom" className="text-blue-600">+ กำหนดเอง</option>
                                            </select>
                                            <ChevronDown size={16} strokeWidth={3} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                    </div>
                                )}

                                {/* Item 3: Chapter warning */}
                                {!formData.chapter && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in duration-300">
                                        <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                        <span className="text-xs font-semibold text-amber-700">กรุณาเลือกบทเรียนเพื่อให้ Prompt สมบูรณ์ยิ่งขึ้น</span>
                                    </div>
                                )}

                                {(formData.chapter === 'custom' || formData.selectedTopic === 'custom') && (
                                    <div className="animate-in zoom-in-95 duration-300">
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-blue-300 text-blue-900 font-bold"
                                            placeholder="ระบุหัวข้อที่ต้องการ เช่น เลขยกกำลังที่มีฐานเป็นลบ..."
                                            value={formData.customTopic}
                                            onChange={(e) => handleChange('customTopic', e.target.value)}
                                            maxLength={200}
                                            aria-label="ระบุหัวข้อที่ต้องการ"
                                        />
                                        {/* Item 3: Character counter */}
                                        <div className="flex justify-end mt-1 pr-1">
                                            <span className={`text-[10px] font-bold ${formData.customTopic.length >= 180 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                {formData.customTopic.length}/200
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>)}

                        {/* Transcribe-only: Range inputs */}
                        {formData.mode === 'transcribe' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-5 bg-cyan-50/50 border border-cyan-200 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ScanText size={18} className="text-cyan-600" />
                                        <span className="text-sm font-bold text-cyan-800">โหมดพิมพ์ตาม — แนบเอกสาร/รูปภาพใน Gemini</span>
                                    </div>
                                    <p className="text-xs text-cyan-600 leading-relaxed">
                                        ระบบจะพิมพ์โจทย์ตามเอกสารที่แนบให้เหมือนต้นฉบับทุกประการ โดยลบหมายเลขข้อออกให้อัตโนมัติ
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                                            ระบุหน้า <span className="text-slate-300 font-medium normal-case">(ทางเลือก)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                                            placeholder="เช่น หน้า 1-3 หรือ หน้า 5"
                                            value={formData.transcribePageRange}
                                            onChange={(e) => handleChange('transcribePageRange', e.target.value)}
                                            aria-label="ระบุหน้าที่ต้องการพิมพ์"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                                            ระบุข้อ <span className="text-slate-300 font-medium normal-case">(ทางเลือก)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                                            placeholder="เช่น ข้อ 1-5 หรือ ข้อ 3,7,10"
                                            value={formData.transcribeQuestionRange}
                                            onChange={(e) => handleChange('transcribeQuestionRange', e.target.value)}
                                            aria-label="ระบุข้อที่ต้องการพิมพ์"
                                        />
                                    </div>
                                </div>

                                {/* Question Type for Transcribe */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest pl-1">ประเภทโจทย์</label>
                                    <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-100">
                                        <button
                                            onClick={() => handleChange('questionType', 'objective')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'objective' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
                                        >
                                            <div>ปรนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'objective' ? 'text-slate-400' : 'text-slate-300'}`}>ตัวเลือก 4 ข้อ</div>
                                        </button>
                                        <button
                                            onClick={() => handleChange('questionType', 'subjective')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'subjective' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
                                        >
                                            <div>อัตนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'subjective' ? 'text-slate-400' : 'text-slate-300'}`}>แสดงวิธีทำ</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 2: Smart Selection Cards - Hidden for Transcribe */}
                    {formData.mode !== 'transcribe' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Source Card */}
                            <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group/card h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                                        <Paperclip size={18} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 font-outfit">แหล่งข้อมูล</h2>
                                </div>
                                <div className="space-y-3 flex-1">
                                    {[
                                        { id: 'ai-free', label: 'AI Knowledge', icon: <Sparkles size={16} />, color: 'blue' },
                                        { id: 'attachment', label: 'My Documents', icon: <Paperclip size={16} />, color: 'pink' },
                                    ].map(src => (
                                        <button
                                            key={src.id}
                                            onClick={() => handleChange('source', src.id)}
                                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group/btn
                                        ${formData.source === src.id
                                                    ? 'border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/5'
                                                    : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                                } `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.source === src.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 group-hover/btn:bg-slate-300'} `}>
                                                    {src.icon}
                                                </div>
                                                <span className={`font-bold text-xs ${formData.source === src.id ? 'text-slate-900' : 'text-slate-500'} `}>{src.label}</span>
                                            </div>
                                            {formData.source === src.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Tone Card */}
                            <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group/card h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                        <Type size={18} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 font-outfit">น้ำเสียง</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                    {[
                                        { id: 'friendly', label: 'ครูฮีม ใจดี', icon: '😊' },
                                        { id: 'academic', label: 'ครูฮีม วิชาการ', icon: '🎓' },
                                        { id: 'fun', label: 'ครูฮีม สนุก', icon: '🤘' },
                                        { id: 'detailed', label: 'ครูฮีม ละเอียด', icon: '🧐' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleChange('tone', t.id)}
                                            className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5
                                        ${formData.tone === t.id
                                                    ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                                                    : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                                } `}
                                        >
                                            <span className="text-xl">{t.icon}</span>
                                            <span className="font-bold text-[10px] uppercase tracking-tighter">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Section 3: Fine-Tuning - Hidden for Transcribe */}
                    {formData.mode !== 'transcribe' && (
                        <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group/card overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover/card:rotate-12 transition-transform duration-500">
                                    <Sliders size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-800 font-outfit tracking-tight">Advanced Config</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                                        {formData.mode === 'summary' ? 'ปรับแต่งความยาวของสรุป' : 'ปรับแต่งระดับความยากและส่วนประกอบ'}
                                    </p>
                                </div>
                            </div>

                            {/* Summary Length Selector (only for summary mode) */}
                            {formData.mode === 'summary' && (
                                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1">
                                        ความยาวของสรุป (Summary Length)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'short', label: 'สั้น', words: '~200 คำ', desc: 'สรุปเฉพาะสูตรหลัก', icon: '⚡', color: 'emerald' },
                                            { id: 'medium', label: 'กลาง', words: '~500 คำ', desc: 'สูตร + เทคนิค + จุดระวัง', icon: '📋', color: 'blue' },
                                            { id: 'long', label: 'ยาว', words: '~800 คำ', desc: 'ครบทุกหัวข้อ + ตัวอย่างประกอบ', icon: '📖', color: 'amber' },
                                        ].map(len => (
                                            <button
                                                key={len.id}
                                                onClick={() => handleChange('summaryLength', len.id)}
                                                className={`p-4 rounded-2xl border-2 text-center transition-all
                                                ${formData.summaryLength === len.id
                                                        ? 'border-amber-500 bg-amber-50/20 ring-4 ring-amber-500/5'
                                                        : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                                    } `}
                                            >
                                                <span className="text-2xl">{len.icon}</span>
                                                <div className={`font-black text-sm mt-1.5 ${formData.summaryLength === len.id ? 'text-amber-600' : 'text-slate-700'}`}>{len.label}</div>
                                                <div className={`text-xs font-bold mt-0.5 ${formData.summaryLength === len.id ? 'text-amber-500' : 'text-slate-400'}`}>{len.words}</div>
                                                <div className="text-[9px] font-bold text-slate-400 leading-tight mt-1">{len.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Difficulty Slider (hidden for summary mode) */}
                            {formData.mode !== 'summary' && (
                                <div className="mb-10">
                                    <div className="flex justify-between items-end mb-4 px-1">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ระดับความยาก (Difficulty)</label>
                                        <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-tighter
                                    ${formData.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : ''}
                                    ${formData.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${formData.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' : ''}
                                    ${formData.difficulty === 'exam' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : ''}
                                `}>
                                            {formData.difficulty === 'exam' ? 'Exam Mode' : formData.difficulty}
                                        </span>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                        <input
                                            type="range"
                                            min="0" max="3" step="1"
                                            className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
                                            value={['easy', 'medium', 'hard', 'exam'].indexOf(formData.difficulty)}
                                            onChange={(e) => handleChange('difficulty', ['easy', 'medium', 'hard', 'exam'][e.target.value])}
                                        />
                                        <div className="absolute top-0 left-0 w-full flex justify-between pointer-events-none px-1">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full mt-2.5 ${i <= ['easy', 'medium', 'hard', 'exam'].indexOf(formData.difficulty) ? 'bg-slate-900' : 'bg-slate-200'} `} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SVG Image Type Selector (only for svg_question mode) */}
                            {formData.mode === 'svg_question' && (
                                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1">
                                        ประเภทรูปภาพ (SVG Image Type)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'geometry', label: 'เรขาคณิต', desc: 'สามเหลี่ยม สี่เหลี่ยม วงกลม', icon: '📐' },
                                            { id: 'graph', label: 'กราฟ', desc: 'เส้นตรง พาราโบลา พิกัด', icon: '📈' },
                                            { id: 'number_line', label: 'เส้นจำนวน', desc: 'Number Line', icon: '📏' },
                                            { id: 'diagram', label: 'แผนภาพ', desc: 'Venn, Tree Diagram', icon: '🔀' },
                                            { id: 'mixed', label: 'ผสม', desc: 'เลือกอัตโนมัติตามโจทย์', icon: '🎨' },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleChange('svgImageType', t.id)}
                                                className={`p-3 rounded-2xl border-2 text-left transition-all
                                            ${formData.svgImageType === t.id
                                                        ? 'border-purple-600 bg-purple-50/20 ring-4 ring-purple-500/5'
                                                        : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                                    } `}
                                            >
                                                <span className="text-lg">{t.icon}</span>
                                                <div className={`font-black text-[11px] mt-1 ${formData.svgImageType === t.id ? 'text-purple-600' : 'text-slate-700'}`}>{t.label}</div>
                                                <div className="text-[9px] font-bold text-slate-400 leading-tight">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Components Chip Set */}
                            <div className="mb-10">
                                <label className="block text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1">
                                    เลือกออปชันเสริม
                                    {allowedComponents.length === 0 && (
                                        <span className="ml-2 text-slate-300 font-medium normal-case">(ไม่มีออปชันสำหรับโหมดนี้)</span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {/* Item 9: Only show options allowed for current mode */}
                                    {[
                                        { id: 'dummyChoice', label: 'ช้อยส์หลอกดักทาง', color: 'blue' },
                                        { id: 'realWorldApp', label: 'ประยุกต์ใช้จริง', color: 'emerald' },
                                        { id: 'addHint', label: 'เพิ่มคำใบ้', color: 'amber' },
                                        { id: 'crossChapter', label: 'ผสมข้ามบท', color: 'indigo' },
                                        { id: 'mistake', label: 'จุดที่มักผิด', color: 'rose' },
                                        { id: 'bulletPoints', label: 'สรุปเป็นข้อๆ', color: 'amber' },
                                        { id: 'comparisonTable', label: 'ตารางเปรียบเทียบ', color: 'cyan' },
                                        { id: 'stepByStep', label: 'ทีละขั้นตอน', color: 'violet' },
                                    ].filter(comp => allowedComponents.includes(comp.id)).map(comp => (
                                        <button
                                            key={comp.id}
                                            onClick={() => handleComponentChange(comp.id)}
                                            aria-label={`เปิด/ปิดออปชัน ${comp.label}`}
                                            aria-pressed={formData.components[comp.id]}
                                            className={`px-4 py-2.5 rounded-2xl border-2 font-bold text-xs transition-all flex items-center gap-2.5 active:scale-95
                                        ${formData.components[comp.id]
                                                    ? `border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10`
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                } `}
                                        >
                                            <Check size={14} strokeWidth={4} className={`transition-all duration-300 ${formData.components[comp.id] ? 'scale-100 opacity-100' : 'scale-0 opacity-0 w-0'} `} />
                                            {comp.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantities for Practice/Exam/SVG Question/Transcribe */}
                            {['practice', 'exam', 'web_quiz', 'svg_question'].includes(formData.mode) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end p-6 bg-slate-50/80 rounded-3xl border border-slate-100 animate-in zoom-in-95 duration-500">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">จำนวนข้อสอบ</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min={1}
                                                max={50}
                                                className="w-24 p-4 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                                                value={formData.questionCount}
                                                onChange={(e) => handleChange('questionCount', e.target.value)}
                                                aria-label="จำนวนข้อสอบ"
                                            />
                                            <span className="font-bold text-slate-400">ITEMS</span>
                                            <span className="text-[9px] font-bold text-slate-300">(1-50)</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-100">
                                        <button
                                            onClick={() => handleChange('questionType', 'objective')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'objective' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'} `}
                                        >
                                            <div>ปรนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'objective' ? 'text-slate-400' : 'text-slate-300'}`}>ตัวเลือก 4 ข้อ</div>
                                        </button>
                                        <button
                                            onClick={() => handleChange('questionType', 'subjective')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'subjective' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'} `}
                                        >
                                            <div>อัตนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'subjective' ? 'text-slate-400' : 'text-slate-300'}`}>แสดงวิธีทำ</div>
                                        </button>
                                        <button
                                            onClick={() => handleChange('questionType', 'word_problem')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'word_problem' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'} `}
                                        >
                                            <div>โจทย์ปัญหา</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'word_problem' ? 'text-slate-400' : 'text-slate-300'}`}>เน้นวิเคราะห์</div>
                                        </button>
                                    </div>
                                    {formData.questionType === 'word_problem' && (
                                        <div className="md:col-span-2 flex gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest self-center px-2">รูปแบบโจทย์ปัญหา:</span>
                                            <button
                                                onClick={() => handleChange('wordProblemType', 'objective')}
                                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${formData.wordProblemType === 'objective' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:text-indigo-600'} `}
                                            >
                                                ปรนัย (มีตัวเลือก)
                                            </button>
                                            <button
                                                onClick={() => handleChange('wordProblemType', 'subjective')}
                                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${formData.wordProblemType === 'subjective' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:text-indigo-600'} `}
                                            >
                                                อัตนัย (แสดงวิธีทำ)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Complexity Toggle - Hidden for Summary */}
                            {formData.mode !== 'summary' && (
                                <div className="mt-8">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest pl-1">
                                        {(['practice', 'exam', 'web_quiz', 'mistake'].includes(formData.mode))
                                            ? 'ระดับความละเอียดของเฉลย'
                                            : 'ระดับความลึกของเนื้อหา'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                id: 'long',
                                                label: (['practice', 'exam', 'web_quiz', 'mistake'].includes(formData.mode)) ? 'เฉลยแบบสั้น (Short Solution)' : 'Standard Depth',
                                                desc: (['practice', 'exam', 'web_quiz', 'mistake'].includes(formData.mode)) ? 'เน้นการเฉลยที่สั้น กระชับ และเข้าใจง่าย' : 'ครอบคลุมทุกจุดสำคัญ (PDF 1-3 หน้า)'
                                            },
                                            {
                                                id: 'very_long',
                                                label: (['practice', 'exam', 'web_quiz', 'mistake'].includes(formData.mode)) ? 'เฉลยแบบละเอียด (Detailed Solution)' : 'Ultimate Master',
                                                desc: (['practice', 'exam', 'web_quiz', 'mistake'].includes(formData.mode)) ? 'เฉลยละเอียด มีหลักการคิด วิธีทำ และสรุปจุดที่ควรระวัง' : 'เจาะลึกทุกรายละเอียด (PDF 4+ หน้า)'
                                            },
                                        ].map(len => (
                                            <button
                                                key={len.id}
                                                onClick={() => handleChange('contentLength', len.id)}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all h-full
                                        ${formData.contentLength === len.id
                                                        ? 'border-blue-600 bg-blue-50/10 ring-4 ring-blue-500/5'
                                                        : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200 hover:bg-white'
                                                    } `}
                                            >
                                                <div className={`font-black text-xs mb-1 uppercase tracking-tight ${formData.contentLength === len.id ? 'text-blue-600' : 'text-slate-800'} `}>{len.label}</div>
                                                <div className="text-[10px] font-bold text-slate-400 leading-tight">{len.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div >

            {/* --- Right Panel (Extracted Component) --- */}
            <PromptPreview
                generatedPrompt={generatedPrompt}
                formData={formData}
                isCopied={isCopied}
                onCopy={handleCopy}
                onCopyMarkdown={handleCopyMarkdown}
                onOpenGemini={handleOpenGemini}
                saveStatus={saveStatus}
            />
        </div>
    );
};

export default PromptBuilderPage;
