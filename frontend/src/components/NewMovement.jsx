import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Bell } from 'lucide-react';

// ==========================================
// COMPONENTES COMPARTIDOS (Incluidos para previsualización)
// ==========================================

const MangoLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#99CF43" /><stop offset="100%" stopColor="#639639" />
      </linearGradient>
      <linearGradient id="bodyGrad" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#99CF43" /><stop offset="30%" stopColor="#FFCE45" /><stop offset="60%" stopColor="#FDBC3C" /><stop offset="85%" stopColor="#E53E3E" /><stop offset="100%" stopColor="#9D50FF" />
      </linearGradient>
    </defs>
    <path d="M105 75 C 110 45, 150 45, 155 60 C 160 75, 140 95, 120 90 C 110 88, 105 80, 105 75 Z" fill="url(#leafGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M100 65 C 135 60, 160 100, 140 145 C 120 185, 60 180, 50 145 C 40 110, 60 85, 80 75 C 88 70, 95 66, 100 65 Z" fill="url(#bodyGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Header = ({ title = "Manguito", onNavigate = () => {} }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-100">
    <div className="flex items-center gap-4">
      <button onClick={() => onNavigate('home')} className="w-10 h-10 flex items-center justify-center text-[#221F26] bg-white rounded-full transition-all active:scale-90 shadow-sm border border-gray-100 hover:border-[#FFCE45]">
        <ChevronRight size={24} className="rotate-180" />
      </button>
      <span className="text-xl font-black text-[#221F26] tracking-tight">{title}</span>
    </div>
    <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-[#FFCE45] transition-all shadow-sm border border-gray-100">
      <Bell size={20} strokeWidth={2.5} />
    </button>
  </header>
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

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBD3A] shadow-md hover:-translate-y-1 active:scale-[0.98]',
  };
  return (
    <button className={`w-full py-3.5 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-3 cursor-pointer ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ==========================================
// PANTALLA DE NUEVO MOVIMIENTO
// ==========================================

export const NewMovementScreen = ({ 
  onNavigate = () => {}, 
  onSave = () => {}, 
  userProfile = { mainCurrency: 'ARS' }, 
  categories = { gasto: [], ingreso: [] } 
}) => {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState(userProfile?.mainCurrency || 'ARS');

  useEffect(() => {
    if (categories[type] && categories[type].length > 0) {
      setCategory(categories[type][0].label);
    }
  }, [type, categories]);

  const handleSave = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    
    const catObj = categories[type]?.find(c => c.label === category);
    const icon = catObj ? catObj.icon : (type === 'gasto' ? '💸' : '💰');

    onSave({
      type,
      amount: parseFloat(amount),
      category,
      description,
      currency,
      icon,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFBF2] theme-transition pb-32 animate-in slide-in-from-bottom-8 duration-300">
      <Header title="Nuevo Movimiento" onNavigate={onNavigate} />
      
      <main className="px-6 mt-6 space-y-6 relative z-10">
        
        {/* Selector de Tipo (Gasto / Ingreso) */}
        <div className="bg-white p-1.5 rounded-[24px] flex shadow-inner border border-gray-100">
          <button 
            onClick={() => setType('gasto')} 
            className={`flex-1 py-3.5 rounded-[18px] text-sm font-black transition-all duration-300 ${type === 'gasto' ? 'bg-[#FFEBEB]/80 text-[#E53E3E] shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Gasto
          </button>
          <button 
            onClick={() => setType('ingreso')} 
            className={`flex-1 py-3.5 rounded-[18px] text-sm font-black transition-all duration-300 ${type === 'ingreso' ? 'bg-[#E6F4EA]/80 text-[#38A169] shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Ingreso
          </button>
        </div>

        {/* Monto Principal */}
        <Card className="!p-8 border-0 text-center flex flex-col items-center shadow-md">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-3">Monto del {type}</p>
          <div className="flex items-center justify-center gap-2 w-full">
            <span className={`text-4xl font-black mb-1 ${type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>$</span>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              className={`bg-transparent text-6xl font-black outline-none w-3/4 text-center tracking-tighter ${type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'} placeholder:opacity-30`}
              autoFocus
            />
          </div>
        </Card>

        {/* Detalles */}
        <Card className="!p-6 border-0 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 px-1">Categoría</label>
            <div className="relative">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-100 rounded-[18px] py-4 px-5 text-[#221F26] font-bold outline-none appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] transition-all"
              >
                {categories[type]?.map((cat, idx) => (
                  <option key={idx} value={cat.label}>{cat.icon} {cat.label}</option>
                ))}
              </select>
              <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none stroke-[3]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 px-1">Descripción (Opcional)</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder={type === 'gasto' ? "Ej: Cena con amigos" : "Ej: Pago de cliente"} 
              className="w-full bg-gray-50 border border-gray-100 rounded-[18px] py-4 px-5 text-[#221F26] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] transition-all" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 px-1">Moneda</label>
            <div className="relative">
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-100 rounded-[18px] py-4 px-5 text-[#221F26] font-bold outline-none appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] transition-all"
              >
                <option value="ARS">🇦🇷 Pesos (ARS)</option>
                <option value="USD">🇺🇸 Dólares (USD)</option>
                <option value="EUR">🇪🇺 Euros (EUR)</option>
              </select>
              <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none stroke-[3]" />
            </div>
          </div>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FFFBF2] via-[#FFFBF2] to-transparent z-50 pb-8 pointer-events-none">
        <Button 
          onClick={handleSave} 
          disabled={!amount || isNaN(amount) || Number(amount) <= 0}
          className={`pointer-events-auto py-5 text-lg shadow-2xl !text-white transform transition-transform hover:-translate-y-1 ${type === 'gasto' ? '!bg-[#E53E3E] hover:!bg-[#C53030] shadow-[#E53E3E]/30' : '!bg-[#639639] hover:!bg-[#4A7828] shadow-[#639639]/30'} disabled:opacity-50 disabled:shadow-none`}
        >
          <Plus size={24} strokeWidth={3} />
          Guardar {type === 'gasto' ? 'Gasto' : 'Ingreso'}
        </Button>
      </div>
    </div>
  );
};

// Exportación para previsualización aislada
export default function App() {
  const mockCategories = {
    gasto: [{ icon: '🍔', label: 'Comida' }, { icon: '🛒', label: 'Super' }],
    ingreso: [{ icon: '💼', label: 'Sueldo' }]
  };
  return <NewMovementScreen categories={mockCategories} />;
}