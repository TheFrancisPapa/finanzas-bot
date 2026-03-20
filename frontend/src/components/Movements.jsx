import React, { useState } from 'react';
import { Camera, Home, DollarSign, Plus, BookOpen, MoreHorizontal, Bell, ChevronRight } from 'lucide-react';

// ==========================================
// COMPONENTES COMPARTIDOS (Incrustados para evitar errores de resolución en el Preview)
// Nota: En tu estructura de carpetas local, estos componentes se importan de './Shared'
// ==========================================

const MangoLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="100%" stopColor="#639639" /></linearGradient>
      <linearGradient id="bodyGrad" x1="10%" y1="0%" x2="90%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="30%" stopColor="#FFCE45" /><stop offset="60%" stopColor="#FDBC3C" /><stop offset="85%" stopColor="#E53E3E" /><stop offset="100%" stopColor="#9D50FF" /></linearGradient>
    </defs>
    <path d="M105 75 C 110 45, 150 45, 155 60 C 160 75, 140 95, 120 90 C 110 88, 105 80, 105 75 Z" fill="url(#leafGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M100 65 C 135 60, 160 100, 140 145 C 120 185, 60 180, 50 145 C 40 110, 60 85, 80 75 C 88 70, 95 66, 100 65 Z" fill="url(#bodyGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Header = ({ title = "Manguito", onNavigate = () => {} }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <MangoLogo className="w-10 h-10" />
      <span className="text-xl font-black tracking-tight">{title}</span>
    </div>
    <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-[#FFCE45] transition-all shadow-sm border border-gray-100 active:scale-95">
      <Bell size={20} strokeWidth={2.5} />
    </button>
  </header>
);

const BottomNav = ({ activeTab, onNavigate = () => {} }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-[#FFCE45] scale-110' : 'text-gray-400'}`}>
      <Home size={24} /><span className="text-[10px] font-bold">Inicio</span>
    </button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'movements' ? 'text-[#FFCE45] scale-110' : 'text-gray-400'}`}>
      <DollarSign size={24} strokeWidth={3} /><span className="text-[10px] font-bold">Movimientos</span>
    </button>
    <div className="-mt-16 relative">
      <button onClick={() => onNavigate('new_movement')} className="w-16 h-16 bg-[#FFCE45] rounded-2xl text-[#221F26] flex items-center justify-center shadow-lg active:scale-90 transition-transform border-[3px] border-[#FFFBF2]">
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'learn' ? 'text-[#FDBC3C] scale-110' : 'text-gray-400'}`}>
      <BookOpen size={24} /><span className="text-[10px] font-bold">Aprender</span>
    </button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'more' ? 'text-[#FFCE45] scale-110' : 'text-gray-400'}`}>
      <MoreHorizontal size={24} /><span className="text-[10px] font-bold">Más</span>
    </button>
  </nav>
);

const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-[32px] ${noPadding ? '' : 'p-6'} border border-gray-100 transition-all ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50 active:scale-[0.98]' : ''} ${className}`}
    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}
  >
    {children}
  </div>
);

const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€', GBP: '£', BRL: 'R$' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

// ==========================================
// PANTALLA DE MOVIMIENTOS
// ==========================================

export const MovementsScreen = ({ onNavigate = () => {}, movements = [] }) => {
  const [filter, setFilter] = useState('todos');

  // Lógica de filtrado
  const filteredMovements = movements.filter(m => 
    filter === 'todos' || m.type === filter.slice(0, -1)
  );

  // Formateador de fechas
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

  // Agrupamiento por fecha
  const groupedMovements = filteredMovements.reduce((acc, mov) => {
    const dateLabel = formatMovementDate(mov.date);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(mov);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FFFBF2] pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} title="Movimientos" />
      
      <main className="px-6 space-y-6 mt-2">
        {/* Selector de Filtros */}
        <div className="bg-white p-1.5 rounded-[24px] flex shadow-sm border border-gray-100">
          {['gastos', 'ingresos', 'todos'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setFilter(tab)} 
              className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all duration-300 ${filter === tab ? 'bg-[#FFCE45] text-[#221F26] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista de Movimientos */}
        {filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center px-4 animate-in slide-in-from-bottom-8">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center border border-gray-100 mb-8 relative">
              <span className="text-6xl relative z-10">📬</span>
              <div className="absolute inset-0 border-[6px] border-[#FFCE45]/20 rounded-full animate-ping opacity-20"></div>
            </div>
            <h2 className="text-3xl font-black text-[#221F26] mb-4 tracking-tight">Sin movimientos</h2>
            <p className="text-gray-500 text-base max-w-[280px] leading-relaxed font-medium">No encontramos nada bajo este filtro. ¡Empezá a anotar tus gastos!</p>
          </div>
        ) : (
          <div className="space-y-6 mt-8">
            {Object.entries(groupedMovements).map(([dateLabel, movs], groupIdx) => (
              <div key={groupIdx}>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">{dateLabel}</h3>
                <div className="space-y-3">
                  {movs.map((mov, idx) => (
                    <Card key={idx} noPadding className="p-4.5 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${mov.type === 'gasto' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                          {mov.icon || (mov.type === 'gasto' ? '💸' : '💰')}
                        </div>
                        <div>
                          <p className="font-black text-[#221F26] text-base tracking-tight">{mov.category || 'Movimiento'}</p>
                          <p className="text-[13px] text-gray-400 mt-0.5">{mov.description || 'Sin descripción'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black ${mov.type === 'gasto' ? 'text-red-500' : 'text-green-600'}`}>
                          {mov.type === 'gasto' ? '-' : '+'}{formatMoney(Number(mov.amount), mov.currency)}
                        </span>
                        {mov.hasReceipt && (
                          <p className="text-[10px] font-bold text-[#FFCE45] mt-1 uppercase flex items-center justify-end gap-1"><Camera size={10} /> Ticket</p>
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

// Exportación por defecto para previsualizar el componente de forma aislada
export default function App() {
  const [currentTab, setCurrentTab] = useState('movements');
  const mockMovements = [
    { type: 'gasto', amount: 4500, category: 'Comida', description: 'Cena pizza', currency: 'ARS', icon: '🍕', date: new Date().toISOString() },
    { type: 'ingreso', amount: 120000, category: 'Sueldo', description: 'Pago quincena', currency: 'ARS', icon: '💼', date: new Date().toISOString() },
    { type: 'gasto', amount: 800, category: 'Transporte', description: 'Carga SUBE', currency: 'ARS', icon: '🚌', date: new Date(Date.now() - 86400000).toISOString() }
  ];

  return <MovementsScreen movements={mockMovements} onNavigate={setCurrentTab} />;
}