import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] shadow-[0_4px_15px_rgba(255,206,69,0.3)] hover:bg-[#FDBD3A] hover:shadow-[0_8px_25px_rgba(255,206,69,0.5)] hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-0 active:shadow-sm',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-main)] border-2 border-[var(--border-color)] shadow-sm hover:border-[#FFCE45] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md active:scale-95 active:translate-y-0',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--input-bg)] active:scale-95',
    google: 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm hover:border-gray-300 hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:bg-[var(--input-bg)] active:translate-y-0 dark:hover:border-gray-600',
    danger: 'bg-[#FFEBEB] text-[#E53E3E] shadow-sm hover:bg-[#FFD6D6] hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-0 dark:bg-[#3B1212]',
    pro: 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] text-white shadow-[0_8px_24px_-6px_rgba(157,80,255,0.5)] hover:opacity-95 hover:shadow-[0_12px_30px_-6px_rgba(157,80,255,0.7)] hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-0'
  };
  return (
    <button 
      className={`w-full py-3.5 px-6 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
