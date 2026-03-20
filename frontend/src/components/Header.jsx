import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { MangoLogo } from '../assets/logos';

const Header = ({ onNavigate, showGreeting = false, userName = "", profilePic = null, backButton = false, title = "Manguito" }) => {
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
          <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full transition-colors active:scale-90 shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45]"><ChevronRight size={24} className="rotate-180" /></button>
        ) : (
          <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] theme-transition transform transition-transform hover:scale-105 cursor-pointer"><MangoLogo className="w-8 h-8" /></div>
        )}
        <div>
          {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)] mb-0.5">¡{greeting}, {userName}!</p>}
          <span className="text-xl font-black text-[var(--text-main)] tracking-tight">{title}</span>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {profilePic && showGreeting && (
          <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] shadow-sm overflow-hidden mr-2 cursor-pointer hover:scale-105 transition-transform">
            <img src={profilePic} alt="Perfil" className="w-full h-full object-cover" />
          </div>
        )}
        <button className="w-11 h-11 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[#FFCE45] transition-all duration-300 shadow-sm border border-[var(--border-color)] active:scale-95"><Bell size={20} strokeWidth={2.5} /></button>
      </div>
    </header>
  );
};

export default Header;
