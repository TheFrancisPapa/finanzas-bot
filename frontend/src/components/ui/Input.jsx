import React from 'react';

const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className={`relative group ${className}`}>
    {Icon && (
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#FFCE45] transition-colors duration-300">
        <Icon size={20} strokeWidth={2.5} />
      </div>
    )}
    <input 
      className={`w-full bg-[var(--input-bg)] border-2 border-transparent rounded-[20px] py-4 ${Icon ? 'pl-14' : 'pl-6'} pr-6 text-[var(--text-main)] outline-none focus:border-[#FFCE45] focus:bg-[var(--bg-card)] focus:shadow-[0_0_0_4px_rgba(255,206,69,0.15)] theme-transition placeholder:text-gray-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)]`} 
      {...props} 
    />
  </div>
);

export default Input;
