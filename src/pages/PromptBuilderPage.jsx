import React, { useState, useEffect, useRef, useCallback } from 'react';
import { savePromptSettings, loadPromptSettings } from '../firebase';
import {
    Sparkles, Copy, Check, Terminal, Zap, FileText,
    BookOpen, Layers, Type, Sliders, Settings, ExternalLink, Brain, ChevronDown, List, PenTool, Paperclip, Undo2, Calendar, Image as ImageIcon, ScanText, AlertCircle, Loader2, Save, ClipboardCopy, Globe, Award, Shapes, Wand2
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
    flashcard: ['realWorldApp', 'addHint', 'crossChapter', 'mistake', 'stepByStep'],
    web_quiz: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    gifted_quiz: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    svg_question: ['dummyChoice', 'realWorldApp', 'addHint', 'crossChapter', 'mistake'],
    math_figure: [],
    figure_from_text: [],
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
    flashcardFocus: 'mixed',
    flashcardAnswerStyle: 'balanced',
};

const DEFAULT_FORM_DATA = {
    mode: 'content',
    grade: 'M1',
    term: '1',
    subjectType: 'Basic',
    source: 'ai-free',
    courseName: '',
    chapter: '',
    selectedTopic: '',
    customTopic: '',
    chapterDetails: '',
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
    flashcardFocus: 'mixed',
    flashcardAnswerStyle: 'balanced',
    transcribePageRange: '',
    transcribeQuestionRange: '',
    summaryLength: 'medium',
    figureSourceText: ''
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

    // Single re-usable timer for the "Copied!" flash + unmount cleanup so rapid
    // clicks don't stack timeouts and a late timeout can't setState after unmount.
    const copyTimerRef = useRef(null);
    useEffect(() => () => clearTimeout(copyTimerRef.current), []);

    // Item 2: Debounced formData for auto-save
    const debouncedFormData = useDebounce(formData, 800);

    // Item 7: Use extracted prompt generation hook
    const generatedPrompt = usePromptGenerator(formData);

    // Load from Firestore on mount (Item 1: Error Handling)
    useEffect(() => {
        let mounted = true;
        let initialLoadTimer = null;
        const load = async () => {
            try {
                setIsLoading(true);
                const saved = await loadPromptSettings();
                if (mounted && saved) setFormData(saved);
            } catch (error) {
                console.error('Error loading prompt settings:', error);
                if (mounted) addToast('ไม่สามารถโหลดค่าที่บันทึกไว้ได้ ใช้ค่าเริ่มต้นแทน', 'error', 5000);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    initialLoadTimer = setTimeout(() => { isInitialLoad.current = false; }, 500);
                }
            }
        };
        load();
        return () => { mounted = false; clearTimeout(initialLoadTimer); };
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

    const handleReset = async () => {
        if (!window.confirm("คุณต้องการล้างการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) return;
        setFormData(DEFAULT_FORM_DATA);
        // Confirm success only after the write actually lands, so the user isn't told
        // "saved" while persistence is still pending or has failed.
        try {
            await savePromptSettings(DEFAULT_FORM_DATA);
            addToast('รีเซ็ตค่าทั้งหมดเรียบร้อย', 'success');
        } catch (e) {
            console.error('Reset save failed:', e);
            addToast('รีเซ็ตเรียบร้อย แต่บันทึกค่าไม่สำเร็จ', 'error');
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
                const isQMode = ['exam', 'web_quiz', 'gifted_quiz', 'practice', 'svg_question', 'mistake'].includes(value);
                return {
                    ...prev,
                    mode: value,
                    ...MODE_DEFAULTS,
                    contentLength: isQMode ? 'medium' : 'long',
                    components: newComponents,
                    ...(value === 'gifted_quiz' ? { grade: 'GIFTED_M1' } : {}),
                };
            });
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Item 9: Get allowed options for current mode
    const allowedComponents = MODE_ALLOWED_OPTIONS[formData.mode] || [];

    const derivedCourseLabel = (() => {
        if (formData.grade === 'ENTRANCE_M1') return 'คอร์สสอบเข้า ม.1';
        if (formData.grade === 'GIFTED_M1') return 'คอร์ส Gifted ม.1';
        const gradeLabel = formData.grade?.replace('M', 'ม.') || 'ม.1';
        const termLabel = ['ENTRANCE_M1', 'GIFTED_M1'].includes(formData.grade) ? '' : ` เทอม ${formData.term}`;
        const subjectLabel = ['M1', 'M2', 'M3', 'ENTRANCE_M1', 'GIFTED_M1'].includes(formData.grade)
            ? ''
            : formData.subjectType === 'Additional'
                ? ' วิชาเพิ่มเติม'
                : ' วิชาพื้นฐาน';
        return `คอร์ส${gradeLabel}${termLabel}${subjectLabel}`;
    })();

    const handleComponentChange = (comp) => {
        // Item 9: Only allow toggling components that are allowed for current mode
        if (!allowedComponents.includes(comp)) return;
        setFormData(prev => ({
            ...prev,
            components: { ...prev.components, [comp]: !prev.components[comp] }
        }));
    };

    const flashCopied = () => {
        setIsCopied(true);
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
    };

    const handleCopy = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt).catch(e => console.error('Copy failed:', e));
        flashCopied();
    };

    // Item 15: Copy as Markdown
    const handleCopyMarkdown = () => {
        if (!generatedPrompt) return;
        const markdownPrompt = `# AI Prompt — ${formData.mode.toUpperCase()}\n\n---\n\n${generatedPrompt}`;
        navigator.clipboard.writeText(markdownPrompt).catch(e => console.error('Copy failed:', e));
        flashCopied();
    };

    const handleOpenGemini = () => {
        window.open('https://gemini.google.com/app', '_blank');
    };

    const SelectWrapper = ({ label, value, onChange, options, disabled = false, icon: Icon }) => (
        <div className="relative group transition-all duration-300">
            <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                {label}
            </label>
            <div className={`relative rounded-[10px] transition-all duration-300 ${disabled ? 'opacity-50' : ''}`}>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8175] group-hover:text-ink transition-colors">
                    {Icon ? <Icon size={16} strokeWidth={2.5} /> : <Layers size={16} strokeWidth={2.5} />}
                </div>
                <select
                    className={`w-full p-3 pl-11 pr-10 bg-paper border border-line rounded-[10px] appearance-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all font-semibold text-[#3a342c] text-sm
                    ${disabled ? 'cursor-not-allowed bg-canvas-2' : 'hover:border-ink/30 cursor-pointer'} `}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b3aa97] pointer-events-none group-hover:text-ink transition-colors">
                    <ChevronDown size={18} strokeWidth={3} />
                </div>
            </div>
        </div>
    );

    // Item 1: Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-canvas">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-accent animate-spin" />
                    <p className="text-[#6b6357] font-semibold text-sm font-thai">กำลังโหลดค่าที่บันทึกไว้...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-canvas font-thai selection:bg-accent selection:text-white">
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
            <div className="w-full lg:w-[62%] h-full overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative z-0 bg-canvas">
                <div className="max-w-4xl mx-auto space-y-10 pb-32">

                    {/* Header */}
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2.5">
                                <div className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-[0.07em] text-[10px] font-display animate-in slide-in-from-left duration-700">
                                    <Sparkles size={12} fill="currentColor" />
                                    <span>Advanced AI Prompt Architecture</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-ink leading-[1.0] font-display tracking-[-0.03em]">
                                    MathCraft <span className="text-accent">AI</span>
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="group flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#6b6357] bg-paper border border-line rounded-[10px] hover:border-ink/30 hover:text-ink transition-all active:scale-95"
                                >
                                    <Undo2 size={14} className="group-hover:-rotate-45 transition-transform" />
                                    RESET
                                </button>
                                <button
                                    onClick={() => setIsTemplateOpen(true)}
                                    aria-label="เปิด Templates"
                                    className="group flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#6b6357] bg-paper border border-line rounded-[10px] hover:border-ink/30 hover:text-ink transition-all active:scale-95"
                                >
                                    <FileText size={14} />
                                    TEMPLATES
                                </button>
                            </div>
                        </div>
                        <p className="text-[#6b6357] max-w-xl text-[15px] font-medium leading-relaxed">
                            สร้างคำสั่งที่ทรงพลังเพื่อเปลี่ยน AI ให้เป็นผู้ช่วยเตรียมเนื้อหาและข้อสอบตามหลักสูตร สสวท. อย่างมืออาชีพ
                        </p>
                    </div>

                    {/* Section 1: Core Configuration */}
                    <section className="bg-paper p-8 rounded-[16px] border border-line transition-all group/card">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-ink rounded-[12px] flex items-center justify-center text-white">
                                <Layers size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-ink font-display tracking-tight">Core Context</h2>
                                <p className="text-[#8a8175] text-xs font-bold uppercase tracking-widest mt-0.5 font-display">ข้อมูลพื้นฐานของเอกสาร</p>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex flex-wrap gap-2 mb-8 bg-canvas p-2 rounded-[14px] border border-line" role="tablist" aria-label="เลือกโหมดการสร้างคำสั่ง">
                            {[
                                { id: 'content', label: 'บทเรียน', icon: <BookOpen size={16} /> },
                                { id: 'practice', label: 'แบบฝึกหัด', icon: <PenTool size={16} /> },
                                { id: 'exam', label: 'ข้อสอบ', icon: <FileText size={16} /> },
                                { id: 'flashcard', label: 'แฟลชการ์ด', icon: <ClipboardCopy size={16} /> },
                                { id: 'web_quiz', label: 'แนวข้อสอบเว็บ', icon: <Globe size={16} /> },
                                { id: 'gifted_quiz', label: 'Gifted เว็บ', icon: <Award size={16} /> },
                                { id: 'svg_question', label: 'โจทย์+รูป', icon: <ImageIcon size={16} /> },
                                { id: 'math_figure', label: 'สร้างรูป', icon: <Shapes size={16} /> },
                                { id: 'figure_from_text', label: 'รูปจากโจทย์', icon: <Wand2 size={16} /> },
                                { id: 'transcribe', label: 'พิมพ์ตาม', icon: <ScanText size={16} /> },
                                { id: 'summary', label: 'สรุปสูตร', icon: <Zap size={16} /> },
                                { id: 'mistake', label: 'วิเคราะห์', icon: <Brain size={16} /> },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleChange('mode', item.id)}
                                    role="tab"
                                    aria-selected={formData.mode === item.id}
                                    aria-label={`โหมด ${item.label}`}
                                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-[10px] font-bold text-xs transition-all flex items-center justify-center gap-2.5
                                    ${formData.mode === item.id
                                            ? `bg-ink text-white`
                                            : 'text-[#6b6357] hover:bg-paper hover:text-ink'
                                        } `}
                                >
                                    <span className={`transition-transform duration-300 ${formData.mode === item.id ? 'scale-110 text-accent' : 'text-[#8a8175]'} `}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Main Grid - Hidden for Transcribe and Math Figure */}
                        {!['transcribe', 'math_figure', 'figure_from_text'].includes(formData.mode) && (<>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <SelectWrapper
                                    label="ระดับชั้น"
                                    icon={Type}
                                    value={formData.grade}
                                    onChange={(e) => handleChange('grade', e.target.value)}
                                    options={[
                                        { value: 'ENTRANCE_M1', label: 'สอบเข้า ม.1' },
                                        { value: 'GIFTED_M1', label: 'Gifted ม.1' },
                                        ...['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map(g => ({ value: g, label: g.replace('M', 'มัธยมศึกษาปีที่ ') }))
                                    ]}
                                />
                                <SelectWrapper
                                    label="ภาคเรียน"
                                    icon={Calendar}
                                    value={formData.term}
                                    onChange={(e) => handleChange('term', e.target.value)}
                                    disabled={['ENTRANCE_M1', 'GIFTED_M1'].includes(formData.grade)}
                                    options={[{ value: '1', label: 'เทอม 1' }, { value: '2', label: 'เทอม 2' }]}
                                />
                                <SelectWrapper
                                    label="ประเภทวิชา"
                                    icon={Settings}
                                    value={formData.subjectType}
                                    onChange={(e) => handleChange('subjectType', e.target.value)}
                                    disabled={['M1', 'M2', 'M3', 'ENTRANCE_M1', 'GIFTED_M1'].includes(formData.grade)}
                                    options={[{ value: 'Basic', label: 'พื้นฐาน' }, { value: 'Additional', label: 'เพิ่มเติม' }]}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="relative group">
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                        บทเรียน (Chapter)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8175] pointer-events-none group-focus-within:text-ink">
                                            <BookOpen size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            className="w-full p-4 pl-12 pr-10 bg-paper border border-line rounded-[12px] appearance-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all text-base font-bold text-ink hover:border-ink/30 cursor-pointer"
                                            value={formData.chapter}
                                            onChange={(e) => handleChange('chapter', e.target.value)}
                                            aria-label="เลือกบทเรียน"
                                        >
                                            <option value="">-- เลือกบทเรียน --</option>
                                            {availableChapters.map((chapter, idx) => (
                                                <option key={idx} value={chapter}>{chapter}</option>
                                            ))}
                                            <option value="custom" className="text-accent font-bold">+ ระบุบทเรียนเอง</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b3aa97] pointer-events-none" size={20} strokeWidth={3} />
                                    </div>
                                </div>

                                {formData.chapter && formData.chapter !== 'custom' && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                            เจาะจงเนื้อหา (Sub-Topic)
                                            <span className="ml-2 text-[#b3aa97] font-medium normal-case">(ทางเลือก)</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8175]">
                                                <List size={18} strokeWidth={2.5} />
                                            </div>
                                            <select
                                                className="w-full p-3.5 pl-12 pr-10 bg-canvas border border-line rounded-[12px] appearance-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all text-sm font-semibold text-[#3a342c] hover:border-ink/30 cursor-pointer"
                                                value={formData.selectedTopic}
                                                onChange={(e) => handleChange('selectedTopic', e.target.value)}
                                            >
                                                <option value="">-- ทุกหัวข้อในบทนี้ --</option>
                                                {availableTopics.map((topic, idx) => (
                                                    <option key={idx} value={topic}>{topic}</option>
                                                ))}
                                                <option value="custom" className="text-accent">+ กำหนดเอง</option>
                                            </select>
                                            <ChevronDown size={16} strokeWidth={3} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b3aa97]" />
                                        </div>
                                    </div>
                                )}

                                {/* Item 3: Chapter warning */}
                                {!formData.chapter && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fae9e7] border border-[#c2483c]/25 rounded-[10px] animate-in fade-in duration-300">
                                        <AlertCircle size={16} className="text-[#c2483c] shrink-0" />
                                        <span className="text-xs font-semibold text-[#a23a30]">กรุณาเลือกบทเรียนเพื่อให้ Prompt สมบูรณ์ยิ่งขึ้น</span>
                                    </div>
                                )}

                                {(formData.chapter === 'custom' || formData.selectedTopic === 'custom') && (
                                    <div className="animate-in zoom-in-95 duration-300">
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-canvas border border-dashed border-line-2 rounded-[12px] focus:ring-2 focus:ring-accent/15 focus:border-accent focus:bg-paper outline-none transition-all placeholder:text-[#b3aa97] text-ink font-bold"
                                            placeholder="ระบุหัวข้อที่ต้องการ เช่น เลขยกกำลังที่มีฐานเป็นลบ..."
                                            value={formData.customTopic}
                                            onChange={(e) => handleChange('customTopic', e.target.value)}
                                            maxLength={200}
                                            aria-label="ระบุหัวข้อที่ต้องการ"
                                        />
                                        {/* Item 3: Character counter */}
                                        <div className="flex justify-end mt-1 pr-1">
                                            <span className={`text-[10px] font-bold ${formData.customTopic.length >= 180 ? 'text-accent' : 'text-[#b3aa97]'}`}>
                                                {formData.customTopic.length}/200
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {formData.mode === 'flashcard' && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="rounded-[16px] border border-line bg-canvas p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.07em] text-accent font-display">
                                                        <ClipboardCopy size={12} />
                                                        Flashcard Blueprint
                                                    </div>
                                                    <h3 className="mt-3 text-lg font-extrabold text-ink">กำหนดคอร์สและรายละเอียดบทให้ชัดก่อนสร้างการ์ด</h3>
                                                    <p className="mt-1 text-sm font-medium leading-relaxed text-[#6b6357]">
                                                        ระบบจะยึดคอร์สเรียนของแต่ละชั้นเป็นบริบทหลัก แล้วแตกการ์ดตามบทและหัวข้อย่อย เพื่อให้ได้การ์ดที่สอนเป็นลำดับจริงใช้งานจริง
                                                    </p>
                                                </div>
                                                <div className="rounded-[12px] bg-paper border border-line px-4 py-3 text-right">
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#8a8175] font-display">Course Snapshot</div>
                                                    <div className="mt-1 text-sm font-extrabold text-ink">{derivedCourseLabel}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                                    ชื่อคอร์ส <span className="text-accent">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3.5 bg-paper border border-line rounded-[12px] focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all text-sm font-semibold text-[#3a342c] placeholder:text-[#b3aa97]"
                                                    placeholder={derivedCourseLabel}
                                                    value={formData.courseName}
                                                    onChange={(e) => handleChange('courseName', e.target.value)}
                                                    aria-label="ชื่อคอร์ส"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                                    แนวการ์ด
                                                </label>
                                                <div className="grid grid-cols-3 gap-2 p-1.5 bg-canvas rounded-[12px] border border-line">
                                                    {[
                                                        { id: 'concept', label: 'คอนเซปต์', desc: 'นิยามและกฎเท่านั้น' },
                                                        { id: 'mixed', label: 'ผสม', desc: 'นิยาม + โจทย์สั้น' },
                                                        { id: 'problem', label: 'โจทย์', desc: 'สั้นกระชับ เน้นวิธีคิด' },
                                                    ].map(option => (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleChange('flashcardFocus', option.id)}
                                                            className={`rounded-[10px] px-3 py-3 text-left transition-all ${formData.flashcardFocus === option.id ? 'bg-ink text-white' : 'text-[#6b6357] hover:bg-paper hover:text-ink'}`}
                                                        >
                                                            <div className="text-xs font-extrabold">{option.label}</div>
                                                            <div className={`mt-1 text-[9px] font-bold ${formData.flashcardFocus === option.id ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>{option.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                                รายละเอียดของบท <span className="text-accent">*</span>
                                            </label>
                                            <textarea
                                                className="w-full min-h-[120px] p-4 bg-paper border border-line rounded-[12px] focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all text-sm font-medium text-[#3a342c] placeholder:text-[#b3aa97] resize-y"
                                                placeholder="เช่น เริ่มจากนิยามสมการ, ตัวแปร, การย้ายข้าง, สมการ 2 ขั้นตอน, โจทย์ประยุกต์ และจุดที่นักเรียนมักสับสนในบทนี้"
                                                value={formData.chapterDetails}
                                                onChange={(e) => handleChange('chapterDetails', e.target.value)}
                                                aria-label="รายละเอียดของบท"
                                            />
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    { title: 'คอร์ส', text: formData.courseName || derivedCourseLabel },
                                                    { title: 'บท', text: formData.chapter === 'custom' ? formData.customTopic || 'ระบุบทเอง' : formData.chapter || 'ยังไม่ได้เลือกบท' },
                                                    { title: 'หัวข้อย่อย', text: formData.selectedTopic === 'custom' ? formData.customTopic || 'กำหนดเอง' : formData.selectedTopic || 'ครอบคลุมทั้งบท' },
                                                ].map((item) => (
                                                    <div key={item.title} className="rounded-[12px] border border-line bg-canvas px-4 py-3">
                                                        <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#8a8175] font-display">{item.title}</div>
                                                        <div className="mt-1 text-sm font-bold text-[#3a342c] leading-snug">{item.text}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>)}

                        {/* Math Figure mode: Figure category + instructions */}
                        {formData.mode === 'math_figure' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-5 bg-canvas border border-line rounded-[12px]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shapes size={18} className="text-ink" />
                                        <span className="text-sm font-bold text-ink">โหมดสร้างรูปคณิตศาสตร์ — แนบรูปต้นฉบับใน Gemini</span>
                                    </div>
                                    <p className="text-xs text-[#6b6357] leading-relaxed">
                                        ระบบจะสร้างโค้ด SVG ตามรูปต้นฉบับที่แนบมา เพื่อให้ได้รูปทางคณิตศาสตร์ที่สวยงาม เส้นหนา ตัวอักษรไม่ซ้อนทับเส้น สามารถนำโค้ดไปวางในระบบเพื่อแสดงผลได้ทันที
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-4 uppercase tracking-widest pl-1 font-display">
                                        หมวดหมู่รูปภาพ (Figure Category)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'geometry', label: 'เรขาคณิต', desc: 'สามเหลี่ยม สี่เหลี่ยม วงกลม' },
                                            { id: 'graph', label: 'กราฟ', desc: 'เส้นตรง พาราโบลา พิกัด' },
                                            { id: 'number_line', label: 'เส้นจำนวน', desc: 'Number Line' },
                                            { id: 'diagram', label: 'แผนภาพ', desc: 'Venn, Tree Diagram' },
                                            { id: 'construction', label: 'การสร้าง', desc: 'วงเวียน สันตรง' },
                                            { id: 'mixed', label: 'ตามรูปต้นฉบับ', desc: 'ให้ AI วิเคราะห์เอง' },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleChange('svgImageType', t.id)}
                                                className={`p-3.5 rounded-[12px] border text-left transition-all
                                                    ${formData.svgImageType === t.id
                                                        ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                        : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                    } `}
                                            >
                                                <div className={`font-extrabold text-[11px] ${formData.svgImageType === t.id ? 'text-ink' : 'text-[#3a342c]'}`}>{t.label}</div>
                                                <div className="text-[9px] font-bold text-[#8a8175] leading-tight mt-0.5">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-canvas border border-line rounded-[12px]">
                                    <Paperclip size={18} className="text-accent shrink-0" />
                                    <div>
                                        <span className="text-xs font-bold text-ink">อย่าลืมแนบรูปต้นฉบับ!</span>
                                        <p className="text-[10px] text-[#6b6357] mt-0.5">คัดลอกคำสั่งด้านขวา แล้วแนบรูปต้นฉบับใน Gemini เพื่อให้ AI สร้าง SVG ตามรูปนั้น</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Figure-from-text mode: paste question -> AI analyzes -> SVG */}
                        {formData.mode === 'figure_from_text' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-5 bg-canvas border border-line rounded-[12px]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Wand2 size={18} className="text-ink" />
                                        <span className="text-sm font-bold text-ink">โหมดสร้างรูปจากโจทย์ — วาง "ข้อความโจทย์" แล้ว AI วิเคราะห์เอง</span>
                                    </div>
                                    <p className="text-xs text-[#6b6357] leading-relaxed">
                                        ต่างจากโหมด "สร้างรูป" ที่ต้องแนบรูปต้นฉบับ — โหมดนี้ AI จะ<strong>อ่านและวิเคราะห์เนื้อหาโจทย์</strong> เพื่อออกแบบรูปประกอบที่เหมาะสมขึ้นมาเอง ไม่ต้องมีรูปต้นฉบับ เหมาะกับโจทย์ที่มีแต่ข้อความแต่ยังขาดรูป
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-2 uppercase tracking-widest pl-1 font-display">
                                        ข้อความโจทย์ <span className="text-[#8a8175] font-medium normal-case">(วางโจทย์ที่ต้องการให้สร้างรูป)</span>
                                    </label>
                                    <textarea
                                        className="w-full h-40 p-4 bg-paper border border-line rounded-[12px] focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all text-sm font-medium text-[#3a342c] placeholder:text-[#b3aa97] resize-none leading-relaxed"
                                        placeholder={'วางโจทย์คณิตศาสตร์ที่นี่ เช่น\n"รูปสามเหลี่ยม ABC มีมุม A = 90°, AB = 3 ซม., AC = 4 ซม. จงหาความยาว BC"\n\nวางได้หลายข้อ — AI จะสร้าง SVG แยกให้แต่ละข้อ'}
                                        value={formData.figureSourceText}
                                        onChange={(e) => handleChange('figureSourceText', e.target.value)}
                                        aria-label="ข้อความโจทย์สำหรับสร้างรูป"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-4 uppercase tracking-widest pl-1 font-display">
                                        หมวดหมู่รูปภาพ (Figure Category)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'mixed', label: 'วิเคราะห์เอง', desc: 'ให้ AI เลือกจากโจทย์' },
                                            { id: 'geometry', label: 'เรขาคณิต', desc: 'สามเหลี่ยม สี่เหลี่ยม วงกลม' },
                                            { id: 'graph', label: 'กราฟ', desc: 'เส้นตรง พาราโบลา พิกัด' },
                                            { id: 'number_line', label: 'เส้นจำนวน', desc: 'Number Line' },
                                            { id: 'diagram', label: 'แผนภาพ', desc: 'Venn, Tree Diagram' },
                                            { id: 'construction', label: 'การสร้าง', desc: 'วงเวียน สันตรง' },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleChange('svgImageType', t.id)}
                                                className={`p-3.5 rounded-[12px] border text-left transition-all
                                                    ${formData.svgImageType === t.id
                                                        ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                        : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                    } `}
                                            >
                                                <div className={`font-extrabold text-[11px] ${formData.svgImageType === t.id ? 'text-ink' : 'text-[#3a342c]'}`}>{t.label}</div>
                                                <div className="text-[9px] font-bold text-[#8a8175] leading-tight mt-0.5">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-canvas border border-line rounded-[12px]">
                                    <Wand2 size={18} className="text-accent shrink-0" />
                                    <div>
                                        <span className="text-xs font-bold text-ink">เคล็ดลับ</span>
                                        <p className="text-[10px] text-[#6b6357] mt-0.5">ถ้าวางข้อความโจทย์ในช่องด้านบนแล้ว ไม่ต้องแนบรูปใน Gemini — คัดลอกคำสั่งด้านขวาไปวางได้เลย</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transcribe-only: Range inputs */}
                        {formData.mode === 'transcribe' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-5 bg-canvas border border-line rounded-[12px]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ScanText size={18} className="text-ink" />
                                        <span className="text-sm font-bold text-ink">โหมดพิมพ์ตาม — แนบเอกสาร/รูปภาพใน Gemini</span>
                                    </div>
                                    <p className="text-xs text-[#6b6357] leading-relaxed">
                                        ระบบจะพิมพ์โจทย์ตามเอกสารที่แนบให้เหมือนต้นฉบับทุกประการ โดยลบหมายเลขข้อออกให้อัตโนมัติ
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                            ระบุหน้า <span className="text-[#b3aa97] font-medium normal-case">(ทางเลือก)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3.5 bg-paper border border-line rounded-[12px] focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all text-sm font-semibold text-[#3a342c] placeholder:text-[#b3aa97]"
                                            placeholder="เช่น หน้า 1-3 หรือ หน้า 5"
                                            value={formData.transcribePageRange}
                                            onChange={(e) => handleChange('transcribePageRange', e.target.value)}
                                            aria-label="ระบุหน้าที่ต้องการพิมพ์"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#8a8175] mb-1.5 uppercase tracking-widest pl-1 font-display">
                                            ระบุข้อ <span className="text-[#b3aa97] font-medium normal-case">(ทางเลือก)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3.5 bg-paper border border-line rounded-[12px] focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all text-sm font-semibold text-[#3a342c] placeholder:text-[#b3aa97]"
                                            placeholder="เช่น ข้อ 1-5 หรือ ข้อ 3,7,10"
                                            value={formData.transcribeQuestionRange}
                                            onChange={(e) => handleChange('transcribeQuestionRange', e.target.value)}
                                            aria-label="ระบุข้อที่ต้องการพิมพ์"
                                        />
                                    </div>
                                </div>

                                {/* Question Type for Transcribe */}
                                <div>
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-3 uppercase tracking-widest pl-1 font-display">ประเภทโจทย์</label>
                                    <div className="flex gap-2 p-1.5 bg-canvas rounded-[12px] border border-line">
                                        <button
                                            onClick={() => handleChange('questionType', 'objective')}
                                            className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-xs transition-all ${formData.questionType === 'objective' ? 'bg-ink text-white' : 'text-[#6b6357] hover:text-ink'}`}
                                        >
                                            <div>ปรนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'objective' ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>ตัวเลือก 4 ข้อ</div>
                                        </button>
                                        <button
                                            onClick={() => handleChange('questionType', 'subjective')}
                                            className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-xs transition-all ${formData.questionType === 'subjective' ? 'bg-ink text-white' : 'text-[#6b6357] hover:text-ink'}`}
                                        >
                                            <div>อัตนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'subjective' ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>แสดงวิธีทำ</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 2: Smart Selection Cards - Hidden for Transcribe & Figure-from-text (source/tone unused there) */}
                    {!['transcribe', 'figure_from_text'].includes(formData.mode) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Source Card */}
                            <section className="bg-paper p-8 rounded-[16px] border border-line group/card h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-ink rounded-[10px] flex items-center justify-center text-white">
                                        <Paperclip size={18} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-lg font-bold text-ink font-display">แหล่งข้อมูล</h2>
                                </div>
                                <div className="space-y-3 flex-1">
                                    {[
                                        { id: 'ai-free', label: 'AI Knowledge', icon: <Sparkles size={16} /> },
                                        { id: 'attachment', label: 'My Documents', icon: <Paperclip size={16} /> },
                                    ].map(src => (
                                        <button
                                            key={src.id}
                                            onClick={() => handleChange('source', src.id)}
                                            className={`w-full p-4 rounded-[12px] border text-left transition-all flex items-center justify-between group/btn
                                        ${formData.source === src.id
                                                    ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                    : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                } `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${formData.source === src.id ? 'bg-ink text-white' : 'bg-paper-2 text-[#8a8175]'} `}>
                                                    {src.icon}
                                                </div>
                                                <span className={`font-bold text-xs ${formData.source === src.id ? 'text-ink' : 'text-[#6b6357]'} `}>{src.label}</span>
                                            </div>
                                            {formData.source === src.id && <div className="w-2 h-2 bg-accent rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Tone Card */}
                            <section className="bg-paper p-8 rounded-[16px] border border-line group/card h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-ink rounded-[10px] flex items-center justify-center text-white">
                                        <Type size={18} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-lg font-bold text-ink font-display">น้ำเสียง</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                    {[
                                        { id: 'friendly', label: 'ครูฮีม ใจดี' },
                                        { id: 'academic', label: 'ครูฮีม วิชาการ' },
                                        { id: 'fun', label: 'ครูฮีม สนุก' },
                                        { id: 'detailed', label: 'ครูฮีม ละเอียด' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleChange('tone', t.id)}
                                            className={`p-4 rounded-[12px] border text-center transition-all flex items-center justify-center
                                        ${formData.tone === t.id
                                                    ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                    : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                } `}
                                        >
                                            <span className={`font-bold text-[11px] ${formData.tone === t.id ? 'text-ink' : 'text-[#6b6357]'}`}>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Section 3: Fine-Tuning - Hidden for Transcribe and Math Figure */}
                    {!['transcribe', 'math_figure', 'figure_from_text'].includes(formData.mode) && (
                        <section className="bg-paper p-8 rounded-[16px] border border-line group/card overflow-hidden relative">

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-ink rounded-[12px] flex items-center justify-center text-white">
                                    <Sliders size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-ink font-display tracking-tight">Advanced Config</h2>
                                    <p className="text-[#8a8175] text-xs font-bold uppercase tracking-widest mt-0.5 font-display">
                                        {formData.mode === 'summary'
                                            ? 'ปรับแต่งความยาวของสรุป'
                                            : formData.mode === 'flashcard'
                                                ? 'ตั้งค่าจำนวนการ์ดและความลึกของคำตอบ'
                                                : 'ปรับแต่งระดับความยากและส่วนประกอบ'}
                                    </p>
                                </div>
                            </div>

                            {/* Summary Length Selector (only for summary mode) */}
                            {formData.mode === 'summary' && (
                                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-4 uppercase tracking-widest pl-1 font-display">
                                        ความยาวของสรุป (Summary Length)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'short', label: 'สั้น', words: '~200 คำ', desc: 'สรุปเฉพาะสูตรหลัก' },
                                            { id: 'medium', label: 'กลาง', words: '~500 คำ', desc: 'สูตร + เทคนิค + จุดระวัง' },
                                            { id: 'long', label: 'ยาว', words: '~800 คำ', desc: 'ครบทุกหัวข้อ + ตัวอย่างประกอบ' },
                                        ].map(len => (
                                            <button
                                                key={len.id}
                                                onClick={() => handleChange('summaryLength', len.id)}
                                                className={`p-4 rounded-[12px] border text-center transition-all
                                                ${formData.summaryLength === len.id
                                                        ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                        : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                    } `}
                                            >
                                                <div className={`font-extrabold text-sm ${formData.summaryLength === len.id ? 'text-ink' : 'text-[#3a342c]'}`}>{len.label}</div>
                                                <div className={`text-xs font-bold mt-0.5 ${formData.summaryLength === len.id ? 'text-accent' : 'text-[#8a8175]'}`}>{len.words}</div>
                                                <div className="text-[9px] font-bold text-[#8a8175] leading-tight mt-1">{len.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Difficulty Slider (hidden for summary mode) */}
                            {formData.mode !== 'summary' && (
                                <div className="mb-10">
                                    <div className="flex justify-between items-end mb-4 px-1">
                                        <label className="text-[11px] font-bold text-[#8a8175] uppercase tracking-widest font-display">ระดับความยาก (Difficulty)</label>
                                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-[5px] tracking-tight
                                    ${formData.difficulty === 'easy' ? 'bg-canvas-2 text-[#3a342c]' : ''}
                                    ${formData.difficulty === 'medium' ? 'bg-canvas-2 text-[#3a342c]' : ''}
                                    ${formData.difficulty === 'hard' ? 'bg-ink text-white' : ''}
                                    ${formData.difficulty === 'exam' ? 'bg-accent text-white' : ''}
                                `}>
                                            {formData.difficulty === 'exam' ? 'Exam Mode' : formData.difficulty}
                                        </span>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                        <input
                                            type="range"
                                            min="0" max="3" step="1"
                                            className="w-full h-1.5 bg-canvas-2 rounded-full appearance-none cursor-pointer accent-ink"
                                            value={['easy', 'medium', 'hard', 'exam'].indexOf(formData.difficulty)}
                                            onChange={(e) => handleChange('difficulty', ['easy', 'medium', 'hard', 'exam'][e.target.value])}
                                        />
                                        <div className="absolute top-0 left-0 w-full flex justify-between pointer-events-none px-1">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full mt-2.5 ${i <= ['easy', 'medium', 'hard', 'exam'].indexOf(formData.difficulty) ? 'bg-ink' : 'bg-line-2'} `} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.mode === 'flashcard' && (
                                <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start p-6 bg-canvas rounded-[16px] border border-line animate-in zoom-in-95 duration-500">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-[#8a8175] uppercase tracking-widest font-display">จำนวนแฟลชการ์ด</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min={1}
                                                max={50}
                                                className="w-24 p-4 bg-paper border border-line rounded-[12px] text-2xl font-extrabold text-ink font-display focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all"
                                                value={formData.questionCount}
                                                onChange={(e) => handleChange('questionCount', e.target.value)}
                                                aria-label="จำนวนแฟลชการ์ด"
                                            />
                                            <span className="font-bold text-[#8a8175] font-display">CARDS</span>
                                            <span className="text-[9px] font-bold text-[#b3aa97]">(1-50)</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#8a8175] uppercase tracking-widest mb-3 font-display">รูปแบบด้านหลังการ์ด</label>
                                        <div className="grid grid-cols-3 gap-2 p-1.5 bg-paper rounded-[12px] border border-line">
                                            {[
                                                { id: 'concise', label: 'สั้น', desc: 'ไม่เกิน 20 คำ' },
                                                { id: 'balanced', label: 'สมดุล', desc: 'ประมาณ 30 คำ' },
                                                { id: 'stepwise', label: 'ละเอียด', desc: 'ประมาณ 40 คำ' },
                                            ].map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleChange('flashcardAnswerStyle', option.id)}
                                                    className={`rounded-[10px] px-3 py-3 text-left transition-all ${formData.flashcardAnswerStyle === option.id ? 'bg-ink text-white' : 'text-[#6b6357] hover:bg-canvas hover:text-ink'}`}
                                                >
                                                    <div className="text-xs font-extrabold">{option.label}</div>
                                                    <div className={`mt-1 text-[9px] font-bold ${formData.flashcardAnswerStyle === option.id ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>{option.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SVG Image Type Selector (only for svg_question mode) */}
                            {formData.mode === 'svg_question' && (
                                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-[11px] font-bold text-[#8a8175] mb-4 uppercase tracking-widest pl-1 font-display">
                                        ประเภทรูปภาพ (SVG Image Type)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'geometry', label: 'เรขาคณิต', desc: 'สามเหลี่ยม สี่เหลี่ยม วงกลม' },
                                            { id: 'graph', label: 'กราฟ', desc: 'เส้นตรง พาราโบลา พิกัด' },
                                            { id: 'number_line', label: 'เส้นจำนวน', desc: 'Number Line' },
                                            { id: 'diagram', label: 'แผนภาพ', desc: 'Venn, Tree Diagram' },
                                            { id: 'mixed', label: 'ผสม', desc: 'เลือกอัตโนมัติตามโจทย์' },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleChange('svgImageType', t.id)}
                                                className={`p-3.5 rounded-[12px] border text-left transition-all
                                            ${formData.svgImageType === t.id
                                                        ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                        : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                    } `}
                                            >
                                                <div className={`font-extrabold text-[11px] ${formData.svgImageType === t.id ? 'text-ink' : 'text-[#3a342c]'}`}>{t.label}</div>
                                                <div className="text-[9px] font-bold text-[#8a8175] leading-tight mt-0.5">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Components Chip Set */}
                            <div className="mb-10">
                                <label className="block text-[11px] font-bold text-[#8a8175] mb-4 uppercase tracking-widest pl-1 font-display">
                                    เลือกออปชันเสริม
                                    {allowedComponents.length === 0 && (
                                        <span className="ml-2 text-[#b3aa97] font-medium normal-case">(ไม่มีออปชันสำหรับโหมดนี้)</span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {/* Item 9: Only show options allowed for current mode */}
                                    {[
                                        { id: 'dummyChoice', label: 'ช้อยส์หลอกดักทาง' },
                                        { id: 'realWorldApp', label: 'ประยุกต์ใช้จริง' },
                                        { id: 'addHint', label: 'เพิ่มคำใบ้' },
                                        { id: 'crossChapter', label: 'ผสมข้ามบท' },
                                        { id: 'mistake', label: 'จุดที่มักผิด' },
                                        { id: 'bulletPoints', label: 'สรุปเป็นข้อๆ' },
                                        { id: 'comparisonTable', label: 'ตารางเปรียบเทียบ' },
                                        { id: 'stepByStep', label: 'ทีละขั้นตอน' },
                                    ].filter(comp => allowedComponents.includes(comp.id)).map(comp => (
                                        <button
                                            key={comp.id}
                                            onClick={() => handleComponentChange(comp.id)}
                                            aria-label={`เปิด/ปิดออปชัน ${comp.label}`}
                                            aria-pressed={formData.components[comp.id]}
                                            className={`px-4 py-2.5 rounded-[10px] border font-bold text-xs transition-all flex items-center gap-2.5 active:scale-95
                                        ${formData.components[comp.id]
                                                    ? `border-ink bg-ink text-white`
                                                    : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                } `}
                                        >
                                            <Check size={14} strokeWidth={4} className={`transition-all duration-300 ${formData.components[comp.id] ? 'scale-100 opacity-100' : 'scale-0 opacity-0 w-0'} `} />
                                            {comp.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantities for Practice/Exam/SVG Question/Transcribe */}
                            {['practice', 'exam', 'web_quiz', 'gifted_quiz', 'svg_question'].includes(formData.mode) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end p-6 bg-canvas rounded-[16px] border border-line animate-in zoom-in-95 duration-500">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-[#8a8175] uppercase tracking-widest font-display">จำนวนข้อสอบ</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min={1}
                                                max={50}
                                                className="w-24 p-4 bg-paper border border-line rounded-[12px] text-2xl font-extrabold text-ink font-display focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all"
                                                value={formData.questionCount}
                                                onChange={(e) => handleChange('questionCount', e.target.value)}
                                                aria-label="จำนวนข้อสอบ"
                                            />
                                            <span className="font-bold text-[#8a8175] font-display">ITEMS</span>
                                            <span className="text-[9px] font-bold text-[#b3aa97]">(1-50)</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-1.5 bg-paper rounded-[12px] border border-line">
                                        <button
                                            onClick={() => handleChange('questionType', 'objective')}
                                            className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-xs transition-all ${formData.questionType === 'objective' ? 'bg-ink text-white' : 'text-[#6b6357] hover:text-ink'} `}
                                        >
                                            <div>ปรนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'objective' ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>ตัวเลือก 4 ข้อ</div>
                                        </button>
                                        <button
                                            onClick={() => handleChange('questionType', 'subjective')}
                                            className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-xs transition-all ${formData.questionType === 'subjective' ? 'bg-ink text-white' : 'text-[#6b6357] hover:text-ink'} `}
                                        >
                                            <div>อัตนัย</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'subjective' ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>แสดงวิธีทำ</div>
                                        </button>
                                        <button
                                            onClick={() => handleChange('questionType', 'word_problem')}
                                            className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-xs transition-all ${formData.questionType === 'word_problem' ? 'bg-ink text-white' : 'text-[#6b6357] hover:text-ink'} `}
                                        >
                                            <div>โจทย์ปัญหา</div>
                                            <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'word_problem' ? 'text-[#a39a8c]' : 'text-[#b3aa97]'}`}>เน้นวิเคราะห์</div>
                                        </button>
                                    </div>
                                    {formData.questionType === 'word_problem' && (
                                        <div className="md:col-span-2 flex gap-3 p-3 bg-paper rounded-[12px] border border-line animate-in slide-in-from-top-2">
                                            <span className="text-[10px] font-bold text-[#8a8175] uppercase tracking-widest self-center px-2 font-display">รูปแบบโจทย์ปัญหา:</span>
                                            <button
                                                onClick={() => handleChange('wordProblemType', 'objective')}
                                                className={`flex-1 py-2 px-3 rounded-[8px] font-bold text-xs transition-all ${formData.wordProblemType === 'objective' ? 'bg-accent text-white' : 'bg-canvas text-[#6b6357] hover:text-ink'} `}
                                            >
                                                ปรนัย (มีตัวเลือก)
                                            </button>
                                            <button
                                                onClick={() => handleChange('wordProblemType', 'subjective')}
                                                className={`flex-1 py-2 px-3 rounded-[8px] font-bold text-xs transition-all ${formData.wordProblemType === 'subjective' ? 'bg-accent text-white' : 'bg-canvas text-[#6b6357] hover:text-ink'} `}
                                            >
                                                อัตนัย (แสดงวิธีทำ)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Complexity Toggle - Hidden for Summary */}
                            {!['summary', 'flashcard'].includes(formData.mode) && (() => {
                                const isQMode = ['practice', 'exam', 'web_quiz', 'gifted_quiz', 'svg_question', 'mistake'].includes(formData.mode);
                                const options = isQMode
                                    ? [
                                        { id: 'short', label: 'สั้น (Short)', desc: 'แสดงวิธีทำสั้นๆ 2-3 บรรทัด ตรงประเด็น' },
                                        { id: 'medium', label: 'กลาง (Medium)', desc: 'แสดงวิธีทำเป็นขั้นตอน พร้อมอธิบายเหตุผลสำคัญ' },
                                        { id: 'detailed', label: 'ละเอียด (Detailed)', desc: 'เฉลยละเอียดทุกขั้นตอน มีหลักการคิด จุดที่ควรระวัง และอธิบายทุกบรรทัด' },
                                    ]
                                    : [
                                        { id: 'long', label: 'Standard Depth', desc: 'ครอบคลุมทุกจุดสำคัญ (PDF 1-3 หน้า)' },
                                        { id: 'very_long', label: 'Ultimate Master', desc: 'เจาะลึกทุกรายละเอียด (PDF 4+ หน้า)' },
                                    ];
                                return (
                                    <div className="mt-8">
                                        <label className="block text-[11px] font-bold text-[#8a8175] mb-3 uppercase tracking-widest pl-1 font-display">
                                            {isQMode ? 'ระดับความละเอียดของเฉลย' : 'ระดับความลึกของเนื้อหา'}
                                        </label>
                                        <div className={`grid gap-3 ${isQMode ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                            {options.map(len => (
                                                <button
                                                    key={len.id}
                                                    onClick={() => handleChange('contentLength', len.id)}
                                                    className={`p-5 rounded-[12px] border text-left transition-all h-full
                                                        ${formData.contentLength === len.id
                                                            ? 'border-ink bg-canvas ring-2 ring-ink/10'
                                                            : 'border-line bg-canvas text-[#6b6357] hover:border-ink/30'
                                                        } `}
                                                >
                                                    <div className={`font-extrabold text-xs mb-1 uppercase tracking-tight ${formData.contentLength === len.id ? 'text-ink' : 'text-[#3a342c]'}`}>{len.label}</div>
                                                    <div className="text-[10px] font-bold text-[#8a8175] leading-tight">{len.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
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
