import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { AlertTriangle, BookOpen, Lightbulb, Info, FileText } from 'lucide-react';

/**
 * Pre-process markdown content to extract multi-line $$ LaTeX blocks
 * from blockquotes. remark-math cannot parse $$ delimiters when each
 * line is prefixed with '>' because the blockquote syntax breaks the
 * math block recognition.
 *
 * Strategy: close the blockquote before the $$ block, output the LaTeX
 * lines without '>' prefix, then resume the blockquote after.
 */
const preprocessLatexInBlockquotes = (content) => {
    if (!content || typeof content !== 'string') return content;

    const lines = content.split('\n');
    const result = [];
    let insideBlockquoteMath = false;
    let mathLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Strip blockquote prefix for analysis
        const stripped = line.replace(/^>\s?/, '');
        const isBlockquoteLine = /^>/.test(line);

        if (isBlockquoteLine && !insideBlockquoteMath && stripped.trim() === '$$') {
            // Entering a multi-line $$ block inside a blockquote
            insideBlockquoteMath = true;
            mathLines = ['$$'];
            // Add a blank line to close the blockquote context
            result.push('');
        } else if (isBlockquoteLine && insideBlockquoteMath && stripped.trim() === '$$') {
            // Closing the $$ block
            mathLines.push('$$');
            // Flush the math block (without > prefix)
            result.push(...mathLines);
            // Add blank line and resume blockquote
            result.push('');
            mathLines = [];
            insideBlockquoteMath = false;
        } else if (insideBlockquoteMath) {
            // Inside math block — strip the > prefix
            mathLines.push(stripped);
        } else {
            result.push(line);
        }
    }

    // If we ended inside a math block (malformed), flush what we have
    if (insideBlockquoteMath && mathLines.length > 0) {
        result.push(...mathLines);
    }

    return result.join('\n');
};

// Robust helper function
const getCalloutStyle = (text) => {
    if (!text || typeof text !== 'string') return { type: 'note', icon: <Info className="w-5 h-5 text-gray-500" />, border: 'border-l-4 border-gray-300' };

    if (text.includes('⚠️')) return { type: 'warning', icon: <AlertTriangle className="w-5 h-5 text-black" />, border: 'border-black' };
    if (text.includes('📘')) return { type: 'definition', icon: <BookOpen className="w-5 h-5 text-black" />, border: 'border-gray-400' };
    if (text.includes('💡')) return { type: 'tip', icon: <Lightbulb className="w-5 h-5 text-black" />, border: 'border-dashed border-gray-600' };
    if (text.includes('📝')) return { type: 'example', icon: <FileText className="w-5 h-5 text-black" />, border: 'border-gray-300' };
    return { type: 'note', icon: <Info className="w-5 h-5 text-gray-500" />, border: 'border-l-4 border-gray-300' };
};

const MarkdownRenderer = ({ content }) => {
    // Safety check for content
    const safeContent = typeof content === 'string' ? preprocessLatexInBlockquotes(content) : '';

    return (
        <div className="text-gray-900 text-base leading-relaxed font-sans">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[[rehypeKatex, { strict: false }]]}
                components={{
                    // 1. Headings
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-2 mb-2 border-b-2 border-black pb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold mt-2 mb-2 text-black" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-medium mt-2 mb-1 text-gray-800" {...props} />,

                    // 2. Bold
                    strong: ({ node, ...props }) => <span className="font-bold text-black bg-gray-100 px-1 rounded-sm" {...props} />,

                    // 3. Lists
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 ml-4 marker:text-black" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 ml-4 marker:font-bold" {...props} />,

                    // 4. Blockquotes (Callouts) - Robust implementation
                    blockquote: ({ node, children }) => {
                        let textContent = "";
                        try {
                            // Safely extract text content
                            if (node && node.children && node.children.length > 0) {
                                const firstChild = node.children[0]; // usually 'paragraph'
                                if (firstChild && firstChild.children && firstChild.children.length > 0) {
                                    const firstDeepChild = firstChild.children[0]; // usually 'text' or 'strong'
                                    if (firstDeepChild && firstDeepChild.value) {
                                        textContent = firstDeepChild.value;
                                    } else if (firstDeepChild && firstDeepChild.type === 'strong') {
                                        // Handle bold start
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
                            <div className={`flex gap-3 p-3 my-2 rounded-lg border bg-gray-50/50 ${style.border} print:border-2`}>
                                <div className="flex-shrink-0 mt-0.5 select-none">
                                    {style.icon}
                                </div>
                                <div className="flex-1 text-gray-800">
                                    {children}
                                </div>
                            </div>
                        );
                    },

                    // 5. Tables
                    table: ({ node, ...props }) => <table className="w-full border-collapse border border-gray-300 my-4 text-sm" {...props} />,
                    th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-left" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,

                    // 6. Links
                    a: ({ node, ...props }) => <a className="text-blue-600 underline decoration-dotted underline-offset-4" {...props} />,

                    // 7. Math (Catch errors if Katex fails)
                    p: ({ node, children, ...props }) => <p className="mb-1" {...props}>{children}</p>
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
