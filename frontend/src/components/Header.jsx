import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { MangoLogo } from '../assets/logos';

const Header = ({ onNavigate, showGreeting = false, userName = "", profilePic = null, backButton = false, title = "Manguito", onProfileClick, notificationCount = 0 }) => {
  const [greeting, setGreeting] = useState('Hola');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buen día');
    else if (hour < 20) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  return (
    <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl border-b border-transparent transition-all" style={{ backgroundColor: 'var(--nav-bg)' }}>
      <div className="flex items-center gap-4">
        {backButton ? (
          <button 
            onClick={onNavigate} 
            className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full transition-all active:scale-90 shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] hover:shadow-md"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
        ) : (
          <div 
            onClick={() => onNavigate('dashboard')}
            className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] theme-transition transform transition-all hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer"
          >
            <MangoLogo className="w-8 h-8" />
          </div>
        )}
        <div className="animate-in slide-in-from-left-4 duration-500">
          {showGreeting && <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5 opacity-70">¡{greeting}, {userName}!</p>}
          <span className="text-xl font-black text-[var(--text-main)] tracking-tight">{title}</span>
        </div>
      </div>

      <div className="flex gap-2.5 items-center">
        {profilePic ? (
          <div 
            onClick={onProfileClick}
            className="w-11 h-11 rounded-full border-2 border-[var(--border-color)] p-0.5 shadow-sm overflow-hidden cursor-pointer hover:scale-110 active:scale-95 transition-all hover:border-[#FFCE45] hover:shadow-md"
          >
            <img src={profilePic} alt="Perfil" className="w-full h-full object-cover rounded-full" />
          </div>
        ) : showGreeting ? (
          <div 
            onClick={onProfileClick}
            className="w-11 h-11 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer hover:scale-110 active:scale-95 transition-all border border-[var(--border-color)] hover:border-[#FFCE45]"
          >
            <User size={20} strokeWidth={2.5} />
          </div>
        ) : null}

        <button className="relative w-11 h-11 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[#FFCE45] transition-all duration-300 shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] hover:shadow-md active:scale-95">
          <Bell size={20} strokeWidth={2.5} />
          {notificationCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#E53E3E] rounded-full border-2 border-[var(--bg-card)] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
