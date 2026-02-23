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
        <div className="w-full lg:w-[38%] bg-[#0B0F19] flex flex-col shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden relative border-l border-slate-800/50 min-h-[40vh] lg:min-h-0">
            {/* Visual Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] -mr-80 -mt-80 rounded-full" />

            {/* Header Section */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-black/20 backdrop-blur-md relative z-10">
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
                        onClick={onOpenGemini}
                        aria-label="เปิด Gemini"
                        className="h-10 px-4 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[11px] font-bold uppercase border border-white/10 hover:border-white/20 active:scale-95 tracking-wider"
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
                                className={`h-10 px-5 rounded-l-xl font-bold text-[11px] transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-600/20 tracking-wider
                                ${isCopied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'} `}
                            >
                                {isCopied ? <Check size={14} strokeWidth={3} /> : <ClipboardCopy size={14} />}
                                {isCopied ? 'COPIED ✓' : 'COPY PROMPT'}
                            </button>
                            <button
                                onClick={() => setShowCopyMenu(!showCopyMenu)}
                                disabled={!generatedPrompt}
                                aria-label="ตัวเลือกการคัดลอก"
                                className={`h-10 px-2 rounded-r-xl border-l border-white/20 font-bold text-[11px] transition-all active:scale-95 shadow-lg shadow-blue-600/20
                                ${isCopied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'} `}
                            >
                                ▾
                            </button>
                        </div>
                        {/* Copy format dropdown */}
                        {showCopyMenu && (
                            <div className="absolute right-0 top-12 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => { onCopy(); setShowCopyMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <ClipboardCopy size={12} /> Copy as Plain Text
                                </button>
                                <button
                                    onClick={() => { onCopyMarkdown(); setShowCopyMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 border-t border-white/5"
                                >
                                    <Code size={12} /> Copy as Markdown
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Item 12: Tab bar for Preview / Expected Output */}
            <div className="flex border-b border-white/5 relative z-10">
                <button
                    onClick={() => setActiveTab('preview')}
                    aria-label="แสดง Preview"
                    role="tab"
                    aria-selected={activeTab === 'preview'}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                        ${activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    <Eye size={12} /> Prompt Preview
                </button>
                <button
                    onClick={() => setActiveTab('output')}
                    aria-label="แสดง Expected Output"
                    role="tab"
                    aria-selected={activeTab === 'output'}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                        ${activeTab === 'output' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    <Code size={12} /> Expected Output
                </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar relative z-10">
                {activeTab === 'preview' ? (
                    // --- Prompt Preview Tab ---
                    generatedPrompt ? (
                        <div className="bg-[#131926] rounded-3xl p-8 border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-700 min-h-full">
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
                    )
                ) : (
                    // --- Item 12: Expected Output Tab ---
                    <div className="bg-[#131926] rounded-3xl p-8 border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-500 min-h-full">
                        <div className="flex gap-2 mb-4 opacity-30">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Code size={14} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">JSON Output Structure</span>
                        </div>
                        <p className="text-slate-500 text-[11px] font-medium mb-4 leading-relaxed">
                            AI จะส่งผลลัพธ์กลับมาในรูปแบบ JSON ตามโครงสร้างด้านล่าง คุณสามารถนำไป import เข้าระบบได้ทันที
                        </p>
                        <pre className="font-mono text-[12px] leading-relaxed text-emerald-300/80 whitespace-pre-wrap bg-black/30 rounded-2xl p-6 border border-emerald-500/10">
                            {outputSkeleton}
                        </pre>
                    </div>
                )}
            </div>

            {/* Status Bar — Save status indicator */}
            <div className="p-4 bg-black/40 backdrop-blur-xl text-[9px] font-bold text-slate-500 flex justify-between px-6 lg:px-8 border-t border-white/5 relative z-10">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> ENGINE: GPT-4/GEMINI READY</span>
                    <span>LENGTH: ~{generatedPrompt.length} chars</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin text-blue-400" /> SAVING...</>}
                        {saveStatus === 'saved' && <><Save size={10} className="text-emerald-400" /> SAVED</>}
                        {saveStatus === 'error' && <><AlertCircle size={10} className="text-rose-400" /> SAVE FAILED</>}
                        {saveStatus === 'idle' && <><Save size={10} className="text-slate-600" /> AUTO-SAVE</>}
                    </span>
                    <span>LOCALE: TH_TH / EN_US</span>
                </div>
            </div>
        </div>
    );
};

export default PromptPreview;
