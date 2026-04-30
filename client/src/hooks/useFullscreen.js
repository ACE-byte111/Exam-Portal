import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../services/socket';

export default function useFullscreen({ enabled = true, onAutoSubmit, examId, studentId }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showInitialEntry, setShowInitialEntry] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [violations, setViolations] = useState(0);
  const violationsRef = useRef(0);
  
  const timerRef = useRef(null);
  const initialCheckDone = useRef(false);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setShowWarning(false);
      setShowInitialEntry(false);
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const dismissWarning = useCallback(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  // Handle countdown logic
  useEffect(() => {
    if (showWarning && !timerRef.current) {
      setCountdown(10);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            if (onAutoSubmit) onAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (!showWarning && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setCountdown(10);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showWarning, onAutoSubmit]);

  // Handle native fullscreen changes
  useEffect(() => {
    if (!enabled) return;

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

      if (!isFS) {
        // Only trigger if we aren't already showing the initial entry screen
        if (!showInitialEntry) {
          violationsRef.current += 1;
          const currentViolations = violationsRef.current;
          setViolations(currentViolations);
          
          socket.emit('student:fullscreen-violation', {
            examId,
            studentId,
            violationCount: currentViolations,
            timestamp: new Date().toISOString(),
          });

          if (currentViolations >= 3) {
            if (onAutoSubmit) onAutoSubmit();
          } else {
            setShowWarning(true);
          }
        }
      } else {
        setShowWarning(false);
        setShowInitialEntry(false);
      }
    };

    const handleBlur = () => {
      if (enabled && !showInitialEntry && !document.hidden) {
        violationsRef.current += 1;
        const currentViolations = violationsRef.current;
        setViolations(currentViolations);
        
        socket.emit('student:anti-cheat-event', {
          examId,
          studentId,
          event: 'window_blur_proctored',
          violationCount: currentViolations,
          timestamp: new Date().toISOString(),
        });

        if (currentViolations >= 3) {
          if (onAutoSubmit) onAutoSubmit();
        } else {
          setShowWarning(true);
        }
      }
    };

    const handleFocus = () => {
      // If they return focus while in FS, we might clear warning
      if (document.fullscreenElement) {
        setShowWarning(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, examId, studentId, showInitialEntry]);

  // Block F11
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          enterFullscreen();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enterFullscreen]);

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
