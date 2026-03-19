/**
 * Auto-Tag Generator for Math Questions
 * สร้าง tags อัตโนมัติจากบท (Chapter), หัวข้อย่อย (Sub-topic), และระดับชั้น (Grade)
 * เพื่อให้สามารถ import เข้า kruheem-course ได้ทันที
 */

// รายการคำสำคัญทางคณิตศาสตร์ที่ต้องสกัด
const MATH_KEYWORDS = [
    'มุม', 'เส้นตรง', 'เส้นขนาน', 'สมการ', 'อสมการ', 'ฟังก์ชัน',
    'ลำดับ', 'อนุกรม', 'สามเหลี่ยม', 'สี่เหลี่ยม', 'วงกลม',
    'ทศนิยม', 'เศษส่วน', 'ร้อยละ', 'อัตราส่วน', 'สัดส่วน',
    'ตรีโกณมิติ', 'แคลคูลัส', 'อนุพันธ์', 'ปริพันธ์',
    'ความน่าจะเป็น', 'สถิติ', 'เรขาคณิต', 'พีชคณิต',
    'จำนวนเต็ม', 'จำนวนจริง', 'จำนวนเชิงซ้อน', 'จำนวนนับ',
    'เมทริกซ์', 'เวกเตอร์', 'ลอการิทึม', 'เลขยกกำลัง',
    'พหุนาม', 'ตัวประกอบ', 'ห.ร.ม.', 'ค.ร.น.',
    'พื้นที่', 'ปริมาตร', 'ความยาว', 'มาตราส่วน',
    'กราฟ', 'พิกัด', 'ระบบพิกัด', 'เส้นตัด',
    'มุมแย้ง', 'มุมภายใน', 'มุมภายนอก', 'มุมประกอบ', 'มุมเสริม',
    'ค่าเฉลี่ย', 'มัธยฐาน', 'ฐานนิยม', 'ส่วนเบี่ยงเบนมาตรฐาน',
    'เซต', 'ตรรกศาสตร์', 'การให้เหตุผล',
    'รังสี', 'ส่วนของเส้นตรง', 'เส้นตั้งฉาก',
    'การแปลงทางเรขาคณิต', 'สมมาตร', 'การหมุน', 'การเลื่อนขนาน',
    'ทฤษฎีบทพีทาโกรัส', 'อัตราส่วนตรีโกณมิติ',
    'sin', 'cos', 'tan',
];

// Mapping หมวดหมู่กว้างจากชื่อบท (ใช้คำสำคัญในชื่อบทเพื่อจับ category)
const CATEGORY_PATTERNS = [
    { pattern: /มุม|เส้นตรง|เส้นขนาน|สามเหลี่ยม|สี่เหลี่ยม|วงกลม|เรขาคณิต|พื้นที่|ปริมาตร|ทิศทาง|แผนผัง|พีทาโกรัส|การแปลง|สมมาตร/, tag: 'เรขาคณิต' },
    { pattern: /สมการ|อสมการ|พหุนาม|ตัวประกอบ|พีชคณิต|เลขยกกำลัง|รากที่/, tag: 'พีชคณิต' },
    { pattern: /ฟังก์ชัน|กราฟ|พิกัด|ลอการิทึม|เอกซ์โพเนนเชียล/, tag: 'ฟังก์ชัน' },
    { pattern: /ลำดับ|อนุกรม|ฟีโบนัชชี/, tag: 'ลำดับและอนุกรม' },
    { pattern: /ตรีโกณ|sin|cos|tan/, tag: 'ตรีโกณมิติ' },
    { pattern: /สถิติ|ค่าเฉลี่ย|มัธยฐาน|ฐานนิยม|แผนภูมิ|ข้อมูล/, tag: 'สถิติ' },
    { pattern: /ความน่าจะเป็น/, tag: 'ความน่าจะเป็น' },
    { pattern: /เศษส่วน|ทศนิยม|ร้อยละ|อัตราส่วน|สัดส่วน/, tag: 'จำนวนและการดำเนินการ' },
    { pattern: /จำนวนเต็ม|จำนวนนับ|จำนวนจริง|จำนวนเชิงซ้อน/, tag: 'ระบบจำนวน' },
    { pattern: /เซต|ตรรกศาสตร์|การให้เหตุผล/, tag: 'ตรรกศาสตร์' },
    { pattern: /แคลคูลัส|อนุพันธ์|ปริพันธ์|ลิมิต/, tag: 'แคลคูลัส' },
    { pattern: /เมทริกซ์|เวกเตอร์/, tag: 'เมทริกซ์และเวกเตอร์' },
];

/**
 * สกัดคำสำคัญจากข้อความ
 * @param {string} text - ข้อความที่ต้องการสกัดคำสำคัญ
 * @returns {string[]} คำสำคัญที่สกัดได้
 */
export function extractKeywords(text) {
    if (!text) return [];
    const keywords = [];
    for (const term of MATH_KEYWORDS) {
        if (text.includes(term)) {
            keywords.push(term);
        }
    }
    return keywords;
}

/**
 * จับหมวดหมู่กว้างจากข้อความ
 * @param {string} text - ข้อความรวมของบทและหัวข้อย่อย
 * @returns {string[]} หมวดหมู่ที่ตรง
 */
function detectCategories(text) {
    if (!text) return [];
    const categories = [];
    for (const { pattern, tag } of CATEGORY_PATTERNS) {
        if (pattern.test(text)) {
            categories.push(tag);
        }
    }
    return categories;
}

/**
 * แปลงรหัสระดับชั้นเป็นข้อความสั้น
 * @param {string} grade - รหัสระดับชั้น (เช่น 'M1', 'ENTRANCE_M1', 'GIFTED_M1')
 * @returns {string} ข้อความระดับชั้น
 */
function gradeToTag(grade) {
    if (!grade) return '';
    if (grade === 'ENTRANCE_M1') return 'สอบเข้า ม.1';
    if (grade === 'GIFTED_M1') return 'Gifted ม.1';
    return grade.replace('M', 'ม.');
}

/**
 * สร้าง tags อัตโนมัติจากบท, หัวข้อย่อย, และระดับชั้น
 * @param {string} chapter - ชื่อบท
 * @param {string|string[]} subTopics - หัวข้อย่อย (string เดียวหรือ array)
 * @param {string} grade - รหัสระดับชั้น
 * @returns {string[]} tags ที่สร้างได้ (ไม่ซ้ำ)
 */
export function generateTagsFromSelection(chapter, subTopics, grade) {
    const tags = [];

    // 1. เพิ่มชื่อบทเป็น tag หลัก
    if (chapter) {
        tags.push(chapter);
    }

    // 2. เพิ่มหัวข้อย่อย
    if (subTopics) {
        const topics = Array.isArray(subTopics) ? subTopics : [subTopics];
        for (const t of topics) {
            if (t && t !== '-- ทุกหัวข้อในบทนี้ --' && t !== 'custom') {
                tags.push(t);
            }
        }
    }

    // 3. สกัดคำสำคัญจากชื่อบทและหัวข้อย่อย
    const allText = [chapter, ...(Array.isArray(subTopics) ? subTopics : [subTopics || ''])].join(' ');
    const keywords = extractKeywords(allText);
    tags.push(...keywords);

    // 4. จับหมวดหมู่กว้าง (เรขาคณิต, พีชคณิต, ฯลฯ)
    const categories = detectCategories(allText);
    tags.push(...categories);

    // 5. เพิ่มระดับชั้น
    const gradeTag = gradeToTag(grade);
    if (gradeTag) {
        tags.push(gradeTag);
    }

    // ลบ tag ซ้ำ, ลบค่าว่าง
    return [...new Set(tags.filter(t => t && t.trim()))];
}
