import React, { useState, useRef, useEffect } from 'react';
import { Type, Check, ChevronDown } from 'lucide-react';
import { DOCUMENT_FONTS, FONT_CATEGORIES, getFontById } from '../data/documentFonts';

const PREVIEW_TEXT = 'การบ้านคณิตศาสตร์ 1234';

const FontPicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const currentFont = getFontById(value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (fontId) => {
        onChange?.(fontId);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-600 dark:text-slate-400 hover:text-gray-900 transition-all"
                title={`ฟอนต์: ${currentFont.name}`}
            >
                <Type size={18} />
                <span
                    className="text-xs font-bold max-w-[80px] truncate hidden sm:inline"
                    style={{ fontFamily: currentFont.stack }}
                >
                    {currentFont.displayName}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-[340px] max-h-[420px] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 custom-scrollbar z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-3 z-10">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Type size={14} className="text-green-600" />
                            เลือกฟอนต์เอกสาร
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">ฟอนต์ยอดนิยมสำหรับเอกสารการเรียน</p>
                    </div>

                    {FONT_CATEGORIES.map(cat => {
                        const fonts = DOCUMENT_FONTS.filter(f => f.category === cat.id);
                        if (fonts.length === 0) return null;
                        return (
                            <div key={cat.id} className="py-2">
                                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center justify-between">
                                    <span>{cat.label}</span>
                                    <span className="text-[9px] font-medium text-gray-300 dark:text-slate-600 normal-case tracking-normal">{cat.subtitle}</span>
                                </div>
                                {fonts.map(font => {
                                    const isActive = font.id === value;
                                    return (
                                        <button
                                            key={font.id}
                                            onClick={() => handleSelect(font.id)}
                                            className={`w-full px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-green-50/50' : ''}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate"
                                                        style={{ fontFamily: font.stack }}
                                                    >
                                                        {font.name}
                                                    </span>
                                                    {font.recommended && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                            แนะนำ
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className="text-sm text-gray-600 dark:text-slate-400 mt-0.5 leading-tight truncate"
                                                    style={{ fontFamily: font.stack }}
                                                >
                                                    {PREVIEW_TEXT}
                                                </p>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 leading-tight">
                                                    {font.description}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <Check size={16} className="text-green-600 flex-shrink-0 mt-1" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FontPicker;
