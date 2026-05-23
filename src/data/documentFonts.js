/**
 * Document Fonts — รายการฟอนต์ไทยยอดนิยมสำหรับจัดทำเอกสารการเรียน
 *
 * เลือกเฉพาะฟอนต์ที่:
 *   1. มี glyph ภาษาไทยครบ (Google Fonts)
 *   2. อ่านง่าย พิมพ์/ถ่ายเอกสารชัด
 *   3. รองรับน้ำหนัก 300-700 (light → bold) สำหรับ heading/body
 *
 * จัดกลุ่มเป็น 3 หมวด:
 *   - Sans (Modern)   — สำหรับเอกสารทั่วไป อ่านง่ายบนหน้าจอ + พิมพ์
 *   - Serif (Classic) — สำหรับเอกสารวิชาการ ดูสง่า
 *   - Display         — สำหรับ heading/title โดยเฉพาะ
 *
 * Default: Sarabun (มาตรฐานเอกสารราชการไทย)
 */

export const DOCUMENT_FONTS = [
    // === Sans / Modern ===
    {
        id: 'sarabun',
        name: 'Sarabun',
        displayName: 'สารบัญ',
        category: 'sans',
        description: 'มาตรฐานเอกสารราชการไทย อ่านง่ายที่สุด',
        stack: "'Sarabun', 'Noto Sans Thai', sans-serif",
        recommended: true,
    },
    {
        id: 'noto-sans-thai',
        name: 'Noto Sans Thai',
        displayName: 'โน้ตโตะ',
        category: 'sans',
        description: 'สะอาด ทันสมัย ใช้ได้กับทุกระดับชั้น',
        stack: "'Noto Sans Thai', 'Sarabun', sans-serif",
    },
    {
        id: 'ibm-plex-thai',
        name: 'IBM Plex Sans Thai',
        displayName: 'ไอบีเอ็ม เพล็กซ์',
        category: 'sans',
        description: 'พรีเมียม ดูแพง เหมาะกับเอกสารคุณภาพสูง',
        stack: "'IBM Plex Sans Thai', 'Sarabun', sans-serif",
    },
    {
        id: 'prompt',
        name: 'Prompt',
        displayName: 'พรอมท์',
        category: 'sans',
        description: 'โมเดิร์น เป็นมิตร เหมาะกับชีตติว',
        stack: "'Prompt', 'Noto Sans Thai', sans-serif",
    },
    {
        id: 'mitr',
        name: 'Mitr',
        displayName: 'มิตร',
        category: 'sans',
        description: 'สะอาดเรียบ เหมาะกับเด็กเล็ก-มัธยมต้น',
        stack: "'Mitr', 'Sarabun', sans-serif",
    },
    {
        id: 'kanit',
        name: 'Kanit',
        displayName: 'คณิต',
        category: 'sans',
        description: 'หนักแน่น เด่นชัด เหมาะกับหัวข้อใหญ่',
        stack: "'Kanit', 'Noto Sans Thai', sans-serif",
    },
    {
        id: 'k2d',
        name: 'K2D',
        displayName: 'เคทูดี',
        category: 'sans',
        description: 'เรียบง่าย ดูเป็นทางการ',
        stack: "'K2D', 'Sarabun', sans-serif",
    },
    {
        id: 'mali',
        name: 'Mali',
        displayName: 'มะลิ',
        category: 'sans',
        description: 'ตัวกลม น่ารัก เหมาะกับเอกสารเด็ก',
        stack: "'Mali', 'Sarabun', sans-serif",
    },

    // === Serif / Classic ===
    {
        id: 'pridi',
        name: 'Pridi',
        displayName: 'ปรีดี',
        category: 'serif',
        description: 'มีเชิง ดูวิชาการ คลาสสิค',
        stack: "'Pridi', 'Trirong', serif",
    },
    {
        id: 'trirong',
        name: 'Trirong',
        displayName: 'ตรีรงค์',
        category: 'serif',
        description: 'หรูหรา เหมาะกับเอกสารทางการ',
        stack: "'Trirong', 'Pridi', serif",
    },
];

export const DEFAULT_FONT_ID = 'sarabun';

export const FONT_CATEGORIES = [
    { id: 'sans', label: 'Sans (โมเดิร์น)', subtitle: 'เรียบง่าย อ่านง่าย' },
    { id: 'serif', label: 'Serif (คลาสสิค)', subtitle: 'มีเชิง วิชาการ' },
];

export const getFontById = (id) => DOCUMENT_FONTS.find(f => f.id === id) || DOCUMENT_FONTS[0];

export const getFontStack = (id) => getFontById(id).stack;

// Font ids usable as Quill `font` format whitelist + CSS class suffixes (ql-font-<id>)
export const FONT_WHITELIST = DOCUMENT_FONTS.map(f => f.id);

/**
 * Register the document fonts with a Quill instance so the rich-text editor
 * can apply per-selection fonts. Idempotent — safe to call on every Quill load.
 * @param {object} Quill - the Quill class (ReactQuill.Quill)
 */
let _registered = false;
export const registerQuillFonts = (Quill) => {
    if (_registered || !Quill) return;
    const Font = Quill.import('formats/font');
    Font.whitelist = FONT_WHITELIST;
    Quill.register(Font, true);
    _registered = true;
};
