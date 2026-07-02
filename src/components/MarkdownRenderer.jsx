import React, { memo } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { AlertTriangle, BookOpen, Lightbulb, Info, FileText, Ruler, Target } from 'lucide-react';

// Print-friendly palette — single source of truth in src/data/pageTemplates.js
import { PALETTE, LESSON_BOX_TYPES } from '../data/pageTemplates';
import { HEAD_FONT_STACK } from '../data/documentFonts';

// Colours available to the inline `{color:text}` marker and the ```chips
// block — shared with LESSON_BOX_TYPES' bar colours so a chip/pill matches
// its parent box's palette.
const INLINE_COLOR_MAP = {
    red: '#dc2626', green: '#059669', blue: '#2563eb', purple: '#6d28d9',
    orange: '#c2560c', gold: '#a8790f', teal: '#0f766e', pink: '#be185d',
    slate: '#475569', sky: '#0284c7', ink: PALETTE.ink,
};

// Markdown collapses single newlines inside a paragraph — these lesson boxes
// want teacher-typed lines (equation steps, formulas) to stay stacked, so
// force a hard break (trailing double-space) at every line.
const forceLineBreaks = (text) => text.split('\n').map(l => l.trim()).filter(Boolean).join('  \n');

// Solid-colour title bar shared by every ```box:TYPE / ```dodont card. White
// text on screen; print swaps to the bar's own colour via .lesson-box-bar-text
// (see index.css) since the bar's background is stripped on paper.
const LessonBoxHeader = ({ title, badge, bar }) => (
    <div
        className="lesson-box-bar-text flex items-center justify-between gap-3 px-5 py-2.5 text-white font-bold"
        style={{ backgroundColor: bar, '--box-print-color': bar }}
    >
        <span>{title}</span>
        {badge && <span className="lesson-box-bar-text text-xs font-semibold opacity-90 flex-shrink-0">{badge}</span>}
    </div>
);

const LessonBoxShell = ({ bar, header, children }) => (
    <div className="rounded-2xl border-2 overflow-hidden my-3 print:rounded-lg" style={{ borderColor: bar }}>
        {header}
        <div className="bg-white px-5 py-3.5">{children}</div>
    </div>
);

// Body layout varies by LESSON_BOX_TYPES[type].mode — everything renders
// teacher-typed lines through MarkdownRenderer itself (recursively) so bold/
// math/etc still work inside a box, just laid out differently per mode.
const renderLessonBoxBody = (mode, bodyLines, bar) => {
    const nonEmpty = bodyLines.map(l => l.trim()).filter(Boolean);
    switch (mode) {
        case 'numbered':
        case 'numbered-blank':
            return (
                <div className="space-y-2.5">
                    {nonEmpty.map((line, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span
                                className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5"
                                style={{ borderColor: bar, color: bar }}
                            >
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                <MarkdownRenderer content={line} plainBlockquote />
                                {mode === 'numbered-blank' && (
                                    <span className="flex-1 border-b border-dotted min-h-[1.4em]" style={{ borderColor: PALETTE.rule }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'choices': {
            const choiceLine = nonEmpty[nonEmpty.length - 1] || '';
            const questionLines = nonEmpty.slice(0, -1);
            const choices = choiceLine.split('|').map(c => c.trim()).filter(Boolean);
            return (
                <>
                    {questionLines.length > 0 && (
                        <MarkdownRenderer content={forceLineBreaks(questionLines.join('\n'))} plainBlockquote />
                    )}
                    {choices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                            {choices.map((c, i) => (
                                <span
                                    key={i}
                                    className="px-3.5 py-1.5 rounded-full border text-sm font-medium"
                                    style={{ borderColor: bar, color: PALETTE.ink }}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            );
        }
        case 'vocab':
            return (
                <div className="divide-y" style={{ borderColor: PALETTE.rule }}>
                    {nonEmpty.map((line, i) => {
                        const [left, right] = line.split('|').map(s => (s || '').trim());
                        return (
                            <div key={i} className="flex items-center justify-between gap-4 py-2">
                                <span className="font-mono" style={{ color: PALETTE.ink }}>{left}</span>
                                <span style={{ color: PALETTE.inkSoft }}>{right}</span>
                            </div>
                        );
                    })}
                </div>
            );
        case 'arrow-list':
            return (
                <div className="space-y-1.5">
                    {nonEmpty.map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span style={{ color: bar }}>▸</span>
                            <div className="flex-1 min-w-0"><MarkdownRenderer content={line} plainBlockquote /></div>
                        </div>
                    ))}
                </div>
            );
        case 'italic':
            return (
                <div className="italic">
                    <MarkdownRenderer content={forceLineBreaks(nonEmpty.join('\n'))} plainBlockquote />
                </div>
            );
        case 'center':
            return (
                <div className="text-center py-1 font-mono text-[1.1em]">
                    <MarkdownRenderer content={forceLineBreaks(nonEmpty.join('\n'))} plainBlockquote />
                </div>
            );
        case 'table':
            // Markdown tables need their own real newlines between rows — unlike
            // every other mode, don't force hard breaks here.
            return <MarkdownRenderer content={bodyLines.join('\n')} plainBlockquote />;
        case 'text':
        default:
            return <MarkdownRenderer content={forceLineBreaks(nonEmpty.join('\n'))} plainBlockquote />;
    }
};

// ```dodont side-by-side compare card — a fixed pair (✓ green / ✗ red), not
// part of LESSON_BOX_TYPES since it's a two-column layout, not a single bar.
const DoDontSide = ({ title, body, bar, icon }) => (
    <div className="flex-1 min-w-0 rounded-2xl border-2 overflow-hidden print:rounded-lg" style={{ borderColor: bar }}>
        <div className="lesson-box-bar-text px-4 py-2 text-white font-bold flex items-center gap-1.5" style={{ backgroundColor: bar, '--box-print-color': bar }}>
            <span>{icon}</span><span>{title}</span>
        </div>
        <div className="bg-white px-4 py-3 font-mono text-[0.95em]">
            <MarkdownRenderer content={forceLineBreaks(body.join('\n'))} plainBlockquote />
        </div>
    </div>
);

/**
 * Pre-process markdown:
 *   1. Extract multi-line $$ LaTeX blocks from inside blockquotes
 *      (remark-math fails when each line is prefixed with '>')
 *   2. Convert ::: theorem CONTENT ::: → blockquote with 📖 marker
 *      so the existing callout pipeline can render it.
 */
const preprocessMarkdown = (content) => {
    if (!content || typeof content !== 'string') return content;

    // Step 1: convert :::theorem ... ::: (single-line or multi-line) to blockquote
    let processed = content.replace(
        /:::\s*theorem\s+([\s\S]*?)\s*:::/g,
        (_, body) => {
            const lines = body.trim().split('\n');
            return lines.map((l, i) => i === 0 ? `> 📖 ${l}` : `> ${l}`).join('\n');
        }
    );

    // Step 1b: {color:text} → colored inline span. Wrapped in backticks so it
    // survives as a literal inline-code node (remark never re-parses code-span
    // contents), then the `code` component below recognises the § marker and
    // swaps it for a real <span> — reuses the same mechanism as ```box blocks
    // instead of needing raw HTML passthrough.
    processed = processed.replace(
        /\{(red|green|blue|purple|orange|gold|teal|pink|slate|sky|ink):([^}]+)\}/g,
        (_, color, text) => `\`§${color}§${text}\``
    );

    // Step 2: pull $$...$$ blocks out of blockquote scope
    const lines = processed.split('\n');
    const result = [];
    let insideBlockquoteMath = false;
    let mathLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const stripped = line.replace(/^>\s?/, '');
        const isBlockquoteLine = /^>/.test(line);

        if (isBlockquoteLine && !insideBlockquoteMath && stripped.trim() === '$$') {
            insideBlockquoteMath = true;
            mathLines = ['$$'];
            result.push('');
        } else if (isBlockquoteLine && insideBlockquoteMath && stripped.trim() === '$$') {
            mathLines.push('$$');
            result.push(...mathLines);
            result.push('');
            mathLines = [];
            insideBlockquoteMath = false;
        } else if (insideBlockquoteMath) {
            mathLines.push(stripped);
        } else {
            result.push(line);
        }
    }
    if (insideBlockquoteMath && mathLines.length > 0) {
        result.push(...mathLines);
    }

    return result.join('\n');
};

/**
 * Detect callout type from blockquote leading text.
 * Returns palette-driven inline styles (print-friendly: พื้นอ่อน + ตัวเข้ม).
 */
const getCalloutStyle = (text) => {
    const fallback = {
        type: 'note',
        icon: <Info className="w-5 h-5" style={{ color: PALETTE.inkSoft }} />,
        bg: PALETTE.paper2,
        border: PALETTE.rule,
    };
    if (!text || typeof text !== 'string') return fallback;

    if (text.includes('⚠️')) return {
        type: 'warn',
        icon: <AlertTriangle className="w-5 h-5" style={{ color: PALETTE.warn }} />,
        bg: PALETTE.warnTint,
        border: PALETTE.warn,
    };
    if (text.includes('💡')) return {
        type: 'tip',
        icon: <Lightbulb className="w-5 h-5" style={{ color: PALETTE.gold }} />,
        bg: PALETTE.goldTint,
        border: PALETTE.gold,
    };
    if (text.includes('📖') || text.includes('📘')) return {
        type: 'theorem',
        icon: <BookOpen className="w-5 h-5" style={{ color: PALETTE.green }} />,
        bg: PALETTE.paper2,
        border: PALETTE.green,
    };
    if (text.includes('📐')) return {
        type: 'formula',
        icon: <Ruler className="w-5 h-5" style={{ color: PALETTE.green }} />,
        bg: PALETTE.paper2,
        border: PALETTE.green,
    };
    if (text.includes('📝')) return {
        type: 'example',
        icon: <FileText className="w-5 h-5" style={{ color: PALETTE.green }} />,
        bg: PALETTE.greenTint,
        border: PALETTE.green,
    };
    if (text.includes('🎯')) return {
        type: 'summary',
        icon: <Target className="w-5 h-5" style={{ color: PALETTE.greenDeep }} />,
        bg: PALETTE.greenTint,
        border: PALETTE.greenDeep,
    };
    return fallback;
};

// react-markdown blocks `data:` URLs by default (XSS hardening aimed at
// `javascript:`/`data:text/html` links) — but the icon-library feature embeds
// icons as `data:image/...` base64 straight in the Markdown. Let image data
// URLs through; everything else still goes through the default allowlist
// (http/https/mailto/xmpp), so that protection is otherwise untouched.
const allowIconDataUrls = (url, key) =>
    key === 'src' && /^data:image\//i.test(url) ? url : defaultUrlTransform(url);

const MarkdownRenderer = ({ content, baseFontPx, plainBlockquote = false }) => {
    const safeContent = typeof content === 'string' ? preprocessMarkdown(content) : '';

    // When a per-item font size is set, drive the whole subtree from it.
    // Headings/tables use em units below so they scale proportionally.
    const rootStyle = {
        color: PALETTE.ink,
        fontFamily: 'inherit',
        // Default 16px preserves prior `text-base` behavior; per-item slider overrides it.
        fontSize: `${typeof baseFontPx === 'number' ? baseFontPx : 16}px`,
    };

    return (
        <div className="leading-relaxed" style={rootStyle}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[[rehypeKatex, { strict: false }]]}
                urlTransform={allowIconDataUrls}
                components={{
                    h1: ({ node, ...props }) => (
                        <h1
                            className="font-bold mt-2 mb-2 pb-2 border-b-2"
                            style={{ color: `var(--doc-heading, ${PALETTE.greenDeep})`, borderColor: `var(--doc-accent, ${PALETTE.green})`, fontSize: '1.875em', fontFamily: `var(--doc-head-font, ${HEAD_FONT_STACK})` }}
                            {...props}
                        />
                    ),
                    // h2 — marker-pen highlight under the text (lecture-note look)
                    h2: ({ node, children, ...props }) => (
                        <h2 className="font-bold mt-3 mb-2" style={{ fontSize: '1.5em', fontFamily: `var(--doc-head-font, ${HEAD_FONT_STACK})` }} {...props}>
                            <span
                                style={{
                                    color: `var(--doc-heading, ${PALETTE.greenDeep})`,
                                    backgroundImage: `linear-gradient(transparent 62%, var(--doc-highlight, ${PALETTE.highlight}) 62%)`,
                                    padding: '0 0.12em',
                                    boxDecorationBreak: 'clone',
                                    WebkitBoxDecorationBreak: 'clone',
                                }}
                            >
                                {children}
                            </span>
                        </h2>
                    ),
                    // h3 — coral dot + blue sub-heading text
                    h3: ({ node, children, ...props }) => (
                        <h3 className="font-semibold mt-2 mb-1" style={{ fontSize: '1.2em', fontFamily: `var(--doc-head-font, ${HEAD_FONT_STACK})` }} {...props}>
                            <span style={{ color: `var(--doc-accent, ${PALETTE.accent})` }}>●</span>{' '}
                            <span style={{ color: `var(--doc-subhead, ${PALETTE.subhead})` }}>{children}</span>
                        </h3>
                    ),

                    strong: ({ node, ...props }) => (
                        <span className="font-bold" style={{ color: PALETTE.ink }} {...props} />
                    ),

                    em: ({ node, ...props }) => (
                        <em style={{ color: PALETTE.inkSoft }} {...props} />
                    ),

                    ul: ({ node, ...props }) => (
                        <ul
                            className="list-disc list-inside space-y-1 ml-4"
                            style={{ color: PALETTE.ink }}
                            {...props}
                        />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol
                            className="list-decimal list-inside space-y-1 ml-4 marker:font-bold"
                            style={{ color: PALETTE.ink }}
                            {...props}
                        />
                    ),

                    blockquote: ({ node, children }) => {
                        // Inside a box that's already tinted (e.g. the green "เฉลย" solution
                        // box), skip the colored callout so it doesn't nest box-in-box —
                        // render as plain quoted text instead.
                        if (plainBlockquote) {
                            return (
                                <div
                                    className="pl-3 my-2 border-l-2"
                                    style={{ borderColor: PALETTE.rule, color: PALETTE.ink }}
                                >
                                    {children}
                                </div>
                            );
                        }

                        let textContent = "";
                        try {
                            if (node && node.children && node.children.length > 0) {
                                const firstChild = node.children[0];
                                if (firstChild && firstChild.children && firstChild.children.length > 0) {
                                    const firstDeepChild = firstChild.children[0];
                                    if (firstDeepChild && firstDeepChild.value) {
                                        textContent = firstDeepChild.value;
                                    } else if (firstDeepChild && firstDeepChild.type === 'strong') {
                                        if (firstDeepChild.children && firstDeepChild.children[0]) {
                                            textContent = firstDeepChild.children[0].value || "";
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn("Error parsing blockquote content", e);
                        }

                        const style = getCalloutStyle(textContent);

                        return (
                            <div
                                className="flex gap-3 p-3 my-2 rounded-md print:rounded-none"
                                style={{
                                    backgroundColor: style.bg,
                                    borderLeft: `4px solid ${style.border}`,
                                    color: PALETTE.ink,
                                }}
                            >
                                <div className="flex-shrink-0 mt-0.5 select-none">
                                    {style.icon}
                                </div>
                                <div className="flex-1">
                                    {children}
                                </div>
                            </div>
                        );
                    },

                    table: ({ node, ...props }) => (
                        <table
                            className="w-full border-collapse my-3"
                            style={{ border: `1px solid ${PALETTE.rule}`, fontSize: '0.875em' }}
                            {...props}
                        />
                    ),
                    th: ({ node, ...props }) => (
                        <th
                            className="px-4 py-2 font-bold text-left"
                            style={{
                                backgroundColor: PALETTE.greenTint,
                                border: `1px solid ${PALETTE.rule}`,
                                color: PALETTE.greenDeep,
                            }}
                            {...props}
                        />
                    ),
                    td: ({ node, ...props }) => (
                        <td
                            className="px-4 py-2"
                            style={{
                                border: `1px solid ${PALETTE.rule}`,
                                color: PALETTE.ink,
                            }}
                            {...props}
                        />
                    ),

                    a: ({ node, ...props }) => (
                        <a
                            className="underline decoration-dotted underline-offset-4"
                            style={{ color: `var(--doc-accent, ${PALETTE.green})` }}
                            {...props}
                        />
                    ),

                    p: ({ node, children, ...props }) => (
                        <p className="mb-1" {...props}>{children}</p>
                    ),

                    hr: () => (
                        <hr className="my-3" style={{ borderColor: PALETTE.rule }} />
                    ),

                    // Fenced blocks that render as custom cards (```topic, ```box:TYPE,
                    // ```section, ```dodont, ```chips) — bypass the default <pre> wrapper
                    // (its monospace/white-space:pre styling would break these layouts)
                    // and let the `code` override below render the real markup.
                    pre: ({ node, children, ...props }) => {
                        const codeClassName = children?.props?.className || '';
                        if (/language-(topic|box:|section|dodont|chips)/.test(codeClassName)) return <>{children}</>;
                        return <pre {...props}>{children}</pre>;
                    },
                    code: ({ node, className, children, ...props }) => {
                        const raw = String(children).replace(/\n$/, '');

                        // Inline {color:text} marker (see preprocessMarkdown) → colored span.
                        if (!className) {
                            const inlineMatch = raw.match(/^§([a-z]+)§([\s\S]*)$/);
                            if (inlineMatch && INLINE_COLOR_MAP[inlineMatch[1]]) {
                                return <span className="font-bold" style={{ color: INLINE_COLOR_MAP[inlineMatch[1]] }}>{inlineMatch[2]}</span>;
                            }
                        }

                        if (className?.includes('language-box:')) {
                            const typeKey = className.split('language-box:')[1]?.trim();
                            const type = LESSON_BOX_TYPES[typeKey];
                            if (!type) return <code className={className} {...props}>{children}</code>;
                            const boxLines = raw.split('\n');
                            const titleLineRaw = (boxLines[0] || '').trim();
                            const bodyLines = boxLines.slice(1);
                            const [titleMain, titleBadge] = titleLineRaw.split('|').map(s => s?.trim());
                            const title = (!titleLineRaw || titleLineRaw === '-') ? type.label : titleMain;
                            return (
                                <LessonBoxShell bar={type.bar} header={<LessonBoxHeader title={title} badge={titleBadge} bar={type.bar} />}>
                                    {renderLessonBoxBody(type.mode, bodyLines, type.bar)}
                                </LessonBoxShell>
                            );
                        }

                        if (className?.includes('language-section')) {
                            return (
                                <div className="rounded-xl px-4 py-2 my-4 font-bold" style={{ backgroundColor: PALETTE.paper2, color: PALETTE.ink }}>
                                    {raw}
                                </div>
                            );
                        }

                        if (className?.includes('language-dodont')) {
                            const [doRaw, dontRaw] = raw.split(/\n-{3,}\n/);
                            const parseSide = (sideRaw) => {
                                const sideLines = (sideRaw || '').split('\n');
                                return { title: (sideLines[0] || '').trim(), body: sideLines.slice(1) };
                            };
                            const doSide = parseSide(doRaw);
                            const dontSide = parseSide(dontRaw);
                            return (
                                <div className="flex flex-col sm:flex-row gap-3 my-3">
                                    <DoDontSide title={doSide.title || 'ทำแบบนี้'} body={doSide.body} bar="#059669" icon="✓" />
                                    <DoDontSide title={dontSide.title || 'อย่าทำ'} body={dontSide.body} bar="#dc2626" icon="✗" />
                                </div>
                            );
                        }

                        if (className?.includes('language-chips')) {
                            const tokens = raw.split('\n').join('|').split('|').map(t => t.trim()).filter(Boolean);
                            const circleColors = ['#2563eb', '#6d28d9', '#c2560c'];
                            let circleIdx = 0;
                            return (
                                <div className="flex flex-wrap items-center gap-2 my-2">
                                    {tokens.map((tok, i) => {
                                        const m = tok.match(/^([a-z]+):(.+)$/);
                                        if (m && INLINE_COLOR_MAP[m[1]]) {
                                            return (
                                                <span key={i} className="lesson-box-bar-text px-3 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: INLINE_COLOR_MAP[m[1]], '--box-print-color': INLINE_COLOR_MAP[m[1]] }}>
                                                    {m[2]}
                                                </span>
                                            );
                                        }
                                        if (/^\d+$/.test(tok)) {
                                            const c = circleColors[circleIdx % circleColors.length];
                                            circleIdx++;
                                            return (
                                                <span key={i} className="lesson-box-bar-text w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c, '--box-print-color': c }}>
                                                    {tok}
                                                </span>
                                            );
                                        }
                                        return <span key={i} className="px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: PALETTE.rule, color: PALETTE.ink }}>{tok}</span>;
                                    })}
                                </div>
                            );
                        }

                        if (!className?.includes('language-topic')) {
                            return <code className={className} {...props}>{children}</code>;
                        }
                        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
                        const [grade = '', titleLine = '', subtitleLine = ''] = lines;
                        const dotIdx = titleLine.indexOf(' · ');
                        const highlightPart = dotIdx === -1 ? titleLine : titleLine.slice(0, dotIdx);
                        const restPart = dotIdx === -1 ? '' : titleLine.slice(dotIdx + 3);
                        return (
                            <div className="flex items-stretch rounded-2xl border-2 overflow-hidden my-3 print:rounded-lg" style={{ borderColor: PALETTE.accent }}>
                                {grade && (
                                    <div
                                        className="flex-shrink-0 w-[92px] flex items-center justify-center text-center font-bold text-xl px-2 border-r-2 text-white print:text-[#e2574c]"
                                        style={{ backgroundColor: PALETTE.accent, borderColor: PALETTE.accent }}
                                    >
                                        {grade}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 px-5 py-3 flex flex-col justify-center gap-0.5">
                                    {titleLine && (
                                        <div className="font-bold text-[1.15em] leading-snug" style={{ color: PALETTE.ink }}>
                                            <span
                                                style={{
                                                    backgroundImage: `linear-gradient(transparent 62%, ${PALETTE.highlight} 62%)`,
                                                    boxDecorationBreak: 'clone',
                                                    WebkitBoxDecorationBreak: 'clone',
                                                    padding: '0 0.12em',
                                                }}
                                            >
                                                {highlightPart}
                                            </span>
                                            {restPart && <> · {restPart}</>}
                                        </div>
                                    )}
                                    {subtitleLine && (
                                        <div className="text-[0.8em]" style={{ color: PALETTE.inkSoft }}>
                                            {subtitleLine}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    },

                    // Markdown images are always small inline icons here (content
                    // photos/diagrams use the dedicated Image block instead) — size
                    // relative to the surrounding text so one icon reads right next
                    // to a heading and another next to body copy without extra markup.
                    img: ({ node, alt, ...props }) => (
                        <img
                            alt={alt || ''}
                            style={{ height: '1.3em', width: 'auto', display: 'inline', verticalAlign: 'middle', margin: '0 0.15em' }}
                            {...props}
                        />
                    ),
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
};

// Memoize — content prop is the only input; skip re-render when content unchanged
export default memo(MarkdownRenderer);
