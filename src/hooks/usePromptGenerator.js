import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook that generates the AI prompt text based on form data.
 * Extracted from PromptBuilderPage to keep the component focused on UI.
 * 
 * @param {Object} formData - The form configuration data
 * @returns {string} The generated prompt text
 */
export const usePromptGenerator = (formData) => {
    const [generatedPrompt, setGeneratedPrompt] = useState('');

    useEffect(() => {
        const topic = formData.selectedTopic === 'custom' ? formData.customTopic : formData.selectedTopic;
        const mode = formData.mode;

        // --- Transcribe mode: standalone simplified prompt ---
        if (mode === 'transcribe') {
            const tType = formData.questionType === 'subjective' ? 'อัตนัย (แสดงวิธีทำ)' : 'ปรนัย (ตัวเลือก 4 ข้อ)';
            let promptText = `**พิมพ์โจทย์ตามเอกสาร/รูปภาพที่แนบมา** ให้เหมือนต้นฉบับทุกประการ (ประเภท: ${tType})\n`;

            if (formData.transcribePageRange) {
                promptText += `**ระบุหน้า:** พิมพ์เฉพาะ ${formData.transcribePageRange} เท่านั้น\n`;
            }
            if (formData.transcribeQuestionRange) {
                promptText += `**ระบุข้อ:** พิมพ์เฉพาะ ${formData.transcribeQuestionRange} เท่านั้น\n`;
            }

            promptText += `
---
**บทบาท: นักพิมพ์โจทย์ตามต้นฉบับ (Transcription Mode)**

**กฎเหล็กในการพิมพ์ตาม:**
1. **พิมพ์ตามต้นฉบับเป๊ะ:** พิมพ์โจทย์ให้เหมือนกับเอกสาร/รูปภาพที่แนบมาทุกประการ ห้ามเปลี่ยนตัวเลข ห้ามเปลี่ยนคำ ห้ามสรุปย่อ ห้ามดัดแปลงแก้ไขใดๆ ทั้งสิ้น
2. **ห้ามใส่หมายเลขข้อ:** ห้ามใส่เลขข้อ (เช่น "1." "2." "ข้อ 1") นำหน้าโจทย์ เพราะระบบจะนับเลขข้อให้อัตโนมัติ ถ้าต้นฉบับมีเลขข้อติดมา ให้ลบออก
3. **ห้ามใส่ prefix ตัวเลือก:** ห้ามใส่ "ก." "ข." "ค." "ง." นำหน้าตัวเลือก เพราะระบบจะใส่ให้อัตโนมัติ
4. **ใช้ LaTeX สำหรับสมการ:** สูตรคณิตศาสตร์ทุกตัวต้องเขียนด้วย LaTeX (เช่น $x^2 + 3x = 0$)
5. **รักษาความหมายเดิม:** หากตัวอักษรในรูปภาพไม่ชัด ให้ตีความตามบริบทคณิตศาสตร์
6. **แยกโจทย์แต่ละข้อ:** แต่ละข้อเป็น 1 object ใน JSON Array

**ข้อควรระวัง:**
- หากโจทย์ต้นฉบับมีรูปภาพประกอบ ให้อธิบายรูปเป็นข้อความสั้นๆ ใน "question" (เช่น "จากรูป สามเหลี่ยม ABC มีด้าน AB = 5 cm...")
- หากมีสูตรหรือสมการ ต้องใช้ LaTeX เท่านั้น
- ${formData.transcribeQuestionRange ? `พิมพ์เฉพาะข้อที่ระบุ (${formData.transcribeQuestionRange})` : 'พิมพ์ทุกข้อที่เห็นในเอกสาร ห้ามข้ามข้อใดข้อหนึ่ง'}
---
`;

            // Output format for transcribe
            promptText += `\n**กฎเหล็กสำหรับ "question" field (สำคัญมาก):**
- **ห้ามใส่หมายเลขข้อ** นำหน้าโจทย์เด็ดขาด (ห้ามใส่ "ข้อที่ 1:", "ข้อ 1.", "1.", "1)" ฯลฯ) เพราะระบบจะนับเลขข้อให้อัตโนมัติ
- **ห้ามใช้ blockquote (>) ใน "question"** เพราะจะทำให้เกิดกล่องข้อความที่ไม่จำเป็น ให้เขียนเป็นข้อความปกติ

`;

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
    "answer": "ก. [คำตอบที่ถูกต้อง] (ระบุตัวเลือก ก/ข/ค/ง ที่ถูกต้องเสมอ)",
    "solution": "**คำตอบ: ข้อ ก.** เฉลย/วิธีทำ (ถ้ามีในต้นฉบับ หรือเว้นว่างไว้)",
    "space": "medium"
  }
]
**สำคัญ:**
- **ห้ามใส่หมายเลขข้อนำหน้า** โจทย์ในทุกกรณี
- **ห้ามใส่ prefix "ก." "ข." "ค." "ง." นำหน้าตัวเลือก** เพราะระบบจะใส่ให้อัตโนมัติ
- ต้องมี "options" ครบ 4 ตัวเลือกเสมอ (ตามต้นฉบับ) และ **มีคำตอบถูกเพียง 1 ข้อเท่านั้น**
- **"answer" ต้องขึ้นต้นด้วย ก./ข./ค./ง.** ตามตัวเลือกที่ถูกต้อง
- หากต้นฉบับไม่มีเฉลย ให้ใส่ "solution" เป็น ""
- แนบเอกสาร/รูปภาพโจทย์ไปพร้อมกับคำสั่งนี้ใน Gemini`;
            }

            setGeneratedPrompt(promptText);
            return; // Early return for transcribe mode
        }

        // --- All other modes ---
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
            const lengthMap = { short: '~200', medium: '~500', long: '~800' };
            const lengthLabel = { short: 'สั้น', medium: 'กลาง', long: 'ยาว' };
            const wordCount = lengthMap[formData.summaryLength] || '~500';
            const lengthName = lengthLabel[formData.summaryLength] || 'กลาง';
            promptText += `เป้าหมาย: สรุปสูตรแบบ Cheat Sheet (ความยาว: ${lengthName} ${wordCount} คำ)\n`;
            promptText += `
---
**บทบาทพิเศษ: ติวเตอร์หน้าห้องสอบ (Cheat Sheet Mode)**

**ความยาว:** ประมาณ ${wordCount} คำ${formData.summaryLength === 'short' ? ' (สรุปเฉพาะสูตรหลักที่สำคัญที่สุด)' : formData.summaryLength === 'long' ? ' (ครบทุกหัวข้อ พร้อมตัวอย่างประกอบ)' : ' (สูตร + เทคนิค + จุดระวัง)'}

กฎเหล็กในการสรุป:
1. **คัดเน้นๆ (High-Yield Only):** สรุปเฉพาะเนื้อหาและสูตรที่เป็น 'หัวใจสำคัญ' หรือ 'ออกสอบบ่อย' เท่านั้น ตัดประวัติความเป็นมา หรือคำอธิบายพื้นฐานที่ยืดยาวทิ้งทั้งหมด
2. **ห้ามเกริ่นนำ:** เริ่มต้นที่สูตรหรือคอนเซปต์เลย ห้ามมีประโยคเปิดเรื่อง (เช่น 'ในบทนี้เราจะมาเรียนรู้...')
3. **กระชับที่สุด:** ใช้ Bullet Point สั้นๆ หรือตารางเปรียบเทียบ
4. **ควบคุมจำนวนคำ:** ห้ามเกิน ${wordCount} คำ

โครงสร้างที่ต้องมี:
- ใช้ > 📘 **สูตรหลัก:** (สูตรที่ต้องจำ)
- ใช้ > ⚠️ **จุดตาย:** (จุดที่นักเรียนมักพลาด หรือโดนหลอกในข้อสอบ)
- ใช้ > 💡 **เทคนิค:** (สูตรลัด หรือวิธีจำให้เร็วขึ้น)

**เป้าหมายสูงสุด:** ทำให้นักเรียนอ่านจบแล้วมีความมั่นใจเดินเข้าห้องสอบได้ทันที
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
        if (formData.components?.dummyChoice) activeComponents.push('ช้อยส์หลอกดักทาง (Distractor/Dummy choices)');
        if (formData.components?.realWorldApp) activeComponents.push('ประยุกต์ใช้ในชีวิตจริง (Real-World Applications)');
        if (formData.components?.addHint) activeComponents.push('เพิ่มคำใบ้ (Hints)');
        if (formData.components?.crossChapter) activeComponents.push('โจทย์ประยุกต์ผสมข้ามบท (Cross-Chapter Problems)');
        if (formData.components?.mistake) activeComponents.push('จุดที่มักผิด (Common Mistakes)');
        if (formData.components?.bulletPoints) activeComponents.push('สรุปเป็นข้อๆ (Bullet Points)');
        if (formData.components?.comparisonTable) activeComponents.push('ตารางเปรียบเทียบ (Comparison Table)');
        if (formData.components?.stepByStep) activeComponents.push('สรุปแบบทีละขั้นตอน (Step-by-step)');

        if (activeComponents.length > 0) {
            promptText += `\n**องค์ประกอบเพิ่มเติมที่ต้องมี (Requirements):**\nช่วยเน้นหรือแทรกเนื้อหาเกี่ยวกับ: ${activeComponents.join(', ')} ให้เหมาะสมกับบทเรียน\n`;
        }

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
   - สัญลักษณ์อย่าง \`\`\\\\times\`\`, \`\`\\\\div\`\`, \`\`\\\\frac\`\`, \`\`^\`\`, \`\`\\\\sqrt\`\` **ห้ามอยู่นอกเครื่องหมายดอลล่าร์เด็ดขาด** เพราะจะทำให้การแสดงผลผิดพลาด (เช่น จะกลายเป็น imes แทนเครื่องหมายคูณ)
   - ตัวอย่างที่ถูกต้อง:
     - ใช้ \`\`$$(-4) \\\\times (-4)$$\`\` แทน \`\`(-4) \\\\times (-4)\`\`
     - ใช้ \`\`$x = 2$\`\` แทน **x = 2**
   - **กฎเหล็กเพิ่มเติมสำหรับสมการหลายบรรทัด:** ถ้าต้องใช้ \\\\begin{array} หรือ \\\\begin{aligned} ภายใน $$ ... $$ block **ห้ามวางไว้ในบรรทัดที่ขึ้นต้นด้วย > (blockquote)** เพราะจะทำให้ระบบแสดงผลเป็น Raw Text ให้ปิด blockquote (เว้นบรรทัดว่าง) เขียน $$ block แยกออกมา แล้วค่อยเปิด blockquote ใหม่
---
`;

        promptText += `\n**กฎเหล็กสำหรับ "question" field (สำคัญมาก):**
- **ห้ามใส่หมายเลขข้อ** นำหน้าโจทย์เด็ดขาด (ห้ามใส่ "ข้อที่ 1:", "ข้อ 1.", "1.", "1)" ฯลฯ) เพราะระบบจะนับเลขข้อให้อัตโนมัติ
- **ห้ามใช้ blockquote (>) ใน "question"** เพราะจะทำให้เกิดกล่องข้อความที่ไม่จำเป็น ให้เขียนเป็นข้อความปกติ
- **ห้ามใช้ Callout Block** (เช่น "> 📘 โจทย์:", "> 📝 โจทย์:") ใน "question" field ให้เขียนโจทย์เป็นข้อความธรรมดาเท่านั้น

**กฎเหล็กสำหรับข้อสอบปรนัย (ตัวเลือก 4 ข้อ) — สำคัญที่สุด:**
- **คำตอบที่ถูกต้องมีเพียง 1 ข้อเท่านั้น:** ทุกข้อต้องมีตัวเลือกที่ถูกต้องเพียงข้อเดียว ห้ามมีคำตอบถูกมากกว่า 1 ข้อเด็ดขาด
- **ตรวจสอบการคำนวณซ้ำทุกข้อ (Double-Check):** ก่อนส่งผลลัพธ์ ให้คำนวณคำตอบของทุกตัวเลือกซ้ำอีกครั้ง เพื่อยืนยันว่ามีเพียงตัวเลือกเดียวที่ถูกต้อง หากพบว่ามีคำตอบถูกมากกว่า 1 ข้อ ให้แก้ไขตัวเลือกหรือโจทย์ใหม่ทันที
- **"answer" ต้องระบุตัวเลือกที่ถูกต้องชัดเจน:** ต้องระบุเป็น "ก. [คำตอบ]", "ข. [คำตอบ]", "ค. [คำตอบ]" หรือ "ง. [คำตอบ]" เสมอ (เช่น "ข. $-a^n$") เพื่อให้ผู้ใช้ทราบทันทีว่าข้อใดถูก
- **"solution" ต้องสรุปคำตอบที่ถูกต้อง:** ในส่วนเฉลยต้องขึ้นต้นด้วย **"คำตอบ: ข้อ [ก/ข/ค/ง]"** ก่อนแสดงวิธีทำ เพื่อให้เห็นคำตอบชัดเจนทันที

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
    "svg": "<svg viewBox=\\\\"0 0 300 250\\\\" width=\\\\"300\\\\" height=\\\\"250\\\\" xmlns=\\\\"http://www.w3.org/2000/svg\\\\">...</svg>",
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
    "svg": "<svg viewBox=\\\\"0 0 300 250\\\\" width=\\\\"300\\\\" height=\\\\"250\\\\" xmlns=\\\\"http://www.w3.org/2000/svg\\\\">...</svg>",
    "options": ["เนื้อหาตัวเลือกที่ 1", "เนื้อหาตัวเลือกที่ 2", "เนื้อหาตัวเลือกที่ 3", "เนื้อหาตัวเลือกที่ 4"],
    "answer": "ก. [คำตอบที่ถูกต้อง] (ระบุตัวเลือก ก/ข/ค/ง ที่ถูกต้องเสมอ)",
    "solution": "**คำตอบ: ข้อ ก.** [แสดงวิธีทำ] ${solutionTemplateSuffix}",
    "space": "medium"
  }
]
**สำคัญ:**
- ต้องมี "options" ครบ 4 ตัวเลือกเสมอ และ **มีคำตอบถูกเพียง 1 ข้อเท่านั้น**
- **ห้ามใส่ prefix "ก." "ข." "ค." "ง." นำหน้าตัวเลือก** เพราะระบบจะใส่ให้อัตโนมัติ (เช่น ใส่แค่ "รูปสามเหลี่ยม" ไม่ใช่ "ก. รูปสามเหลี่ยม")
- **"answer" ต้องขึ้นต้นด้วย ก./ข./ค./ง.** ตามตัวเลือกที่ถูกต้อง
- **"svg" ต้องเป็น SVG code string สมบูรณ์** ที่ปฏิบัติตามกฎเหล็ก SVG ด้านบนทุกข้อ
- ทุกข้อต้องมี "svg" field เสมอ ห้ามเว้น
- **ตรวจสอบการคำนวณซ้ำทุกข้อก่อนส่ง** ยืนยันว่ามีคำตอบถูกเพียงข้อเดียว`;
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
    "answer": "ก. [คำตอบที่ถูกต้อง] (ระบุตัวเลือก ก/ข/ค/ง ที่ถูกต้องเสมอ)",
    "solution": "**คำตอบ: ข้อ ก.** [แสดงวิธีทำ] ${solutionTemplateSuffix}",
    "space": "medium" (เว้นที่ว่าง: small/medium/large)
  }
]
**สำคัญ:**
- ต้องมี "options" ครบ 4 ตัวเลือกเสมอ และ **มีคำตอบถูกเพียง 1 ข้อเท่านั้น**
- **ห้ามใส่ prefix "ก." "ข." "ค." "ง." นำหน้าตัวเลือก** เพราะระบบจะใส่ให้อัตโนมัติ
- **"answer" ต้องขึ้นต้นด้วย ก./ข./ค./ง.** ตามตัวเลือกที่ถูกต้อง
- **"solution" ต้องเริ่มด้วย "คำตอบ: ข้อ [ก/ข/ค/ง]"** ก่อนแสดงวิธีทำ
- **ตรวจสอบการคำนวณซ้ำทุกข้อก่อนส่ง** ยืนยันว่ามีคำตอบถูกเพียงข้อเดียว`;
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

    return generatedPrompt;
};

/**
 * Returns a JSON skeleton string for previewing the expected output format
 * based on the current mode and question type.
 */
export const getOutputSkeleton = (mode, questionType, wordProblemType) => {
    const isSubjective = questionType === 'subjective' || (questionType === 'word_problem' && wordProblemType === 'subjective');

    if (mode === 'content' || mode === 'summary' || mode === 'mistake') {
        return JSON.stringify({
            type: "lesson",
            title: "ชื่อหัวข้อเรื่อง",
            blocks: [
                { type: "header", content: "# หัวข้อหลัก" },
                { type: "text", content: "เนื้อหาอธิบาย..." },
                { type: "callout", style: "warning", content: "> ⚠️ **ข้อควรระวัง:** ..." }
            ]
        }, null, 2);
    }

    if (mode === 'svg_question') {
        if (isSubjective) {
            return JSON.stringify([{
                question: "โจทย์ (LaTeX)",
                svg: "<svg>...</svg>",
                answer: "คำตอบ",
                solution: "วิธีทำ...",
                space: "large"
            }], null, 2);
        }
        return JSON.stringify([{
            question: "โจทย์ (LaTeX)",
            svg: "<svg>...</svg>",
            options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
            answer: "ก. คำตอบ",
            solution: "**คำตอบ: ข้อ ก.** วิธีทำ...",
            space: "medium"
        }], null, 2);
    }

    // exam, practice, transcribe
    if (isSubjective) {
        return JSON.stringify([{
            question: "โจทย์ (LaTeX)",
            answer: "คำตอบ",
            solution: "วิธีทำ...",
            space: "large"
        }], null, 2);
    }

    return JSON.stringify([{
        question: "โจทย์ (LaTeX)",
        options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
        answer: "ก. คำตอบ",
        solution: "**คำตอบ: ข้อ ก.** วิธีทำ...",
        space: "medium"
    }], null, 2);
};

export default usePromptGenerator;
