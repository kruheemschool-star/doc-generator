import { useState, useCallback } from 'react';

/**
 * Custom Hook for Undo/Redo functionality
 * @param {any} initialState - The initial state value
 * @returns {Object} - { state, set, undo, redo, canUndo, canRedo, clear }
 */
const useHistory = (initialState) => {
    const [history, setHistory] = useState({
        past: [],
        present: initialState,
        future: []
    });

    const { past, present, future } = history;

    // Helper to determine if undo/redo is possible
    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    /**
     * Revert to the previous state
     */
    const undo = useCallback(() => {
        setHistory((currentState) => {
            const { past, present, future } = currentState;
            if (past.length === 0) return currentState;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [present, ...future]
            };
        });
    }, []);

    /**
     * Restore the next state
     */
    const redo = useCallback(() => {
        setHistory((currentState) => {
            const { past, present, future } = currentState;
            if (future.length === 0) return currentState;

            const next = future[0];
            const newFuture = future.slice(1);

            return {
                past: [...past, present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    /**
     * Set a new state, adding the current state to history
     * @param {any|Function} newPresentOrFn - The new state value or a function receiving prev state
     */
    const set = useCallback((newPresentOrFn) => {
        setHistory((currentState) => {
            const { present } = currentState;

            const newPresent = typeof newPresentOrFn === 'function'
                ? newPresentOrFn(present)
                : newPresentOrFn;

            if (newPresent === present) return currentState;

            return {
                past: [...currentState.past, present],
                present: newPresent,
                future: []
            };
        });
    }, []);

    /**
     * Update the current state without adding to the history (silent update)
     * @param {any|Function} newPresentOrFn - The new state value or a function receiving prev state
     */
    const replace = useCallback((newPresentOrFn) => {
        setHistory((currentState) => {
            const { present } = currentState;

            const newPresent = typeof newPresentOrFn === 'function'
                ? newPresentOrFn(present)
                : newPresentOrFn;

            if (newPresent === present) return currentState;

            return {
                ...currentState,
                present: newPresent
            };
        });
    }, []);

    /**
     * Reset the history entirely
     * @param {any} newInitialState - Optional new initial state
     */
    const clear = useCallback((newInitialState) => {
        setHistory({
            past: [],
            present: newInitialState !== undefined ? newInitialState : initialState,
            future: []
        });
    }, [initialState]);

    return {
        state: present,
        set,
        replace,
        undo,
        redo,
        canUndo,
        canRedo,
        clear,
        history // Expose raw history if needed for debugging
    };
};

export default useHistory;
