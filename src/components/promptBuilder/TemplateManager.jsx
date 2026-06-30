import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, FileText, Loader2, Plus, Download } from 'lucide-react';
import { savePromptTemplate, loadPromptTemplates, deletePromptTemplate } from '../../firebase';
import { useModalA11y } from '../../hooks/useModalA11y';

/**
 * TemplateManager — Modal for managing saved prompt presets (Item 5)
 */
const TemplateManager = ({ isOpen, onClose, currentFormData, onLoadTemplate, addToast }) => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [showSaveForm, setShowSaveForm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        setIsLoading(true);
        const loaded = await loadPromptTemplates();
        setTemplates(loaded.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!templateName.trim()) return;
        setIsSaving(true);
        try {
            const template = {
                id: `tmpl_${Date.now()}`,
                name: templateName.trim(),
                formData: currentFormData,
                createdAt: new Date().toISOString(),
            };
            await savePromptTemplate(template);
            addToast(`บันทึก "${templateName}" เรียบร้อย`, 'success');
            setTemplateName('');
            setShowSaveForm(false);
            await loadTemplates();
        } catch (error) {
            addToast('บันทึก Template ไม่สำเร็จ', 'error');
        }
        setIsSaving(false);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`ลบ "${name}"?`)) return;
        try {
            await deletePromptTemplate(id);
            addToast(`ลบ "${name}" แล้ว`, 'success');
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            addToast('ลบ Template ไม่สำเร็จ', 'error');
        }
    };

    const handleLoad = (template) => {
        onLoadTemplate(template.formData);
        addToast(`โหลด "${template.name}" แล้ว`, 'success');
        onClose();
    };

    const getModeLabel = (mode) => {
        const labels = {
            content: 'บทเรียน', practice: 'แบบฝึกหัด', exam: 'ข้อสอบ',
            flashcard: 'แฟลชการ์ด', web_quiz: 'แนวข้อสอบเว็บ', gifted_quiz: 'Gifted เว็บ',
            svg_question: 'โจทย์+รูป', math_figure: 'สร้างรูป', figure_from_text: 'รูปจากโจทย์',
            transcribe: 'พิมพ์ตาม', summary: 'สรุปสูตร', mistake: 'วิเคราะห์'
        };
        return labels[mode] || mode;
    };

    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 font-thai" onClick={onClose}>
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label="จัดการ Template"
                tabIndex={-1}
                className="bg-paper border border-line rounded-2xl shadow-[0_24px_60px_-20px_rgba(20,18,15,0.45)] w-full max-w-lg max-h-[80vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-line">
                    <div>
                        <h2 className="text-lg font-bold text-ink tracking-tight">Prompt Templates</h2>
                        <p className="text-xs text-[#8a8175] font-medium mt-1">บันทึกและเรียกใช้ค่าที่ตั้งไว้</p>
                    </div>
                    <button onClick={onClose} className="p-2 border border-line rounded-[10px] text-[#6b6357] hover:bg-paper-2 hover:text-ink transition-colors" aria-label="ปิด">
                        <X size={18} />
                    </button>
                </div>

                {/* Save new template */}
                <div className="p-4 border-b border-line bg-canvas">
                    {showSaveForm ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ชื่อ Template เช่น 'ข้อสอบ ม.1 เลขยกกำลัง'"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                maxLength={60}
                                className="flex-1 px-4 py-2.5 rounded-[10px] bg-paper border border-line text-sm font-semibold text-[#3a342c] placeholder:text-[#b3aa97] focus:ring-2 focus:ring-accent/15 focus:border-accent outline-none transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                aria-label="ชื่อ Template"
                            />
                            <button
                                onClick={handleSave}
                                disabled={!templateName.trim() || isSaving}
                                className="px-4 py-2.5 bg-accent text-white rounded-[10px] text-xs font-bold hover:bg-accent-press disabled:opacity-50 transition-all flex items-center gap-1.5"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                บันทึก
                            </button>
                            <button
                                onClick={() => { setShowSaveForm(false); setTemplateName(''); }}
                                className="px-3 py-2.5 text-[#6b6357] hover:text-ink rounded-[10px] text-xs font-bold hover:bg-paper-2 transition-all"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSaveForm(true)}
                            className="w-full py-3 border border-dashed border-line-2 rounded-[10px] text-xs font-bold text-[#6b6357] hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> บันทึกค่าปัจจุบันเป็น Template
                        </button>
                    )}
                </div>

                {/* Template list */}
                <div className="overflow-y-auto max-h-[45vh] p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="text-accent animate-spin" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12 text-[#8a8175]">
                            <FileText size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-bold text-[#3a342c]">ยังไม่มี Template</p>
                            <p className="text-xs mt-1">กดปุ่มด้านบนเพื่อบันทึกค่าปัจจุบัน</p>
                        </div>
                    ) : (
                        templates.map(tmpl => (
                            <div
                                key={tmpl.id}
                                className="flex items-center gap-3 p-4 bg-paper border border-line rounded-[14px] hover:border-ink/30 hover:shadow-[0_4px_14px_-10px_rgba(40,44,80,0.4)] transition-all group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-ink truncate">{tmpl.name}</div>
                                    <div className="flex gap-2 mt-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 text-accent bg-accent/10 rounded-[5px] text-[10px] font-bold">
                                            {getModeLabel(tmpl.formData?.mode)}
                                        </span>
                                        <span className="px-2 py-0.5 bg-canvas-2 text-[#6b6357] rounded-[5px] text-[10px] font-bold">
                                            {tmpl.formData?.grade}
                                        </span>
                                        {tmpl.formData?.chapter && (
                                            <span className="px-2 py-0.5 bg-canvas-2 text-[#8a8175] rounded-[5px] text-[10px] font-medium truncate max-w-[150px]">
                                                {tmpl.formData.chapter}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleLoad(tmpl)}
                                        className="p-2.5 border border-line text-ink rounded-[10px] hover:bg-ink hover:text-white transition-colors"
                                        aria-label={`โหลด ${tmpl.name}`}
                                        title="โหลด Template"
                                    >
                                        <Download size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tmpl.id, tmpl.name)}
                                        className="p-2.5 border border-line text-[#c2483c] rounded-[10px] hover:bg-[#fae9e7] hover:border-[#c2483c]/40 transition-colors"
                                        aria-label={`ลบ ${tmpl.name}`}
                                        title="ลบ Template"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplateManager;
