import React from 'react';
import { LayoutDashboard, Sparkles, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Navbar = ({ currentView, onViewChange }) => {
    const [theme, toggleTheme] = useTheme();
    const isDark = theme === 'dark';

    return (
        <nav className="bg-white dark:bg-[#1e1e2f] text-gray-900 dark:text-white sticky top-0 z-40 border-b border-gray-200 dark:border-white/5 print:hidden font-sans">
            <div className="flex items-center justify-end h-14 px-6">
                <div className="flex items-center gap-2">
                    {/* Menu Items */}
                    <div className="flex space-x-1 bg-gray-100 dark:bg-white/[0.06] p-1 rounded-xl border border-gray-200/60 dark:border-white/[0.06]">
                        <button
                            onClick={() => onViewChange('dashboard')}
                            aria-label="Dashboard"
                            aria-current={(currentView === 'dashboard' || currentView === 'editor') ? 'page' : undefined}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                                currentView === 'dashboard' || currentView === 'editor'
                                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                            }`}
                        >
                            <LayoutDashboard size={16} className={currentView === 'dashboard' || currentView === 'editor' ? 'text-blue-500 dark:text-blue-400' : ''} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </button>

                        <button
                            onClick={() => onViewChange('prompt-builder')}
                            aria-label="Prompt Builder"
                            aria-current={currentView === 'prompt-builder' ? 'page' : undefined}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                                currentView === 'prompt-builder'
                                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                            }`}
                        >
                            <Sparkles size={16} className={currentView === 'prompt-builder' ? 'text-purple-500 dark:text-purple-400' : ''} />
                            <span className="hidden sm:inline">Prompt Builder</span>
                        </button>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                        title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-amber-300 hover:text-gray-900 dark:hover:text-amber-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/[0.06] overflow-hidden"
                    >
                        <Sun
                            size={16}
                            strokeWidth={2.5}
                            className={`absolute transition-all duration-500 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                        />
                        <Moon
                            size={16}
                            strokeWidth={2.5}
                            className={`absolute transition-all duration-500 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
                        />
                    </button>

                    {/* Settings */}
                    <button
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/[0.06]"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
