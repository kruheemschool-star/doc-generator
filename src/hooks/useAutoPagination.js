import { useRef, useLayoutEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// A4 Height at 96dpi is approx 1123px (297mm).
const A4_HEIGHT_THRESHOLD = 1135;
const MAX_PAGES_SAFETY = 50; // Prevention against runaway loops

const useAutoPagination = (pages, setPages, replacePages) => {
    const pageRefs = useRef({});
    const [isChecking, setIsChecking] = useState(false);

    useLayoutEffect(() => {
        if (isChecking) return;
        if (pages.length > MAX_PAGES_SAFETY) {
            console.error("AutoPagination: Max pages reached. Stopping to prevent infinite loop.");
            return;
        }

        let hasOverflow = false;
        let newPages = [...pages];

        for (let i = 0; i < newPages.length; i++) {
            const pageId = newPages[i].id;
            const pageEl = pageRefs.current[pageId];

            if (!pageEl) continue;

            // CRITICAL FIX: Only paginate if the page overflows AND there's more than one item.
            // If there's only one item and it's too big, we MUST let it stay or it will hop pages forever.
            if (pageEl.clientHeight > A4_HEIGHT_THRESHOLD && newPages[i].questions.length > 1) {
                hasOverflow = true;

                const questions = [...newPages[i].questions];
                const questionToMove = questions.pop(); // Take the last one

                // Update current page
                newPages[i] = {
                    ...newPages[i],
                    questions: questions
                };

                // Move to next page
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
                break;
            }
        }

        if (hasOverflow) {
            setIsChecking(true);
            const updater = replacePages || setPages;
            updater(newPages);
            setTimeout(() => {
                setIsChecking(false);
            }, 100);
        }

    }, [pages, isChecking, setPages, replacePages]);

    return { pageRefs };
};

export default useAutoPagination;
