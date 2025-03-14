const Card = ({ children, className }) => {
    return <div className={`p-4 shadow-lg rounded-lg border ${className}`}>{children}</div>;
  };
  
  const CardContent = ({ children }) => <div className="p-2">{children}</div>;
  const CardHeader = ({ children }) => <div className="font-bold text-lg">{children}</div>;
  const CardTitle = ({ children }) => <h3 className="text-xl font-semibold">{children}</h3>;
  
  export { Card, CardContent, CardHeader, CardTitle };  // Named exports
  