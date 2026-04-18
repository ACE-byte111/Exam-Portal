const variants = {
  active: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  upcoming: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  ended: 'bg-text-muted/15 text-text-muted border-text-muted/30',
  submitted: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
  warning: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
  danger: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  live: 'bg-accent-green/15 text-accent-green border-accent-green/30',
};

export default function Badge({ children, variant = 'active', dot = false, className = '' }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
      rounded-full border ${variants[variant] || variants.active} ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${variant === 'live' ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
}
