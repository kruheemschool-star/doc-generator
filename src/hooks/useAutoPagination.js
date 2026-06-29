import { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// A4 page dimensions at 96dpi:
// Full A4 height = 297mm ≈ 1123px. We pack to a 1100px threshold, leaving ~7mm of
// safety before the printable boundary so nothing clips when printed.
const A4_CONTENT_HEIGHT = 1100;
const MAX_PAGES_SAFETY = 200;
const RECHECK_DELAY = 80;

// @hello-pangea/dnd tags every draggable item; we measure those nodes directly.
const itemSelector = (id) => `[data-rfd-draggable-id="${CSS.escape(String(id))}"]`;

const pagesSignature = (pages) =>
    pages.map(p => p.questions.map(q => q.id).join(',')).join('|');

const useAutoPagination = (pages, setPages, replacePages) => {
    const pageRefs = useRef({});
    const [isChecking, setIsChecking] = useState(false);
    const [overflowPages, setOverflowPages] = useState(new Set());
    const [resizeTick, setResizeTick] = useState(0); // bumps when any page content resizes
    const resizeTimerRef = useRef(null);
    const observerRef = useRef(null);
    const recheckTimerRef = useRef(null);

    // Unmount-only cleanup: clear any pending re-check timer so setIsChecking()
    // can't fire on an unmounted component. Deliberately NOT cleared on every
    // effect re-run — doing so would cancel the timer that resets isChecking and
    // freeze pagination.
    useEffect(() => () => clearTimeout(recheckTimerRef.current), []);

    // --- ResizeObserver: re-paginate when content grows asynchronously
    // (image loads, KaTeX rendering, font swap, solution toggle, typing) ---
    useEffect(() => {
        const handleResize = () => {
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = setTimeout(() => setResizeTick(t => t + 1), 150);
        };
        observerRef.current = new ResizeObserver(handleResize);
        Object.values(pageRefs.current).forEach(pageEl => {
            const contentEl = pageEl?.querySelector('[data-page-content]');
            if (contentEl) observerRef.current.observe(contentEl);
        });
        return () => {
            if (observerRef.current) observerRef.current.disconnect();
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
        };
    }, [pages]);

    // --- Core: measure real item heights and bin-pack into A4 pages in ONE pass. ---
    // The previous algorithm moved a single item per render (~120ms each), which never
    // converged on a bulk import of 100 questions. Measuring every item up front and
    // packing greedily means even a 100-question import lays out in a single update.
    useLayoutEffect(() => {
        if (isChecking) return;
        if (pages.length > MAX_PAGES_SAFETY) {
            console.error('AutoPagination: max pages reached, stopping to prevent a loop.');
            return;
        }

        // offsetHeight is layout px and is NOT affected by the editor's zoom transform;
        // getBoundingClientRect() would be scaled and would over-pack the page.
        const heightOf = (el) => {
            const cs = getComputedStyle(el);
            return el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
        };

        // 1. Gather every item in document order with its measured height.
        //    Derive the per-page budget from the real content padding so the packed
        //    height matches the scrollHeight overflow threshold used on screen.
        //    Bail out if any node isn't rendered yet — a later resizeTick will retry.
        let budget = A4_CONTENT_HEIGHT;
        let budgetReady = false;
        const ordered = [];

        for (const page of pages) {
            const pageEl = pageRefs.current[page.id];
            if (!pageEl) return;
            const contentEl = pageEl.querySelector('[data-page-content]');
            if (!contentEl) return;
            if (!budgetReady) {
                const cs = getComputedStyle(contentEl);
                budget = A4_CONTENT_HEIGHT - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
                budgetReady = true;
            }
            for (const q of page.questions) {
                const el = contentEl.querySelector(itemSelector(q.id));
                if (!el) return;
                ordered.push({ item: q, height: heightOf(el) });
            }
        }
        if (ordered.length === 0) return;

        // 2. Greedy next-fit packing — preserves item order, never splits one item.
        const packed = [[]];
        let running = 0;
        for (const entry of ordered) {
            const cur = packed[packed.length - 1];
            if (cur.length > 0 && running + entry.height > budget) {
                packed.push([]);
                running = 0;
            }
            packed[packed.length - 1].push(entry);
            running += entry.height;
        }

        // 3. Rebuild pages, reusing existing ids by index so React keys and DnD
        //    droppable ids stay stable across the re-pack.
        const newPages = packed.map((bucket, i) => ({
            id: pages[i]?.id || uuidv4(),
            questions: bucket.map(b => b.item),
        }));

        // 4. A lone item taller than a whole page can't be split — flag it.
        const newOverflow = new Set();
        packed.forEach((bucket, i) => {
            if (bucket.length === 1 && bucket[0].height > budget) newOverflow.add(newPages[i].id);
        });

        // 5. Commit only when the layout actually changed (deterministic packing on
        //    stable heights => identical signature => no loop).
        if (pagesSignature(newPages) !== pagesSignature(pages)) {
            setIsChecking(true);
            (replacePages || setPages)(newPages);
            clearTimeout(recheckTimerRef.current);
            recheckTimerRef.current = setTimeout(() => setIsChecking(false), RECHECK_DELAY);
        }

        setOverflowPages(prev => {
            const a = Array.from(prev).sort().join(',');
            const b = Array.from(newOverflow).sort().join(',');
            return a === b ? prev : newOverflow;
        });
    }, [pages, isChecking, resizeTick, setPages, replacePages]);

    const isPageOverflow = useCallback((pageId) => overflowPages.has(pageId), [overflowPages]);

    return { pageRefs, overflowPages, isPageOverflow };
};

export default useAutoPagination;
