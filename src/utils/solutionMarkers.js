// Shared detection for "solution" regions inside a Markdown item, so the global
// ซ่อน/แสดงเฉลย toggle can hide the teacher's answer and print a student version.
//
// Convention (inline): a solution starts at the first line that begins — after an
// optional blockquote `>`, a leading emoji/checkmark (🎯 / ✅ / 💡 / etc. — the same
// convention the callout-colour detector in MarkdownRenderer reads), heading `#`,
// list number, or bold `**` — with one of the Thai markers below, and runs to the
// END of the block. Everything above is the problem/content shown to students;
// the region below is the worked answer.

const MARKERS = 'เฉลยละเอียด|เฉลย|วิธีทำ|วิธีคิด|แนวคำตอบ|แนวคิด|คำตอบ';

// Real answer-key blockquotes are almost always "> 🎯 **เฉลย:**" or "> ✅ **เฉลย:**"
// — an emoji sits between the blockquote marker and the bolded word. Without this,
// the whole line silently fails to match (a leading 🎯 isn't whitespace/#/digit, so
// none of the optional prefixes consume it) and "ซ่อน/แสดงเฉลย" has nothing to hide.
const EMOJI_PREFIX = '(?:\\p{Extended_Pictographic}\\uFE0F?\\s*)*';

// Kept deliberately strict to avoid catching ordinary prose: the marker must be
// bolded (**เฉลย**), followed by a colon (เฉลย:), or be a bare "ตอบ" answer line
// followed by a space/colon/digit (ตอบ 42 / ตอบ: ข้อ 2).
export const SOLUTION_LINE_RE = new RegExp(
    '^\\s*(?:>\\s*)?' + EMOJI_PREFIX + '(?:#{1,6}\\s*)?' + EMOJI_PREFIX + '(?:\\d+[.)]\\s*)?(?:' +
        `\\*\\*\\s*(?:${MARKERS}|ตอบ)` +   // **เฉลย**  /  **คำตอบ: ข้อ 2.**  /  **ตอบ**
        '|' +
        `(?:${MARKERS})\\s*[:：]` +          // เฉลย:  /  คำตอบ：  /  วิธีทำ:
        '|' +
        `(?:${MARKERS})\\s*$` +             // เฉลย  /  #### เฉลยละเอียด  /  > เฉลย  (marker alone on its line)
        '|' +
        'ตอบ(?:[\\s:：\\d])' +               // ตอบ 42  /  ตอบ: ข้อ 2   (legacy)
        ')',
    'u'
);

// True if the markdown contains a solution region.
export const hasSolution = (content) =>
    !!content && content.split('\n').some(line => SOLUTION_LINE_RE.test(line));

// Split markdown into { problem, solution } at the first solution line.
// `solution` is null when no marker is present (nothing to hide).
export const splitSolution = (content) => {
    if (!content) return { problem: content, solution: null };
    const lines = content.split('\n');
    const idx = lines.findIndex(line => SOLUTION_LINE_RE.test(line));
    if (idx === -1) return { problem: content, solution: null };
    return {
        problem: lines.slice(0, idx).join('\n'),
        solution: lines.slice(idx).join('\n'),
    };
};
