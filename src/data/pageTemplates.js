/**
 * Page Templates สำหรับ WorksheetEditor
 *
 * แบ่งเป็น 3 หมวด:
 *   A. SECTION TEMPLATES  — ชุดเล็ก แทรกในตำแหน่งปัจจุบัน (สูตร, นิยาม, tip, warn, ตัวอย่าง, ฯลฯ)
 *   B. PAGE TEMPLATES     — โครงร่างหน้าเต็มหน้า (หน้าเปิดบท, หน้าเนื้อหา, หน้าแนวข้อสอบ, ฯลฯ)
 *   C. DOCUMENT TEMPLATES — เอกสารทั้งชุด ประกอบจาก B หลายหน้า
 *
 * Print-friendly: ทุก template ใช้พื้นอ่อน ตัวเข้ม
 *   - ห้ามใช้ background สีเข้ม + ตัวอักษรขาว
 *   - ใช้ blockquote + emoji prefix สำหรับ tip/warn (ไม่ต้องสร้าง component ใหม่)
 *   - กล่องสรุป → "เส้น 2 เส้น + ตารางพื้นจาง" แทนพื้นเข้ม
 *
 * Schema item types: markdown / question / image / spacer / divider / text
 *   id จะถูก gen ตอนแทรก (ไม่ต้องใส่ใน template)
 */

// Palette colors — ห้ามใช้สีอื่นนอกพาเลตนี้
// "สมุดเลคเชอร์ครูฮีม" — กระดาษขาว ลายตารางจาง โทน teal/ปะการัง/น้ำเงิน/มิ้นต์
// Contrast ratios (vs white paper #ffffff) target WCAG AA ≥ 4.5:1 for normal text.
// NOTE: key names are kept stable — MarkdownRenderer + page templates consume them.
export const PALETTE = {
    ink: '#26303a',         // near-black slate  ~11:1 ✓
    inkSoft: '#586672',     // muted secondary   ~5.0:1 ✓
    paper: '#ffffff',
    paper2: '#f5f1e6',      // warm paper tint (table header / theorem · formula box bg)
    green: '#0f766e',       // BRAND TEAL — dividers, links, theorem/formula/example icon  4.7:1 ✓
    greenDeep: '#0b5a54',   // deep teal — h1/h2 heading text, summary border  6.4:1 ✓
    greenTint: '#d7efe9',   // light mint — example / summary box bg
    gold: '#b07d18',        // note title / tip border  4.8:1 ✓
    goldTint: '#fff7d6',    // note / tip box bg (cream)
    warn: '#b23a2a',        // warning red  ~6:1 ✓
    warnTint: '#fbe3da',    // light coral
    rule: '#e3dccb',        // hairline divider / table border

    // --- Notebook role tokens (new) — chapter bar, headings, chips, cards ---
    accent: '#e2574c',      // ปะการัง — emphasis, chapter bar bg, numbered chips
    accentDeep: '#c0392b',  // darker coral for text-weight accents
    subhead: '#3a5ba0',     // น้ำเงิน — sub-headings
    varText: '#3a7d2c',     // เขียว — variables / answers
    highlight: '#ffe27a',   // marker-pen highlight (under headings / key terms)
    noteBg: '#fff7d6',
    noteBorder: '#d9b94a',
    noteTitle: '#b07d18',
    cardBg: '#ffffff',
    cardBorder: '#e7e0cf',  // equation card border
    brandTeal: '#0f766e',
    brandYellow: '#fbbf24',
};

// ============================================================
// A. SECTION TEMPLATES
// ============================================================

const A_TEMPLATES = [
    {
        id: 'a1-formula',
        category: 'section',
        templateName: 'สูตรสำคัญ',
        icon: '📐',
        description: 'กล่องสูตรสำคัญ มีเส้นบน-ล่าง คั่น',
        items: [
            { type: 'divider', style: 'solid', thickness: 1, color: PALETTE.ink },
            { type: 'markdown', content: '**สูตร**', size: 'small' },
            { type: 'markdown', content: '$$y = ax + b$$', size: 'large' },
            { type: 'markdown', content: '*คำอธิบายสูตรสั้นๆ*', size: 'small' },
            { type: 'divider', style: 'solid', thickness: 1, color: PALETTE.ink },
        ],
    },
    {
        id: 'a2-theorem',
        category: 'section',
        templateName: 'นิยาม / ทฤษฎีบท',
        icon: '📖',
        description: 'กล่องนิยามหรือทฤษฎีบท พื้นครีม border เขียว',
        items: [
            { type: 'markdown', content: '::: theorem **นิยาม X.X** — *ชื่อทฤษฎีบท* :::', size: 'medium' },
            { type: 'markdown', content: 'เนื้อหานิยาม... $f(x) = ...$', size: 'medium' },
            { type: 'spacer', height: 8 },
        ],
    },
    {
        id: 'a3-tip',
        category: 'section',
        templateName: 'เคล็ดลับ',
        icon: '💡',
        description: 'กล่องเคล็ดลับ พื้นทองอ่อน border ทอง',
        items: [
            { type: 'markdown', content: '> 💡 **เคล็ดลับ:** เนื้อความ...', size: 'medium' },
        ],
    },
    {
        id: 'a4-warn',
        category: 'section',
        templateName: 'ข้อควรระวัง',
        icon: '⚠️',
        description: 'กล่องข้อควรระวัง พื้นแดงอ่อน border แดงเข้ม',
        items: [
            { type: 'markdown', content: '> ⚠️ **ข้อควรระวัง:** เนื้อความ...', size: 'medium' },
        ],
    },
    {
        id: 'a5-example',
        category: 'section',
        templateName: 'ตัวอย่างพร้อมเฉลย',
        icon: '📝',
        description: 'ตัวอย่างโจทย์ + วิธีทำ + คำตอบ',
        items: [
            { type: 'markdown', content: '**ตัวอย่างที่ X** — *หัวข้อ*', size: 'medium' },
            { type: 'markdown', content: '**โจทย์:** ระบุโจทย์...', size: 'medium' },
            { type: 'markdown', content: '**วิธีทำ:**\n1. ขั้นที่ 1...\n2. ขั้นที่ 2...\n3. ขั้นที่ 3...', size: 'medium' },
            { type: 'markdown', content: '**∴ ตอบ:** $\\boxed{...}$', size: 'medium' },
        ],
    },
    {
        id: 'a6-vocab',
        category: 'section',
        templateName: 'คำศัพท์',
        icon: '📚',
        description: 'รายการคำศัพท์ ไทย-อังกฤษ พร้อมคำอธิบาย',
        items: [
            { type: 'markdown', content: '**คำศัพท์**', size: 'medium' },
            { type: 'markdown', content: '- **คำไทย** *english* — คำอธิบาย\n- **คำไทย** *english* — คำอธิบาย', size: 'small' },
        ],
    },
    {
        id: 'a7-summary-box',
        category: 'section',
        templateName: 'สรุปท้ายบท',
        icon: '🎯',
        description: 'สรุปท้ายบท เส้น 2 เส้นบน-ล่าง + ตารางสูตร (ประหยัดหมึก)',
        items: [
            { type: 'divider', style: 'solid', thickness: 2, color: PALETTE.green },
            { type: 'markdown', content: '**🎯 สรุปท้ายบท** — สูตรที่ต้องจำ', size: 'large' },
            { type: 'markdown', content: '| สูตร | ความหมาย |\n|---|---|\n| $a_n = a_1+(n-1)d$ | พจน์ที่ n |\n| $S_n = \\frac{n}{2}(a_1+a_n)$ | ผลบวก n พจน์ |', size: 'medium' },
            { type: 'divider', style: 'solid', thickness: 2, color: PALETTE.green },
        ],
    },
    {
        id: 'a8-subhead',
        category: 'section',
        templateName: 'หัวข้อย่อย',
        icon: '🔖',
        description: 'หัวข้อย่อยพร้อมระยะห่างเหมาะสม',
        items: [
            { type: 'spacer', height: 12 },
            { type: 'markdown', content: '**▸ ชื่อหัวข้อย่อย**', size: 'large' },
            { type: 'spacer', height: 4 },
        ],
    },
    {
        id: 'a9-note',
        category: 'section',
        templateName: 'กล่องจดบันทึก',
        icon: '📝',
        description: 'กล่องโน้ตพื้นครีม ขอบมน สำหรับจดบันทึก/สรุป',
        items: [
            {
                type: 'markdown',
                content: '📝 **บันทึก**\n\n*เขียนสรุปหรือโน้ตของคุณที่นี่...*',
                size: 'medium',
                borderStyle: 'solid',
                borderWidth: 2,
                borderColor: PALETTE.noteBorder,
                fillColor: PALETTE.goldTint,
                borderRadius: 12,
            },
        ],
    },
    {
        id: 'a10-scratch',
        category: 'section',
        templateName: 'กล่องทดเลข',
        icon: '✏️',
        description: 'กล่องลายตารางกระดาษทดเลข สำหรับให้นักเรียนทดเลข/แสดงวิธีทำ',
        items: [
            { type: 'spacer', height: 200, paperStyle: 'scratch' },
        ],
    },
    {
        id: 'a11-topic-header',
        category: 'section',
        templateName: 'หัวข้อหลัก (ป้ายชั้น + ชื่อบท)',
        icon: '🏷️',
        description: 'แถบหัวข้อหลัก: ป้ายระดับชั้นสีปะการัง + ชื่อบทไฮไลต์เหลือง + คำค้นภาษาอังกฤษ',
        items: [
            { type: 'markdown', content: '```topic\nม.X\nชื่อหัวข้อบทเรียน · คำอธิบายสั้นๆ ของบทนี้\nคำค้นภาษาอังกฤษ · เว็บไซต์ของคุณ\n```', size: 'medium' },
        ],
    },
];

// ============================================================
// B. PAGE TEMPLATES
// ============================================================

const B_TEMPLATES = [
    {
        id: 'b1-chapter-open',
        category: 'page',
        templateName: 'หน้าเปิดบท',
        icon: '📘',
        description: 'หน้าเปิดบท: บทที่ + ชื่อบท + บทนำ + วัตถุประสงค์',
        items: [
            { type: 'markdown', content: '**บทที่ X**', size: 'small' },
            { type: 'markdown', content: '# ชื่อบทเรียน', size: 'large' },
            { type: 'markdown', content: '*Chapter Title in English*', size: 'medium' },
            { type: 'divider', style: 'solid', thickness: 1, color: PALETTE.green },
            { type: 'spacer', height: 16 },
            { type: 'markdown', content: '**บทนำ** — ภาพรวมของบทเรียน...', size: 'medium' },
            { type: 'spacer', height: 12 },
            { type: 'markdown', content: '**🎯 วัตถุประสงค์**\n1. ระบุวัตถุประสงค์ที่ 1\n2. ระบุวัตถุประสงค์ที่ 2\n3. ระบุวัตถุประสงค์ที่ 3', size: 'medium' },
        ],
    },
    {
        id: 'b2-content',
        category: 'page',
        templateName: 'หน้าเนื้อหา + ตัวอย่าง',
        icon: '📄',
        description: 'เนื้อหา + สูตร + ตัวอย่าง + เคล็ดลับ',
        items: [
            { type: 'markdown', content: '## X.X ชื่อหัวข้อ', size: 'large' },
            { type: 'markdown', content: 'เนื้อหาอธิบายแนวคิด...', size: 'medium' },
            { type: 'markdown', content: '> 📐 **สูตร:** $...$', size: 'medium' },
            { type: 'spacer', height: 8 },
            { type: 'markdown', content: '**ตัวอย่างที่ 1**\n**โจทย์:** ...\n**วิธีทำ:** ...\n**∴ ตอบ:** ...', size: 'medium' },
            { type: 'markdown', content: '> 💡 **เคล็ดลับ:** ...', size: 'small' },
        ],
    },
    {
        id: 'b3-exam',
        category: 'page',
        templateName: 'หน้าแนวข้อสอบ',
        icon: '📝',
        description: 'แนวข้อสอบ + โจทย์ตัวอย่าง + เฉลย + ข้อควรระวัง',
        items: [
            { type: 'markdown', content: '> 📝 **แนวข้อสอบ**', size: 'large' },
            { type: 'spacer', height: 12 },
            {
                type: 'question',
                question: 'ตัวอย่างโจทย์...',
                options: ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3', 'ตัวเลือก 4'],
                correctIndex: 0,
                solution: 'เฉลย...',
                layoutColumn: 2,
            },
            { type: 'markdown', content: '> ⚠️ **ข้อควรระวัง:** ...', size: 'medium' },
            { type: 'divider', style: 'solid', thickness: 2, color: PALETTE.rule },
        ],
    },
    {
        id: 'b4-graded-practice',
        category: 'page',
        templateName: 'โจทย์ฝึกแบ่งระดับ',
        icon: '📚',
        description: 'โจทย์ฝึก 3 ระดับ: ง่าย / กลาง / ท้าทาย',
        items: [
            { type: 'markdown', content: '## 📚 โจทย์ฝึก (ระดับบันได)', size: 'large' },
            { type: 'markdown', content: '🟢 **ระดับง่าย**', size: 'medium' },
            { type: 'question', question: 'ข้อ 1. ...', options: [], solution: '...', layoutColumn: 1 },
            { type: 'spacer', height: 8 },
            { type: 'markdown', content: '🟡 **ระดับกลาง**', size: 'medium' },
            { type: 'question', question: 'ข้อ 2. ...', options: [], solution: '...', layoutColumn: 1 },
            { type: 'spacer', height: 8 },
            { type: 'markdown', content: '🔴 **ระดับท้าทาย**', size: 'medium' },
            { type: 'question', question: 'ข้อ 3. ...', options: [], solution: '...', layoutColumn: 1 },
        ],
    },
    {
        id: 'b5-summary',
        category: 'page',
        templateName: 'หน้าสรุป',
        icon: '🎯',
        description: 'สรุปท้ายบท: สูตรสำคัญ + checklist ก่อนสอบ',
        items: [
            { type: 'markdown', content: '## 🎯 สรุปท้ายบท', size: 'large' },
            { type: 'divider', style: 'solid', thickness: 1, color: PALETTE.green },
            { type: 'markdown', content: '**สูตรสำคัญ**\n\n| สูตร | ใช้เมื่อ |\n|---|---|\n| ... | ... |', size: 'medium' },
            { type: 'spacer', height: 12 },
            { type: 'markdown', content: '**✅ Checklist ก่อนสอบ**\n- [ ] เข้าใจ ...\n- [ ] ทำโจทย์ ... ได้\n- [ ] จำสูตร ... ได้', size: 'medium' },
        ],
    },
];

// ============================================================
// C. DOCUMENT TEMPLATES (composition of B)
// ============================================================
//   C1 = B1 + B2×3 + B4 + B5         → ใบงาน 6 หน้า
//   C2 = B1 + B2×4 + B3×2 + B4 + B5  → ชีตติว 10-12 หน้า
//   C3 = B3×N + B5                    → ใบข้อสอบ
//
// แต่ละหน้า "B" แทรกเป็น page ใหม่ — กลไก insertion จะแยกหน้าให้

const findTemplateById = (id) => [...A_TEMPLATES, ...B_TEMPLATES].find(t => t.id === id);

const C_TEMPLATES = [
    {
        id: 'c1-worksheet',
        category: 'document',
        templateName: 'ใบงานคณิตศาสตร์ 6 หน้า',
        icon: '📋',
        description: 'หน้าเปิดบท + เนื้อหา 3 หน้า + ฝึกแบ่งระดับ + สรุป',
        pages: [
            'b1-chapter-open',
            'b2-content',
            'b2-content',
            'b2-content',
            'b4-graded-practice',
            'b5-summary',
        ],
    },
    {
        id: 'c2-tutorial-sheet',
        category: 'document',
        templateName: 'ชีตติว 10-12 หน้า',
        icon: '📓',
        description: 'หน้าเปิดบท + เนื้อหา 4 หน้า + แนวข้อสอบ 2 หน้า + ฝึก + สรุป',
        pages: [
            'b1-chapter-open',
            'b2-content',
            'b2-content',
            'b2-content',
            'b2-content',
            'b3-exam',
            'b3-exam',
            'b4-graded-practice',
            'b5-summary',
        ],
    },
    {
        id: 'c3-exam-sheet',
        category: 'document',
        templateName: 'ใบข้อสอบ',
        icon: '📑',
        description: 'แนวข้อสอบ × N หน้า + สรุปท้าย',
        pages: [
            'b3-exam',
            'b3-exam',
            'b3-exam',
            'b5-summary',
        ],
    },
];

// Expand document template → array of page item-arrays
export const expandDocumentTemplate = (docTemplate) => {
    return docTemplate.pages.map(pageId => {
        const tmpl = findTemplateById(pageId);
        return tmpl ? tmpl.items : [];
    });
};

// ============================================================
// EXPORTS
// ============================================================

export const SECTION_TEMPLATES = A_TEMPLATES;
export const PAGE_TEMPLATES = B_TEMPLATES;
export const DOCUMENT_TEMPLATES = C_TEMPLATES;

export const ALL_TEMPLATES = [...A_TEMPLATES, ...B_TEMPLATES, ...C_TEMPLATES];

export const TEMPLATE_CATEGORIES = [
    { id: 'section', label: 'Section', subtitle: 'แทรกในตำแหน่งที่เลือก', templates: A_TEMPLATES },
    { id: 'page', label: 'Page', subtitle: 'เพิ่มเป็นหน้าใหม่', templates: B_TEMPLATES },
    { id: 'document', label: 'Document', subtitle: 'สร้างเอกสารทั้งชุด', templates: C_TEMPLATES },
];
