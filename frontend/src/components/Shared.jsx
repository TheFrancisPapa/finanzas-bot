import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle2, Bell, Home, DollarSign, 
  Plus, BookOpen, MoreHorizontal 
} from 'lucide-react';

// ==========================================
// 1. CONFIGURACIÓN Y CONSTANTES
// ==========================================
export const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000/api' 
    : '/api',
  IS_LOCAL_MODE: false 
};

export const EXCHANGE_RATES = { ARS: 1, USD: 1000, EUR: 1100, GBP: 1400, BRL: 200 };

// ==========================================
// 2. LÓGICA DE ESTADO Y RED (Fetch & Persistence)
// ==========================================

// Hook para guardar datos en el navegador automáticamente
export const useLocalState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {}
  }, [key, state]);

  return [state, setState];
};

// Motor de peticiones al Backend en Render
export const apiFetch = async (endpoint, options = {}) => {
  const profileStr = window.localStorage.getItem('manguito_profile');
  const profile = profileStr ? JSON.parse(profileStr) : null;
  const token = profile?.token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, { ...options, headers });
  
  if (response.status === 401) {
    console.warn("Sesión expirada. Limpiando...");
    window.localStorage.clear();
    window.location.reload();
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la petición');
  }
  return response.json();
};

// Conexión centralizada con Gemini
export const callGeminiText = async (prompt) => {
  const apiKey = ""; // Inyectado por el entorno
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { 
      parts: [{ text: `Sos Manguito, un asistente financiero experto, empático y argentino. Respuestas cortas, directas y amigables.` }] 
    }
  };

  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return "Uy, me colgué. ¡Intentá de nuevo en un ratito! 🔌";
  }
};

// ==========================================
// 3. ESTILOS Y COMPONENTES VISUALES
// ==========================================

export const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root { 
      --bg-base: #FFFBF2; --bg-card: #FFFFFF; --text-main: #221F26; --text-muted: #8B7C72; 
      --border-color: #F3F4F6; --input-bg: rgba(249, 250, 251, 0.8); --nav-bg: rgba(255, 255, 255, 0.85);
      --card-shadow: 0 8px 30px rgba(0,0,0,0.03); 
    }
    .dark { 
      --bg-base: #0D0B0F; --bg-card: #16141A; --text-main: #F3F4F6; --text-muted: #9CA3AF; 
      --border-color: #2D2936; --input-bg: rgba(45, 41, 54, 0.4); --nav-bg: rgba(22, 20, 26, 0.85);
    }
    body { background-color: var(--bg-base); color: var(--text-main); font-family: system-ui, sans-serif; margin: 0; }
    .theme-transition { transition: all 0.4s ease; }
    @keyframes slideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .step-animate { animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  `}} />
);

export const MangoLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="100%" stopColor="#639639" /></linearGradient>
      <linearGradient id="bodyGrad" x1="10%" y1="0%" x2="90%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="30%" stopColor="#FFCE45" /><stop offset="60%" stopColor="#FDBC3C" /><stop offset="85%" stopColor="#E53E3E" /><stop offset="100%" stopColor="#9D50FF" /></linearGradient>
    </defs>
    <path d="M105 75 C 110 45, 150 45, 155 60 C 160 75, 140 95, 120 90 C 110 88, 105 80, 105 75 Z" fill="url(#leafGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M100 65 C 135 60, 160 100, 140 145 C 120 185, 60 180, 50 145 C 40 110, 60 85, 80 75 C 88 70, 95 66, 100 65 Z" fill="url(#bodyGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBD3A] shadow-md active:scale-95',
    secondary: 'bg-white text-[#221F26] border-2 border-[var(--border-color)] hover:border-[#FFCE45]',
    google: 'bg-white border-2 border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50',
    pro: 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] text-white'
  };
  return <button className={`w-full py-3.5 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-3 cursor-pointer ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

export const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className={`relative group ${className}`}>
    {Icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#FFCE45] transition-colors"><Icon size={20} strokeWidth={2.5} /></div>}
    <input className={`w-full bg-[var(--input-bg)] border-2 border-transparent rounded-[20px] py-4 ${Icon ? 'pl-14' : 'pl-6'} pr-6 text-[var(--text-main)] outline-none focus:border-[#FFCE45] focus:bg-[var(--bg-card)] theme-transition`} {...props} />
  </div>
);

export const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50' : ''} ${className}`} style={{ boxShadow: 'var(--card-shadow)' }}>{children}</div>
);

export const Toast = ({ message, type = 'success' }) => {
  if (!message) return null;
  return (
    <div className="fixed top-8 left-0 right-0 z-[100] flex justify-center animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-none">
      <div className={`${type === 'error' ? 'bg-[#E53E3E]' : 'bg-[#221F26]'} text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md bg-opacity-95 border border-white/10`}>
        {type === 'error' ? <AlertCircle size={20} strokeWidth={3} /> : <CheckCircle2 size={20} strokeWidth={3} className="text-[#99CF43]" />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export const Header = ({ title = "Manguito", userName = "Amigo", showGreeting = false, backButton = false, onNavigate }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-[var(--nav-bg)] backdrop-blur-xl z-40 border-b border-transparent">
    <div className="flex items-center gap-3">
      {backButton ? (
        <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-white rounded-full shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] active:scale-90">
          <MoreHorizontal className="rotate-180" size={24} />
        </button>
      ) : (
        <MangoLogo className="w-10 h-10" />
      )}
      <div>
        {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)]">¡Hola, {userName}!</p>}
        <span className="text-xl font-black tracking-tight">{title}</span>
      </div>
    </div>
    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[var(--border-color)] shadow-sm"><Bell size={20}/></button>
  </header>
);

export const BottomNav = ({ activeTab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'home' ? 'text-[#FFCE45]' : 'text-[var(--text-muted)]'}`}>
      <Home size={24} /><span className="text-[10px] font-bold">Inicio</span>
    </button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'movements' ? 'text-[#FFCE45]' : 'text-[var(--text-muted)]'}`}>
      <DollarSign size={24} /><span className="text-[10px] font-bold">Movimientos</span>
    </button>
    <button onClick={() => onNavigate('new_movement')} className="w-14 h-14 bg-[#FFCE45] rounded-2xl flex items-center justify-center -mt-10 shadow-lg active:scale-90 transition-transform">
      <Plus size={32} strokeWidth={3}/>
    </button>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'learn' ? 'text-[#FDBC3C]' : 'text-[var(--text-muted)]'}`}>
      <BookOpen size={24} /><span className="text-[10px] font-bold">Aprender</span>
    </button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'more' ? 'text-[#FFCE45]' : 'text-[var(--text-muted)]'}`}>
      <MoreHorizontal size={24} /><span className="text-[10px] font-bold">Más</span>
    </button>
  </nav>
);

export const MercadoPagoLogo = ({ className }) => (
  <div className={`bg-[#009EE3] rounded-full flex items-center justify-center text-white ${className}`}>
    <Plus size={14} strokeWidth={2.5} />
  </div>
);

export const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
};

export const convertCurrency = (amount, fromCurr, toCurr) => (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];