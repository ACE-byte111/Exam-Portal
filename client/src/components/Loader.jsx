import { Loader2 } from 'lucide-react';

export default function Loader({ text = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-border" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
