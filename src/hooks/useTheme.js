import { useState, useEffect, useCallback } from 'react';

// Three independent appearance axes, each persisted in localStorage so the
// user's choices survive reloads. We also reflect them as html attributes
// (`class="dark"` for Tailwind compat, `data-color-mode` / `data-theme` /
// `data-density` for the Deep Space CSS-variable tokens in index.css).
const MODE_KEY = 'kruheem-theme';         // legacy key — keeps stored value working
const THEME_KEY = 'kruheem-accent';
const DENSITY_KEY = 'kruheem-density';

const safeRead = (key, fallback, valid) => {
    if (typeof window === 'undefined') return fallback;
    try {
        const stored = localStorage.getItem(key);
        if (stored && valid.includes(stored)) return stored;
    } catch (_) { /* private mode */ }
    return fallback;
};

const getInitialMode = () => {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = localStorage.getItem(MODE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        // First visit: honor OS preference but default to dark (Deep Space is dark-first)
        if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    } catch (_) { /* private mode */ }
    return 'dark';
};

const apply = (mode, theme, density) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Tailwind compat: dark variant uses .dark on <html>
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    // Token system attributes
    root.setAttribute('data-color-mode', mode);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-density', density);
};

/**
 * useTheme — manages all three appearance axes:
 *   - mode:    'dark' | 'light'
 *   - theme:   'violet' | 'cyan' | 'amber'   (accent color)
 *   - density: 'comfortable' | 'compact'     (content padding)
 *
 * Returned shape kept backward-compatible: [mode, toggleMode, setMode]
 * plus extra setters as properties on the array (theme, setTheme,
 * density, setDensity). Existing call sites that use [theme, toggleTheme]
 * destructuring keep working.
 */
export const useTheme = () => {
    const [mode, setModeState] = useState(getInitialMode);
    const [theme, setThemeState] = useState(() => safeRead(THEME_KEY, 'violet', ['violet', 'cyan', 'amber']));
    const [density, setDensityState] = useState(() => safeRead(DENSITY_KEY, 'comfortable', ['comfortable', 'compact']));

    useEffect(() => {
        apply(mode, theme, density);
        try {
            localStorage.setItem(MODE_KEY, mode);
            localStorage.setItem(THEME_KEY, theme);
            localStorage.setItem(DENSITY_KEY, density);
        } catch (_) { /* private mode */ }
    }, [mode, theme, density]);

    const setMode = useCallback((next) => {
        if (next === 'light' || next === 'dark') setModeState(next);
    }, []);
    const toggleMode = useCallback(() => {
        setModeState(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);
    const setTheme = useCallback((next) => {
        if (['violet', 'cyan', 'amber'].includes(next)) setThemeState(next);
    }, []);
    const setDensity = useCallback((next) => {
        if (['comfortable', 'compact'].includes(next)) setDensityState(next);
    }, []);

    // Tuple keeps old [theme, toggleTheme, setTheme] usage working,
    // with extra fields hung off it for the Settings menu.
    const tuple = [mode, toggleMode, setMode];
    tuple.mode = mode;
    tuple.theme = theme;
    tuple.density = density;
    tuple.setMode = setMode;
    tuple.toggleMode = toggleMode;
    tuple.setTheme = setTheme;
    tuple.setDensity = setDensity;
    return tuple;
};

// Apply on import to avoid initial flash before useTheme mounts
if (typeof window !== 'undefined') {
    const initialMode = getInitialMode();
    const initialTheme = safeRead(THEME_KEY, 'violet', ['violet', 'cyan', 'amber']);
    const initialDensity = safeRead(DENSITY_KEY, 'comfortable', ['comfortable', 'compact']);
    apply(initialMode, initialTheme, initialDensity);
}
