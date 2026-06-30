import React, { useState } from 'react';
import {
    Terminal, ExternalLink, Check, Paperclip, ScanText,
    ClipboardCopy, Loader2, Save, AlertCircle, Code, Eye
} from 'lucide-react';
import { getOutputSkeleton } from '../../hooks/usePromptGenerator';

/**
 * PromptPreview — Right panel component for displaying prompt preview,
 * expected output format, copy controls, and status bar.
 * Includes Item 12 (Output Preview) and Item 15 (Copy as Markdown).
 */
const PromptPreview = ({
    generatedPrompt,
    formData,
    isCopied,
    onCopy,
    onCopyMarkdown,
    onOpenGemini,
    saveStatus,
}) => {
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'output'
    const [showCopyMenu, setShowCopyMenu] = useState(false);

    const outputSkeleton = getOutputSkeleton(
        formData.mode,
        formData.questionType,
        formData.wordProblemType
    );

    return (
        <div className="w-full lg:w-[38%] bg-ink flex flex-col overflow-hidden relative border-l border-line min-h-[40vh] lg:min-h-0 font-thai">

            {/* Header Section */}
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-ink-soft flex items-center justify-center border border-white/10 text-accent">
                        <Terminal size={14} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold font-display text-xs tracking-[0.18em] leading-none">PREVIEW</h3>
                        <span className="text-[9px] font-semibold text-[#807868] uppercase tracking-[0.06em] mt-1.5 block font-display">Live AI Instruction</span>
                    </div>
                </div>
                <div className="flex gap-2.5">
                    <button
                        onClick={onOpenGemini}
                        aria-label="เปิด Gemini"
                        className="h-10 px-4 rounded-[10px] hover:bg-white/5 text-[#a39a8c] hover:text-white transition-all flex items-center gap-2 text-[11px] font-bold uppercase border border-white/10 hover:border-white/25 active:scale-95 tracking-wider font-display"
                    >
                        <ExternalLink size={14} strokeWidth={2.5} />
                        Open Gemini
                    </button>
                    {/* Item 15: Copy with format options */}
                    <div className="relative">
                        <div className="flex">
                            <button
                                onClick={onCopy}
                                disabled={!generatedPrompt}
                                aria-label="คัดลอกคำสั่ง"
                                className={`h-10 px-5 rounded-l-[10px] font-bold text-[11px] transition-all flex items-center gap-2 active:scale-95 tracking-wider font-display
                                ${isCopied ? 'bg-[#3f8a5f] text-white' : 'bg-accent text-white hover:bg-accent-press disabled:opacity-50'} `}
                            >
                                {isCopied ? <Check size={14} strokeWidth={3} /> : <ClipboardCopy size={14} />}
                                {isCopied ? 'COPIED' : 'COPY PROMPT'}
                            </button>
                            <button
                                onClick={() => setShowCopyMenu(!showCopyMenu)}
                                disabled={!generatedPrompt}
                                aria-label="ตัวเลือกการคัดลอก"
                                className={`h-10 px-2 rounded-r-[10px] border-l border-white/25 font-bold text-[11px] transition-all active:scale-95
                                ${isCopied ? 'bg-[#3f8a5f] text-white' : 'bg-accent text-white hover:bg-accent-press disabled:opacity-50'} `}
                            >
                                ▾
                            </button>
                        </div>
                        {/* Copy format dropdown */}
                        {showCopyMenu && (
                            <div className="absolute right-0 top-12 bg-ink-soft border border-white/10 rounded-[12px] shadow-2xl z-50 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => { onCopy(); setShowCopyMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-xs font-semibold text-[#d8d0c2] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <ClipboardCopy size={12} /> Copy as Plain Text
                                </button>
                                <button
                                    onClick={() => { onCopyMarkdown(); setShowCopyMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-xs font-semibold text-[#d8d0c2] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 border-t border-white/10"
                                >
                                    <Code size={12} /> Copy as Markdown
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Item 12: Tab bar for Preview / Expected Output */}
            <div className="flex border-b border-white/10 relative z-10">
                <button
                    onClick={() => setActiveTab('preview')}
                    aria-label="แสดง Preview"
                    role="tab"
                    aria-selected={activeTab === 'preview'}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-display
                        ${activeTab === 'preview' ? 'text-white border-b-2 border-accent bg-white/5' : 'text-[#807868] hover:text-[#a39a8c]'}`}
                >
                    <Eye size={12} /> Prompt Preview
                </button>
                <button
                    onClick={() => setActiveTab('output')}
                    aria-label="แสดง Expected Output"
                    role="tab"
                    aria-selected={activeTab === 'output'}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-display
                        ${activeTab === 'output' ? 'text-white border-b-2 border-accent bg-white/5' : 'text-[#807868] hover:text-[#a39a8c]'}`}
                >
                    <Code size={12} /> Expected Output
                </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar relative z-10">
                {activeTab === 'preview' ? (
                    // --- Prompt Preview Tab ---
                    generatedPrompt ? (
                        <div className="bg-ink-soft rounded-[16px] p-8 border border-white/10 animate-in fade-in zoom-in-95 duration-700 min-h-full">
                            <div className="flex gap-2 mb-6 opacity-40">
                                <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
                                <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
                                <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                            </div>
                            {formData.mode === 'transcribe' && (
                                <div className="mb-6 p-4 bg-accent/10 border border-accent/25 rounded-[12px]">
                                    <div className="flex items-center gap-2 text-accent font-bold text-xs mb-2">
                                        <Paperclip size={14} />
                                        <span>อย่าลืมแนบเอกสาร!</span>
                                    </div>
                                    <p className="text-[11px] text-[#d8d0c2] leading-relaxed">
                                        คัดลอกคำสั่งนี้ไปวางใน Gemini แล้ว<strong>แนบรูปภาพ/เอกสารโจทย์สอบ</strong>ไปพร้อมกัน AI จะพิมพ์โจทย์ตามให้เหมือนต้นฉบับทุกประการ
                                    </p>
                                </div>
                            )}
                            <div className="font-mono text-[13px] leading-relaxed text-[#e8e1d3] whitespace-pre-wrap selection:bg-accent/30">
                                {generatedPrompt}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#a39a8c] gap-6 opacity-40 select-none">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                <Terminal size={32} />
                            </div>
                            <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase font-display">Ready to generate your command</p>
                        </div>
                    )
                ) : (
                    // --- Item 12: Expected Output Tab ---
                    <div className="bg-ink-soft rounded-[16px] p-8 border border-white/10 animate-in fade-in zoom-in-95 duration-500 min-h-full">
                        <div className="flex gap-2 mb-4 opacity-40">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
                            <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Code size={14} className="text-accent" />
                            <span className="text-white font-bold text-xs uppercase tracking-widest font-display">JSON Output Structure</span>
                        </div>
                        <p className="text-[#a39a8c] text-[11px] font-medium mb-4 leading-relaxed">
                            AI จะส่งผลลัพธ์กลับมาในรูปแบบ JSON ตามโครงสร้างด้านล่าง คุณสามารถนำไป import เข้าระบบได้ทันที
                        </p>
                        <pre className="font-mono text-[12px] leading-relaxed text-[#cfc7b8] whitespace-pre-wrap bg-black/30 rounded-[12px] p-6 border border-white/10">
                            {outputSkeleton}
                        </pre>
                    </div>
                )}
            </div>

            {/* Status Bar — Save status indicator */}
            <div className="p-4 text-[9px] font-bold text-[#807868] flex justify-between px-6 lg:px-8 border-t border-white/10 relative z-10 font-display">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> ENGINE: GPT-4/GEMINI READY</span>
                    <span>LENGTH: ~{generatedPrompt?.length ?? 0} chars</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin text-accent" /> SAVING...</>}
                        {saveStatus === 'saved' && <><Save size={10} className="text-[#5cba85]" /> SAVED</>}
                        {saveStatus === 'error' && <><AlertCircle size={10} className="text-[#e06a5c]" /> SAVE FAILED</>}
                        {saveStatus === 'idle' && <><Save size={10} className="text-[#5e5749]" /> AUTO-SAVE</>}
                    </span>
                    <span>LOCALE: TH_TH / EN_US</span>
                </div>
            </div>
        </div>
    );
};

export default PromptPreview;
