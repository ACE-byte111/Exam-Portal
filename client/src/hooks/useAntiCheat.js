import { useEffect } from 'react';
import socket from '../services/socket';
import { useToastStore } from '../stores/toastStore';

export default function useAntiCheat({ enabled = true, examId, studentId }) {
  useEffect(() => {
    if (!enabled || !examId) return;

    const logEvent = (event, details = {}) => {
      const data = {
        examId,
        studentId,
        event,
        timestamp: new Date().toISOString(),
        ...details,
      };
      socket.emit('student:anti-cheat-event', data);
    };

    // Tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        logEvent('tab_hidden');
        useToastStore.getState().warning('Tab switch detected. This activity is being recorded.');
      } else {
        logEvent('tab_visible');
      }
    };

    // Window blur/focus
    const handleBlur = () => {
      logEvent('window_blur');
    };
    const handleFocus = () => {
      logEvent('window_focus');
    };

    // Copy/paste/cut handlers
    const handleCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        // Save to internal store only
        import('../stores/editorStore').then(m => {
          m.useEditorStore.setState({ internalClipboard: selectedText });
        });
        
        logEvent('copy_internal', { length: selectedText.length });
        useToastStore.getState().success('Copied to internal clipboard');
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const internalClipboard = import('../stores/editorStore').then(m => {
        const text = m.useEditorStore.getState().internalClipboard;
        if (text) {
          logEvent('paste_internal', { length: text.length });
          // Note: Actual insertion is handled by the component (like Monaco)
          // For standard inputs, we could insert here, but mostly we care about the editor.
        } else {
          logEvent('paste_external_blocked');
          useToastStore.getState().warning('External paste blocked. Use internal copy/paste only.');
        }
      });
    };

    const handleCut = (e) => {
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        internalClipboard = selectedText;
        logEvent('cut_internal');
      }
      e.preventDefault();
    };

    // Right-click (Strict Block)
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      logEvent('context_menu_blocked');
      useToastStore.getState().warning('Right-click is disabled during the exam.');
      return false;
    };

    // Keyboard shortcuts (Additional Detection)
    const handleKeydown = (e) => {
      // Detect Ctrl+Tab, Alt+Tab
      if ((e.ctrlKey && e.key === 'Tab') || (e.altKey && e.key === 'Tab')) {
        logEvent('key_switch_attempt', { keys: `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}` });
      }
      // Detect PrintScreen
      if (e.key === 'PrintScreen') {
        logEvent('screenshot_attempt');
        useToastStore.getState().warning('Screenshot attempt detected.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('cut', handleCut, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('cut', handleCut, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [enabled, examId, studentId]);
}
