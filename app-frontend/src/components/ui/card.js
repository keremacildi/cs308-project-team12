export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`border-b border-gray-200 p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`border-t border-gray-200 p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

const CardTitle = ({ children }) => <h3 className="text-xl font-semibold">{children}</h3>;

export { CardTitle };  // Named exports
  