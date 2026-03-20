import React from 'react';

const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50' : ''} ${className}`} 
    style={{ boxShadow: 'var(--card-shadow)' }}
  >
    {children}
  </div>
);

export default Card;
