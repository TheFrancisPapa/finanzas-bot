import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBC3C] shadow-[0_8px_20px_-6px_rgba(255,206,69,0.5)]',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-main)] border-2 border-[var(--border-color)] hover:border-[#FFCE45]',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]',
    google: 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm hover:shadow-md',
    danger: 'bg-[#FFEBEB] text-[#E53E3E] hover:bg-[#FFD6D6] dark:bg-[#3B1212]',
    pro: 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] text-white hover:opacity-90 shadow-[0_8px_24px_-6px_rgba(157,80,255,0.5)]'
  };
  return (
    <button 
      className={`w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 active:scale-[0.96] flex items-center justify-center gap-2 ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
