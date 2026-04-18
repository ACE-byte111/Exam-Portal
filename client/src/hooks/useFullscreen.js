import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../services/socket';

export default function useFullscreen({ enabled = true, onAutoSubmit, examId, studentId }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showInitialEntry, setShowInitialEntry] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [violations, setViolations] = useState(0);
  const countdownRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const initialCheckDone = useRef(false);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setShowWarning(false);
      setShowInitialEntry(false);
      setCountdown(10);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const dismissWarning = useCallback(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  useEffect(() => {
    if (!enabled) return;

    // Check if we start outside of fullscreen
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      if (!document.fullscreenElement) {
        setShowInitialEntry(true);
      } else {
        setIsFullscreen(true);
      }
    }

    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);

      if (!isFS && enabledRef.current) {
        // Left fullscreen - show warning and start countdown
        setShowInitialEntry(false);
        setShowWarning(true);
        setCountdown(10);
        setViolations(prev => prev + 1);

        socket.emit('student:fullscreen-violation', {
          examId,
          studentId,
          timestamp: new Date().toISOString(),
        });

        if (!countdownRef.current) {
          countdownRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
                setShowWarning(false);
                if (onAutoSubmit) onAutoSubmit();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else if (isFS) {
        // Returned to fullscreen
        setShowWarning(false);
        setShowInitialEntry(false);
        setCountdown(10);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }
    };

    // Listen to native F11 keys and prevent default to force DOM fullscreen
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          enterFullscreen();
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enabled, examId, studentId, onAutoSubmit, enterFullscreen]);

  return {
    isFullscreen,
    showWarning,
    showInitialEntry,
    countdown,
    enterFullscreen,
    dismissWarning,
    violations,
  };
}
