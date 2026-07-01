import React, { useEffect, useRef } from 'react';
import { X, GalleryThumbnails } from 'lucide-react';

// Strip Markdown/HTML syntax down to plain readable text — no remark/rehype/
// KaTeX pipeline, so 30 pages of equations don't get re-parsed just to draw
// thumbnails. Cheap regex pass; good enough to recognise a page by its words.
const toPlainText = (raw, isHtml) => {
    if (!raw) return '';
    let text = raw;
    if (isHtml) {
        text = text.replace(/<\/(p|h1|h2|h3|li|div|br)>/gi, '\n').replace(/<[^>]+>/g, ' ');
    } else {
        text = text
            .replace(/\$\$[\s\S]*?\$\$/g, ' [สมการ] ')
            .replace(/\$[^$\n]*\$/g, ' ')
            .replace(/:::\s*\w+/g, '')
            .replace(/^#{1,6}\s*/gm, '')
            .replace(/^>\s?/gm, '')
            .replace(/^[-*+]\s+/gm, '')
            .replace(/^\d+[.)]\s+/gm, '')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, ' [รูป] ')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/[*_`~]/g, '');
    }
    return text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

// Real (if tiny) text preview per item — plain strings, no Markdown/KaTeX
// rendering or image decoding, so the rail stays fast even on a 50+ page doc,
// while still showing the teacher actual words instead of abstract shapes.
const MiniItem = ({ item }) => {
    if (item.type === 'question') {
        const text = toPlainText(item.question);
        return (
            <div className="flex items-start gap-1 mb-[6px]">
                <div className="w-[10px] h-[10px] rounded-full bg-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center text-[5px] font-bold text-slate-500 leading-none">•</div>
                <p className="flex-1 text-[6px] leading-[1.35] text-slate-600 line-clamp-3 break-words">{text || 'โจทย์'}</p>
            </div>
        );
    }
    if (item.type === 'divider') {
        return <div className="h-[1px] bg-slate-300 my-[6px]" />;
    }
    if (item.type === 'image') {
        return item.src ? (
            <img src={item.src} alt="" loading="lazy" className="max-h-[34px] w-auto max-w-full rounded-sm border border-slate-200 mb-[6px] object-contain" />
        ) : (
            <div className="h-[20px] w-[55%] rounded-sm bg-slate-100 border border-dashed border-slate-300 mb-[6px]" />
        );
    }
    if (item.type === 'columns') {
        return (
            <div className="flex gap-[6px] mb-[6px]">
                <p className="flex-1 text-[6px] leading-[1.3] text-slate-600 line-clamp-3 break-words">{toPlainText(item.left) || '—'}</p>
                <p className="flex-1 text-[6px] leading-[1.3] text-slate-600 line-clamp-3 break-words">{toPlainText(item.right) || '—'}</p>
            </div>
        );
    }
    if (item.type === 'spacer') {
        return <div className="h-[12px] w-full rounded-sm border border-dashed border-slate-300 mb-[6px]" />;
    }
    // text / markdown — the actual page content, just shrunk way down.
    const isHeading = item.size === 'xl' || item.size === 'large';
    const text = toPlainText(item.content, item.type === 'text');
    if (!text) return null;
    return (
        <p
            className={`mb-[6px] break-words ${isHeading ? 'text-[8px] font-bold text-slate-700 line-clamp-2' : 'text-[6px] text-slate-500 line-clamp-4'}`}
            style={{ lineHeight: 1.35 }}
        >
            {text}
        </p>
    );
};

/**
 * Left-docked slide-over: a scrollable rail of every page as a small A4-shaped
 * card (abstract block preview, not a pixel-accurate render — keeps it cheap),
 * with the current page highlighted and click-to-jump.
 */
const PageThumbnailPanel = ({ open, onClose, pages, currentPageId, onJumpToPage }) => {
    const activeRef = useRef(null);

    // Keep the highlighted thumbnail in view as the user scrolls the document —
    // otherwise on a long doc the rail's active card can drift off-screen.
    useEffect(() => {
        if (open) activeRef.current?.scrollIntoView({ block: 'nearest' });
    }, [open, currentPageId]);

    return (
        <div
            className={`fixed top-0 left-[72px] h-full w-[230px] max-w-[80vw] z-[60] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 print:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
            role="dialog"
            aria-label="ภาพรวมหน้าเอกสาร"
            aria-hidden={!open}
        >
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <GalleryThumbnails size={18} className="text-teal-600" />
                    <span className="font-bold">ภาพรวมหน้า</span>
                    <span className="text-xs font-medium text-gray-400">{pages.length} หน้า</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    aria-label="ปิดแผงภาพรวมหน้า"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {pages.map((page, idx) => {
                    const active = page.id === currentPageId;
                    return (
                        <button
                            key={page.id}
                            ref={active ? activeRef : undefined}
                            onClick={() => onJumpToPage(page.id)}
                            className="w-full text-left group"
                            aria-current={active ? 'page' : undefined}
                        >
                            <div className={`w-full aspect-[210/297] bg-white rounded-md border-2 p-2 overflow-hidden transition-colors ${active ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                {(page.questions || []).slice(0, 14).map(item => <MiniItem key={item.id} item={item} />)}
                            </div>
                            <div className={`mt-1 text-center text-[11px] font-semibold ${active ? 'text-teal-600' : 'text-gray-400'}`}>
                                หน้า {idx + 1}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PageThumbnailPanel;
