import React, { useState } from 'react';
import { 
  FileText, Download, LockKeyhole, Handshake, 
  ChevronRight, Camera, Smartphone, ShieldCheck, Bell, Home, DollarSign, Plus, BookOpen, MoreHorizontal
} from 'lucide-react';

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

const Header = ({ title = "Manguito", onNavigate = () => {}, backButton = false }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-100">
    <div className="flex items-center gap-4">
      {backButton ? (
        <button onClick={() => onNavigate('more')} className="w-10 h-10 flex items-center justify-center text-[#221F26] bg-white rounded-full transition-all active:scale-90 shadow-sm border border-gray-100 hover:border-[#FFCE45]">
          <ChevronRight size={24} className="rotate-180" />
        </button>
      ) : (
        <MangoLogo className="w-10 h-10" />
      )}
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

const MercadoPagoLogo = ({ className }) => (
  <div className={`bg-[#009EE3] rounded-full flex items-center justify-center text-white ${className}`}>
    <Handshake size={14} strokeWidth={2.5} />
  </div>
);

// ==========================================
// 1. PANTALLA: MODO PAREJA
// ==========================================
export const ModoParejaScreen = ({ onNavigate = () => {} }) => {
  return (
    <div className="min-h-screen bg-[#FFFBF2] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={onNavigate} backButton={true} title="Modo Pareja" />
      <main className="px-6 mt-4">
        <div className="text-center pt-4 pb-8">
          <div className="flex justify-center items-center mb-6">
            <div className="w-20 h-20 bg-[#221F26] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white z-10">
              <span className="text-2xl font-black">V</span>
            </div>
            <div className="w-12 h-1 bg-gray-200 -mx-2 z-0"></div>
            <div className="w-20 h-20 bg-gray-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-gray-400 z-10 border-dashed">
              <Handshake size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-[#221F26] tracking-tight mb-3">Finanzas de a dos</h2>
          <p className="text-gray-500 font-medium leading-relaxed px-4 text-sm">
            Lleven los gastos del hogar juntos. Sincronizá tus movimientos con los de tu pareja y olvídense de las planillas compartidas.
          </p>
        </div>

        <div className="relative mb-8">
          <Card className="opacity-40 blur-[2px] pointer-events-none select-none border-none">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-[#8B7C72] uppercase tracking-widest text-[10px]">🏠 Alquiler y Expensas</p>
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-white"></div>
              </div>
            </div>
            <p className="text-4xl font-black text-[#221F26] mb-6">$850.000</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Vos aportaste</span>
                <span className="text-sm font-black">$450.000</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#FFCE45] h-full w-[60%]"></div>
              </div>
            </div>
          </Card>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
            <div className="bg-white p-4 rounded-3xl shadow-xl text-[#9D50FF] mb-4 border border-purple-50">
              <LockKeyhole size={32} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-lg mb-2 text-[#221F26]">Función PRO</h3>
            <Button 
              onClick={() => onNavigate('pro')} 
              className="!bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] !text-white shadow-xl py-4"
            >
              Desbloquear Modo Pareja
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

// ==========================================
// 2. PANTALLA: EXPORTAR DATOS
// ==========================================
export const ExportarScreen = ({ onNavigate = () => {} }) => {
  return (
    <div className="min-h-screen bg-[#FFFBF2] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={onNavigate} backButton={true} title="Exportar Reportes" />
      <main className="px-6 mt-4">
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 bg-green-50 rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
            📊
          </div>
          <h2 className="text-3xl font-black text-[#221F26] tracking-tight mb-2">Tus datos en Excel</h2>
          <p className="text-gray-500 text-sm font-medium px-4">
            Descargá tus movimientos listos para compartir con tu contador o hacer tu propio análisis profundo.
          </p>
        </div>

        <Card className="space-y-6 !p-8 shadow-md border-none">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-[#FFCE45] transition-all text-center">
              <FileText className="mx-auto mb-2 text-green-600" size={28} />
              <span className="text-[10px] font-black uppercase text-[#221F26]">Formato Excel</span>
            </div>
            <div className="flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-[#FFCE45] transition-all text-center opacity-40">
              <Download className="mx-auto mb-2 text-red-500" size={28} />
              <span className="text-[10px] font-black uppercase text-[#221F26]">Formato PDF</span>
            </div>
          </div>
          
          <div className="pt-4">
            <Button onClick={() => onNavigate('pro')} className="py-4">
              Exportar movimientos (.xlsx)
            </Button>
            <p className="text-[10px] text-center font-bold text-gray-400 mt-4 uppercase tracking-widest">
              Límite de exportación: Solo usuarios PRO
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

// ==========================================
// 3. PANTALLA: CONEXIÓN BANCARIA
// ==========================================
export const ConexionBancariaScreen = ({ onNavigate = () => {} }) => {
  const [entidad, setEntidad] = useState('mercadopago');
  
  const info = {
    mercadopago: { icon: '💙', name: 'Mercado Pago', color: 'bg-blue-50 text-blue-600' },
    uala: { icon: '💜', name: 'Ualá', color: 'bg-purple-50 text-purple-600' },
    naranja: { icon: '🧡', name: 'Naranja X', color: 'bg-orange-50 text-orange-600' }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF2] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={onNavigate} backButton={true} title="Bancos y Tarjetas" />
      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[#E6F4EA] border border-green-100 rounded-3xl p-5 flex gap-4 items-start shadow-sm">
          <ShieldCheck className="text-green-600 flex-shrink-0" size={24} />
          <p className="text-xs text-green-800 font-bold leading-relaxed">
            <strong className="block mb-1">Seguridad nivel bancario</strong>
            Manguito nunca guarda tus claves. El proceso es mediante importación de resumen oficial.
          </p>
        </div>

        <Card className="!p-6 border-none shadow-md">
          <h3 className="font-black text-sm mb-4 text-[#221F26]">Seleccioná tu entidad</h3>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {Object.entries(info).map(([id, item]) => (
              <button 
                key={id} 
                onClick={() => setEntidad(id)}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${entidad === id ? 'border-[#FFCE45] bg-white' : 'border-transparent bg-gray-50'}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[9px] font-black uppercase text-center text-[#221F26]">{item.name}</span>
              </button>
            ))}
          </div>

          <div className={`p-5 rounded-3xl mb-8 ${info[entidad].color}`}>
            <h4 className="font-black text-sm mb-3">¿Cómo conectar?</h4>
            <ul className="space-y-3">
              <li className="text-[11px] font-bold flex gap-2"><span>1.</span> Descargá tu resumen CSV desde la App de {info[entidad].name}.</li>
              <li className="text-[11px] font-bold flex gap-2"><span>2.</span> Subilo acá y Manguito categorizará todo automáticamente.</li>
            </ul>
          </div>

          <Button className="!bg-[#221F26] !text-white py-4.5">
            <Camera size={20} className="mr-2" /> Subir archivo CSV
          </Button>
        </Card>
      </main>
    </div>
  );
};

// ==========================================
// PREVISUALIZACIÓN (APP)
// ==========================================
export default function App() {
  const [screen, setScreen] = useState('couple');
  
  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FFFBF2] relative overflow-x-hidden shadow-2xl">
      <div className="fixed top-4 left-4 z-[100] flex gap-2 bg-white/80 backdrop-blur p-2 rounded-xl border border-gray-100 shadow-sm">
        <button onClick={() => setScreen('couple')} className={`px-2 py-1 text-[10px] font-bold rounded-lg ${screen==='couple'?'bg-[#FFCE45]':'bg-gray-100'}`}>Pareja</button>
        <button onClick={() => setScreen('export')} className={`px-2 py-1 text-[10px] font-bold rounded-lg ${screen==='export'?'bg-[#FFCE45]':'bg-gray-100'}`}>Exportar</button>
        <button onClick={() => setScreen('bank')} className={`px-2 py-1 text-[10px] font-bold rounded-lg ${screen==='bank'?'bg-[#FFCE45]':'bg-gray-100'}`}>Bancos</button>
      </div>

      {screen === 'couple' && <ModoParejaScreen onNavigate={setScreen} />}
      {screen === 'export' && <ExportarScreen onNavigate={setScreen} />}
      {screen === 'bank' && <ConexionBancariaScreen onNavigate={setScreen} />}
    </div>
  );
}