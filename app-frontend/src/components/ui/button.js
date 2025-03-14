const Button = ({ children, onClick, className = "", disabled = false, type = "button" }) => {
  return (
      <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-white font-medium transition 
              ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
              ${className}`}
      >
          {children}
      </button>
  );
};

export { Button };
