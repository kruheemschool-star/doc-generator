import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Type, Palette, FileText } from 'lucide-react';
import { DOCUMENT_FONTS, FONT_CATEGORIES } from '../data/documentFonts';
import { DEFAULT_DOC_THEME } from '../data/docThemes';

/**
 * Tweaks panel — live, per-document design controls (colors, fonts, paper grid).
 * Edits flow straight into the document `theme` object; the sheet repaints via
 * CSS variables (see src/data/docThemes.js). Non-modal drawer so the document
 * stays visible while adjusting. Hidden on print.
 */

const FieldLabel = ({ children }) => (
    <label className="text-xs font-medium text-gray-600 dark:text-slate-300">{children}</label>
);

const ColorRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between gap-3 py-1.5">
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500 uppercase">{value}</span>
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-700 bg-transparent cursor-pointer p-0.5"
                aria-label={label}
            />
        </div>
    </div>
);

const FontSelect = ({ label, value, onChange }) => (
    <div className="flex flex-col gap-1 py-1.5">
        <FieldLabel>{label}</FieldLabel>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
        >
            {FONT_CATEGORIES.map(cat => (
                <optgroup key={cat.id} label={cat.label}>
                    {DOCUMENT_FONTS.filter(f => f.category === cat.id).map(f => (
                        <option key={f.id} value={f.id}>{f.displayName} ({f.name})</option>
                    ))}
                </optgroup>
            ))}
        </select>
    </div>
);

const Section = ({ icon, title, children }) => (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1.5 text-gray-800 dark:text-slate-100">
            {icon}
            <h3 className="text-sm font-bold">{title}</h3>
        </div>
        {children}
    </div>
);

const TweaksPanel = ({ open, onClose, theme, onChange, fontId, onFontIdChange }) => {
    const set = (key, val) => onChange({ ...theme, [key]: val });

    const handleReset = () => {
        onChange({ ...DEFAULT_DOC_THEME });
    };

    return (
        <div
            className={`fixed top-0 right-0 h-full w-[320px] max-w-[88vw] z-[60] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 print:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}
            role="dialog"
            aria-label="ปรับดีไซน์เอกสาร"
            aria-hidden={!open}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <SlidersHorizontal size={18} className="text-teal-600" />
                    <span className="font-bold">ปรับดีไซน์</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    aria-label="ปิดแผงปรับดีไซน์"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Section icon={<Type size={15} className="text-amber-500" />} title="ตัวอักษร">
                    <FontSelect label="ฟอนต์หัวข้อ" value={theme.headFontId} onChange={v => set('headFontId', v)} />
                    <FontSelect label="ฟอนต์เนื้อหา" value={fontId} onChange={onFontIdChange} />
                </Section>

                <Section icon={<Palette size={15} className="text-rose-500" />} title="สี">
                    <ColorRow label="สีหลัก / แบรนด์" value={theme.accent} onChange={v => set('accent', v)} />
                    <ColorRow label="สีหัวข้อ" value={theme.heading} onChange={v => set('heading', v)} />
                    <ColorRow label="สีหัวข้อรอง" value={theme.subhead} onChange={v => set('subhead', v)} />
                    <ColorRow label="สีไฮไลต์" value={theme.highlight} onChange={v => set('highlight', v)} />
                </Section>

                <Section icon={<FileText size={15} className="text-teal-600" />} title="กระดาษ">
                    <ColorRow label="สีพื้นกระดาษ" value={theme.paper} onChange={v => set('paper', v)} />
                    <div className="flex items-center justify-between gap-3 py-1.5">
                        <FieldLabel>ลายตาราง</FieldLabel>
                        <button
                            onClick={() => set('gridOn', !theme.gridOn)}
                            role="switch"
                            aria-checked={theme.gridOn}
                            aria-label="เปิด/ปิดลายตาราง"
                            className={`relative w-10 h-5 rounded-full transition-colors ${theme.gridOn ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-700'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${theme.gridOn ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                    <div className={`flex flex-col gap-1 py-1.5 transition-opacity ${theme.gridOn ? '' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center justify-between">
                            <FieldLabel>ความเข้มเส้น</FieldLabel>
                            <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500">{Math.round(theme.gridAlpha * 100)}%</span>
                        </div>
                        <input
                            type="range" min="0" max="0.2" step="0.01"
                            value={theme.gridAlpha}
                            onChange={e => set('gridAlpha', parseFloat(e.target.value))}
                            className="w-full accent-teal-600"
                            aria-label="ความเข้มเส้นตาราง"
                        />
                    </div>
                    <div className={`flex flex-col gap-1 py-1.5 transition-opacity ${theme.gridOn ? '' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center justify-between">
                            <FieldLabel>ขนาดช่อง</FieldLabel>
                            <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500">{theme.gridSize}px</span>
                        </div>
                        <input
                            type="range" min="16" max="44" step="2"
                            value={theme.gridSize}
                            onChange={e => set('gridSize', parseInt(e.target.value, 10))}
                            className="w-full accent-teal-600"
                            aria-label="ขนาดช่องตาราง"
                        />
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-slate-800">
                <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                >
                    <RotateCcw size={15} /> คืนค่าเริ่มต้น
                </button>
            </div>
        </div>
    );
};

export default TweaksPanel;
