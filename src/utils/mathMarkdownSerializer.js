/**
 * mathMarkdownSerializer
 * -----------------------------------------------------------------------------
 * Round-trips between the app's stored string format (Markdown + inline LaTeX
 * `$...$` / display `$$...$$`) and a Quill Delta ops array.
 *
 * The editor (RichMathEditor) keeps Quill internally but exposes a plain
 * Markdown+LaTeX string to callers — so existing documents, MarkdownRenderer
 * and react-latex-next keep working unchanged. The teacher never sees `$` or
 * `**` while editing; this module is what hides/reveals that syntax.
 *
 * Phase 1 scope (lossless round-trip): plain text, **bold**, *italic*, and
 * math embeds. Anything else (tables, callouts, headings) passes through as
 * literal text, so it is preserved verbatim rather than corrupted.
 *
 * Math embeds use a Quill embed blot named 'mathlive' whose value is
 * `{ latex, display }`.
 */

// --- string -> ops ----------------------------------------------------------

/**
 * Split a string into text / math tokens by scanning for $$...$$ and $...$.
 * A lone or unbalanced `$` is treated as literal text (currency-safe enough
 * for Phase 1; teachers insert math via the equation button, not by typing $).
 */
export function tokenizeMath(str) {
    const tokens = [];
    const n = str.length;
    let i = 0;
    let textBuf = '';

    const flushText = () => {
        if (textBuf) {
            tokens.push({ type: 'text', content: textBuf });
            textBuf = '';
        }
    };

    while (i < n) {
        if (str[i] === '$') {
            // Display math: $$...$$
            if (str[i + 1] === '$') {
                const end = str.indexOf('$$', i + 2);
                if (end !== -1) {
                    const content = str.slice(i + 2, end);
                    flushText();
                    tokens.push({ type: 'math', display: true, content: content.trim() });
                    i = end + 2;
                    continue;
                }
            }
            // Inline math: $...$ (single line, non-empty)
            const end = str.indexOf('$', i + 1);
            if (end !== -1) {
                const content = str.slice(i + 1, end);
                if (content.length > 0 && !content.includes('\n')) {
                    flushText();
                    tokens.push({ type: 'math', display: false, content });
                    i = end + 1;
                    continue;
                }
            }
            // Not a usable delimiter -> literal '$'
            textBuf += '$';
            i += 1;
        } else {
            const next = str.indexOf('$', i);
            const end = next === -1 ? n : next;
            textBuf += str.slice(i, end);
            i = end;
        }
    }
    flushText();
    return tokens;
}

function pushText(ops, text, attrs) {
    if (!text) return;
    const op = { insert: text };
    if (attrs && Object.keys(attrs).length) op.attributes = { ...attrs };
    ops.push(op);
}

// Parse *italic* / _italic_ inside an already bold-split chunk.
function parseItalic(text, baseAttrs, ops) {
    const re = /(\*|_)(?=\S)([^*_\n]+?)(?<=\S)\1/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) pushText(ops, text.slice(last, m.index), baseAttrs);
        pushText(ops, m[2], { ...baseAttrs, italic: true });
        last = m.index + m[0].length;
    }
    if (last < text.length) pushText(ops, text.slice(last), baseAttrs);
}

// Parse **bold** / __bold__, then italics within.
function inlineMarkdownToOps(text, ops) {
    const re = /(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parseItalic(text.slice(last, m.index), {}, ops);
        parseItalic(m[2], { bold: true }, ops);
        last = m.index + m[0].length;
    }
    if (last < text.length) parseItalic(text.slice(last), {}, ops);
}

/**
 * Convert a Markdown+LaTeX string into a Quill Delta ops array.
 * @param {string} str
 * @returns {Array} ops
 */
export function markdownToOps(str) {
    if (!str || typeof str !== 'string') return [{ insert: '\n' }];

    const tokens = tokenizeMath(str);
    const ops = [];
    for (const t of tokens) {
        if (t.type === 'math') {
            ops.push({ insert: { mathlive: { latex: t.content, display: !!t.display } } });
        } else {
            inlineMarkdownToOps(t.content, ops);
        }
    }

    // Quill documents must end in a newline.
    const lastOp = ops[ops.length - 1];
    if (!lastOp || typeof lastOp.insert !== 'string' || !lastOp.insert.endsWith('\n')) {
        ops.push({ insert: '\n' });
    }
    return ops;
}

// --- ops -> string ----------------------------------------------------------

// Wrap each non-empty line's core (ignoring leading/trailing spaces) with a marker.
function wrapLines(str, marker) {
    return str
        .split('\n')
        .map((line) => {
            const lead = line.match(/^\s*/)[0];
            const trail = line.match(/\s*$/)[0];
            const core = line.slice(lead.length, line.length - trail.length);
            if (!core) return line;
            return lead + marker + core + marker + trail;
        })
        .join('\n');
}

function applyInlineMarkdown(text, attrs) {
    if (!text) return '';
    let result = text;
    if (attrs.italic) result = wrapLines(result, '*');
    if (attrs.bold) result = wrapLines(result, '**');
    return result;
}

/**
 * Convert a Quill Delta ops array back into a Markdown+LaTeX string.
 * @param {Array} ops
 * @returns {string}
 */
export function opsToMarkdown(ops) {
    if (!Array.isArray(ops)) return '';
    let out = '';
    for (const op of ops) {
        if (op && typeof op.insert === 'object' && op.insert && op.insert.mathlive) {
            const { latex = '', display = false } = op.insert.mathlive || {};
            if (!latex) continue;
            out += display ? `$$${latex}$$` : `$${latex}$`;
        } else if (op && typeof op.insert === 'string') {
            out += applyInlineMarkdown(op.insert, op.attributes || {});
        }
    }
    // Drop the single trailing newline Quill always keeps.
    return out.replace(/\n$/, '');
}

// --- dev self-test ----------------------------------------------------------

/**
 * Assert serialize(parse(x)) === x for a corpus of representative strings.
 * Logs mismatches to the console in dev; returns the list of failures.
 */
export function runSerializerSelfTest() {
    const corpus = [
        'กำหนดให้ $A = -0.01$, $B = -0.001$ และ $C = -0.1$ จงเรียงลำดับตัวแปรจาก **มากไปน้อย**',
        'จงหาค่าของ $x$ เมื่อ $2x + 5 = 11$',
        'พื้นที่วงกลม $$A = \\pi r^2$$ หน่วยตารางหน่วย',
        'ข้อความ **ตัวหนา** และ *ตัวเอียง* ปกติ',
        'ไม่มีคณิตเลย แค่ข้อความไทยธรรมดา',
        '',
    ];
    const failures = [];
    for (const input of corpus) {
        const output = opsToMarkdown(markdownToOps(input));
        if (output !== input) failures.push({ input, output });
    }
    if (failures.length && typeof console !== 'undefined') {
        console.warn('[mathMarkdownSerializer] round-trip mismatches:', failures);
    }
    return failures;
}
