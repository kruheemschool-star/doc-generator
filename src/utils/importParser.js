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
 * Classify a parsed value into a preview-friendly shape.
 * @returns {{ kind: 'questions', questions: object[] }
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
    if (parsed && parsed.type === 'lesson' && Array.isArray(parsed.blocks)) {
        return { kind: 'lesson', blocks: parsed.blocks };
    }
    if (parsed && typeof parsed === 'object') {
        return { kind: 'raw', raw: parsed.content || parsed.text || '' };
    }
    return { kind: 'unknown' };
};
