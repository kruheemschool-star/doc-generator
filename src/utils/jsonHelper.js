/**
 * Utility: JSON Helper
 * 
 * ใช้สำหรับจัดการ JSON string ที่ได้จาก AI (ซึ่งมักจะมีขยะปนมาด้วย เช่น Markdown code block)
 * Helps parse "dirty" JSON strings from LLM responses.
 * 
 * Rules:
 * 1. Finds the first '[' and last ']' to extract the JSON array.
 * 2. Parses it safely.
 * 3. Validates that it is an Array.
 */

export const cleanAndParseJSON = (inputString) => {
    // 1. Validation (ตรวจสอบเบื้องต้น)
    if (!inputString || typeof inputString !== 'string') {
        throw new Error("ไม่พบข้อมูล Input หรือรูปแบบข้อมูลไม่ถูกต้อง (Invalid Input String)");
    }

    // 2. Find Brackets (หาขอบเขตของ Array)
    const startIndex = inputString.indexOf('[');
    const endIndex = inputString.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        throw new Error("ไม่พบโครงสร้าง JSON Array ในข้อความที่ได้รับ (No valid JSON Array found)");
    }

    // 3. Extract & Sanitize (ดึงข้อมูลและทำความสะอาด)
    let jsonString = inputString.substring(startIndex, endIndex + 1);

    // Optional: Remove dangerous control characters (ถ้ามี)
    // แต่มักจะไม่จำเป็นถ้า AI ตอบมาดีพอ
    // jsonString = jsonString.replace(/[\u0000-\u0019]+/g, ""); 

    try {
        // 4. Parse (แปลงเป็น Object)
        const parsedData = JSON.parse(jsonString);

        // 5. Validation (ตรวจสอบว่าเป็น Array จริงหรือไม่)
        if (!Array.isArray(parsedData)) {
            throw new Error("ข้อมูลที่ได้ไม่ใช่ Array (Parsed data is not an array)");
        }

        return parsedData;

    } catch (error) {
        console.error("JSON Parse Error:", error);
        throw new Error(`รูปแบบข้อมูลเสียหาย ไม่สามารถแปลงเป็น JSON ได้ (Parse Error: ${error.message})`);
    }
};
