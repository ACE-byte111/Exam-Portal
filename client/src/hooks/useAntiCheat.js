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

    // Copy/paste/cut
    const handleCopy = (e) => {
      logEvent('copy_attempt', { text: (e.clipboardData?.getData?.('text') || '').slice(0, 50) });
      useToastStore.getState().warning('Copy detected. This activity is being recorded.');
    };
    const handlePaste = (e) => {
      logEvent('paste_attempt', { text: (e.clipboardData?.getData?.('text') || '').slice(0, 50) });
      useToastStore.getState().warning('Paste detected. This activity is being recorded.');
    };
    const handleCut = (e) => {
      logEvent('cut_attempt');
    };

    // Right-click
    const handleContextMenu = (e) => {
      logEvent('context_menu');
    };

    // Keyboard shortcuts (Ctrl+C, Ctrl+V outside editor)
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
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [enabled, examId, studentId]);
}
