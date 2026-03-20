import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import { formatMoney } from '../lib/utils';

const MovementsScreen = ({ onNavigate, movements = [] }) => {
  const [filter, setFilter] = useState('todos');
  const filteredMovements = movements.filter(m => filter === 'todos' || m.type === filter.slice(0, -1));

  const formatMovementDate = (dateString) => {
    if (!dateString) return 'Hoy';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const groupedMovements = filteredMovements.reduce((acc, mov) => {
    const dateLabel = formatMovementDate(mov.date);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(mov);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} title="Movimientos" />
      <main className="px-6 space-y-6 mt-2">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-sm border border-[var(--border-color)] theme-transition">
          {['gastos', 'ingresos', 'todos'].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all duration-300 ${filter === tab ? 'bg-[#FFCE45] text-[#221F26] shadow-md scale-[1.02]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center px-4 animate-in slide-in-from-bottom-8 duration-700">
            <div className="w-28 h-28 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] mb-8 relative theme-transition">
              <span className="text-6xl relative z-10 animate-bounce" style={{ animationDuration: '3s' }}>📬</span>
              <div className="absolute inset-0 border-[6px] border-[#FFCE45]/20 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
            </div>
            <h2 className="text-3xl font-black text-[var(--text-main)] mb-4 tracking-tight">Sin movimientos</h2>
            <p className="text-[var(--text-muted)] text-base max-w-[280px] leading-relaxed font-medium">Anotá tu primer gasto usando el botón central <span className="inline-block bg-[#FFCE45] text-[#221F26] w-6 h-6 rounded-md font-black text-xs leading-6 shadow-sm mx-1">+</span>.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-8">
            {Object.entries(groupedMovements).map(([dateLabel, movs], groupIdx) => (
              <div key={groupIdx} className="stagger-animate" style={{ animationDelay: `${groupIdx * 0.1}s` }}>
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 px-2 opacity-60">{dateLabel}</h3>
                <div className="space-y-3">
                  {movs.map((mov, idx) => (
                    <Card key={idx} noPadding className="p-4.5 flex justify-between items-center shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-xl ${mov.type === 'gasto' ? 'bg-[#FFEBEB]/80 dark:bg-red-500/10' : 'bg-[#E6F4EA]/80 dark:bg-green-500/10'}`}>
                          {mov.icon || (mov.type === 'gasto' ? '💸' : '💰')}
                        </div>
                        <div>
                          <p className="font-black text-[var(--text-main)] text-[15px] tracking-tight">{mov.category || 'Movimiento'}</p>
                          <p className="text-[12px] font-bold text-[var(--text-muted)] mt-0.5 opacity-70">{mov.description || 'Sin descripción'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[17px] font-black ${mov.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
                          {mov.type === 'gasto' ? '-' : '+'}{formatMoney(Number(mov.amount), mov.currency)}
                        </span>
                        {mov.hasReceipt && (
                          <p className="text-[9px] font-black text-[#FFCE45] mt-1 uppercase tracking-widest flex items-center justify-end gap-1"><Camera size={10} strokeWidth={3} /> Ticket</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav activeTab="movements" onNavigate={onNavigate} />
    </div>
  );
};

export default MovementsScreen;
