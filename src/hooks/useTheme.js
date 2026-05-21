import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kruheem-theme';

const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // Honor OS preference on first visit
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
};

const applyTheme = (theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
};

/**
 * useTheme — manages light/dark theme with localStorage persistence
 *   - Honors OS preference on first visit
 *   - Adds/removes `dark` class on <html> for Tailwind dark: variants
 *   - Returns [theme, toggleTheme, setTheme]
 */
export const useTheme = () => {
    const [theme, setThemeState] = useState(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* private mode */ }
    }, [theme]);

    const setTheme = useCallback((next) => {
        if (next === 'light' || next === 'dark') setThemeState(next);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    return [theme, toggleTheme, setTheme];
};

// Apply on import to avoid initial flash before useTheme mounts
if (typeof window !== 'undefined') {
    applyTheme(getInitialTheme());
}
