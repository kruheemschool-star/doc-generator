import React, { useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import SvgRenderer from './SvgRenderer';
import { Eye, AlertCircle, FileQuestion, BookOpen, FileText } from 'lucide-react';
import { tryParseImportJSON, classifyImport, splitMarkdownByHeading } from '../utils/importParser';
import { hasSolution } from '../utils/solutionMarkers';

// AI sometimes prefixes options with ก./ข./ค./ง. — strip so numbering isn't doubled.
const stripOptionPrefix = (text) => (text ? text.replace(/^[ก-ง]\.\s*/, '').trim() : text);

const PreviewQuestion = ({ q, no }) => (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex gap-2.5">
            <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center">{no}</span>
            <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed">
                    <MarkdownRenderer content={q.question} />
                </div>

                {q.svg && (
                    <div className="my-3 flex justify-center">
                        <SvgRenderer svgString={q.svg} maxWidth={300} />
                    </div>
                )}

                {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {q.options.map((opt, idx) => {
                            const isCorrect = typeof q.correctIndex === 'number' && q.correctIndex === idx;
                            return (
                                <div key={idx}
                                    className={`flex items-start gap-2 text-sm rounded-lg px-2.5 py-1.5 border ${isCorrect
                                        ? 'border-green-300 bg-green-50/70 dark:bg-green-900/15'
                                        : 'border-transparent'}`}>
                                    <span className={`font-bold min-w-[18px] ${isCorrect ? 'text-green-700' : 'text-gray-500 dark:text-slate-400'}`}>{idx + 1}.</span>
                                    <div className="flex-1 min-w-0 text-gray-700 dark:text-slate-300">
                                        <MarkdownRenderer content={stripOptionPrefix(opt)} />
                                    </div>
                                    {isCorrect && <span className="text-[10px] font-bold text-green-600 shrink-0 mt-0.5">✓ เฉลย</span>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {q.solution && (
                    <div className="mt-3 rounded-lg border px-3 py-2 text-sm text-gray-700 dark:text-slate-300" style={{ backgroundColor: '#eaf0dd80', borderColor: '#3d5a2c33' }}>
                        <MarkdownRenderer content={q.solution} plainBlockquote />
                    </div>
                )}

                {q.options && q.options.length > 0 && typeof q.correctIndex !== 'number' && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <AlertCircle size={13} />
                        ไม่มีตัวเลือกไหนถูกระบุว่าใช่คำตอบ (correctIndex หายไปหรือชี้เกินจำนวนตัวเลือก) — ตรวจสอบก่อนนำเข้า
                    </div>
                )}
            </div>
        </div>
    </div>
);

// Banner shown for the kruheemmath.com export (carries a `meta` block).
const MetaBanner = ({ meta, count, label = 'ชุดข้อสอบ' }) => {
    const chips = [meta.level, meta.difficulty, meta.category, meta.timeLimit ? `${meta.timeLimit} นาที` : null]
        .filter(Boolean);
    return (
        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/15 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-1">
                <FileQuestion size={13} /> {label} • {count} ข้อ
            </div>
            {meta.title && <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{meta.title}</p>}
            {meta.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{meta.description}</p>}
            {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {chips.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-[11px] font-medium text-gray-600 dark:text-slate-300">{c}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

const Placeholder = ({ icon: Icon, title, sub }) => (
    <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-300 dark:text-slate-600 select-none px-6">
        <Icon size={40} strokeWidth={1.5} />
        <div>
            <p className="text-sm font-bold text-gray-400 dark:text-slate-500">{title}</p>
            {sub && <p className="text-xs mt-1 text-gray-300 dark:text-slate-600">{sub}</p>}
        </div>
    </div>
);

const ImportPreview = ({ text }) => {
    const result = useMemo(() => {
        if (!text || !text.trim()) return { state: 'empty' };
        const parsedRes = tryParseImportJSON(text);
        // Not JSON → treat the paste as Markdown and split it into section boxes,
        // mirroring exactly what handleImport() will create on "นำเข้า".
        if (!parsedRes.ok) return { state: 'ok', kind: 'markdown', blocks: splitMarkdownByHeading(text) };
        return { state: 'ok', ...classifyImport(parsedRes.parsed) };
    }, [text]);

    if (result.state === 'empty') {
        return <Placeholder icon={Eye} title="ตัวอย่างจะแสดงที่นี่" sub="วาง JSON หรือข้อความด้านซ้าย แล้วดูผลลัพธ์ก่อนนำเข้า" />;
    }

    if (result.state === 'error') {
        return <Placeholder icon={AlertCircle} title="ยังแปลงเป็นตัวอย่างไม่ได้" sub="ตรวจรูปแบบ JSON อีกครั้ง (ระบบจะลองนำเข้าเป็นข้อความดิบให้ตอนกดนำเข้า)" />;
    }

    if (result.kind === 'questions') {
        if (result.questions.length === 0) {
            return <Placeholder icon={FileQuestion} title="ไม่พบโจทย์ในข้อมูลที่วาง" />;
        }
        return (
            <div className="space-y-3">
                {result.meta && <MetaBanner meta={result.meta} count={result.questions.length} />}
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <FileQuestion size={14} /> ตัวอย่าง {result.questions.length} ข้อ
                </div>
                {result.questions.map((q, i) => <PreviewQuestion key={i} q={q} no={i + 1} />)}
            </div>
        );
    }

    if (result.kind === 'answers') {
        if (result.blocks.length === 0) {
            return <Placeholder icon={FileQuestion} title="ไม่พบเฉลยในข้อมูลที่วาง" />;
        }
        return (
            <div className="space-y-3">
                {result.meta && <MetaBanner meta={result.meta} count={result.blocks.length} label="ชุดเฉลย" />}
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <FileText size={14} /> ตัวอย่างเฉลย {result.blocks.length} ข้อ
                </div>
                {result.blocks.map((content, i) => (
                    <div key={i} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-sm text-gray-800 dark:text-slate-200 leading-relaxed">
                        <MarkdownRenderer content={content} />
                    </div>
                ))}
            </div>
        );
    }

    if (result.kind === 'lesson') {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <BookOpen size={14} /> ตัวอย่างบทเรียน ({result.blocks.length} บล็อก)
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                    {result.blocks.map((b, i) => (
                        <div key={i} className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed">
                            <MarkdownRenderer content={typeof b?.content === 'string' ? b.content : ''} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (result.kind === 'markdown') {
        if (!result.blocks || result.blocks.length === 0) {
            return <Placeholder icon={FileText} title="ยังไม่มีเนื้อหา" sub="พิมพ์หรือวาง Markdown ด้านซ้าย" />;
        }
        const withSolution = result.blocks.filter(hasSolution).length;
        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <FileText size={14} /> ตัวอย่าง Markdown • แยกเป็น {result.blocks.length} กล่อง
                    {withSolution > 0 && (
                        <span className="normal-case px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: '#eaf0dd', color: '#3d5a2c' }}>
                            มีเฉลย {withSolution} กล่อง · ซ่อนได้ด้วยปุ่มเฉลย
                        </span>
                    )}
                </div>
                {result.blocks.map((content, i) => (
                    <div key={i} className="relative rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-sm text-gray-800 dark:text-slate-200 leading-relaxed">
                        {hasSolution(content) && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: '#eaf0dd', color: '#3d5a2c' }}>เฉลย</span>
                        )}
                        <MarkdownRenderer content={content} />
                    </div>
                ))}
            </div>
        );
    }

    if (result.kind === 'raw') {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <FileText size={14} /> ตัวอย่างข้อความ
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-sm text-gray-800 dark:text-slate-200">
                    <MarkdownRenderer content={result.raw || ''} />
                </div>
            </div>
        );
    }

    return <Placeholder icon={AlertCircle} title="รูปแบบข้อมูลไม่รองรับการแสดงตัวอย่าง" />;
};

export default ImportPreview;
