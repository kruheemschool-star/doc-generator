import React, { useState, useMemo } from 'react';
import { X, Layers, FileText, FilePlus, Search, Sparkles } from 'lucide-react';
import { TEMPLATE_CATEGORIES, PALETTE } from '../data/pageTemplates';
import { useModalA11y } from '../hooks/useModalA11y';

const CATEGORY_META = {
    section: { Icon: Layers, color: PALETTE.green },
    page: { Icon: FileText, color: PALETTE.gold },
    document: { Icon: FilePlus, color: PALETTE.warn },
};

// Section templates carry a `group` field so this long list (30+ items) reads
// as a few clear clusters instead of one flat scroll — order here is display
// order. Page/Document templates don't set `group`, so they render as one
// flat list (small enough — 6 and 3 items — not to need it).
const GROUP_META = {
    classic: { label: 'กล่องเนื้อหาคลาสสิก', hint: 'เส้นขอบ + พื้นสีอ่อน' },
    'lesson-card': { label: 'การ์ดบันทึกการสอน', hint: 'แถบหัวข้อสีทึบ + ตัวอักษรขาว' },
    structure: { label: 'โครงสร้าง & ป้ายกำกับ', hint: 'แบ่งหมวด, เปรียบเทียบ, ป้ายเล็กๆ' },
};

const TemplatePicker = ({ isOpen, onClose, onInsertSection, onInsertPage, onInsertDocument }) => {
    const [activeCategory, setActiveCategory] = useState('section');
    const [searchQuery, setSearchQuery] = useState('');
    const modalRef = useModalA11y(isOpen, onClose);

    const activeCategoryObj = useMemo(
        () => TEMPLATE_CATEGORIES.find(c => c.id === activeCategory) || TEMPLATE_CATEGORIES[0],
        [activeCategory]
    );

    const filteredTemplates = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return activeCategoryObj.templates;
        return activeCategoryObj.templates.filter(t =>
            t.templateName.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }, [activeCategoryObj, searchQuery]);

    // Bucket into GROUP_META's display order; anything without a recognised
    // `group` (Page/Document templates, or a future section template someone
    // forgets to tag) falls into one untitled bucket at the end.
    const groupedTemplates = useMemo(() => {
        const buckets = new Map();
        for (const t of filteredTemplates) {
            const key = t.group && GROUP_META[t.group] ? t.group : '_ungrouped';
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push(t);
        }
        const orderedKeys = [...Object.keys(GROUP_META), '_ungrouped'];
        return orderedKeys
            .filter(key => buckets.has(key))
            .map(key => ({ key, meta: GROUP_META[key], templates: buckets.get(key) }));
    }, [filteredTemplates]);

    if (!isOpen) return null;

    const handlePick = (template) => {
        if (template.category === 'section') {
            onInsertSection?.(template);
        } else if (template.category === 'page') {
            onInsertPage?.(template);
        } else if (template.category === 'document') {
            onInsertDocument?.(template);
        }
        onClose?.();
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="template-picker-title"
                tabIndex={-1}
                className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[88vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200"
            >
                {/* Header */}
                <div className="px-8 pt-7 pb-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 id="template-picker-title" className="text-xl font-bold text-gray-900 dark:text-slate-100 font-outfit flex items-center gap-2.5">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${PALETTE.green}, ${PALETTE.greenDeep})`,
                                        boxShadow: `0 8px 20px ${PALETTE.green}33`,
                                    }}
                                >
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                เทมเพลตหน้า (Page Templates)
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 ml-[46px]">
                                เลือกเทมเพลตที่ออกแบบให้พิมพ์/ถ่ายเอกสารชัดเจน — พื้นอ่อน ตัวเข้ม
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-300 dark:text-slate-600 hover:text-gray-500 transition-colors"
                            aria-label="ปิด"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="px-8 pt-5">
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                        {TEMPLATE_CATEGORIES.map(cat => {
                            const meta = CATEGORY_META[cat.id];
                            const Icon = meta?.Icon || Layers;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-slate-800 text-white shadow-lg'
                                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                                        {cat.label}
                                    </div>
                                    <span className={`text-[9px] font-medium ${isActive ? 'text-white/70' : 'text-gray-400 dark:text-slate-500'}`}>
                                        {cat.subtitle}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="px-8 pt-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600" />
                        <input
                            type="text"
                            placeholder="ค้นหาเทมเพลต..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Template Grid — grouped when templates carry a `group` (Section tab); Page/Document render as one flat block via the "_ungrouped" bucket */}
                <div className="px-8 py-5 flex-1 overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm font-medium">
                            ไม่พบเทมเพลตที่ตรงกับคำค้น
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedTemplates.map(({ key, meta, templates }) => (
                                <div key={key}>
                                    {meta && (
                                        <div className="flex items-baseline gap-2 mb-2.5 px-0.5">
                                            <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                                                {meta.label}
                                            </h5>
                                            <span className="text-[11px] text-gray-300 dark:text-slate-600">· {meta.hint}</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {templates.map(template => (
                                            <TemplateCard
                                                key={template.id}
                                                template={template}
                                                onClick={() => handlePick(template)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                        {activeCategory === 'section' && '📌 แทรกต่อจากตำแหน่งที่เลือก (หรือท้ายเอกสาร)'}
                        {activeCategory === 'page' && '📄 เพิ่มเป็นหน้าใหม่ต่อท้ายเอกสาร'}
                        {activeCategory === 'document' && '⚠️ จะสร้างหลายหน้า แทนที่หน้าว่างปัจจุบัน'}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-gray-500 dark:text-slate-400 font-bold hover:bg-gray-200 transition-all text-xs"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};

const TemplateCard = ({ template, onClick }) => {
    const itemCount = template.items?.length ?? template.pages?.length ?? 0;
    const isDoc = template.category === 'document';

    return (
        <button
            onClick={onClick}
            className="text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-green-300 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white dark:bg-slate-900 group"
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: PALETTE.paper2 }}
                >
                    {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100 group-hover:text-green-700 transition-colors truncate">
                            {template.templateName}
                        </h4>
                    </div>
                    {template.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {template.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: PALETTE.greenTint,
                                color: PALETTE.greenDeep,
                            }}
                        >
                            {isDoc ? `${itemCount} หน้า` : `${itemCount} item`}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default TemplatePicker;
