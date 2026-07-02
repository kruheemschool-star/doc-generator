// Shared parsing for the "นำเข้าเนื้อหา" (Import from Gemini) flow.
// Used by both the actual import (handleImport) and the live preview so that
// what the user sees in the preview is exactly what gets imported.

/**
 * Parse pasted Gemini output into a JS value.
 * Tolerates ```json fences and surrounding prose by extracting the first
 * balanced [...] / {...} block as a fallback.
 * @returns {{ ok: true, parsed: any } | { ok: false, error: string }}
 */
export const tryParseImportJSON = (rawText) => {
    if (!rawText || !rawText.trim()) return { ok: false, error: 'empty' };

    const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        return { ok: true, parsed: JSON.parse(jsonString) };
    } catch (e) {
        const startArr = jsonString.indexOf('[');
        const startObj = jsonString.indexOf('{');
        const start = startArr !== -1 ? startArr : startObj;
        const endArr = jsonString.lastIndexOf(']');
        const endObj = jsonString.lastIndexOf('}');
        const end = startArr !== -1 ? endArr : endObj;
        if (start !== -1 && end !== -1 && end > start) {
            try {
                return { ok: true, parsed: JSON.parse(jsonString.substring(start, end + 1)) };
            } catch (e2) {
                return { ok: false, error: e2.message };
            }
        }
        return { ok: false, error: e.message };
    }
};

/**
 * Coerce a raw question object into the internal question shape.
 * AI output uses "explanation" + "correctIndex"; keep "solution" for older pastes.
 */
export const normalizeImportedQuestion = (q) => {
    const options = Array.isArray(q.options) ? q.options.filter(o => typeof o === 'string' && o.trim()) : [];
    // An out-of-range or non-integer index (AI miscounts, or options got filtered
    // above) would otherwise mark no option as correct — silently, with no clue
    // why. Drop it instead of passing it through, so the gap is visible at a glance.
    const correctIndex = typeof q.correctIndex === 'number' && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < options.length
        ? q.correctIndex
        : undefined;
    return {
        question: typeof q.question === 'string' ? q.question : '*(Question)*',
        options,
        solution: typeof q.solution === 'string'
            ? q.solution
            : (typeof q.explanation === 'string' ? q.explanation : ''),
        answer: typeof q.answer === 'string' ? q.answer : '',
        correctIndex,
        svg: typeof q.svg === 'string' ? q.svg : '',
        spaceNeeded: q.space || 'medium',
    };
};

/**
 * Detect the kruheemmath.com export shape: { meta, problems[], solutions[] }.
 * problems & solutions are separate arrays linked by `number`.
 */
export const isProblemSolutionExport = (parsed) =>
    !!parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.problems);

/**
 * Detect the kruheemmath.com answer-key export: { meta, solutions[] } with NO `problems`.
 * Each solution has { number, answerIndex, answerLabel, answerText, explanation }.
 */
export const isSolutionOnlyExport = (parsed) =>
    !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    && Array.isArray(parsed.solutions) && !Array.isArray(parsed.problems);

/**
 * Render each solution from a solutions-only export as a self-contained markdown block.
 * Prepending the question number + answer text gives an at-a-glance answer-key view;
 * the explanation (which already opens with "**คำตอบ: ข้อ X.**") follows underneath.
 */
export const solutionsToMarkdownBlocks = (parsed) => {
    const solutions = Array.isArray(parsed?.solutions) ? parsed.solutions : [];
    return solutions
        .filter(s => s && typeof s === 'object')
        .map(s => {
            const num = s.number != null ? `ข้อ ${s.number}.` : '';
            const ans = typeof s.answerText === 'string' && s.answerText
                ? ` คำตอบ: ${s.answerText}` : '';
            const header = `**${num}${ans}**`.trim();
            const explanation = typeof s.explanation === 'string' ? s.explanation : '';
            return [header, explanation].filter(Boolean).join('\n\n').trim();
        });
};

/**
 * Merge problems[] with solutions[] (matched by `number`, falling back to position)
 * into the internal question shape. In that export answerIndex is 0-based, so it
 * maps straight onto correctIndex; explanation becomes the solution.
 * @returns {object[]} normalized questions
 */
export const mergeProblemsAndSolutions = (parsed) => {
    const problems = Array.isArray(parsed?.problems) ? parsed.problems : [];
    const solutions = Array.isArray(parsed?.solutions) ? parsed.solutions : [];
    const solByNumber = new Map(
        solutions
            .filter(s => s && typeof s === 'object' && s.number != null)
            .map(s => [s.number, s])
    );

    return problems
        .filter(p => p && typeof p === 'object')
        .map((p, idx) => {
            const sol = solByNumber.get(p.number) || solutions[idx] || {};
            return normalizeImportedQuestion({
                question: p.question,
                options: p.options,
                explanation: sol.explanation,
                answer: typeof sol.answerText === 'string' ? sol.answerText : '',
                correctIndex: typeof sol.answerIndex === 'number' ? sol.answerIndex : undefined,
            });
        });
};

/**
 * Split a raw Markdown string into section blocks, breaking at ATX headings
 * (`#` … up to `maxLevel`), at thematic breaks (`---`/`***`/`___` on their own
 * line), at bold-numbered exercise markers (`**1.**`, `**2.**`, … at the very
 * start of a line), and — once a block already contains a table — at a blank
 * line immediately before a new blockquote. Each block keeps a heading
 * together with the body that follows it; text before the first heading
 * becomes its own leading block.
 *
 * Designed for the "นำเข้าเป็น Markdown แยกกล่องตามหัวข้อ" flow — each returned
 * block becomes one `markdown` content item, which lets the pagination hook
 * bin-pack the sections onto A4 pages by their measured height. The extra
 * split signals matter in practice: lesson/exercise sheets often use bold
 * pseudo-headers instead of nested headings — "**ตัวอย่างที่ 1**" separated by
 * `---`, or "**1.**"/"**2.**" exercise numbers with no separator at all — and
 * heading-only splitting left those glued into one oversized item that
 * silently overflowed a page (never split, per useAutoPagination's rule that
 * a single item can't be broken across pages). The table-gated blockquote
 * split catches the case none of the line-pattern rules can: an exercise
 * question + a fill-in table, immediately followed by a "> 🎯 เฉลย:" answer
 * key that itself wraps another table — two tables with no heading or `---`
 * between them are reliably tall regardless of raw character count (a plain
 * char-count threshold was tried first and mis-fired: this exact case is
 * only ~440 characters, well under any threshold generic enough not to
 * over-split short, well-behaved sections elsewhere in the same file), so
 * "does this block already contain a table row" is the more direct signal.
 *
 * Fenced code blocks (``` / ~~~) are respected so a `#`/`---`/`**N.**`/`>`
 * inside code is never mistaken for a split point. Consecutive headings
 * (e.g. `##` then `###` with no body between) stay grouped rather than
 * producing empty stub boxes. A thematic-break line is itself dropped (not
 * carried into either side) since it's a pure separator, not content.
 */
export const splitMarkdownByHeading = (md, maxLevel = 3) => {
    if (!md || !md.trim()) return [];
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const splitRe = new RegExp(`^#{1,${maxLevel}}\\s+\\S`);
    const anyHeadingRe = /^#{1,6}\s+\S/;
    // CommonMark thematic break: 3+ of the same -, _ or * on their own line,
    // optionally spaced out. Requires the ENTIRE line to be just that — a
    // markdown table separator row (`|---|---|`) has pipes in it and never
    // matches, so table syntax is never mistaken for a section break.
    const thematicBreakRe = /^[ \t]*([-_*])(?:[ \t]*\1){2,}[ \t]*$/;
    // Deliberately narrow: bold content that's ONLY digits + a dot ("**1.**"),
    // immediately followed by whitespace or end of line. Won't match a bold
    // measurement or price ("**1.5 กก.**", "**100 บาท**") since those have
    // more than a bare number inside the bold span.
    const boldNumberRe = /^\*\*\d+\.\*\*(?:\s|$)/;
    // A table row, optionally wrapped in a blockquote ("> | a | b |"). Doesn't
    // need to be the separator row specifically — any pipe-delimited row is
    // enough to flag "this block already has a table in it".
    const tableRowRe = /^\s*>?\s*\|/;
    const blocks = [];
    let current = [];
    let inFence = false;
    // Only break when the current block already holds real body text — keeps a
    // run of back-to-back headings attached to the body that eventually follows.
    const hasBody = () => current.some(l => l.trim() && !anyHeadingRe.test(l));
    const hasTable = () => current.some(l => tableRowRe.test(l));
    const flush = () => {
        const text = current.join('\n').trim();
        if (text) blocks.push(text);
        current = [];
    };
    for (const line of lines) {
        if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
        if (!inFence && thematicBreakRe.test(line) && hasBody()) {
            flush();
            continue; // drop the --- itself, don't carry it into the next block
        }
        if (!inFence && (splitRe.test(line) || boldNumberRe.test(line)) && hasBody()) flush();
        if (
            !inFence && /^>/.test(line) && hasBody() && hasTable() &&
            current.length > 0 && current[current.length - 1].trim() === ''
        ) flush();
        current.push(line);
    }
    flush();
    return blocks;
};

/**
 * Classify a parsed value into a preview-friendly shape.
 * @returns {{ kind: 'questions', questions: object[], meta?: object }
 *         | { kind: 'lesson', blocks: object[] }
 *         | { kind: 'raw', raw: string }
 *         | { kind: 'unknown' }}
 */
export const classifyImport = (parsed) => {
    if (Array.isArray(parsed)) {
        return {
            kind: 'questions',
            questions: parsed.filter(q => q && typeof q === 'object').map(normalizeImportedQuestion),
        };
    }
    if (isProblemSolutionExport(parsed)) {
        return {
            kind: 'questions',
            questions: mergeProblemsAndSolutions(parsed),
            meta: parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : null,
        };
    }
    if (isSolutionOnlyExport(parsed)) {
        return {
            kind: 'answers',
            blocks: solutionsToMarkdownBlocks(parsed),
            meta: parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : null,
        };
    }
    if (parsed && parsed.type === 'lesson' && Array.isArray(parsed.blocks)) {
        return { kind: 'lesson', blocks: parsed.blocks };
    }
    if (parsed && typeof parsed === 'object') {
        return { kind: 'raw', raw: parsed.content || parsed.text || '' };
    }
    return { kind: 'unknown' };
};
