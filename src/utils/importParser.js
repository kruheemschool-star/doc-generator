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
export const normalizeImportedQuestion = (q) => ({
    question: typeof q.question === 'string' ? q.question : '*(Question)*',
    options: Array.isArray(q.options) ? q.options.filter(o => typeof o === 'string') : [],
    solution: typeof q.solution === 'string'
        ? q.solution
        : (typeof q.explanation === 'string' ? q.explanation : ''),
    answer: typeof q.answer === 'string' ? q.answer : '',
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : undefined,
    svg: typeof q.svg === 'string' ? q.svg : '',
    spaceNeeded: q.space || 'medium',
});

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
