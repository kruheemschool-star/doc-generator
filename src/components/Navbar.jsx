import React, { useState } from 'react';
import { LayoutDashboard, Sparkles, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import SettingsMenu from './SettingsMenu';

// Editorial Bold — vertical LEFT global rail (spec §6.1)
// 72px dark ink rail, fixed full-height. Hover expands to a 236px overlay
// showing labels + brand. Keeps the existing useTheme + SettingsMenu +
// currentView/onViewChange behaviour intact.
const Navbar = ({ currentView, onViewChange }) => {
    const t = useTheme();
    const isDark = t.mode === 'dark';
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const RAIL_W = 72;
    const OPEN_W = 236;
    const IDLE_ICON = '#7d756a';

    const navItems = [
        { view: 'dashboard', label: 'เอกสารทั้งหมด', icon: LayoutDashboard, primary: true, match: (v) => v === 'dashboard' || v === 'editor' },
        { view: 'prompt-builder', label: 'Prompt Builder', icon: Sparkles, primary: false, match: (v) => v === 'prompt-builder' },
    ];

    return (
        <>
            <nav
                className="fixed top-0 left-0 z-40 print:hidden h-screen font-thai"
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                style={{
                    width: expanded ? OPEN_W : RAIL_W,
                    backgroundColor: 'var(--ink)',
                    paddingTop: 16,
                    paddingBottom: 16,
                    transition: 'width 180ms cubic-bezier(.4,0,.2,1)',
                    overflow: 'hidden',
                    boxShadow: expanded ? '0 16px 40px -12px rgba(20,18,15,.6)' : 'none',
                }}
            >
                <div className="flex flex-col h-full" style={{ width: OPEN_W }}>
                    {/* Brand / logo tile */}
                    <div className="flex items-center" style={{ paddingLeft: 17, paddingRight: 17, gap: 12 }}>
                        <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 11,
                                backgroundColor: 'var(--accent)',
                            }}
                        >
                            <span
                                style={{ fontFamily: 'Sora', fontWeight: 800, color: '#fff', fontSize: 19, lineHeight: 1 }}
                            >
                                K
                            </span>
                        </div>
                        <div
                            className="flex items-center gap-2 whitespace-nowrap"
                            style={{ opacity: expanded ? 1 : 0, transition: 'opacity 140ms ease' }}
                        >
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
                                คณิตครูฮีม
                            </span>
                            <span
                                style={{
                                    fontFamily: 'Sora',
                                    fontWeight: 800,
                                    fontSize: 8.5,
                                    color: '#fff',
                                    backgroundColor: 'var(--accent)',
                                    padding: '2px 5px',
                                    borderRadius: 5,
                                    letterSpacing: '0.04em',
                                }}
                            >
                                AI
                            </span>
                        </div>
                    </div>

                    {/* Nav items */}
                    <div className="flex flex-col" style={{ marginTop: 28, gap: 6, paddingLeft: 16, paddingRight: 16 }}>
                        {navItems.map(({ view, label, icon: Icon, primary, match }) => {
                            const active = match(currentView);
                            return (
                                <button
                                    key={view}
                                    onClick={() => onViewChange(view)}
                                    aria-label={label}
                                    aria-current={active ? 'page' : undefined}
                                    title={label}
                                    className="flex items-center whitespace-nowrap"
                                    style={{
                                        height: 40,
                                        gap: 12,
                                        borderRadius: 11,
                                        paddingLeft: 9,
                                        backgroundColor: active ? 'var(--ink-soft)' : 'transparent',
                                        transition: 'background-color 140ms ease',
                                    }}
                                >
                                    <span className="flex items-center justify-center shrink-0" style={{ width: 22 }}>
                                        <Icon
                                            size={18}
                                            strokeWidth={1.9}
                                            color={active ? (primary ? 'var(--accent)' : '#fff') : IDLE_ICON}
                                        />
                                    </span>
                                    <span
                                        style={{
                                            color: active ? '#fff' : '#b3aa97',
                                            fontWeight: 600,
                                            fontSize: 12.5,
                                            opacity: expanded ? 1 : 0,
                                            transition: 'opacity 140ms ease',
                                        }}
                                    >
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bottom controls: theme toggle, settings, avatar */}
                    <div className="flex flex-col" style={{ gap: 6, paddingLeft: 16, paddingRight: 16 }}>
                        {/* Theme mode (sun/moon) */}
                        <button
                            onClick={t.toggleMode}
                            aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                            title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                            className="flex items-center whitespace-nowrap"
                            style={{
                                height: 40,
                                gap: 12,
                                borderRadius: 11,
                                paddingLeft: 9,
                                backgroundColor: 'transparent',
                                transition: 'background-color 140ms ease',
                            }}
                        >
                            <span className="relative flex items-center justify-center shrink-0 overflow-hidden" style={{ width: 22, height: 18 }}>
                                <Sun
                                    size={17}
                                    strokeWidth={2}
                                    color={IDLE_ICON}
                                    className={`absolute transition-all duration-500 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                                />
                                <Moon
                                    size={17}
                                    strokeWidth={2}
                                    color={IDLE_ICON}
                                    className={`absolute transition-all duration-500 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
                                />
                            </span>
                            <span
                                style={{
                                    color: '#b3aa97',
                                    fontWeight: 600,
                                    fontSize: 12.5,
                                    opacity: expanded ? 1 : 0,
                                    transition: 'opacity 140ms ease',
                                }}
                            >
                                {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                            </span>
                        </button>

                        {/* Settings (theme picker + density) */}
                        <button
                            onClick={() => setSettingsOpen(s => !s)}
                            className="flex items-center whitespace-nowrap"
                            title="ตั้งค่า"
                            aria-label="ตั้งค่า"
                            aria-expanded={settingsOpen}
                            style={{
                                height: 40,
                                gap: 12,
                                borderRadius: 11,
                                paddingLeft: 9,
                                backgroundColor: settingsOpen ? 'var(--ink-soft)' : 'transparent',
                                transition: 'background-color 140ms ease',
                            }}
                        >
                            <span className="flex items-center justify-center shrink-0" style={{ width: 22 }}>
                                <Settings
                                    size={18}
                                    strokeWidth={1.9}
                                    color={settingsOpen ? '#fff' : IDLE_ICON}
                                />
                            </span>
                            <span
                                style={{
                                    color: settingsOpen ? '#fff' : '#b3aa97',
                                    fontWeight: 600,
                                    fontSize: 12.5,
                                    opacity: expanded ? 1 : 0,
                                    transition: 'opacity 140ms ease',
                                }}
                            >
                                ตั้งค่า
                            </span>
                        </button>

                        {/* User block / avatar */}
                        <div className="flex items-center whitespace-nowrap" style={{ height: 40, gap: 12, paddingLeft: 6, marginTop: 4 }}>
                            <span
                                className="flex items-center justify-center shrink-0"
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--ink-soft)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 13,
                                }}
                            >
                                ฮ
                            </span>
                            <span
                                className="flex flex-col"
                                style={{ opacity: expanded ? 1 : 0, transition: 'opacity 140ms ease', lineHeight: 1.2 }}
                            >
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: 12.5 }}>ครูฮีม</span>
                                <span style={{ color: '#8a8175', fontSize: 10.5 }}>บัญชีของฉัน</span>
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

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
        </>
    );
};

export default Navbar;
