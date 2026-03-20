import React from 'react';
import { Home, DollarSign, Plus, BookOpen, MoreHorizontal } from 'lucide-react';

const BottomNav = ({ activeTab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'home' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
      <Home size={24} fill={activeTab === 'home' ? "currentColor" : "none"} fillOpacity={activeTab === 'home' ? 0.2 : 0} />
      <span className={`text-[10px] font-bold ${activeTab === 'home' ? 'text-[var(--text-main)]' : ''}`}>Inicio</span>
    </button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'movements' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
      <DollarSign size={24} strokeWidth={activeTab === 'movements' ? 3 : 2} />
      <span className={`text-[10px] font-bold ${activeTab === 'movements' ? 'text-[var(--text-main)]' : ''}`}>Movimientos</span>
    </button>
    <div className="-mt-16 relative group">
      <div className={`absolute inset-0 bg-[#FFCE45] rounded-[24px] blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300 ${activeTab === 'new' ? 'opacity-100 animate-pulse' : ''}`}></div>
      <button onClick={() => onNavigate('new_movement')} className={`relative w-16 h-16 bg-[#FFCE45] rounded-[24px] shadow-lg shadow-[#FFCE45]/40 text-[#221F26] flex items-center justify-center active:scale-90 transition-all duration-300 border-[3px] border-[var(--bg-base)] ${activeTab === 'new' ? 'scale-95 ring-4 ring-[#FFCE45]/20 rotate-45' : 'hover:-translate-y-1'}`}>
        <Plus size={32} strokeWidth={3} className={activeTab === 'new' ? 'rotate-45 transition-transform' : 'transition-transform'} />
      </button>
    </div>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'learn' ? 'text-[#FDBC3C] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
      <BookOpen size={24} fill={activeTab === 'learn' ? "currentColor" : "none"} fillOpacity={activeTab === 'learn' ? 0.2 : 0} />
      <span className={`text-[10px] font-bold ${activeTab === 'learn' ? 'text-[var(--text-main)]' : ''}`}>Aprender</span>
    </button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'more' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
      <MoreHorizontal size={24} strokeWidth={activeTab === 'more' ? 3 : 2} />
      <span className={`text-[10px] font-bold ${activeTab === 'more' ? 'text-[var(--text-main)]' : ''}`}>Más</span>
    </button>
  </nav>
);

export default BottomNav;
