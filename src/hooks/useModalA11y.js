import { useEffect, useRef } from 'react';

/**
 * Accessible modal hook — handles:
 *  1. Trap Tab/Shift+Tab inside modal container
 *  2. Auto-focus first focusable element on open
 *  3. Restore focus to previous element on close
 *  4. Close on Escape key
 *
 * Usage:
 *   const modalRef = useModalA11y(isOpen, onClose);
 *   return <div ref={modalRef} role="dialog" aria-modal="true">...</div>
 */
const FOCUSABLE_SELECTOR = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(',');

export const useModalA11y = (isOpen, onClose) => {
    const ref = useRef(null);
    const previouslyFocusedRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Save focus to restore on close
        previouslyFocusedRef.current = document.activeElement;

        // Auto-focus first focusable inside modal (after paint)
        const focusFirst = () => {
            const node = ref.current;
            if (!node) return;
            const focusables = node.querySelectorAll(FOCUSABLE_SELECTOR);
            if (focusables.length > 0) {
                focusables[0].focus();
            } else {
                node.focus();
            }
        };
        const rafId = requestAnimationFrame(focusFirst);

        // Trap Tab + close on Escape
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose?.();
                return;
            }
            if (e.key !== 'Tab') return;
            const node = ref.current;
            if (!node) return;
            const focusables = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(rafId);
            document.removeEventListener('keydown', handleKeyDown);
            // Restore focus
            const prev = previouslyFocusedRef.current;
            if (prev && typeof prev.focus === 'function') {
                try { prev.focus(); } catch (_) { /* element may be gone */ }
            }
        };
    }, [isOpen, onClose]);

    return ref;
};
