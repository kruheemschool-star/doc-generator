import React, { useState } from 'react';
import { LayoutDashboard, Sparkles, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import SettingsMenu from './SettingsMenu';

// Deep Space TopBar — 52px slim bar, dark token-driven, sits over the Sidebar
// region on the left visually but does not cover its content (Sidebar's KruHeem
// brand sits in the corner; Navbar content lives on the right half).
const Navbar = ({ currentView, onViewChange }) => {
    const t = useTheme();
    const isDark = t.mode === 'dark';
    const [settingsOpen, setSettingsOpen] = useState(false);

    const pill = (active) => ({
        backgroundColor: active ? 'var(--surface-3)' : 'transparent',
        color: active ? 'var(--text-1)' : 'var(--text-3)',
    });

    return (
        <nav
            className="sticky top-0 z-40 print:hidden font-noto-thai"
            style={{
                height: 52,
                backgroundColor: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
            }}
        >
            <div className="flex items-center justify-end h-full px-9">
                <div className="flex items-center gap-2">
                    {/* Page nav pills */}
                    <div
                        className="flex gap-0.5 p-1"
                        style={{
                            borderRadius: 10,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border-2)',
                        }}
                    >
                        <button
                            onClick={() => onViewChange('dashboard')}
                            aria-label="Dashboard"
                            aria-current={(currentView === 'dashboard' || currentView === 'editor') ? 'page' : undefined}
                            className="px-3.5 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-all"
                            style={pill(currentView === 'dashboard' || currentView === 'editor')}
                        >
                            <LayoutDashboard size={14} strokeWidth={2} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </button>

                        <button
                            onClick={() => onViewChange('prompt-builder')}
                            aria-label="Prompt Builder"
                            aria-current={currentView === 'prompt-builder' ? 'page' : undefined}
                            className="px-3.5 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-all"
                            style={pill(currentView === 'prompt-builder')}
                        >
                            <Sparkles size={14} strokeWidth={2} />
                            <span className="hidden sm:inline">Prompt Builder</span>
                        </button>
                    </div>

                    {/* Theme mode (sun/moon) */}
                    <button
                        onClick={t.toggleMode}
                        aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                        title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                        className="relative w-9 h-9 flex items-center justify-center overflow-hidden transition-all"
                        style={{
                            borderRadius: 10,
                            color: 'var(--text-3)',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border-2)',
                        }}
                    >
                        <Sun
                            size={15}
                            strokeWidth={2.2}
                            className={`absolute transition-all duration-500 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                        />
                        <Moon
                            size={15}
                            strokeWidth={2.2}
                            className={`absolute transition-all duration-500 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
                        />
                    </button>

                    {/* Settings (theme picker + density) */}
                    <button
                        onClick={() => setSettingsOpen(s => !s)}
                        className="w-9 h-9 flex items-center justify-center transition-all"
                        style={{
                            borderRadius: 10,
                            color: settingsOpen ? 'var(--accent-b)' : 'var(--text-3)',
                            backgroundColor: settingsOpen ? 'var(--accent-dim)' : 'var(--surface)',
                            border: '1px solid ' + (settingsOpen ? 'var(--accent)' : 'var(--border-2)'),
                        }}
                        title="Settings"
                        aria-label="Settings"
                        aria-expanded={settingsOpen}
                    >
                        <Settings size={15} strokeWidth={2} />
                    </button>
                </div>
            </div>
            <SettingsMenu
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                theme={t.theme}
                setTheme={t.setTheme}
                density={t.density}
                setDensity={t.setDensity}
                mode={t.mode}
                setMode={t.setMode}
            />
        </nav>
    );
};

export default Navbar;
