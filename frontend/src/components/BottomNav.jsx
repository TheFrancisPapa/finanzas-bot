import React from 'react';
import { Home, DollarSign, Plus, BookOpen, MoreHorizontal } from 'lucide-react';

const BottomNav = ({ activeTab, onNavigate }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'movements', icon: DollarSign, label: 'Movimientos' },
    { id: 'new_movement', icon: Plus, label: 'Nuevo', isCenter: true },
    { id: 'learn', icon: BookOpen, label: 'Aprender' },
    { id: 'more', icon: MoreHorizontal, label: 'Más' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-3 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] overflow-visible" style={{ backgroundColor: 'var(--nav-bg)' }}>
      {tabs.map((tab, idx) => {
        if (tab.isCenter) {
          return (
            <div key={tab.id} className="-mt-14 relative group stagger-animate" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className={`absolute inset-0 bg-[#FFCE45] rounded-[24px] blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300 ${activeTab === 'new' ? 'opacity-100 animate-pulse' : ''}`}></div>
              <button 
                onClick={() => onNavigate('new_movement')} 
                className={`relative w-16 h-16 bg-[#FFCE45] rounded-[24px] shadow-lg shadow-[#FFCE45]/40 text-[#221F26] flex items-center justify-center active:scale-90 active:rotate-45 transition-all duration-500 border-[4px] border-[var(--bg-base)] ${activeTab === 'new' ? 'scale-95 ring-4 ring-[#FFCE45]/20 rotate-45 bg-[#FDBC3A]' : 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FFCE45]/60'}`}
              >
                <Plus size={32} strokeWidth={3.5} className={`transition-transform duration-500 ${activeTab === 'new' ? 'rotate-45' : 'group-hover:rotate-90'}`} />
              </button>
            </div>
          );
        }

        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button 
            key={tab.id}
            onClick={() => onNavigate(tab.id)} 
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 stagger-animate ${isActive ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-0.5'}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className={`relative p-1 rounded-xl transition-colors duration-300 ${isActive ? 'bg-[#FFCE45]/10' : ''}`}>
              <Icon 
                size={22} 
                strokeWidth={isActive ? 3 : 2}
                fill={isActive && (tab.id === 'home' || tab.id === 'learn') ? "currentColor" : "none"} 
                fillOpacity={0.2} 
              />
              {isActive && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#FFCE45] rounded-full shadow-[0_0_8px_#FFCE45]" />
              )}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter transition-all ${isActive ? 'text-[var(--text-main)] translate-y-0 opacity-100' : 'opacity-60'}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
