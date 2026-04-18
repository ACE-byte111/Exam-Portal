import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-accent-blue hover:bg-accent-blue/80 text-white',
  secondary: 'bg-bg-tertiary hover:bg-bg-hover text-text-primary border border-border',
  danger: 'bg-accent-red hover:bg-accent-red/80 text-white',
  success: 'bg-accent-green hover:bg-accent-green/80 text-white',
  ghost: 'bg-transparent hover:bg-bg-tertiary text-text-secondary hover:text-text-primary',
  outline: 'bg-transparent border border-border hover:bg-bg-tertiary text-text-primary',
};

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-3.5 text-lg rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold tracking-wide
        transition-all duration-200 shadow-sm
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
