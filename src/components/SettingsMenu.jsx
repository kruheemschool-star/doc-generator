import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

// Theme accent swatches — visual color hint matches the actual CSS variable
// the theme will swap in. Kept inline so it doesn't drift from index.css tokens.
const THEMES = [
    { id: 'violet', label: 'Violet', from: '#7856f4', to: '#a87ff8' },
    { id: 'cyan', label: 'Cyan', from: '#06b6d4', to: '#67e8f9' },
    { id: 'amber', label: 'Amber', from: '#f59e0b', to: '#fcd34d' },
];

const Section = ({ label, children }) => (
    <div className="px-3 pb-2">
        <div
            className="uppercase mb-2 mt-3 font-noto-thai"
            style={{ color: 'var(--text-5)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em' }}
        >{label}</div>
        {children}
    </div>
);

const Chip = ({ active, onClick, children, style }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 transition-all"
        style={{
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: active ? 'var(--text-1)' : 'var(--text-3)',
            backgroundColor: active ? 'var(--surface-3)' : 'var(--surface-2)',
            border: '1px solid ' + (active ? 'var(--border-4)' : 'var(--border-2)'),
            ...style,
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-3)'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-2)'; }}
    >{children}</button>
);

// Settings dropdown — opens from the gear icon on the TopBar. Lets the user
// swap accent theme (violet/cyan/amber), density (comfortable/compact), and
// color-mode (dark/light). All driven through the useTheme hook so changes
// flip the CSS-variable tokens on <html> instantly.
const SettingsMenu = ({ open, onClose, theme, setTheme, density, setDensity, mode, setMode }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        // Defer attaching mousedown so the same click that opened the menu
        // doesn't immediately close it via the outside-click handler.
        const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        const timer = setTimeout(() => document.addEventListener('mousedown', onDocClick), 0);
        document.addEventListener('keydown', onEsc);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={ref}
            className="absolute right-9 z-50 font-noto-thai"
            style={{
                top: 56,
                minWidth: 260,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-3)',
                borderRadius: 12,
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            }}
        >
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 700 }}>Settings</span>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{ color: 'var(--text-5)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-3)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-5)'}
                ><X size={14} /></button>
            </div>

            <Section label="Accent theme">
                <div className="flex gap-1.5 flex-wrap">
                    {THEMES.map(t => (
                        <Chip key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)} style={{ padding: '5px 9px' }}>
                            <span
                                className="block"
                                style={{
                                    width: 14, height: 14, borderRadius: 4,
                                    background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                                    boxShadow: theme === t.id ? `0 0 0 2px var(--surface), 0 0 0 3px ${t.from}55` : 'none',
                                }}
                            />
                            <span>{t.label}</span>
                            {theme === t.id && <Check size={12} />}
                        </Chip>
                    ))}
                </div>
            </Section>

            <Section label="Density">
                <div className="flex gap-1.5">
                    <Chip active={density === 'comfortable'} onClick={() => setDensity('comfortable')}>
                        Comfortable {density === 'comfortable' && <Check size={12} />}
                    </Chip>
                    <Chip active={density === 'compact'} onClick={() => setDensity('compact')}>
                        Compact {density === 'compact' && <Check size={12} />}
                    </Chip>
                </div>
            </Section>

            <Section label="Color mode">
                <div className="flex gap-1.5">
                    <Chip active={mode === 'dark'} onClick={() => setMode('dark')}>
                        Dark {mode === 'dark' && <Check size={12} />}
                    </Chip>
                    <Chip active={mode === 'light'} onClick={() => setMode('light')}>
                        Light {mode === 'light' && <Check size={12} />}
                    </Chip>
                </div>
            </Section>

            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-2)', color: 'var(--text-6)', fontSize: 10, fontFamily: 'Sora, sans-serif', letterSpacing: '0.04em' }}>
                Preferences are saved locally.
            </div>
        </div>
    );
};

export default SettingsMenu;
