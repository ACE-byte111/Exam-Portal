import { Terminal, X, Trash2, Loader2, AlertCircle, CheckCircle2, Keyboard, RotateCcw } from 'lucide-react';

export default function OutputPanel({ output, loading, stdin, setStdin, onClose, onClear }) {

  return (
    <div className="h-80 bg-bg-editor border-t border-border flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Terminal size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Console</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {output && (
            <button
              onClick={onClear}
              className="p-1 hover:bg-bg-tertiary rounded text-text-muted hover:text-text-primary transition-colors"
              title="Clear Console"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Section */}
        <div className="w-1/3 border-r border-border flex flex-col bg-bg-primary/30">
          <div className="px-3 py-1.5 border-b border-border/50 flex items-center justify-between text-text-muted">
            <div className="flex items-center gap-2">
              <Keyboard size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Input (stdin)</span>
            </div>
            <button 
              onClick={() => setStdin('')}
              className="hover:text-text-primary p-0.5" 
              title="Clear input"
            >
              <RotateCcw size={10} />
            </button>
          </div>
          <div className="flex-1 relative group">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="absolute inset-0 w-full h-full bg-transparent p-3 text-sm font-mono text-text-primary focus:outline-none resize-none placeholder:text-text-muted/20"
              placeholder="Program input here..."
            />
          </div>
          <div className="px-3 py-2 bg-accent-blue/5 text-[9px] text-accent-blue/60 italic border-t border-border/30">
            Note: This input is sent when you click 'Run'.
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3">
              <Loader2 size={24} className="animate-spin text-accent-blue" />
              <p className="animate-pulse">Compiling and running...</p>
            </div>
          ) : output ? (
            <div className="space-y-4">
              {/* Status Line */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                {output.exitCode === 0 ? (
                  <CheckCircle2 size={14} className="text-accent-green" />
                ) : (
                  <AlertCircle size={14} className="text-accent-red" />
                )}
                <span className={output.exitCode === 0 ? 'text-accent-green font-bold' : 'text-accent-red font-bold'}>
                  {output.status}
                </span>
                {output.time && (
                  <span className="text-text-muted ml-auto text-[10px] uppercase">
                    {output.time}s · {Math.round(output.memory / 1024)}MB
                  </span>
                )}
              </div>

              {/* Stdout */}
              {output.stdout && (
                <div className="space-y-1 animate-fade-in">
                  <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest opacity-50">Program Output</div>
                  <pre className="text-text-primary whitespace-pre-wrap bg-bg-primary/20 p-2 rounded-lg">{output.stdout}</pre>
                </div>
              )}

              {/* Stderr / Compile Errors */}
              {output.stderr && (
                <div className="space-y-1 animate-fade-in">
                  <div className="text-[10px] text-accent-red uppercase font-bold tracking-widest opacity-50">
                    Errors & Compilation Logs
                  </div>
                  <pre className="text-accent-red whitespace-pre-wrap bg-accent-red/5 p-3 rounded-lg border border-accent-red/10 font-medium">
                    {output.stderr}
                  </pre>
                </div>
              )}

              {!output.stdout && !output.stderr && (
                <p className="text-text-muted italic opacity-40">No output generated.</p>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted/30 gap-2">
              <Terminal size={32} strokeWidth={1} />
              <p className="italic text-sm">Click 'Run' to see output</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
