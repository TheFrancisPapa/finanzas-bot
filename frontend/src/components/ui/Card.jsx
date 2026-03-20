import React from 'react';

const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50 hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)] transition-all duration-300 active:scale-[0.98]' : ''} ${className}`} style={{ boxShadow: onClick ? undefined : 'var(--card-shadow)' }}>{children}</div>
);

export default Card;
