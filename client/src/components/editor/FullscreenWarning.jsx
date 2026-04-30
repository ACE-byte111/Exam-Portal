import { Shield, AlertTriangle } from 'lucide-react';
import Button from '../Button';

export default function FullscreenWarning({ countdown, violations, onReturn }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="text-center max-w-md mx-4 animate-slide-up">
        {/* Warning icon */}
        <div className="w-20 h-20 rounded-full bg-accent-red/20 border-2 border-accent-red/40 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
          <AlertTriangle size={36} className="text-accent-red" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {violations >= 2 ? 'FINAL WARNING' : 'Fullscreen Required'}
        </h2>
        <p className="text-text-secondary mb-4">
          You have exited fullscreen or clicked away. Return to continue.
        </p>

        {/* Strike counter */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className={`w-10 h-2 rounded-full ${i <= violations ? 'bg-accent-red' : 'bg-white/20'}`}
            />
          ))}
          <span className="text-[10px] uppercase font-bold text-accent-red ml-2 tracking-widest">
            Strike {violations}/3
          </span>
        </div>

        {/* Countdown */}
        <div className="mb-6">
          <div className={`
            inline-flex items-center justify-center w-24 h-24 rounded-full
            border-4 text-4xl font-bold
            ${countdown <= 3
              ? 'border-accent-red text-accent-red animate-pulse-glow'
              : 'border-accent-orange text-accent-orange'
            }
          `}
          style={{ animation: 'countdown-pulse 1s ease-in-out infinite' }}
          >
            {countdown}
          </div>
          <p className="text-sm text-text-muted mt-3">
            Your exam will be auto-submitted in {countdown} second{countdown !== 1 ? 's' : ''}
          </p>
        </div>

        <Button
          onClick={onReturn}
          size="lg"
          icon={Shield}
          className="px-10"
        >
          Return to Fullscreen
        </Button>
      </div>
    </div>
  );
}
