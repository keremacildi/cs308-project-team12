export function Badge({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'border border-gray-200 text-gray-800',
  };

  const sizes = {
    default: 'text-xs px-2.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-block rounded-full font-medium whitespace-nowrap
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
} 