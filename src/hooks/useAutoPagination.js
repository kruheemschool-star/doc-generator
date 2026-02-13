import { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// A4 page dimensions at 96dpi:
// Full A4 height = 297mm ≈ 1123px
// Content wrapper has pt-16mm + pb-20mm = 36mm padding
// Boundary line at 277mm → content wrapper scrollHeight at boundary = 297mm ≈ 1123px
// Threshold at ~1100px triggers pagination ~7mm before the visual boundary line
const A4_CONTENT_HEIGHT = 1100;
const MAX_PAGES_SAFETY = 100;
const RECHECK_DELAY = 120;

const useAutoPagination = (pages, setPages, replacePages) => {
    const pageRefs = useRef({});
    const [isChecking, setIsChecking] = useState(false);
    const [overflowPages, setOverflowPages] = useState(new Set());
    const [resizeTick, setResizeTick] = useState(0); // Increments when any page content resizes
    const resizeTimerRef = useRef(null);
    const observerRef = useRef(null);

    // --- ResizeObserver: detects async content expansion (image loads, KaTeX rendering, etc.) ---
    useEffect(() => {
        // Debounced handler for resize events
        const handleResize = () => {
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = setTimeout(() => {
                setResizeTick(t => t + 1);
            }, 150); // Debounce 150ms to batch rapid changes
        };

        // Create a single observer that watches all page content divs
        observerRef.current = new ResizeObserver(handleResize);

        // Observe all current page content divs
        Object.values(pageRefs.current).forEach(pageEl => {
            if (!pageEl) return;
            const contentEl = pageEl.querySelector('[data-page-content]');
            if (contentEl) {
                observerRef.current.observe(contentEl);
            }
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            if (resizeTimerRef.current) {
                clearTimeout(resizeTimerRef.current);
            }
        };
    }, [pages]); // Re-setup observer when pages array changes

    // --- Core pagination logic: runs on pages change, isChecking change, or resize tick ---
    useLayoutEffect(() => {
        if (isChecking) return;
        if (pages.length > MAX_PAGES_SAFETY) {
            console.error("AutoPagination: Max pages reached. Stopping to prevent infinite loop.");
            return;
        }

        let hasOverflow = false;
        let newPages = [...pages];
        const newOverflowPages = new Set();

        for (let i = 0; i < newPages.length; i++) {
            const pageId = newPages[i].id;
            const pageEl = pageRefs.current[pageId];

            if (!pageEl) continue;

            const contentEl = pageEl.querySelector('[data-page-content]');
            const contentHeight = contentEl ? contentEl.scrollHeight : pageEl.scrollHeight;

            if (contentHeight > A4_CONTENT_HEIGHT) {
                if (newPages[i].questions.length > 1) {
                    // Multi-item page: move last item to next page
                    hasOverflow = true;

                    const questions = [...newPages[i].questions];
                    const questionToMove = questions.pop();

                    newPages[i] = {
                        ...newPages[i],
                        questions: questions
                    };

                    if (i + 1 < newPages.length) {
                        newPages[i + 1] = {
                            ...newPages[i + 1],
                            questions: [questionToMove, ...newPages[i + 1].questions]
                        };
                    } else {
                        newPages.push({
                            id: uuidv4(),
                            questions: [questionToMove]
                        });
                    }
                    break; // Re-check from scratch after move
                } else {
                    // Single-item page that overflows: mark as overflow warning
                    newOverflowPages.add(pageId);
                }
            }
        }

        // Update overflow warning state
        setOverflowPages(prev => {
            const prevArr = Array.from(prev).sort().join(',');
            const newArr = Array.from(newOverflowPages).sort().join(',');
            if (prevArr !== newArr) return newOverflowPages;
            return prev;
        });

        if (hasOverflow) {
            setIsChecking(true);
            const updater = replacePages || setPages;
            updater(newPages);
            setTimeout(() => {
                setIsChecking(false);
            }, RECHECK_DELAY);
        }

    }, [pages, isChecking, resizeTick, setPages, replacePages]);

    // Helper to check if a specific page is overflowing
    const isPageOverflow = useCallback((pageId) => {
        return overflowPages.has(pageId);
    }, [overflowPages]);

    return { pageRefs, overflowPages, isPageOverflow };
};

export default useAutoPagination;
