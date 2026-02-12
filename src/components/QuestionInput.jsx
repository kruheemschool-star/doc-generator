import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, Copy, Check, FileJson, Trash2, Import, BookOpen, List, CheckSquare } from 'lucide-react';

const QuestionInput = ({ onAddQuestion, onClearAll }) => {
    const [activeTab, setActiveTab] = useState('manual');

    // Manual Input State
    const [questionText, setQuestionText] = useState('');
    const [spaceNeeded, setSpaceNeeded] = useState(40);

    // AI Generator State
    const [topic, setTopic] = useState('');
    const [docType, setDocType] = useState('subjective'); // lesson, subjective, objective
    const [difficulty, setDifficulty] = useState('Medium');
    const [count, setCount] = useState(3);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Import JSON State
    const [jsonInput, setJsonInput] = useState('');

    // --- Manual Handler ---
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!questionText.trim()) return;

        // --- HEURISTIC CHECK FOR USER ERROR ---
        // If the input starts with [ and ends with ] or contains typical JSON keys, warn the user.
        const trimmed = questionText.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.includes('"question":') && trimmed.includes('"id":'))) {
            if (window.confirm("ดูเหมือนคุณกำลังพยายามวาง JSON Code ลงในช่อง Manual Input?\n\nกรุณาไปที่แท็บ 'Import' เพื่อนำเข้าโจทย์หลายข้อพร้อมกัน หรือกด Cancel เพื่อยืนยันที่จะเพิ่มข้อความนี้เป็นโจทย์ข้อเดียว")) {
                setActiveTab('import');
                setJsonInput(trimmed); // Auto-fill intended input
                setQuestionText(''); // Clear mistake
                return;
            }
        }

        onAddQuestion({
            id: uuidv4(),
            no: 0,
            question: questionText,
            spaceNeeded: spaceNeeded,
            type: 'Math'
        });

        setQuestionText('');
        setSpaceNeeded(40);
    };

    // --- Prompt Generator Handler ---
    const handleGeneratePrompt = () => {
        if (!topic.trim()) return;

        let prompt = "";
        const baseInstruction = `ให้แสดงผลลัพธ์ในรูปแบบ Markdown Code Block (\`\`\`json ... \`\`\`) เท่านั้น เพื่อให้ง่ายต่อการคัดลอก ห้ามมีคำนำหรือคำปิดท้าย`;
        // Update: Explicitly ask for double backslash to prevent JSON parse errors
        const latexConstraint = `คำเตือนสำคัญ: ในส่วนของรูปแบบ LaTeX ($...$) ห้ามใช้ \\ (Backslash เดียว) ให้ใช้ \\\\ (Double Backslash) เสมอ เช่น \\\\frac{1}{2}, \\\\sqrt{x} เพื่อไม่ให้เกิด JSON Parse Error`;

        if (docType === 'lesson') {
            prompt = `จงสรุปเนื้อหาเรื่อง ${topic} ให้เข้าใจง่ายที่สุดสำหรับนักเรียน แบ่งเป็นหัวข้อและตัวอย่างประกอบ 
${baseInstruction}
โดยใช้โครงสร้าง JSON ดังนี้:
[
  {
    "type": "content",
    "content": "เนื้อหาสรุป (รองรับ Markdown/HTML)"
  }
]
${latexConstraint}`;
        } else if (docType === 'objective') {
            prompt = `จงสร้างโจทย์คณิตศาสตร์เรื่อง ${topic} แบบปรนัย 4 ตัวเลือก (ก, ข, ค, ง) จำนวน ${count} ข้อ ความยากระดับ ${difficulty}
${baseInstruction}
โดยใช้โครงสร้าง JSON ดังนี้:
[
  {
    "id": "1",
    "question": "โจทย์คำถาม",
    "options": ["ก. ...", "ข. ...", "ค. ...", "ง. ..."],
    "solution": {
      "answer": "คำตอบที่ถูกต้อง",
      "principle": "หลักการ/กฎ ที่ใช้",
      "steps": ["ขั้นตอนที่ 1...", "ขั้นตอนที่ 2..."],
      "caution": "ข้อควรระวัง (ถ้ามี)"
    },
    "space": 20
  }
]
${latexConstraint}`;
        } else {
            // Subjective (Default)
            prompt = `ช่วยสร้างโจทย์คณิตศาสตร์เรื่อง ${topic} จำนวน ${count} ข้อ ความยากระดับ ${difficulty}
${baseInstruction}
โดยใช้โครงสร้าง JSON ดังนี้:
[
  {
    "id": "1",
    "question": "โจทย์คำถาม",
    "solution": {
      "answer": "คำตอบสุดท้าย",
      "principle": "หลักการ/กฎ ที่ใช้",
      "steps": ["ขั้นตอนที่ 1...", "ขั้นตอนที่ 2..."],
      "caution": "ข้อควรระวัง (ถ้ามี)"
    },
    "space": 40
  }
]
${latexConstraint}`;
        }

        setGeneratedPrompt(prompt);
        setIsCopied(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedPrompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- Import JSON Handler ---
    const handleImportJson = () => {
        try {
            // Remove potential markdown code blocks provided by AI
            const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            if (!Array.isArray(parsed)) {
                alert("Invalid format: The pasted text must be a JSON Array.");
                return;
            }

            let addedCount = 0;
            parsed.forEach(item => {
                // Handle Lesson Content
                if (item.type === 'content' && item.content) {
                    onAddQuestion({
                        id: uuidv4(),
                        no: 0,
                        question: item.content, // Map content to question for rendering
                        type: 'lesson',
                        spaceNeeded: 0
                    });
                    addedCount++;
                    return;
                }

                // Handle Questions (Objective & Subjective)
                if (item.question) {
                    onAddQuestion({
                        id: uuidv4(),
                        no: 0,
                        question: item.question,
                        options: item.options || [], // Store options if available
                        solution: item.solution || { answer: item.answer || '' }, // Map solution structure
                        spaceNeeded: parseInt(item.space) || 40,
                        type: item.options ? 'objective' : 'Math'
                    });
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                setJsonInput('');
                alert(`Successfully imported ${addedCount} items!`);
            } else {
                alert("No valid items found in the JSON.");
            }

        } catch (error) {
            alert("เกิดข้อผิดพลาดในการอ่าน JSON: " + error.message + "\n\nคำแนะนำ: ลองตรวจสอบว่ามีเครื่องหมายเกิน หรือ Backslash ใน LaTeX ผิดปกติหรือไม่");
            console.error("JSON Import Error:", error);
        }
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full lg:w-80 h-fit sticky top-8 print:hidden transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Questions</h2>

            {/* Tabs */}
            <div className="flex mb-4 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Manual
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'ai' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Sparkles size={12} />
                    Prompt
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'import' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileJson size={12} />
                    Import
                </button>
            </div>

            {/* --- Manual Input Tab --- */}
            {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 animate-fadeIn">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="question" className="text-sm font-medium text-gray-700">
                            Question (LaTeX Supported)
                        </label>
                        <textarea
                            id="question"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Enter math question (e.g., $x^2$)..."
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y text-sm font-mono"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="space" className="text-sm font-medium text-gray-700">
                            Space for Answer
                        </label>
                        <select
                            id="space"
                            value={spaceNeeded}
                            onChange={(e) => setSpaceNeeded(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value={40}>Small (40px)</option>
                            <option value={80}>Medium (80px)</option>
                            <option value={160}>Large (160px)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={!questionText.trim()}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        <span>Add Question</span>
                    </button>

                    <div className="mt-2 text-xs text-gray-500 text-center">
                        Tip: Use <code className="bg-gray-100 px-1 rounded">$...$</code> for math.
                    </div>
                </form>
            )}

            {/* --- AI Prompt Generator Tab --- */}
            {activeTab === 'ai' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                    {/* Topic */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Linear Equations"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Doc Type Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setDocType('lesson')}
                                className={`p-2 text-xs flex flex-col items-center justify-center gap-1 rounded-md border transition-all ${docType === 'lesson' ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <BookOpen size={16} />
                                <span>Lesson</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocType('subjective')}
                                className={`p-2 text-xs flex flex-col items-center justify-center gap-1 rounded-md border transition-all ${docType === 'subjective' ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <List size={16} />
                                <span>Subjective</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocType('objective')}
                                className={`p-2 text-xs flex flex-col items-center justify-center gap-1 rounded-md border transition-all ${docType === 'objective' ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <CheckSquare size={16} />
                                <span>Objective</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Difficulty */}
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-medium text-gray-600">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        {/* Count - Hide for Lesson */}
                        {docType !== 'lesson' && (
                            <div className="flex flex-col gap-1 w-20">
                                <label className="text-xs font-medium text-gray-600">Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Generate Prompt Button */}
                    <button
                        onClick={handleGeneratePrompt}
                        disabled={!topic.trim()}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <Sparkles size={18} />
                        <span>สร้างคำสั่ง (Generate Prompt)</span>
                    </button>

                    {/* Result Area */}
                    {generatedPrompt && (
                        <div className="mt-4 animate-fadeIn">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                                Copy this to Gemini:
                            </label>
                            <div className="relative">
                                <textarea
                                    value={generatedPrompt}
                                    readOnly
                                    className="w-full p-3 h-32 text-sm bg-blue-50 border border-blue-200 rounded-lg text-gray-700 resize-none focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-md shadow-sm text-xs font-medium text-gray-700 flex items-center gap-1 transition-colors"
                                >
                                    {isCopied ? (
                                        <>
                                            <Check size={14} className="text-green-600" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- Import JSON Tab --- */}
            {activeTab === 'import' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Paste JSON Result
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='Paste JSON array here... e.g. [{"question": "...", ...}]'
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[150px] resize-y text-sm font-mono"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleImportJson}
                            disabled={!jsonInput.trim()}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                        >
                            <Import size={18} />
                            <span>นำเข้าโจทย์ (Import)</span>
                        </button>

                        <div className="border-t border-gray-200 my-2"></div>

                        <button
                            onClick={onClearAll}
                            type="button"
                            className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-lg border border-red-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            <span>ล้างข้อมูลทั้งหมด (Clear All)</span>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default QuestionInput;
