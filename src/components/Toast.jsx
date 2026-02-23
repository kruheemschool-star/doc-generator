import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react';

const TOAST_CONFIGS = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-emerald-50 border-emerald-200',
        iconClass: 'text-emerald-500',
        textClass: 'text-emerald-800',
    },
    error: {
        icon: AlertCircle,
        bgClass: 'bg-rose-50 border-rose-200',
        iconClass: 'text-rose-500',
        textClass: 'text-rose-800',
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-amber-50 border-amber-200',
        iconClass: 'text-amber-500',
        textClass: 'text-amber-800',
    },
    info: {
        icon: Info,
        bgClass: 'bg-blue-50 border-blue-200',
        iconClass: 'text-blue-500',
        textClass: 'text-blue-800',
    },
};

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const config = TOAST_CONFIGS[type] || TOAST_CONFIGS.info;
    const Icon = config.icon;

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    }, [onClose]);

    useEffect(() => {
        // Enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto-dismiss
        if (duration > 0) {
            const timer = setTimeout(handleClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, handleClose]);

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm 
                transition-all duration-300 ease-out
                ${config.bgClass}
                ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
            `}
        >
            <Icon size={18} className={`${config.iconClass} shrink-0`} strokeWidth={2.5} />
            <span className={`text-sm font-semibold flex-1 ${config.textClass}`}>{message}</span>
            <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                aria-label="ปิดการแจ้งเตือน"
            >
                <X size={14} strokeWidth={3} />
            </button>
        </div>
    );
};

/**
 * Toast Container - manages multiple toasts
 * Usage: const { toasts, addToast, removeToast } = useToast();
 */
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};

export const ToastContainer = ({ toasts, removeToast }) => {
    if (!toasts.length) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2" aria-label="การแจ้งเตือน">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default Toast;
