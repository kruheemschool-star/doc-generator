import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { AlertTriangle, BookOpen, Lightbulb, Info, FileText, Ruler, Target } from 'lucide-react';

// Print-friendly palette — single source of truth in src/data/pageTemplates.js
import { PALETTE } from '../data/pageTemplates';
import { HEAD_FONT_STACK } from '../data/documentFonts';

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

const MarkdownRenderer = ({ content, baseFontPx }) => {
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
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
};

// Memoize — content prop is the only input; skip re-render when content unchanged
export default memo(MarkdownRenderer);
