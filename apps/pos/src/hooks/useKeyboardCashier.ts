import { useEffect, useState } from 'react';

interface UseKeyboardProps {
    maxIndex: number;
    onSearchFocus: () => void;
    onCheckout: () => void;
    onClearCart: () => void;
    onAddHighlightedItem: (index: number) => void;
}

export function useKeyboardCashier({ 
    maxIndex, 
    onSearchFocus, 
    onCheckout, 
    onClearCart, 
    onAddHighlightedItem 
}: UseKeyboardProps) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Reset highlight when list changes
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [maxIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isInputFocused = document.activeElement?.tagName === 'INPUT';

            // Global Shortcuts
            if (e.key === '/' && !isInputFocused) {
                e.preventDefault();
                onSearchFocus();
                return;
            }

            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                onCheckout();
                return;
            }

            if (e.ctrlKey && (e.key === 'Delete' || e.key === 'Backspace')) {
                e.preventDefault();
                onClearCart();
                return;
            }

            if (e.key === 'Escape') {
                if (isInputFocused) {
                    (document.activeElement as HTMLElement).blur();
                }
                setHighlightedIndex(-1);
                return;
            }

            // Grid Navigation (Only if not typing in an input)
            if (!isInputFocused && maxIndex > 0) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev < maxIndex - 1 ? prev + 1 : prev));
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                    e.preventDefault();
                    onAddHighlightedItem(highlightedIndex);
                    onSearchFocus(); // Instantly back to search after add
                    setHighlightedIndex(-1);
                }
            } else if (isInputFocused && e.key === 'Enter' && maxIndex > 0) {
                // If searching and they hit enter, auto-add the first item if none is highlighted?
                // Or if they hit down arrow while searching, move focus to grid.
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddHighlightedItem(highlightedIndex >= 0 ? highlightedIndex : 0);
                    // Clear search or just keep focus
                    onSearchFocus();
                    setHighlightedIndex(-1);
                }
            }

            if (isInputFocused && (e.key === 'ArrowDown')) {
                 e.preventDefault();
                 (document.activeElement as HTMLElement).blur();
                 setHighlightedIndex(0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [maxIndex, highlightedIndex, onSearchFocus, onCheckout, onClearCart, onAddHighlightedItem]);

    return { highlightedIndex, setHighlightedIndex };
}
