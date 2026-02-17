import React, { useState, useEffect, useRef } from 'react';
import { savePromptSettings, loadPromptSettings } from '../firebase';
import {
    Sparkles, Copy, Check, Terminal, Zap, FileText,
    BookOpen, Layers, Type, Sliders, Settings, ExternalLink, Brain, ChevronDown, List, PenTool, Paperclip, Undo2, Calendar, Image as ImageIcon, ScanText
} from 'lucide-react';
import { IPST_CURRICULUM, getChapters, getChapterObject } from '../data/thaiMathCurriculum';

const DEFAULT_FORM_DATA = {
    mode: 'content',
    grade: 'M1',
    term: '1',
    subjectType: 'Basic',
    source: 'ai-free',
    chapter: '',
    selectedTopic: '',
    customTopic: '',
    tone: 'friendly',
    difficulty: 'medium',
    components: {
        formula: true,
        mistake: false,
        shortcut: false,
        trivia: false,
        vocab: false,
        problemSolving: false
    },
    svgImageType: 'geometry',
    contentLength: 'long',
    questionCount: 10,
    questionType: 'objective',
    wordProblemType: 'objective'
};

const PromptBuilderPage = () => {
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [availableChapters, setAvailableChapters] = useState([]);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const isInitialLoad = useRef(true);

    // Load from Firestore on mount
    useEffect(() => {
        const load = async () => {
            const saved = await loadPromptSettings();
            if (saved) setFormData(saved);
            setTimeout(() => { isInitialLoad.current = false; }, 500);
        };
        load();
    }, []);

    // Auto-save to Firestore
    useEffect(() => {
        if (isInitialLoad.current) return;
        savePromptSettings(formData);
    }, [formData]);

    useEffect(() => {
        const chapters = getChapters(formData.grade, formData.term, formData.subjectType);
        setAvailableChapters(chapters);
    }, [formData.grade, formData.term, formData.subjectType]);

    useEffect(() => {
        if (formData.chapter && formData.chapter !== 'custom') {
            const chapterObj = getChapterObject(formData.grade, formData.term, formData.chapter, formData.subjectType);
            if (chapterObj && chapterObj.topics) {
                setAvailableTopics(chapterObj.topics);
            } else {
                setAvailableTopics([]);
            }
        } else {
            setAvailableTopics([]);
        }
    }, [formData.chapter, formData.grade, formData.term, formData.subjectType]);

    useEffect(() => {
        const topic = formData.selectedTopic === 'custom' ? formData.customTopic : formData.selectedTopic;
        const mode = formData.mode;

        const toneMap = {
            friendly: 'พูดจาเป็นกันเอง อบอุ่น ใจดี ให้กำลังใจนักเรียน',
            academic: 'ใช้ภาษาวิชาการ เน้นความถูกต้องและเป็นระบบ',
            fun: 'สนุกสนาน เปรียบเทียบกับชีวิตจริง มีมุกตลกแทรก',
            detailed: 'อธิบายละเอียดทุกขั้นตอน เน้นให้เข้าใจลึกซึ้ง'
        };
        const toneDesc = toneMap[formData.tone] || toneMap.friendly;

        let promptText = `รับบทเป็น "ครูฮีม" ครูสอนคณิตศาสตร์ที่${toneDesc} `;
        promptText += `แทนตัวเองว่า "ครูฮีม" เวลาพูดกับนักเรียน `;
        promptText += `ช่วยสร้างเนื้อหาการสอนวิชาคณิตศาสตร์ `;
        promptText += `เรื่อง "${formData.chapter}" `;
        if (topic) promptText += `หัวข้อเจาะจง "${topic}" `;
        promptText += `สำหรับนักเรียนชั้น ${formData.grade} (หลักสูตร สสวท.)\n\n`;

        let qType = '';
        if (formData.questionType === 'word_problem') {
            qType = formData.wordProblemType === 'subjective'
                ? 'โจทย์ปัญหาแสดงวิธีทำ (Word Problem - Subjective)'
                : 'โจทย์ปัญหาแบบตัวเลือก (Word Problem - Objective)';
        } else {
            qType = formData.questionType === 'subjective' ? 'อัตนัย (แสดงวิธีทำ)' : 'ปรนัย (ตัวเลือก 4 ข้อ)';
        }

        if (mode === 'exam') {
            promptText += `เป้าหมาย: ออกข้อสอบแบบ${qType} จำนวน ${formData.questionCount || 5} ข้อ (ความยาก: ${formData.difficulty})\n`;
        } else if (mode === 'practice') {
            promptText += `เป้าหมาย: สร้างแบบฝึกหัดแบบ${qType} จำนวน ${formData.questionCount || 5} ข้อ (ความยาก: ${formData.difficulty})\n`;
        } else if (mode === 'summary') {
            promptText += `เป้าหมาย: สรุปสูตรแบบ Cheat Sheet ให้อ่านจบใน 5 นาทีแล้วเข้าห้องสอบได้เลย\n`;
            promptText += `
---
**บทบาทพิเศษ: ติวเตอร์หน้าห้องสอบ (Cheat Sheet Mode)**

กฎเหล็กในการสรุป:
1. **คัดเน้นๆ (High-Yield Only):** สรุปเฉพาะเนื้อหาและสูตรที่เป็น 'หัวใจสำคัญ' หรือ 'ออกสอบบ่อย' เท่านั้น ตัดประวัติความเป็นมา หรือคำอธิบายพื้นฐานที่ยืดยาวทิ้งทั้งหมด
2. **ห้ามเกริ่นนำ:** เริ่มต้นที่สูตรหรือคอนเซปต์เลย ห้ามมีประโยคเปิดเรื่อง (เช่น 'ในบทนี้เราจะมาเรียนรู้...')
3. **กระชับที่สุด:** ใช้ Bullet Point สั้นๆ หรือตารางเปรียบเทียบ

โครงสร้างที่ต้องมี:
- ใช้ > 📘 **สูตรหลัก:** (สูตรที่ต้องจำ)
- ใช้ > ⚠️ **จุดตาย:** (จุดที่นักเรียนมักพลาด หรือโดนหลอกในข้อสอบ)
- ใช้ > 💡 **เทคนิค:** (สูตรลัด หรือวิธีจำให้เร็วขึ้น)

**เป้าหมายสูงสุด:** ทำให้นักเรียนอ่านจบใน 5 นาทีแล้วมีความมั่นใจเดินเข้าห้องสอบได้ทันที
---
`;
        } else if (mode === 'svg_question') {
            const svgTypeMap = {
                geometry: 'รูปทรงเรขาคณิต (สามเหลี่ยม สี่เหลี่ยม วงกลม ฯลฯ)',
                graph: 'กราฟเส้นตรง กราฟพาราโบลา หรือระบบพิกัด',
                number_line: 'เส้นจำนวน (Number Line)',
                diagram: 'แผนภาพ (Venn Diagram, Tree Diagram ฯลฯ)',
                mixed: 'ผสมหลายแบบ (เรขาคณิต, กราฟ, แผนภาพ ตามความเหมาะสมของโจทย์)'
            };
            const svgDesc = svgTypeMap[formData.svgImageType] || svgTypeMap.geometry;
            const svgQType = formData.questionType === 'subjective' ? 'อัตนัย (แสดงวิธีทำ)' : 'ปรนัย (ตัวเลือก 4 ข้อ)';

            promptText += `เป้าหมาย: สร้างโจทย์คณิตศาสตร์แบบ${svgQType} จำนวน ${formData.questionCount || 5} ข้อ **พร้อมรูปภาพประกอบ (SVG)** (ความยาก: ${formData.difficulty})\n`;
            promptText += `ประเภทรูปภาพ: ${svgDesc}\n`;
            promptText += `
---
**บทบาทพิเศษ: นักออกแบบโจทย์พร้อมรูปภาพ (Visual Math Question Designer)**

**กฎเหล็กสำหรับ SVG (สำคัญมาก):**
1. **เส้นสีดำเท่านั้น:** ทุกเส้นใน SVG ต้องใช้ stroke="#000000" เท่านั้น ห้ามใช้สีอื่น
2. **เส้นหนาและคม:** กำหนด stroke-width="2.5" เป็นอย่างน้อย เพื่อให้มองเห็นชัดเจนเมื่อพิมพ์
3. **พื้นหลังขาว:** ใช้ fill="none" สำหรับรูปทรง (ยกเว้นพื้นที่แรเงาใช้ fill="#e5e5e5")
4. **ตัวอักษรกำกับห้ามทับเส้น:** ตัวเลข/ตัวอักษร (เช่น ชื่อจุด A, B, C หรือความยาวด้าน) ต้องมีระยะห่างจากเส้นรูปทรงอย่างน้อย 8px
5. **ขนาด SVG:** กำหนด viewBox="0 0 300 250" (ปรับตามความเหมาะสม) width="300" height="250"
6. **ฟอนต์:** ใช้ font-family="sans-serif" font-size="16" font-weight="bold" fill="#000"
7. **ห้ามใช้ CSS ภายนอก:** ทุก style ต้องเป็น inline attribute ใน SVG element
8. **SVG ต้องสมบูรณ์:** ต้องขึ้นต้นด้วย <svg และปิดด้วย </svg> เสมอ
9. **ความสมบูรณ์ของรูปภาพ (สำคัญที่สุด):** รูปภาพต้องวาดครบถ้วนสมบูรณ์ทุกส่วน ห้ามตัดขาด ห้ามวาดไม่จบ ต้องตรวจสอบว่ารูปทรงทุกเส้นเชื่อมต่อกันครบ ทุกจุดยอดมีตัวอักษรกำกับ และทุกมิติที่จำเป็นต้องมีตัวเลขกำกับ
10. **Margin ภายใน:** ทุก element ต้องอยู่ภายใน viewBox โดยเว้นขอบอย่างน้อย 15px ห้ามมีส่วนใดถูกตัดออกนอกกรอบ

**มาตรฐานการวางตัวอักษร:**
- จุดยอด (Vertex): วางตัวอักษรห่างจากจุดประมาณ 12px ในทิศทางตรงข้ามกับรูปทรง
- ความยาวด้าน: วางตัวเลขตรงกลางด้านนั้น ห่างจากเส้นออกไปด้านนอกประมาณ 15px
- มุม: วางสัญลักษณ์มุมใกล้จุดยอดแต่ไม่ทับเส้น
---
`;
        } else if (mode === 'transcribe') {
            const tType = formData.questionType === 'subjective' ? 'อัตนัย (แสดงวิธีทำ)' : 'ปรนัย (ตัวเลือก 4 ข้อ)';
            promptText += `เป้าหมาย: **พิมพ์โจทย์ตามเอกสาร/รูปภาพที่แนบมา** ให้เหมือนต้นฉบับทุกประการ (ประเภท: ${tType})\n`;
            promptText += `
---
**บทบาทพิเศษ: นักพิมพ์โจทย์ตามต้นฉบับ (Transcription Mode)**

**กฎเหล็กในการพิมพ์ตาม:**
1. **พิมพ์ตามต้นฉบับเป๊ะ:** พิมพ์โจทย์ทุกข้อให้เหมือนกับเอกสาร/รูปภาพที่แนบมาทุกประการ ห้ามเปลี่ยนตัวเลข ห้ามเปลี่ยนคำ ห้ามสรุปย่อ
2. **ห้ามใส่หมายเลขข้อ:** ห้ามใส่เลขข้อ (เช่น "1." "2." "ข้อ 1") นำหน้าโจทย์ เพราะระบบจะนับเลขข้อให้อัตโนมัติ
3. **ห้ามใส่ prefix ตัวเลือก:** ห้ามใส่ "ก." "ข." "ค." "ง." นำหน้าตัวเลือก เพราะระบบจะใส่ให้อัตโนมัติ
4. **ใช้ LaTeX สำหรับสมการ:** สูตรคณิตศาสตร์ทุกตัวต้องเขียนด้วย LaTeX (เช่น $x^2 + 3x = 0$)
5. **รักษาความหมายเดิม:** หากตัวอักษรในรูปภาพไม่ชัด ให้ตีความตามบริบทคณิตศาสตร์
6. **แยกโจทย์แต่ละข้อ:** แต่ละข้อเป็น 1 object ใน JSON Array

**ข้อควรระวัง:**
- หากโจทย์ต้นฉบับมีรูปภาพประกอบ ให้อธิบายรูปเป็นข้อความสั้นๆ ใน "question" (เช่น "จากรูป สามเหลี่ยม ABC มีด้าน AB = 5 cm...")
- หากมีสูตรหรือสมการ ต้องใช้ LaTeX เท่านั้น
- พิมพ์ทุกข้อที่เห็นในเอกสาร ห้ามข้ามข้อใดข้อหนึ่ง
---
`;
        } else if (mode === 'mistake') {
            promptText += `เป้าหมาย: วิเคราะห์เจาะลึกกลไกและตรรกะเบื้องหลัง ไม่พูดเรื่องผิวเผิน\n`;
            promptText += `
---
**บทบาทพิเศษ: นักวิเคราะห์เชิงลึก (Deep Dive Analysis Mode)**

กฎเหล็กในการวิเคราะห์:
1. **ห้ามเกริ่นนำภาพรวม:** ห้ามอธิบายความหมายกว้างๆ ของหัวข้อ (เช่น ถ้าวิเคราะห์เรื่อง 'การคูณเลขยกกำลัง' ไม่ต้องอธิบายว่าเลขยกกำลังคืออะไร)
2. **เจาะที่ 'กลไก' (Mechanism):** วิเคราะห์ว่า 'ทำไม' สูตรนี้ถึงเป็นแบบนี้ หรือ 'ตรรกะเบื้องหลัง' คืออะไร
3. **เชื่อมโยง (Connections):** แสดงความสัมพันธ์ระหว่างหัวข้อนี้กับหัวข้ออื่นที่เกี่ยวข้อง

โครงสร้างที่ต้องมี:
- **การทำงาน:** อธิบายกลไกการทำงานทีละขั้นตอน (Step-by-step logic)
- **สาเหตุของปัญหา:** วิเคราะห์ว่าทำไมคนส่วนใหญ่ถึงไม่เข้าใจเรื่องนี้
- **การประยุกต์ใช้:** วิเคราะห์สถานการณ์ที่ต้องใช้ความรู้นี้แก้ปัญหา

**เป้าหมายสูงสุด:** ให้ผู้อ่านเข้าใจ 'แก่นแท้' ของเรื่องนั้นอย่างทะลุปรุโปร่ง ไม่ใช่แค่จำสูตรได้
---
`;
        } else {
            promptText += `เป้าหมาย: อธิบายเนื้อหาแบบเต็มที่ เจาะลึก และละเอียดที่สุด (ห้ามสรุปย่อ) พร้อมสอนวิธีทำอย่างเป็นขั้นตอน\n`;
        }

        // --- Logic for Extra Options (Components) ---
        const activeComponents = [];
        if (formData.components.formula) activeComponents.push('สรุปสูตรสำคัญ (Formula)');
        if (formData.components.shortcut) activeComponents.push('เทคนิคลัด (Shortcuts & Tricks)');
        if (formData.components.trivia) activeComponents.push('เกร็ดความรู้ (Trivia)');
        if (formData.components.vocab) activeComponents.push('คำศัพท์เทคนิค (Technical Terms)');
        if (formData.components.mistake) activeComponents.push('จุดที่มักผิด (Common Mistakes)');
        if (formData.components.problemSolving) activeComponents.push('โจทย์ปัญหาและการแก้ปัญหา (Word Problems)');

        if (activeComponents.length > 0) {
            promptText += `\n**องค์ประกอบเพิ่มเติมที่ต้องมี (Requirements):**\nช่วยเน้นหรือแทรกเนื้อหาเกี่ยวกับ: ${activeComponents.join(', ')} ให้เหมาะสมกับบทเรียน\n`;
        }
        // ------------------------------------------

        promptText += `
---
**รูปแบบการเขียน (STYLE GUIDE) - สำคัญมาก:**
เพื่อให้เอกสารอ่านง่ายและสวยงาม ต้องใช้สัญลักษณ์ Markdown ดังนี้เท่านั้น:

1. **โครงสร้าง:**
   - หัวข้อหลัก (Title): ใช้ # (เช่น # จำนวนเต็ม)
   - หัวข้อย่อย (Sub-topic): ใช้ ## (เช่น ## 1. การบวก)
   - รายการ: ใช้ - หรือ 1.

2. **กล่องข้อความพิเศษ (Callout Blocks):**
   *ต้องขึ้นต้นบรรทัดด้วยสัญลักษณ์นี้เป๊ะๆ เพื่อให้ระบบแปลงเป็นกล่องสวยงาม:*
   - **นิยาม/สูตร:** ใช้ "> 📘 **นิยาม:** ..."
   - **ข้อควรระวัง:** ใช้ "> ⚠️ **ข้อควรระวัง:** ..."
   - **เทคนิค/สูตรลัด:** ใช้ "> 💡 **เทคนิค:** ..."
   - **ตัวอย่าง:** ใช้ "> 📝 **ตัวอย่าง:** ..."

3. **คณิตศาสตร์ (Math & Equations) - สำคัญมาก:**
   - **กฎเหล็ก:** ทุกๆ สมการ, นิพจน์, ตัวแปร, หรือตัวเลขที่มีสัญลักษณ์ทางคณิตศาสตร์ **ต้องอยู่ในเครื่องหมาย $$ ... $$ หรือ $ ... $ เสมอ**
   - ห้ามใช้ตัวหนา Markdown (**...**) กับสัญลักษณ์คณิตศาสตร์ ให้ใช้ LaTeX แทนเท่านั้น
   - สัญลักษณ์อย่าง \`\`\\times\`\`, \`\`\\div\`\`, \`\`\\frac\`\`, \`\`^\`\`, \`\`\\sqrt\`\` **ห้ามอยู่นอกเครื่องหมายดอลล่าร์เด็ดขาด** เพราะจะทำให้การแสดงผลผิดพลาด (เช่น จะกลายเป็น imes แทนเครื่องหมายคูณ)
   - ตัวอย่างที่ถูกต้อง:
     - ใช้ \`\`$$(-4) \\times (-4)$$\`\` แทน \`\`(-4) \\times (-4)\`\`
     - ใช้ \`\`$x = 2$\`\` แทน **x = 2**
   - **กฎเหล็กเพิ่มเติมสำหรับสมการหลายบรรทัด:** ถ้าต้องใช้ \\begin{array} หรือ \\begin{aligned} ภายใน $$ ... $$ block **ห้ามวางไว้ในบรรทัดที่ขึ้นต้นด้วย > (blockquote)** เพราะจะทำให้ระบบแสดงผลเป็น Raw Text ให้ปิด blockquote (เว้นบรรทัดว่าง) เขียน $$ block แยกออกมา แล้วค่อยเปิด blockquote ใหม่
---
`;

        promptText += `\n**กฎเหล็กสำหรับ "question" field (สำคัญมาก):**
- **ห้ามใส่หมายเลขข้อ** นำหน้าโจทย์เด็ดขาด (ห้ามใส่ "ข้อที่ 1:", "ข้อ 1.", "1.", "1)" ฯลฯ) เพราะระบบจะนับเลขข้อให้อัตโนมัติ
- **ห้ามใช้ blockquote (>) ใน "question"** เพราะจะทำให้เกิดกล่องข้อความที่ไม่จำเป็น ให้เขียนเป็นข้อความปกติ
- **ห้ามใช้ Callout Block** (เช่น "> 📘 โจทย์:", "> 📝 โจทย์:") ใน "question" field ให้เขียนโจทย์เป็นข้อความธรรมดาเท่านั้น

`;
        promptText += `**สิ่งที่ต้องส่งกลับมา (Output Requirements):**\n`;

        const isDetailed = formData.contentLength === 'very_long';
        const solutionTypeDesc = isDetailed
            ? "เฉลยแบบละเอียด: ต้องมีส่วนประกอบ 1) **หลักการคิด (Principle)** 2) **วิธีทำอย่างละเอียดเป็นขั้นตอน** 3) **สรุปจุดที่ควรระวัง (Precautions)** และ 4) **Danger Zone (จุดที่ผิดบ่อย)**"
            : "เฉลยแบบสั้น: ให้เน้นการเฉลยแสดงวิธีทำอย่างเดียว ไม่ต้องพูดถึงหลักการคิดหรือข้อควรระวัง โดยให้ความยาวของการเฉลยประมาณ 3-4 บรรทัด";

        const solutionTemplateSuffix = isDetailed
            ? "(ใช้ Markdown ตาม Style Guide ด้านบน เช่น มีกล่อง > 📘 หลักการ, > ⚠️ ข้อควรระวัง, และวิธีทำเป็นขั้นตอน)"
            : "(ใช้ Markdown ตาม Style Guide ด้านบน โดยแสดงวิธีทำสั้นๆ กระชับ)";

        if (mode === 'svg_question') {
            const isSubjective = formData.questionType === 'subjective';
            if (isSubjective) {
                promptText += `ส่งผลลัพธ์เป็น **JSON Array** เท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) ตามโครงสร้างนี้:
[
  {
    "question": "โจทย์ (ใช้ LaTeX สำหรับสมการ)",
    "svg": "<svg viewBox=\\"0 0 300 250\\" width=\\"300\\" height=\\"250\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>",
    "answer": "คำตอบที่ถูกต้อง",
    "solution": "${solutionTypeDesc} ${solutionTemplateSuffix}",
    "space": "large"
  }
]
**สำคัญ:**
- ห้ามใส่ "options" เพราะเป็นข้อสอบอัตนัย (แสดงวิธีทำ) ไม่มีตัวเลือก
- **"svg" ต้องเป็น SVG code string สมบูรณ์** ที่ปฏิบัติตามกฎเหล็ก SVG ด้านบนทุกข้อ
- ทุกข้อต้องมี "svg" field เสมอ ห้ามเว้น`;
            } else {
                promptText += `ส่งผลลัพธ์เป็น **JSON Array** เท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) ตามโครงสร้างนี้:
[
  {
    "question": "โจทย์ (ใช้ LaTeX สำหรับสมการ)",
    "svg": "<svg viewBox=\\"0 0 300 250\\" width=\\"300\\" height=\\"250\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>",
    "options": ["เนื้อหาตัวเลือกที่ 1", "เนื้อหาตัวเลือกที่ 2", "เนื้อหาตัวเลือกที่ 3", "เนื้อหาตัวเลือกที่ 4"],
    "answer": "คำตอบที่ถูกต้อง",
    "solution": "${solutionTypeDesc} ${solutionTemplateSuffix}",
    "space": "medium"
  }
]
**สำคัญ:**
- ต้องมี "options" ครบ 4 ตัวเลือกเสมอ
- **ห้ามใส่ prefix "ก." "ข." "ค." "ง." นำหน้าตัวเลือก** เพราะระบบจะใส่ให้อัตโนมัติ (เช่น ใส่แค่ "รูปสามเหลี่ยม" ไม่ใช่ "ก. รูปสามเหลี่ยม")
- **"svg" ต้องเป็น SVG code string สมบูรณ์** ที่ปฏิบัติตามกฎเหล็ก SVG ด้านบนทุกข้อ
- ทุกข้อต้องมี "svg" field เสมอ ห้ามเว้น`;
            }
        } else if (mode === 'transcribe') {
            const isSubjective = formData.questionType === 'subjective';
            if (isSubjective) {
                promptText += `ส่งผลลัพธ์เป็น **JSON Array** เท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) ตามโครงสร้างนี้:
[
  {
    "question": "โจทย์ตามต้นฉบับ (ใช้ LaTeX สำหรับสมการ) ห้ามใส่เลขข้อ",
    "answer": "คำตอบ (ถ้ามีในต้นฉบับ)",
    "solution": "เฉลย/วิธีทำ (ถ้ามีในต้นฉบับ หรือเว้นว่างไว้)",
    "space": "large"
  }
]
**สำคัญ:**
- ห้ามใส่ "options" เพราะเป็นข้อสอบอัตนัย
- **ห้ามใส่หมายเลขข้อนำหน้า** โจทย์ในทุกกรณี
- หากต้นฉบับไม่มีเฉลย ให้ใส่ "solution" เป็น ""
- แนบเอกสาร/รูปภาพโจทย์ไปพร้อมกับคำสั่งนี้ใน Gemini`;
            } else {
                promptText += `ส่งผลลัพธ์เป็น **JSON Array** เท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) ตามโครงสร้างนี้:
[
  {
    "question": "โจทย์ตามต้นฉบับ (ใช้ LaTeX สำหรับสมการ) ห้ามใส่เลขข้อ",
    "options": ["เนื้อหาตัวเลือกที่ 1", "เนื้อหาตัวเลือกที่ 2", "เนื้อหาตัวเลือกที่ 3", "เนื้อหาตัวเลือกที่ 4"],
    "answer": "คำตอบที่ถูกต้อง",
    "solution": "เฉลย/วิธีทำ (ถ้ามีในต้นฉบับ หรือเว้นว่างไว้)",
    "space": "medium"
  }
]
**สำคัญ:**
- **ห้ามใส่หมายเลขข้อนำหน้า** โจทย์ในทุกกรณี
- **ห้ามใส่ prefix "ก." "ข." "ค." "ง." นำหน้าตัวเลือก** เพราะระบบจะใส่ให้อัตโนมัติ
- ต้องมี "options" ครบ 4 ตัวเลือกเสมอ (ตามต้นฉบับ)
- หากต้นฉบับไม่มีเฉลย ให้ใส่ "solution" เป็น ""
- แนบเอกสาร/รูปภาพโจทย์ไปพร้อมกับคำสั่งนี้ใน Gemini`;
            }
        } else if (mode === 'exam' || mode === 'practice') {
            const isSubjective = formData.questionType === 'subjective' || (formData.questionType === 'word_problem' && formData.wordProblemType === 'subjective');

            if (isSubjective) {
                promptText += `ส่งผลลัพธ์เป็น **JSON Array** เท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) ตามโครงสร้างนี้:
[
  {
    "question": "โจทย์ (ใช้ LaTeX สำหรับสมการ)",
    "answer": "คำตอบที่ถูกต้อง",
    "solution": "${solutionTypeDesc} ${solutionTemplateSuffix}",
    "space": "large" (เว้นที่ว่างสำหรับเขียนวิธีทำ: small/medium/large)
  }
]
**สำคัญ:** ห้ามใส่ "options" เพราะเป็นข้อสอบอัตนัย (แสดงวิธีทำ) ไม่มีตัวเลือก`;
            } else {
                promptText += `ส่งผลลัพธ์เป็น **JSON Array** เท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) ตามโครงสร้างนี้:
[
  {
    "question": "โจทย์ (ใช้ LaTeX สำหรับสมการ)",
    "options": ["เนื้อหาตัวเลือกที่ 1", "เนื้อหาตัวเลือกที่ 2", "เนื้อหาตัวเลือกที่ 3", "เนื้อหาตัวเลือกที่ 4"],
    "answer": "คำตอบที่ถูกต้อง",
    "solution": "${solutionTypeDesc} ${solutionTemplateSuffix}",
    "space": "medium" (เว้นที่ว่าง: small/medium/large)
  }
]
**สำคัญ:** ต้องมี "options" ครบ 4 ตัวเลือกเสมอ **ห้ามใส่ prefix "ก." "ข." "ค." "ง." นำหน้าตัวเลือก** เพราะระบบจะใส่ให้อัตโนมัติ`;
            }
        } else {
            promptText += `ส่งผลลัพธ์เป็น **JSON Object** เพียงก้อนเดียวเท่านั้น (โปรดใส่ Markdown Code Block \`\`\`json ... \`\`\` ครอบผลลัพธ์เพื่อความสะดวกในการคัดลอก) โดยมีโครงสร้างดังนี้:

{
  "type": "lesson",
  "title": "ชื่อหัวข้อเรื่อง",
  "blocks": [
    { "type": "header", "content": "# หัวข้อหลัก" },
    { "type": "text", "content": "เนื้อหาอธิบายอย่างละเอียดลึกซึ้ง (ห้ามสรุปย่อ) ใส่ Markdown ได้ตาม Style Guide..." },
    { "type": "callout", "style": "warning", "content": "> ⚠️ **ข้อควรระวัง:** ..." },
    { "type": "header", "content": "## หัวข้อย่อย" },
    { "type": "text", "content": "คำอธิบายส่วนถัดไป..." },
    { "type": "example", "content": "> 📝 **ตัวอย่าง:** ..." }
  ]
}

**สำคัญ:** ห้ามรวมเนื้อหาทั้งหมดเป็น String เดียว ให้แบ่งเป็น Blocks ย่อยๆ ตามหัวข้อ เพื่อให้ระบบสามารถจัดหน้ากระดาษ (Pagination) ได้อย่างสวยงาม`;
        }

        setGeneratedPrompt(promptText);
    }, [formData]);

    const handleReset = () => {
        if (window.confirm("คุณต้องการล้างการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) {
            setFormData(DEFAULT_FORM_DATA);
            setGeneratedPrompt('');
            savePromptSettings(DEFAULT_FORM_DATA);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleComponentChange = (comp) => {
        setFormData(prev => ({
            ...prev,
            components: { ...prev.components, [comp]: !prev.components[comp] }
        }));
    };

    const handleCopy = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenGemini = () => {
        window.open('https://gemini.google.com/app', '_blank');
    };

    const SelectWrapper = ({ label, value, onChange, options, disabled = false, icon: Icon }) => (
        <div className="relative group transition-all duration-300">
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                {label}
            </label>
            <div className={`relative rounded-xl transition-all duration-300 ${disabled ? 'opacity-50' : 'hover:shadow-lg hover:shadow-blue-500/5'}`}>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors">
                    {Icon ? <Icon size={16} strokeWidth={2.5} /> : <Layers size={16} strokeWidth={2.5} />}
                </div>
                <select
                    className={`w-full p-3 pl-11 pr-10 bg-white border border-slate-200 rounded-xl appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700 text-sm shadow-sm
                    ${disabled ? 'cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 cursor-pointer'} `}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors">
                    <ChevronDown size={18} strokeWidth={3} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-[#F1F5F9] font-sans selection:bg-blue-600 selection:text-white">
            {/* --- Left Panel --- */}
            <div className="w-full lg:w-[62%] h-full overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative z-0">
                <div className="max-w-4xl mx-auto space-y-10 pb-32">

                    {/* Glass Header */}
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 rounded-full text-blue-600 font-bold uppercase tracking-tighter text-[10px] animate-in slide-in-from-left duration-700">
                                    <Sparkles size={12} fill="currentColor" />
                                    <span>Advanced AI Prompt Architecture</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 leading-[1.1] font-outfit tracking-tight">
                                    MathCraft <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">AI</span>
                                </h1>
                            </div>
                            <button
                                onClick={handleReset}
                                className="group flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                            >
                                <Undo2 size={14} className="group-hover:-rotate-45 transition-transform" />
                                RESET
                            </button>
                        </div>
                        <p className="text-slate-500 max-w-xl text-[15px] font-medium leading-relaxed">
                            สร้างคำสั่งที่ทรงพลังเพื่อเปลี่ยน AI ให้เป็นผู้ช่วยเตรียมเนื้อหาและข้อสอบตามหลักสูตร สสวท. อย่างมืออาชีพ
                        </p>
                    </div>

                    {/* Section 1: Core Configuration */}
                    <section className="bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all hover:shadow-[0_20px_50px_rgba(59,130,246,0.08)] group/card">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover/card:scale-110 transition-transform duration-500">
                                <Layers size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 font-outfit tracking-tight">Core Context</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">ข้อมูลพื้นฐานของเอกสาร</p>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex flex-wrap gap-2.5 mb-8 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
                            {[
                                { id: 'content', label: 'บทเรียน', icon: <BookOpen size={16} />, color: 'blue' },
                                { id: 'practice', label: 'แบบฝึกหัด', icon: <PenTool size={16} />, color: 'teal' },
                                { id: 'exam', label: 'ข้อสอบ', icon: <FileText size={16} />, color: 'indigo' },
                                { id: 'svg_question', label: 'โจทย์+รูป', icon: <ImageIcon size={16} />, color: 'purple' },
                                { id: 'transcribe', label: 'พิมพ์ตาม', icon: <ScanText size={16} />, color: 'cyan' },
                                { id: 'summary', label: 'สรุปสูตร', icon: <Zap size={16} />, color: 'amber' },
                                { id: 'mistake', label: 'วิเคราะห์', icon: <Brain size={16} />, color: 'rose' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleChange('mode', item.id)}
                                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2.5 
                                    ${formData.mode === item.id
                                            ? `bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.03]`
                                            : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-md'
                                        } `}
                                >
                                    <span className={`transition-transform duration-300 ${formData.mode === item.id ? 'scale-110 text-blue-400' : 'text-slate-400'} `}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <SelectWrapper
                                label="ระดับชั้น"
                                icon={Type}
                                value={formData.grade}
                                onChange={(e) => handleChange('grade', e.target.value)}
                                options={['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map(g => ({ value: g, label: g.replace('M', 'มัธยมศึกษาปีที่ ') }))}
                            />
                            <SelectWrapper
                                label="ภาคเรียน"
                                icon={Calendar}
                                value={formData.term}
                                onChange={(e) => handleChange('term', e.target.value)}
                                options={[{ value: '1', label: 'เทอม 1' }, { value: '2', label: 'เทอม 2' }]}
                            />
                            <SelectWrapper
                                label="ประเภทวิชา"
                                icon={Settings}
                                value={formData.subjectType}
                                onChange={(e) => handleChange('subjectType', e.target.value)}
                                disabled={['M1', 'M2', 'M3'].includes(formData.grade)}
                                options={[{ value: 'Basic', label: 'พื้นฐาน' }, { value: 'Additional', label: 'เพิ่มเติม' }]}
                            />
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                                    บทเรียน (Chapter)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500">
                                        <BookOpen size={18} strokeWidth={2.5} />
                                    </div>
                                    <select
                                        className="w-full p-4 pl-12 pr-10 bg-white border border-slate-200 rounded-2xl appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-base font-bold text-slate-800 shadow-sm hover:border-blue-300 cursor-pointer"
                                        value={formData.chapter}
                                        onChange={(e) => handleChange('chapter', e.target.value)}
                                    >
                                        <option value="">-- เลือกบทเรียน --</option>
                                        {availableChapters.map((chapter, idx) => (
                                            <option key={idx} value={chapter}>{chapter}</option>
                                        ))}
                                        <option value="custom" className="text-blue-600 font-bold">+ ระบุบทเรียนเอง</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} strokeWidth={3} />
                                </div>
                            </div>

                            {formData.chapter && formData.chapter !== 'custom' && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">
                                        เจาะจงเนื้อหา (Sub-Topic)
                                        <span className="ml-2 text-slate-300 font-medium normal-case">(ทางเลือก)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <List size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            className="w-full p-3.5 pl-12 pr-10 bg-slate-50/50 border border-slate-200 rounded-2xl appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-semibold text-slate-600 hover:border-blue-300 cursor-pointer"
                                            value={formData.selectedTopic}
                                            onChange={(e) => handleChange('selectedTopic', e.target.value)}
                                        >
                                            <option value="">-- ทุกหัวข้อในบทนี้ --</option>
                                            {availableTopics.map((topic, idx) => (
                                                <option key={idx} value={topic}>{topic}</option>
                                            ))}
                                            <option value="custom" className="text-blue-600">+ กำหนดเอง</option>
                                        </select>
                                        <ChevronDown size={16} strokeWidth={3} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>
                            )}

                            {(formData.chapter === 'custom' || formData.selectedTopic === 'custom') && (
                                <div className="animate-in zoom-in-95 duration-300">
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-blue-300 text-blue-900 font-bold"
                                        placeholder="ระบุหัวข้อที่ต้องการ เช่น เลขยกกำลังที่มีฐานเป็นลบ..."
                                        value={formData.customTopic}
                                        onChange={(e) => handleChange('customTopic', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section 2: Smart Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Source Card */}
                        <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group/card h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                                    <Paperclip size={18} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 font-outfit">แหล่งข้อมูล</h2>
                            </div>
                            <div className="space-y-3 flex-1">
                                {[
                                    { id: 'ai-free', label: 'AI Knowledge', icon: <Sparkles size={16} />, color: 'blue' },
                                    { id: 'attachment', label: 'My Documents', icon: <Paperclip size={16} />, color: 'pink' },
                                ].map(src => (
                                    <button
                                        key={src.id}
                                        onClick={() => handleChange('source', src.id)}
                                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group/btn
                                        ${formData.source === src.id
                                                ? 'border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/5'
                                                : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                            } `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.source === src.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 group-hover/btn:bg-slate-300'} `}>
                                                {src.icon}
                                            </div>
                                            <span className={`font-bold text-xs ${formData.source === src.id ? 'text-slate-900' : 'text-slate-500'} `}>{src.label}</span>
                                        </div>
                                        {formData.source === src.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Tone Card */}
                        <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group/card h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <Type size={18} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 font-outfit">น้ำเสียง</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                {[
                                    { id: 'friendly', label: 'ครูฮีม ใจดี', icon: '😊' },
                                    { id: 'academic', label: 'ครูฮีม วิชาการ', icon: '🎓' },
                                    { id: 'fun', label: 'ครูฮีม สนุก', icon: '🤘' },
                                    { id: 'detailed', label: 'ครูฮีม ละเอียด', icon: '🧐' },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleChange('tone', t.id)}
                                        className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5
                                        ${formData.tone === t.id
                                                ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                                                : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                            } `}
                                    >
                                        <span className="text-xl">{t.icon}</span>
                                        <span className="font-bold text-[10px] uppercase tracking-tighter">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Section 3: Fine-Tuning */}
                    <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group/card overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover/card:rotate-12 transition-transform duration-500">
                                <Sliders size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 font-outfit tracking-tight">Advanced Config</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">ปรับแต่งระดับความยากและส่วนประกอบ</p>
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="mb-10">
                            <div className="flex justify-between items-end mb-4 px-1">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ระดับความยาก (Difficulty)</label>
                                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-tighter
                                    ${formData.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : ''}
                                    ${formData.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${formData.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' : ''}
                                    ${formData.difficulty === 'exam' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : ''}
                                `}>
                                    {formData.difficulty === 'exam' ? 'Exam Mode' : formData.difficulty}
                                </span>
                            </div>
                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range"
                                    min="0" max="3" step="1"
                                    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
                                    value={['easy', 'medium', 'hard', 'exam'].indexOf(formData.difficulty)}
                                    onChange={(e) => handleChange('difficulty', ['easy', 'medium', 'hard', 'exam'][e.target.value])}
                                />
                                <div className="absolute top-0 left-0 w-full flex justify-between pointer-events-none px-1">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full mt-2.5 ${i <= ['easy', 'medium', 'hard', 'exam'].indexOf(formData.difficulty) ? 'bg-slate-900' : 'bg-slate-200'} `} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SVG Image Type Selector (only for svg_question mode) */}
                        {formData.mode === 'svg_question' && (
                            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="block text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1">
                                    ประเภทรูปภาพ (SVG Image Type)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {[
                                        { id: 'geometry', label: 'เรขาคณิต', desc: 'สามเหลี่ยม สี่เหลี่ยม วงกลม', icon: '📐' },
                                        { id: 'graph', label: 'กราฟ', desc: 'เส้นตรง พาราโบลา พิกัด', icon: '📈' },
                                        { id: 'number_line', label: 'เส้นจำนวน', desc: 'Number Line', icon: '📏' },
                                        { id: 'diagram', label: 'แผนภาพ', desc: 'Venn, Tree Diagram', icon: '🔀' },
                                        { id: 'mixed', label: 'ผสม', desc: 'เลือกอัตโนมัติตามโจทย์', icon: '🎨' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleChange('svgImageType', t.id)}
                                            className={`p-3 rounded-2xl border-2 text-left transition-all
                                            ${formData.svgImageType === t.id
                                                    ? 'border-purple-600 bg-purple-50/20 ring-4 ring-purple-500/5'
                                                    : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200'
                                                } `}
                                        >
                                            <span className="text-lg">{t.icon}</span>
                                            <div className={`font-black text-[11px] mt-1 ${formData.svgImageType === t.id ? 'text-purple-600' : 'text-slate-700'}`}>{t.label}</div>
                                            <div className="text-[9px] font-bold text-slate-400 leading-tight">{t.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Components Chip Set */}
                        <div className="mb-10">
                            <label className="block text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1">
                                เลือกออปชันเสริม
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                                {[
                                    { id: 'formula', label: 'สรุปสูตร', color: 'blue' },
                                    { id: 'shortcut', label: 'เทคนิคลัด', color: 'indigo' },
                                    { id: 'trivia', label: 'เกร็ดความรู้', color: 'amber' },
                                    { id: 'vocab', label: 'ศัพท์เทคนิค', color: 'emerald' },
                                    { id: 'mistake', label: 'จุดที่มักผิด', color: 'rose' },
                                    { id: 'problemSolving', label: 'โจทย์ปัญหา', color: 'purple' },
                                ].map(comp => (
                                    <button
                                        key={comp.id}
                                        onClick={() => handleComponentChange(comp.id)}
                                        className={`px-4 py-2.5 rounded-2xl border-2 font-bold text-xs transition-all flex items-center gap-2.5 active:scale-95
                                        ${formData.components[comp.id]
                                                ? `border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10`
                                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                            } `}
                                    >
                                        <Check size={14} strokeWidth={4} className={`transition-all duration-300 ${formData.components[comp.id] ? 'scale-100 opacity-100' : 'scale-0 opacity-0 w-0'} `} />
                                        {comp.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantities for Practice/Exam/SVG Question/Transcribe */}
                        {['practice', 'exam', 'svg_question', 'transcribe'].includes(formData.mode) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end p-6 bg-slate-50/80 rounded-3xl border border-slate-100 animate-in zoom-in-95 duration-500">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">จำนวนข้อสอบ</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            className="w-24 p-4 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            value={formData.questionCount}
                                            onChange={(e) => handleChange('questionCount', e.target.value)}
                                        />
                                        <span className="font-bold text-slate-400">ITEMS</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-100">
                                    <button
                                        onClick={() => handleChange('questionType', 'objective')}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'objective' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'} `}
                                    >
                                        <div>ปรนัย</div>
                                        <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'objective' ? 'text-slate-400' : 'text-slate-300'}`}>ตัวเลือก 4 ข้อ</div>
                                    </button>
                                    <button
                                        onClick={() => handleChange('questionType', 'subjective')}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'subjective' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'} `}
                                    >
                                        <div>อัตนัย</div>
                                        <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'subjective' ? 'text-slate-400' : 'text-slate-300'}`}>แสดงวิธีทำ</div>
                                    </button>
                                    <button
                                        onClick={() => handleChange('questionType', 'word_problem')}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all ${formData.questionType === 'word_problem' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'} `}
                                    >
                                        <div>โจทย์ปัญหา</div>
                                        <div className={`text-[9px] font-medium mt-0.5 ${formData.questionType === 'word_problem' ? 'text-slate-400' : 'text-slate-300'}`}>เน้นวิเคราะห์</div>
                                    </button>
                                </div>
                                {formData.questionType === 'word_problem' && (
                                    <div className="md:col-span-2 flex gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest self-center px-2">รูปแบบโจทย์ปัญหา:</span>
                                        <button
                                            onClick={() => handleChange('wordProblemType', 'objective')}
                                            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${formData.wordProblemType === 'objective' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:text-indigo-600'} `}
                                        >
                                            ปรนัย (มีตัวเลือก)
                                        </button>
                                        <button
                                            onClick={() => handleChange('wordProblemType', 'subjective')}
                                            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${formData.wordProblemType === 'subjective' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:text-indigo-600'} `}
                                        >
                                            อัตนัย (แสดงวิธีทำ)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Complexity Toggle */}
                        <div className="mt-8">
                            <label className="block text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest pl-1">
                                {(['practice', 'exam', 'summary', 'mistake'].includes(formData.mode))
                                    ? 'ระดับความละเอียดของเฉลย'
                                    : 'ระดับความลึกของเนื้อหา'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        id: 'long',
                                        label: (['practice', 'exam', 'summary', 'mistake'].includes(formData.mode)) ? 'เฉลยแบบสั้น (Short Solution)' : 'Standard Depth',
                                        desc: (['practice', 'exam', 'summary', 'mistake'].includes(formData.mode)) ? 'เน้นการเฉลยที่สั้น กระชับ และเข้าใจง่าย' : 'ครอบคลุมทุกจุดสำคัญ (PDF 1-3 หน้า)'
                                    },
                                    {
                                        id: 'very_long',
                                        label: (['practice', 'exam', 'summary', 'mistake'].includes(formData.mode)) ? 'เฉลยแบบละเอียด (Detailed Solution)' : 'Ultimate Master',
                                        desc: (['practice', 'exam', 'summary', 'mistake'].includes(formData.mode)) ? 'เฉลยละเอียด มีหลักการคิด วิธีทำ และสรุปจุดที่ควรระวัง' : 'เจาะลึกทุกรายละเอียด (PDF 4+ หน้า)'
                                    },
                                ].map(len => (
                                    <button
                                        key={len.id}
                                        onClick={() => handleChange('contentLength', len.id)}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all h-full
                                        ${formData.contentLength === len.id
                                                ? 'border-blue-600 bg-blue-50/10 ring-4 ring-blue-500/5'
                                                : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200 hover:bg-white'
                                            } `}
                                    >
                                        <div className={`font-black text-xs mb-1 uppercase tracking-tight ${formData.contentLength === len.id ? 'text-blue-600' : 'text-slate-800'} `}>{len.label}</div>
                                        <div className="text-[10px] font-bold text-slate-400 leading-tight">{len.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div >

            {/* --- Right Panel --- */}
            < div className="w-full lg:w-[38%] bg-[#0B0F19] flex flex-col shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden relative border-l border-slate-800/50 min-h-[40vh] lg:min-h-0" >
                {/* Visual Glow */}
                < div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] -mr-80 -mt-80 rounded-full" />

                {/* Header Section */}
                < div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md relative z-10" >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                            <Terminal size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-white font-black font-outfit text-xs tracking-widest leading-none">PREVIEW</h3>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 block">Live AI Instruction</span>
                        </div>
                    </div>
                    <div className="flex gap-2.5">
                        <button
                            onClick={handleOpenGemini}
                            className="h-10 px-4 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[11px] font-bold uppercase border border-white/10 hover:border-white/20 active:scale-95 tracking-wider"
                        >
                            <ExternalLink size={14} strokeWidth={2.5} />
                            Open Gemini
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!generatedPrompt}
                            className={`h-10 px-5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-600/20 tracking-wider
                            ${isCopied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'} `}
                        >
                            {isCopied ? <Check size={14} strokeWidth={3} /> : <Sparkles size={14} fill="currentColor" />}
                            {isCopied ? 'COPIED' : 'GENERATE & COPY'}
                        </button>
                    </div>
                </div >

                {/* Editor Content */}
                < div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar relative z-10" >
                    {
                        generatedPrompt ? (
                            <div className="bg-[#131926] rounded-3xl p-8 border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-700 min-h-full" >
                                <div className="flex gap-2 mb-6 opacity-30">
                                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                </div>
                                {formData.mode === 'transcribe' && (
                                    <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-2">
                                            <Paperclip size={14} />
                                            <span>📎 อย่าลืมแนบเอกสาร!</span>
                                        </div>
                                        <p className="text-[11px] text-cyan-300/70 leading-relaxed">
                                            คัดลอกคำสั่งนี้ไปวางใน Gemini แล้ว<strong>แนบรูปภาพ/เอกสารโจทย์สอบ</strong>ไปพร้อมกัน AI จะพิมพ์โจทย์ตามให้เหมือนต้นฉบับทุกประการ
                                        </p>
                                    </div>
                                )}
                                <div className="font-mono text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap selection:bg-blue-500/30">
                                    {generatedPrompt}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-6 opacity-30 select-none">
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                    <Terminal size={32} />
                                </div>
                                <p className="text-center text-[10px] font-black tracking-[0.2em] uppercase">Ready to generate your command</p>
                            </div>
                        )}
                </div >

                {/* Status Bar */}
                < div className="p-4 bg-black/40 backdrop-blur-xl text-[9px] font-bold text-slate-500 flex justify-between px-8 border-t border-white/5 relative z-10" >
                    <div className="flex gap-6">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> ENGINE: GPT-4/GEMINI READY</span>
                        <span>LENGTH: ~{generatedPrompt.length} chars</span>
                    </div>
                    <span>LOCALE: TH_TH / EN_US</span>
                </div >
            </div >
        </div >
    );
};

export default PromptBuilderPage;
