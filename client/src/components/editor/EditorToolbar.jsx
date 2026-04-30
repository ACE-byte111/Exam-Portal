import { useState, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import {
  Send, Clock, PanelLeftClose, PanelLeft, History, Settings,
  Sun, Moon, Type, Map, WrapText, Minus, Plus, Play
} from 'lucide-react';
import Button from '../Button';
import Badge from '../Badge';

export default function EditorToolbar({ examTitle, endTime, onSubmit, submitted, onRun, running, sidebarOpen, onToggleSidebar }) {
  const { theme, fontSize, toggleTheme, toggleHistory, showHistory,
    toggleMinimap, toggleWordWrap, setFontSize, minimap, wordWrap } = useEditorStore();
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!endTime) return;
    const update = () => {
      const end = new Date(endTime).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00');
        setUrgent(true);
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        hrs > 0
          ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
      setUrgent(diff < 300000); // 5 min
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary border-b border-border gap-3">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>
        <div className="h-5 w-px bg-border" />
        <h2 className="text-sm font-semibold text-text-primary truncate max-w-48">{examTitle}</h2>
      </div>

      {/* Center - Timer */}
      <div className={`
        flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-sm font-semibold
        ${urgent
          ? 'bg-accent-red/15 text-accent-red animate-pulse-glow border border-accent-red/30'
          : 'bg-bg-tertiary text-text-primary border border-border'
        }
      `}>
        <Clock size={14} />
        <span>{timeLeft || '--:--'}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Settings dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
          >
            <Settings size={16} />
          </button>
          {showSettings && (
            <div className="absolute right-0 top-full mt-1 w-56 glass rounded-xl border border-border shadow-xl z-50 py-2 animate-slide-down">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Theme</span>
                <button onClick={toggleTheme} className="p-1 rounded-md hover:bg-bg-tertiary transition-colors">
                  {theme === 'vs-dark' ? <Sun size={14} className="text-accent-orange" /> : <Moon size={14} className="text-accent-blue" />}
                </button>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Font Size</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className="p-1 rounded-md hover:bg-bg-tertiary transition-colors">
                    <Minus size={12} className="text-text-muted" />
                  </button>
                  <span className="text-xs text-text-primary w-6 text-center">{fontSize}</span>
                  <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className="p-1 rounded-md hover:bg-bg-tertiary transition-colors">
                    <Plus size={12} className="text-text-muted" />
                  </button>
                </div>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Word Wrap</span>
                <button onClick={toggleWordWrap} className={`p-1 rounded-md transition-colors ${wordWrap === 'on' ? 'bg-accent-blue/20 text-accent-blue' : 'hover:bg-bg-tertiary text-text-muted'}`}>
                  <WrapText size={14} />
                </button>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Minimap</span>
                <button onClick={toggleMinimap} className={`p-1 rounded-md transition-colors ${minimap ? 'bg-accent-blue/20 text-accent-blue' : 'hover:bg-bg-tertiary text-text-muted'}`}>
                  <Map size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleHistory}
          className={`p-1.5 rounded-lg transition-all ${showHistory ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'}`}
          title="Version History"
        >
          <History size={16} />
        </button>

        <div className="h-5 w-px bg-border" />

        <Button
          size="sm"
          variant="success"
          icon={Play}
          onClick={onRun}
          loading={running}
          disabled={submitted || running}
        >
          Run
        </Button>

        <Button
          size="sm"
          icon={Send}
          onClick={onSubmit}
          disabled={submitted}
          variant={submitted ? 'secondary' : 'primary'}
        >
          {submitted ? 'Submitted' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
