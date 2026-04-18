export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon size={16} />
          </div>
        )}
        <input
          className={`
            w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3.5
            text-text-primary text-base placeholder:text-text-muted
            focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30
            transition-all duration-200 block
            ${Icon ? 'pl-[2.75rem]' : ''}
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/30' : ''}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
