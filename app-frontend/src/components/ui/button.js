export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  className = '', 
  ...props 
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-primary text-primary hover:bg-blue-50',
    ghost: 'text-primary hover:bg-blue-50',
  };

  const sizes = {
    small: 'text-sm px-3 py-1',
    medium: 'px-4 py-2',
    large: 'text-lg px-6 py-3',
  };

  return (
    <button
      className={`rounded font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
