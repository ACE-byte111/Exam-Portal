import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { api } from '../services/api';

export default function useAutosave({ enabled = true, examId, studentId }) {
  const timerRef = useRef(null);
  const lastContentRef = useRef(null);

  useEffect(() => {
    if (!enabled || !examId) return;

    const saveToServer = async () => {
      const { files, dirty, versions } = useEditorStore.getState();

      // Check if there are dirty files
      const dirtyFiles = Object.entries(dirty).filter(([_, isDirty]) => isDirty);
      if (dirtyFiles.length === 0) return;

      // Create a content hash to avoid duplicate saves
      const contentStr = JSON.stringify(files);
      if (contentStr === lastContentRef.current) return;
      lastContentRef.current = contentStr;

      useEditorStore.getState().setSaving(true);

      try {
        await api.saveVersion({
          examId,
          studentId,
          files,
          timestamp: new Date().toISOString(),
        });
        useEditorStore.getState().markSaved();
      } catch (err) {
        console.warn('Autosave to server failed:', err);
        // Still mark as saved locally since localStorage already has it
        useEditorStore.getState().setSaving(false);
      }
    };

    // Autosave every 3 seconds
    timerRef.current = setInterval(saveToServer, 3000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, examId, studentId]);

  // Save on beforeunload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e) => {
      const { hasDirtyFiles, files, versions, examId: eid } = useEditorStore.getState();
      if (hasDirtyFiles()) {
        // Force save to localStorage
        const storageKey = `portal_autosave_${eid}`;
        localStorage.setItem(storageKey, JSON.stringify({
          files,
          versions,
          lastSaved: new Date().toISOString(),
        }));
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);
}
