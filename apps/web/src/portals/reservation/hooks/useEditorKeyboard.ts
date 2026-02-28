import { useEffect } from 'react';

interface EditorKeyboardActions {
  deleteSelected: () => void;
  duplicateSelected: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  nudge: (dx: number, dy: number) => void;
  undo: () => void;
  redo: () => void;
  isActive: boolean; // Only process when editor is active
  nudgeAmount: number; // Grid size or 5px
}

export function useEditorKeyboard(actions: EditorKeyboardActions) {
  useEffect(() => {
    if (!actions.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      // Undo
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
        return;
      }

      // Redo
      if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        actions.redo();
        return;
      }

      // Select all
      if (isMeta && e.key === 'a') {
        e.preventDefault();
        actions.selectAll();
        return;
      }

      // Duplicate
      if (isMeta && e.key === 'd') {
        e.preventDefault();
        actions.duplicateSelected();
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        actions.deleteSelected();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        actions.clearSelection();
        return;
      }

      // Arrow keys - nudge
      const nudge = actions.nudgeAmount;
      if (e.key === 'ArrowUp') { e.preventDefault(); actions.nudge(0, -nudge); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); actions.nudge(0, nudge); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); actions.nudge(-nudge, 0); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); actions.nudge(nudge, 0); return; }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
