import React from 'react';
import { Home, Sparkles, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = ({ theme, onToggle }) => {
    const isDark = theme === 'dark';
    return (
        <button
            onClick={onToggle}
            aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
            title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/60 border border-white/5 text-amber-300 hover:text-amber-200 transition-all active:scale-95 group overflow-hidden"
        >
            <Sun
                size={18}
                strokeWidth={2.5}
                className={`absolute transition-all duration-500 ${
                    isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
            />
            <Moon
                size={18}
                strokeWidth={2.5}
                className={`absolute transition-all duration-500 ${
                    isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                }`}
            />
        </button>
    );
};

const Navbar = ({ currentView, onViewChange }) => {
    const [theme, toggleTheme] = useTheme();

    return (
        <nav className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/5 print:hidden font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => onViewChange('dashboard')}
                    >
                        <div className="relative">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                                K
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 dark:border-slate-950 rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight leading-none group-hover:text-blue-400 transition-colors font-outfit">
                                KruHeem
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Math AI Assistant</span>
                        </div>
                    </div>

                    {/* Right side: Menu + Theme toggle */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Menu Items */}
                        <div className="flex space-x-1 sm:space-x-2 bg-slate-800/50 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => onViewChange('dashboard')}
                                aria-label="Dashboard"
                                aria-current={(currentView === 'dashboard' || currentView === 'editor') ? 'page' : undefined}
                                className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ${currentView === 'dashboard' || currentView === 'editor'
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <LayoutDashboard size={18} className={currentView === 'dashboard' || currentView === 'editor' ? 'text-blue-400' : ''} />
                                <span className="hidden sm:inline">Dashboard</span>
                            </button>

                            <button
                                onClick={() => onViewChange('prompt-builder')}
                                aria-label="Prompt Builder"
                                aria-current={currentView === 'prompt-builder' ? 'page' : undefined}
                                className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ${currentView === 'prompt-builder'
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <Sparkles size={18} className={currentView === 'prompt-builder' ? 'text-purple-400 animate-pulse' : ''} />
                                <span className="hidden sm:inline">Prompt Builder</span>
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
