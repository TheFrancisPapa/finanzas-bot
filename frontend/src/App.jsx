import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, BarChart2, DollarSign, Plus, BookOpen, MoreHorizontal, RefreshCcw, 
  LogOut, Mail, Lock, User, ChevronRight, Settings, Send, Bell, ArrowUpRight, 
  ArrowDownRight, Eye, EyeOff, Smartphone, Fingerprint, LockKeyhole, Trash2, 
  Pencil, Handshake, Camera, Users, Target, FileText, Download, CheckCircle2, 
  Sparkles, TrendingUp, ShieldCheck, AlertCircle, Moon, Sun, KeyRound, CloudOff, Cloud
} from 'lucide-react';

// --- GOOGLE LOGIN HOOK NATIVO ---
// Usamos la API oficial de Google Identity Services para no depender de librerías externas
const useGoogleLogin = ({ onSuccess, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
  }, []);

  return () => {
    if (!isLoaded || !window.google) {
      if (onError) onError('Error al cargar el script de Google');
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: "938457845659-43m4o2esvlht4kr3pnd3b147efo1v94j.apps.googleusercontent.com",
      scope: 'email profile openid',
      callback: (response) => {
        if (response.error) {
          if (onError) onError(response);
        } else {
          onSuccess(response);
        }
      },
    });
    client.requestAccessToken();
  };
};

// --- CONFIGURACIÓN DE ENTORNO ---
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000/api' : '/api',
  IS_LOCAL_MODE: false 
};

// --- Escudo Antifallos ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFBF2] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-[#FFEBEB] rounded-3xl flex items-center justify-center text-[#E53E3E] mb-6 shadow-sm">
            <AlertCircle size={40} strokeWidth={2.5}/>
          </div>
          <h2 className="text-3xl font-black text-[#221F26] mb-3 tracking-tight">¡Uy! Un tropezón.</h2>
          <p className="text-[#8B7C72] font-medium mb-8">Algo en la Matrix falló, pero tus datos están a salvo.</p>
          <button onClick={() => window.location.reload()} className="bg-[#FFCE45] text-[#221F26] px-8 py-4 rounded-2xl font-black shadow-md hover:scale-105 transition-all">
            Volver a intentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- MOTOR DE PETICIONES ---
const apiFetch = async (endpoint, options = {}) => {
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
    console.warn("Token inválido o expirado. Limpiando sesión local...");
    window.localStorage.clear();
    window.location.reload();
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la API');
  }
  return response.json();
};

const useLocalState = (key, initialValue) => {
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
    } catch (error) { }
  }, [key, state]);

  return [state, setState];
};

const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root { 
      --bg-base: #FFFBF2; --bg-card: #FFFFFF; --text-main: #221F26; --text-muted: #8B7C72; 
      --border-color: #F3F4F6; --input-bg: rgba(249, 250, 251, 0.8); --nav-bg: rgba(255, 255, 255, 0.85);
      --card-shadow: 0 8px 30px rgba(0,0,0,0.03); --card-shadow-hover: 0 14px 40px rgba(0,0,0,0.06);
    }
    .dark { 
      --bg-base: #0D0B0F; --bg-card: #16141A; --text-main: #F3F4F6; --text-muted: #9CA3AF; 
      --border-color: #2D2936; --input-bg: rgba(45, 41, 54, 0.4); --nav-bg: rgba(22, 20, 26, 0.85);
      --card-shadow: 0 8px 30px rgba(0,0,0,0.4); --card-shadow-hover: 0 14px 40px rgba(0,0,0,0.6);
    }
    body { background-color: var(--bg-base); color: var(--text-main); transition: background-color 0.4s ease, color 0.4s ease; }
    .theme-transition { transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease; }
    @keyframes slideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .step-animate { animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  `}} />
);

const callGeminiText = async (prompt) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: `Sos Manguito, asistente financiero. Respuestas cortas, amigables (che, plata). SOLO finanzas.` }] }
  };
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return "Uy, problemita técnico. ¡Intentá en un ratito! 🔌";
  }
};

const EXCHANGE_RATES = { ARS: 1, USD: 1000, EUR: 1100, GBP: 1400, BRL: 200 };
const convertCurrency = (amount, fromCurr, toCurr) => (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];
const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€', GBP: '£', BRL: 'R$' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- LOGOS ---
const InstagramLogo = ({ className }) => <svg viewBox="0 0 24 24" className={className}><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FEE411"/><stop offset="10%" stopColor="#FEDB16"/><stop offset="25%" stopColor="#FEC125"/><stop offset="40%" stopColor="#FE983D"/><stop offset="55%" stopColor="#FE5F5E"/><stop offset="70%" stopColor="#E53688"/><stop offset="85%" stopColor="#CE239B"/><stop offset="100%" stopColor="#5258CF"/></linearGradient></defs><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const YouTubeLogo = ({ className }) => <svg viewBox="0 0 24 24" fill="#FF0000" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const MercadoPagoLogo = ({ className }) => <div className={`bg-[#009EE3] rounded-full flex items-center justify-center text-white ${className}`}><Handshake size={14} strokeWidth={2.5} /></div>;

const MangoLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="100%" stopColor="#639639" /></linearGradient>
      <linearGradient id="bodyGrad" x1="10%" y1="0%" x2="90%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="30%" stopColor="#FFCE45" /><stop offset="60%" stopColor="#FDBC3C" /><stop offset="85%" stopColor="#E53E3E" /><stop offset="100%" stopColor="#9D50FF" /></linearGradient>
    </defs>
    <path d="M105 75 C 110 45, 150 45, 155 60 C 160 75, 140 95, 120 90 C 110 88, 105 80, 105 75 Z" fill="url(#leafGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M100 65 C 135 60, 160 100, 140 145 C 120 185, 60 180, 50 145 C 40 110, 60 85, 80 75 C 88 70, 95 66, 100 65 Z" fill="url(#bodyGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- COMPONENTES UI BASE ---
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBD3A] shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-main)] border-2 border-[var(--border-color)] hover:border-[#FFCE45] hover:-translate-y-1 hover:shadow-md active:scale-[0.98]',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--input-bg)] active:scale-95',
    danger: 'bg-[#FFEBEB] text-[#E53E3E] hover:bg-[#FFD6D6] dark:bg-[#3B1212] hover:-translate-y-1 active:scale-[0.98]',
    pro: 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] text-white hover:opacity-95 hover:-translate-y-1 shadow-[0_8px_24px_-6px_rgba(157,80,255,0.5)]'
  };
  return <button className={`w-full py-3.5 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-3 cursor-pointer ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className={`relative group ${className}`}>
    {Icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#FFCE45] transition-colors"><Icon size={20} strokeWidth={2.5} /></div>}
    <input className={`w-full bg-[var(--input-bg)] border-2 border-transparent rounded-[20px] py-4 ${Icon ? 'pl-14' : 'pl-6'} pr-6 text-[var(--text-main)] outline-none focus:border-[#FFCE45] focus:bg-[var(--bg-card)] theme-transition`} {...props} />
  </div>
);

const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50 hover:-translate-y-1 transition-all' : ''} ${className}`} style={{ boxShadow: onClick ? undefined : 'var(--card-shadow)' }}>{children}</div>
);

const Toast = ({ message, type = 'success' }) => {
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

// --- Gráfico de Bolsa ---
const StockChart = ({ movements, mainCurrency }) => {
  if (!movements || movements.length === 0) {
    return (
      <div className="w-full h-28 mt-2 flex flex-col items-center justify-center bg-[var(--input-bg)] rounded-2xl border-2 border-dashed border-[var(--border-color)] theme-transition hover:border-[#FFCE45]/50 transition-colors">
        <TrendingUp size={24} className="text-[var(--text-muted)] mb-2 opacity-50" />
        <p className="text-xs font-bold text-[var(--text-muted)]">Anotá tu primer movimiento</p>
      </div>
    );
  }

  let chartData = [40, 42, 41, 45, 44, 48, 47, 52, 50, 56, 54, 60, 58, 65, 63, 70];
  let currentVal = chartData[chartData.length - 1];
  const recentMovs = [...movements].reverse().slice(-8);
  recentMovs.forEach(mov => {
    const convertedAmount = convertCurrency(mov.amount, mov.currency, mainCurrency);
    const impact = (convertedAmount / 1000) || 5;
    currentVal += (mov.type === 'ingreso' ? impact : -impact);
    chartData.push(currentVal);
  });

  const max = Math.max(...chartData) + 5;
  const min = Math.min(...chartData) - 5;
  const range = max - min || 1;
  const points = chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100},${40 - ((val - min) / range) * 40}`).join(' ');

  const isPositive = chartData.length > 1 ? chartData[chartData.length - 1] >= chartData[chartData.length - 2] : true;
  const strokeColor = isPositive ? '#639639' : '#E53E3E';
  const fillUrl = isPositive ? 'url(#glowGreen)' : 'url(#glowRed)';

  return (
    <div className="relative w-full h-28 mt-2 group">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="glowGreen" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#639639" stopOpacity="0.3" /><stop offset="100%" stopColor="#639639" stopOpacity="0" /></linearGradient>
          <linearGradient id="glowRed" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#E53E3E" stopOpacity="0.3" /><stop offset="100%" stopColor="#E53E3E" stopOpacity="0" /></linearGradient>
        </defs>
        <polygon points={`0,40 ${points} 100,40`} fill={fillUrl} className="transition-all duration-700 ease-out" />
        <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out drop-shadow-md group-hover:stroke-[2.5px]" />
        <circle cx="100" cy={40 - ((chartData[chartData.length - 1] - min) / range) * 40} r="1.5" fill={strokeColor} className="animate-pulse shadow-lg group-hover:r-2 transition-all" />
      </svg>
    </div>
  );
};

// --- Componentes Navegación ---
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
          <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full transition-all active:scale-90 shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] hover:-translate-x-1"><ChevronRight size={24} className="rotate-180" /></button>
        ) : (
          <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] theme-transition transform transition-transform hover:scale-105 hover:shadow-md cursor-pointer"><MangoLogo className="w-8 h-8" /></div>
        )}
        <div>
          {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)] mb-0.5">¡{greeting}, {userName}!</p>}
          <span className="text-xl font-black text-[var(--text-main)] tracking-tight">{title}</span>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {profilePic && showGreeting && (
          <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] shadow-sm overflow-hidden mr-2 cursor-pointer hover:scale-105 transition-transform hover:shadow-md flex-shrink-0">
            <img src={profilePic} alt="Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <button className="w-11 h-11 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[#FFCE45] transition-all duration-300 shadow-sm border border-[var(--border-color)] hover:shadow-md hover:-translate-y-0.5 active:scale-95"><Bell size={20} strokeWidth={2.5} /></button>
      </div>
    </header>
  );
};

const BottomNav = ({ activeTab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'home' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-1'}`}>
      <Home size={24} fill={activeTab === 'home' ? "currentColor" : "none"} fillOpacity={activeTab === 'home' ? 0.2 : 0} />
      <span className={`text-[10px] font-bold ${activeTab === 'home' ? 'text-[var(--text-main)]' : ''}`}>Inicio</span>
    </button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'movements' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-1'}`}>
      <DollarSign size={24} strokeWidth={activeTab === 'movements' ? 3 : 2} />
      <span className={`text-[10px] font-bold ${activeTab === 'movements' ? 'text-[var(--text-main)]' : ''}`}>Movimientos</span>
    </button>
    <div className="-mt-16 relative group">
      <div className={`absolute inset-0 bg-[#FFCE45] rounded-[24px] blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300 ${activeTab === 'new' ? 'opacity-100 animate-pulse' : ''}`}></div>
      <button onClick={() => onNavigate('new_movement')} className={`relative w-16 h-16 bg-[#FFCE45] rounded-[24px] shadow-lg shadow-[#FFCE45]/40 text-[#221F26] flex items-center justify-center active:scale-90 transition-all duration-300 border-[3px] border-[var(--bg-base)] ${activeTab === 'new' ? 'scale-95 ring-4 ring-[#FFCE45]/20 rotate-45' : 'hover:-translate-y-2 hover:shadow-[#FFCE45]/60 hover:shadow-xl'}`}>
        <Plus size={32} strokeWidth={3} className={activeTab === 'new' ? 'rotate-45 transition-transform' : 'transition-transform'} />
      </button>
    </div>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'learn' ? 'text-[#FDBC3C] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-1'}`}>
      <BookOpen size={24} fill={activeTab === 'learn' ? "currentColor" : "none"} fillOpacity={activeTab === 'learn' ? 0.2 : 0} />
      <span className={`text-[10px] font-bold ${activeTab === 'learn' ? 'text-[var(--text-main)]' : ''}`}>Aprender</span>
    </button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'more' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-1'}`}>
      <MoreHorizontal size={24} strokeWidth={activeTab === 'more' ? 3 : 2} />
      <span className={`text-[10px] font-bold ${activeTab === 'more' ? 'text-[var(--text-main)]' : ''}`}>Más</span>
    </button>
  </nav>
);

const BiometricLockScreen = ({ onUnlock }) => {
  const [loading, setLoading] = useState(false);
  const handleUnlock = () => { setLoading(true); setTimeout(() => { setLoading(false); onUnlock(); }, 1200); };
  return (
    <div className="fixed inset-0 z-50 bg-[#110F13] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(255,206,69,0.1)]"><MangoLogo className="w-14 h-14 opacity-80" /></div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Manguito Bloqueado</h2>
    <p className="text-gray-400 text-sm mb-12 font-medium">Usá tu huella o Face ID para entrar</p>
        <button onClick={handleUnlock} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 ${loading ? 'bg-[#FFCE45] shadow-[0_0_40px_rgba(255,206,69,0.5)] scale-110' : 'bg-white/5 border border-white/20 hover:bg-white/10 hover:shadow-lg'}`}>
          {loading ? <LockKeyhole size={36} className="text-[#221F26] animate-pulse" /> : <Fingerprint size={40} className="text-[#FFCE45] opacity-80 animate-pulse" />}
        </button>
        <p className="text-gray-500 text-xs mt-6 font-bold tracking-widest uppercase">{loading ? 'Verificando...' : 'Toca para desbloquear'}</p>
      </div>
    </div>
  );
};

// --- Pantallas Auth y Onboarding ---

const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile, setUserProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoadingGoogle(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        
        const realName = userInfo.name || 'Amigo';
        const realEmail = userInfo.email || '';
        const realPicture = userInfo.picture || null;
        
        try {
          const apiRes = await fetch(`${CONFIG.API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: realEmail,
              name: realName,
              picture: realPicture
            })
          });

          if (!apiRes.ok) throw new Error('Fallo al conectar con el backend');
          const apiData = await apiRes.json();

          if (apiData.user?.isNewUser) {
            onNavigate('register_google', { email: realEmail, name: realName, picture: realPicture });
          } else {
            setUserProfile((prev) => ({ 
              mainCurrency: 'ARS',
              hideBalances: false,
              biometricAuth: false,
              ...prev,
              ...apiData.user, 
              name: apiData.user.name || realName,
              profilePic: apiData.user.picture || apiData.user.profilePic || realPicture || prev?.profilePic,
              token: apiData.token 
            }));
            onNavigate('home');
          }
        } catch (backendError) {
          console.warn("API demoró, usando modo local con tus datos de Google:", backendError);
          setUserProfile((prev) => ({
            mainCurrency: 'ARS', hideBalances: false, biometricAuth: false,
            ...prev, name: realName, email: realEmail, profilePic: realPicture, authProvider: 'google',
            token: "token_local_temporal"
          }));
          onNavigate('home');
        }
      } catch (error) {
        console.error("Error validando cuenta de Google:", error);
        triggerToast('Error validando tu cuenta de Google. Intentá de nuevo.', 'error');
      } finally {
        setIsLoadingGoogle(false);
      }
    },
    onError: () => triggerToast('Se canceló el inicio de sesión', 'error'),
  });

  const handleLogin = () => { 
    if (!isRegistered || !userProfile) {
      return triggerToast('No encontramos tu cuenta. ¡Creala tocando abajo en "Crear cuenta"! 👇', 'error');
    } 
    if (!email || !password) {
      return triggerToast('¡Che! Completá tu email y contraseña para entrar.', 'error');
    }
    if (email.toLowerCase().trim() !== userProfile.email?.toLowerCase().trim() || password !== userProfile.password) {
      return triggerToast('Email o contraseña incorrectos. Revisalos bien.', 'error');
    }
    onNavigate('home'); 
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email.trim()) return triggerToast('Escribí tu email primero y te mandamos las instrucciones.', 'error');
    triggerToast(`Te enviamos un link de recuperación a ${email} 📧`);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse dark:mix-blend-screen"></div>

      <div className="mb-8 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-32 h-32 bg-[var(--bg-card)] rounded-[40px] flex items-center justify-center mb-6 shadow-lg mx-auto border border-[var(--border-color)] relative transform hover:scale-105 transition-transform duration-500">
          <MangoLogo className="w-20 h-20 drop-shadow-sm" />
        </div>
        <h1 className="text-5xl font-black text-[var(--text-main)] mb-2 tracking-tight">Manguito</h1>
        <p className="text-[var(--text-muted)] font-semibold text-sm tracking-wide">Tu copiloto financiero</p>
      </div>

      <div className="w-full max-w-md bg-[var(--bg-card)] backdrop-blur-2xl rounded-[40px] p-8 border border-[var(--border-color)] relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h3 className="font-black text-2xl text-[var(--text-main)] mb-6 text-center tracking-tight">Acceder</h3>
        <Input placeholder="correo@ejemplo.com" type="email" icon={Mail} value={email} onChange={e => setEmail(e.target.value)} className="mb-4" />
        <Input placeholder="Contraseña secreta" type="password" icon={Lock} value={password} onChange={e => setPassword(e.target.value)} className="mb-2" />
        <div className="text-right mb-6">
          <button onClick={handleForgotPassword} type="button" className="text-xs font-bold text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors p-1 active:scale-95">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <Button onClick={handleLogin}>Entrar a mi cuenta</Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)] rounded-full">o ingresar con</span></div>
        </div>

        <button
          onClick={() => loginConGoogle()}
          disabled={isLoadingGoogle}
          className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-0.5 active:bg-gray-100 dark:active:bg-gray-900 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoadingGoogle ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded-full" alt="Google" />
          )}
          {isLoadingGoogle ? 'Conectando...' : 'Continuar con Google'}
        </button>
      </div>

      <div className="w-full max-w-md mt-6 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
        <button onClick={() => onNavigate('register')} className="group w-full relative overflow-hidden rounded-[32px] bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-2 transition-all duration-300 hover:border-[#FFCE45] hover:shadow-[0_12px_40px_rgba(255,206,69,0.2)] hover:-translate-y-1 active:scale-[0.98]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFCE45]/5 to-[#FDBC3C]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between px-5 py-4">
            <div className="text-left flex flex-col justify-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">¿Sos nuevo por acá?</span>
              <span className="text-xl font-black text-[var(--text-main)] tracking-tight">Creá tu cuenta gratis</span>
            </div>
            <div className="w-12 h-12 bg-[#FFCE45] rounded-2xl flex items-center justify-center text-[#221F26] shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <ArrowUpRight size={24} strokeWidth={3} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

const OnboardingFlow = ({ onFinish, onBack, mode = 'manual', initialData = {} }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: initialData.name || '', email: initialData.email || '', password: '', dob: '', goal: '', mainCurrency: 'ARS', authProvider: mode, profilePic: initialData.picture || null 
  });
  const [initialSetup, setInitialSetup] = useState({ type: null, name: '', amount: '' });

  const hasLen = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNum = /[0-9]/.test(formData.password);
  const passSecure = hasLen && hasUpper && hasNum;

  const isMinor = formData.dob && (Math.abs(new Date(Date.now() - new Date(formData.dob).getTime()).getUTCFullYear() - 1970) < 18);

  const manualSteps = [
    { id: 'name_email', title: '¡Hola!\nVamos a conocerte', desc: '¿Cómo te llamás y cuál es tu email?' },
    { id: 'password', title: 'Tu seguridad\nes clave 🔒', desc: 'Creá una contraseña fuerte para proteger tus mangos.' },
    { id: 'dob', title: '¿Cuándo naciste?', desc: 'Para adaptar los consejos a tu edad (y saludarte 🎂).' },
    { id: 'goal', title: '¿Cuál es tu principal objetivo?', desc: 'Elegí el que mejor te describa hoy.' },
    { id: 'initial_setup', title: 'Arrancá con todo', desc: '¿Querés crear un presupuesto mensual o una meta de ahorro? No es obligatorio.' },
    { id: 'currency', title: 'Último paso', desc: '¿En qué moneda querés ver tu balance principal?' },
    { id: 'loading', title: 'Preparando tu Manguito...', desc: 'Personalizando el dashboard para vos.' }
  ];

  const googleSteps = [
    { id: 'name_email', title: 'Confirmá tus datos', desc: 'Extraídos de forma segura de Google.' },
    { id: 'dob', title: 'Falta un datito', desc: '¿Cuándo naciste? Para saludarte en tu cumple 🎂' },
    { id: 'goal', title: '¿Cuál es tu principal objetivo?', desc: 'Elegí el que mejor te describa hoy.' },
    { id: 'initial_setup', title: 'Arrancá con todo', desc: '¿Querés crear un presupuesto mensual o una meta de ahorro? No es obligatorio.' },
    { id: 'currency', title: 'Último paso', desc: '¿En qué moneda querés ver tu balance principal?' },
    { id: 'loading', title: 'Preparando tu Manguito...', desc: 'Personalizando el dashboard para vos.' }
  ];

  const stepsFlow = mode === 'manual' ? manualSteps : googleSteps;
  const currentStepData = stepsFlow[step - 1];

  useEffect(() => {
    if (currentStepData.id === 'loading') setTimeout(() => onFinish(formData, initialSetup), 3000);
  }, [step, currentStepData.id]);

  const handleBack = () => {
    if (step === 1) onBack();
    else setStep(step - 1);
  };

  const nextStep = () => {
    if (currentStepData.id === 'name_email' && (!formData.name.trim() || !formData.email.trim())) return;
    if (currentStepData.id === 'password' && !passSecure) return;
    if (currentStepData.id === 'dob' && !formData.dob) return;
    if (step < stepsFlow.length) setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition flex flex-col p-6 overflow-hidden relative">
      {currentStepData.id !== 'loading' && (
        <header className="pt-6 pb-4 flex items-center justify-between relative z-20">
          <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full transition-colors active:scale-90 shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45]">
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div className="flex gap-2">
            {stepsFlow.map((s, i) => (
              s.id !== 'loading' && <div key={i} className={`h-2 w-6 rounded-full transition-colors duration-500 ${i < step ? 'bg-[#FFCE45]' : 'bg-[var(--border-color)]'}`}></div>
            ))}
          </div>
        </header>
      )}

      <div className="flex-1 flex flex-col justify-center relative z-10 max-w-md w-full mx-auto">
        <div key={step} className="step-animate">
          {currentStepData.id !== 'loading' && (
            <>
              <h2 className="text-4xl font-black text-[var(--text-main)] mb-3 tracking-tight whitespace-pre-line">{currentStepData.title}</h2>
              <p className="text-[var(--text-muted)] mb-8 font-medium text-lg">{currentStepData.desc}</p>
            </>
          )}

          {currentStepData.id === 'name_email' && (
            <>
              <Input placeholder="Tu nombre o apodo" icon={User} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus className="mb-4" />
              <div className="relative">
                <Input placeholder="correo@ejemplo.com" type="email" icon={Mail} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={mode === 'google'} className={mode === 'google' ? 'opacity-60 pointer-events-none' : ''} />
              </div>
              {mode === 'google' && (
                <div className="bg-[#E6F4EA]/50 dark:bg-green-900/10 border border-[#639639]/20 rounded-xl p-3 flex items-center gap-2 mt-4">
                  <Lock size={14} className="text-[#639639]" />
                  <p className="text-xs font-bold text-[#639639]">Email enlazado a Google de forma segura.</p>
                </div>
              )}
            </>
          )}

          {currentStepData.id === 'password' && (
            <>
              <Input placeholder="Contraseña secreta" type="password" icon={Lock} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} autoFocus className="mb-6" />
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-[24px] shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Requisitos</p>
                <ul className="space-y-3">
                  <li className={`flex items-center gap-3 font-bold text-sm transition-colors ${hasLen ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasLen ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] border-2 rounded-full" />} Mínimo 8 caracteres</li>
                  <li className={`flex items-center gap-3 font-bold text-sm transition-colors ${hasUpper ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasUpper ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] border-2 rounded-full" />} Una mayúscula</li>
                  <li className={`flex items-center gap-3 font-bold text-sm transition-colors ${hasNum ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasNum ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] border-2 rounded-full" />} Un número</li>
                </ul>
              </div>
            </>
          )}

          {currentStepData.id === 'dob' && (
            <>
              <Input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="mb-6" autoFocus />
              {isMinor && (
                <div className="bg-[#E6F4EA] dark:bg-green-900/20 border border-[#639639]/30 rounded-2xl p-4 flex gap-3 animate-in fade-in duration-300">
                  <ShieldCheck className="text-[#639639] flex-shrink-0" />
                  <p className="text-sm font-bold text-[var(--text-main)]">¡Qué bueno que arranques joven! <span className="font-medium text-[var(--text-muted)]">Te recomendamos validar las grandes decisiones con un adulto.</span></p>
                </div>
              )}
            </>
          )}

          {currentStepData.id === 'goal' && (
            <div className="space-y-3">
              {[
                { id: 'control', icon: '📝', title: 'Controlar gastos', desc: 'Saber en qué se me va la plata.' },
                { id: 'save', icon: '🎯', title: 'Ahorrar para una meta', desc: 'Viaje, auto, mudanza...' },
                { id: 'invest', icon: '📈', title: 'Aprender a invertir', desc: 'Hacer rendir mis ahorros.' }
              ].map(opt => (
                <button key={opt.id} onClick={() => setFormData({ ...formData, goal: opt.id })} className={`w-full p-5 rounded-[24px] border-2 text-left flex gap-4 transition-all ${formData.goal === opt.id ? 'border-[#FFCE45] bg-[var(--bg-card)] shadow-md scale-[1.02] border-2' : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-70 hover:opacity-100 hover:border-[#FFCE45]/50'}`}>
                  <span className="text-3xl">{opt.icon}</span>
                  <div><h4 className="font-black text-[var(--text-main)]">{opt.title}</h4><p className="text-xs text-[var(--text-muted)] font-bold mt-1">{opt.desc}</p></div>
                </button>
              ))}
              <button onClick={nextStep} className="w-full text-center text-sm font-bold text-[var(--text-muted)] hover:text-[#FFCE45] mt-4 py-2 transition-colors active:scale-95">Omitir este paso</button>
            </div>
          )}

          {currentStepData.id === 'initial_setup' && (
            <div className="space-y-4">
              {!initialSetup.type ? (
                <>
                  <button onClick={() => setInitialSetup({ ...initialSetup, type: 'budget' })} className="w-full p-6 rounded-[24px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-left flex items-center gap-4 hover:border-[#FFCE45] hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛒</div>
                    <div><h4 className="font-black text-[var(--text-main)] text-lg">Presupuesto Mensual</h4><p className="text-xs text-[var(--text-muted)] font-medium">Ej: Gastar máx. $100.000 en Super</p></div>
                  </button>
                  <button onClick={() => setInitialSetup({ ...initialSetup, type: 'goal' })} className="w-full p-6 rounded-[24px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-left flex items-center gap-4 hover:border-[#FFCE45] hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🚗</div>
                    <div><h4 className="font-black text-[var(--text-main)] text-lg">Meta de Ahorro</h4><p className="text-xs text-[var(--text-muted)] font-medium">Ej: Juntar US$5.000 para un auto</p></div>
                  </button>
                  <button onClick={nextStep} className="w-full text-center text-sm font-bold text-[var(--text-muted)] hover:text-[#FFCE45] mt-2 py-2 transition-colors active:scale-95">Omitir, lo armo después</button>
                </>
              ) : (
                <div className="animate-in fade-in duration-300 bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black text-[var(--text-main)] text-lg flex items-center gap-2">
                      {initialSetup.type === 'budget' ? '🛒 Tu Presupuesto' : '🚗 Tu Meta'}
                    </h4>
                    <button onClick={() => setInitialSetup({ type: null, name: '', amount: '' })} className="text-xs font-bold text-[#E53E3E] bg-[#FFEBEB] dark:bg-[#3B1212] px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Cancelar</button>
                  </div>
                  <Input placeholder={initialSetup.type === 'budget' ? "Ej: Supermercado" : "Ej: Auto 0km"} value={initialSetup.name} onChange={e => setInitialSetup({ ...initialSetup, name: e.target.value })} className="mb-4" autoFocus />
                  <Input placeholder="Monto objetivo ($)" type="number" value={initialSetup.amount} onChange={e => setInitialSetup({ ...initialSetup, amount: e.target.value })} />
                </div>
              )}
            </div>
          )}

          {currentStepData.id === 'currency' && (
            <div className="grid grid-cols-2 gap-3">
              {['ARS', 'USD', 'EUR', 'BRL'].map(cur => (
                <button key={cur} onClick={() => setFormData({...formData, mainCurrency: cur})} className={`p-5 rounded-[24px] border-2 font-black text-xl transition-all ${formData.mainCurrency === cur ? 'border-[#FFCE45] bg-[var(--bg-card)] text-[var(--text-main)] shadow-md scale-105' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[#FFCE45]/50'}`}>
                  {cur}
                </button>
              ))}
            </div>
          )}

          {currentStepData.id === 'loading' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[var(--bg-card)] rounded-[32px] flex items-center justify-center mb-8 shadow-xl border border-[var(--border-color)] relative">
                <MangoLogo className="w-14 h-14 animate-pulse" />
                <div className="absolute inset-0 border-4 border-[#FFCE45] rounded-[32px] animate-spin border-t-transparent" style={{animationDuration: '2s'}}></div>
              </div>
              <h2 className="text-3xl font-black text-[var(--text-main)] mb-2 tracking-tight">{currentStepData.title}</h2>
              <p className="text-[var(--text-muted)] font-bold animate-pulse">{currentStepData.desc}</p>
            </div>
          )}
        </div>
      </div>

      {currentStepData.id !== 'loading' && (
        <div className="relative z-20 pt-8 mt-auto">
          <Button 
            onClick={nextStep} 
            disabled={
              (currentStepData.id === 'name_email' && !formData.name) || 
              (currentStepData.id === 'initial_setup' && initialSetup.type && (!initialSetup.name || !initialSetup.amount)) ||
              (currentStepData.id === 'password' && !passSecure)
            } 
            className="py-5 text-lg shadow-[0_10px_30px_rgba(255,206,69,0.3)] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
          >
            {currentStepData.id === 'currency' ? 'Empezar con Manguito 🚀' : 'Continuar'}
          </Button>
        </div>
      )}
    </div>
  );
};

const DashboardScreen = ({ onNavigate, movements = [], userProfile }) => {
  const [revealBalances, setRevealBalances] = useState(!userProfile?.hideBalances);
  const [insight, setInsight] = useState("Aún no registraste gastos. ¡Cargá tu primer movimiento para activar la IA!");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const mainCurrency = userProfile?.mainCurrency || 'ARS';
  const shortName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Amigo';

  useEffect(() => { setRevealBalances(!userProfile?.hideBalances); }, [userProfile?.hideBalances]);

  useEffect(() => {
    if (movements.length > 0 && !loadingInsight && insight.includes("Aún no")) {
      setInsight("Tus finanzas se movieron. Tocá el botón abajo para analizar tus hábitos con IA.");
    }
  }, [movements]);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const balance = totalIngresos - totalGastos;
  const displayMoney = (val) => revealBalances ? formatMoney(val, mainCurrency) : `${mainCurrency === 'USD'? 'US$' : mainCurrency==='EUR' ? '€' : '$'} ••••••`;

  const isBirthday = () => {
    if (!userProfile?.dob) return false;
    const today = new Date();
    const [year, month, day] = userProfile.dob.split('-');
    return today.getMonth() + 1 === parseInt(month) && today.getDate() === parseInt(day);
  };

  const handleGenerateInsight = async () => {
    if (movements.length === 0) return;
    setLoadingInsight(true);
    const movsData = movements.slice(0, 5).map(m => `${m.type}: ${m.amount} ${m.currency} en ${m.category}`);
    const prompt = `Analizá estos últimos gastos/ingresos y dame un consejo financiero corto de 2 oraciones. Datos: ${JSON.stringify(movsData)}`;
    const result = await callGeminiText(prompt);
    setInsight(result || "Hubo un error analizando tus datos. Intentá más tarde.");
    setLoadingInsight(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header
        onNavigate={onNavigate}
        showGreeting={true}
        userName={shortName}
        profilePic={userProfile?.profilePic || userProfile?.picture}
      />

      <main className="px-6 space-y-6 mt-2">
        {isBirthday() && (
          <div className="bg-gradient-to-r from-[#FFCE45] to-[#FDBC3C] rounded-[32px] p-6 shadow-lg shadow-[#FFCE45]/30 relative overflow-hidden animate-in slide-in-from-top-4 duration-700">
            <div className="absolute -right-4 -top-4 text-8xl opacity-20 rotate-12">🎉</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-[#221F26] mb-2 tracking-tight">¡Feliz cumple, {shortName}! 🎂</h3>
              <p className="text-[#221F26] text-sm font-medium leading-relaxed opacity-90">Un año más de vida. Venís con una racha genial, ¡hoy date un buen gustito!</p>
            </div>
          </div>
        )}

        <div className="bg-[var(--bg-card)] rounded-[40px] p-8 text-center border border-[var(--border-color)] relative overflow-hidden group theme-transition" style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[70px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 dark:mix-blend-screen"></div>
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest opacity-80">Balance en {mainCurrency}</p>
            <button onClick={() => setRevealBalances(!revealBalances)} className="text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors p-1 active:scale-90">
              {revealBalances ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="h-[72px] flex items-center justify-center">
            <h2 className={`text-[52px] font-black tracking-tighter relative z-10 drop-shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-500 ${balance < 0 ? 'text-[#E53E3E]' : 'text-[#639639]'}`} key={revealBalances ? balance : 'hidden'}>
              {displayMoney(balance)}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border-color)] relative z-10">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowUpRight size={14} className="text-[#639639] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ingresos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalIngresos)}</span>
            </div>
            <div className="border-l border-[var(--border-color)] flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowDownRight size={14} className="text-[#E53E3E] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Gastos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalGastos)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
            <div className="w-14 h-14 bg-orange-50/50 dark:bg-orange-500/10 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">🔥</div>
            <span className="text-3xl font-black text-[var(--text-main)]">3</span>
            <span className="text-xs font-bold text-[var(--text-muted)]">Días de racha</span>
          </Card>
          <Card className="flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
            <div className="w-14 h-14 bg-yellow-50/50 dark:bg-yellow-500/10 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">💰</div>
            <span className="text-2xl font-black text-[var(--text-main)] mt-1">{displayMoney(totalGastos)}</span>
            <span className="text-xs font-bold text-[var(--text-muted)] mt-1">Gastado hoy</span>
          </Card>

          <Card className="col-span-2 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300 cursor-default !p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50/50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">🧠</div>
              <div className="text-left flex-1">
                <p className="font-black text-[var(--text-main)] text-sm">Análisis Inteligente</p>
                <p className="text-xs font-medium text-[var(--text-muted)] leading-snug mt-0.5 animate-in fade-in" key={insight}>{insight}</p>
              </div>
            </div>
            {movements.length > 0 && (
              <Button onClick={handleGenerateInsight} variant="secondary" className="py-2 text-xs w-full shadow-none border-dashed border-[var(--border-color)] hover:border-[#FFCE45]">
                {loadingInsight ? "Analizando..." : <><Sparkles size={14} className="text-[#FFCE45]" /> Generar nuevo análisis con IA</>}
              </Button>
            )}
          </Card>
        </div>

        <div onClick={() => onNavigate('pro')} className="bg-gradient-to-r from-[#FFF8E7] to-[#FFF2D6] dark:from-[#3B2F1D] dark:to-[#221A0F] border border-[#FFCE45]/40 rounded-[32px] p-6 flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(255,206,69,0.1)] relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgba(255,206,69,0.2)] transition-all">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFCE45]/15 to-transparent transform group-hover:scale-x-150 transition-transform origin-right"></div>
          <div className="flex-1 relative z-10">
            <p className="text-[var(--text-main)] font-black text-sm mb-1 group-hover:text-[#FDBC3C] transition-colors">¿Querés exportar tus datos?</p>
            <p className="text-[var(--text-muted)] text-xs font-bold">Por $6.999 ARS/mes descargá PDFs.</p>
          </div>
          <button className="bg-[#FFCE45] text-[#221F26] px-5 py-3 rounded-[14px] text-xs font-black uppercase tracking-wider shadow-md group-hover:scale-105 group-active:scale-95 transition-transform relative z-10">Ser PRO</button>
        </div>

        <Card className="!p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-[var(--text-main)] text-lg">Evolución ({mainCurrency})</h3>
            <span className="bg-[var(--bg-base)] text-[var(--text-muted)] text-[10px] font-black px-3 py-1.5 rounded-[10px] uppercase tracking-widest border border-[var(--border-color)]">30 días</span>
          </div>
          <StockChart movements={movements} mainCurrency={mainCurrency} />
        </Card>

        {movements.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-6xl mb-5 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default transform hover:scale-110">🌱</div>
            <h4 className="font-black text-[var(--text-muted)] mb-1">Sin movimientos recientes</h4>
            <p className="text-sm text-[var(--text-muted)] font-medium">Tus últimos gastos aparecerán aquí</p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-black text-[var(--text-main)] text-lg">Últimos movimientos</h3>
              {movements.length > 3 && (
                <button onClick={() => onNavigate('movements')} className="text-xs font-bold text-[var(--text-muted)] hover:text-[#FFCE45] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95">Ver todos</button>
              )}
            </div>
            <div className="space-y-3">
              {movements.slice(0, 3).map((mov, idx) => (
                <Card key={idx} noPadding className="p-4 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${mov.type === 'gasto' ? 'bg-[#FFEBEB]/80 dark:bg-red-500/10' : 'bg-[#E6F4EA]/80 dark:bg-green-500/10'}`}>
                      {mov.icon || (mov.type === 'gasto' ? '💸' : '💰')}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-main)]">{mov.category || 'General'}</p>
                      {mov.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{mov.description}</p>}
                    </div>
                  </div>
                  <span className={`font-black ${mov.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
                    {mov.type === 'gasto' ? '-' : '+'}{formatMoney(Number(mov.amount), mov.currency)}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
};

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
          <div className="space-y-6 mt-8 animate-in slide-in-from-bottom-4 duration-500">
            {Object.entries(groupedMovements).map(([dateLabel, movs], groupIdx) => (
              <div key={groupIdx}>
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 px-2">{dateLabel}</h3>
                <div className="space-y-3">
                  {movs.map((mov, idx) => (
                    <div key={idx} className="stagger-animate" style={{ animationDelay: `${idx * 100}ms` }}>
                      <Card noPadding className="p-4.5 flex justify-between items-center shadow-sm hover:border-[#FFCE45]/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${mov.type === 'gasto' ? 'bg-[#FFEBEB]/80 dark:bg-red-500/10' : 'bg-[#E6F4EA]/80 dark:bg-green-500/10'}`}>
                            {mov.icon || (mov.type === 'gasto' ? '💸' : '💰')}
                          </div>
                          <div>
                            <p className="font-black text-[var(--text-main)] text-base tracking-tight">{mov.category || 'Movimiento'}</p>
                            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{mov.description || 'Sin descripción'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black ${mov.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
                            {mov.type === 'gasto' ? '-' : '+'}{formatMoney(Number(mov.amount), mov.currency)}
                          </span>
                          {mov.hasReceipt && (
                            <p className="text-[10px] font-bold text-[#FFCE45] mt-1 uppercase tracking-wider flex items-center justify-end gap-1"><Camera size={10} /> Ticket</p>
                          )}
                        </div>
                      </Card>
                    </div>
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

const LearnScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('ia');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: '¡Hola! Soy Mango IA ✨. Hacé una pregunta sobre tus finanzas, presupuestos o cómo invertir tus ahorros.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const financialTips = [
    { icon: '🛡️', title: 'Fondo de emergencia', desc: 'El primer paso para la tranquilidad es tener entre 3 y 6 meses de tus gastos fijos ahorrados.' },
    { icon: '⏳', title: 'Regla de las 24 horas', desc: 'Antes de una compra grande, esperá 24hs. Evita gastos impulsivos.' },
    { icon: '📊', title: 'Regla 50/30/20', desc: 'Destiná 50% a necesidades, 30% a gustos y 20% a ahorro o inversión.' },
    { icon: '💳', title: 'Ojo con las cuotas', desc: 'Asegurate de que las cuotas no superen el 30% de tu sueldo.' },
    { icon: '📈', title: 'Interés compuesto', desc: 'Invertir poco pero constante a largo plazo es clave.' },
    { icon: '🐜', title: 'Gastos hormiga', desc: 'Ese café diario o suscripción que no usás suma un montón a fin de mes.' },
    { icon: '🎯', title: 'Pagate a vos primero', desc: 'Apenas cobres, separá la plata del ahorro.' }
  ];
  const todayTip = financialTips[new Date().getDate() % financialTips.length];

  const tabs = [
    { id: 'ia', icon: '🤖', label: 'IA' },
    { id: 'tips', icon: '💡', label: 'Tips' },
    { id: 'instagram', icon: <InstagramLogo className="w-5 h-5" />, label: 'Instagram' },
    { id: 'youtube', icon: <YouTubeLogo className="w-5 h-5" />, label: 'YouTube' }
  ];

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatHistory, isTyping]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const newMsg = { role: 'user', text: chatInput };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsTyping(true);

    const contextStr = updatedHistory.map(m => `${m.role === 'user' ? 'Usuario' : 'Manguito'}: ${m.text}`).join('\n');
    const prompt = `Historial de chat:\n${contextStr}\n\nManguito:`;

    const response = await callGeminiText(prompt);
    setChatHistory([...updatedHistory, { role: 'model', text: response || "Me quedé sin conexión por un ratito. Intenta de nuevo más tarde." }]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} />
      <main className="px-6 mt-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] text-2xl theme-transition">📚</div>
          <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Aprender</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3.5 rounded-[20px] font-bold text-sm whitespace-nowrap snap-start transition-all duration-300 ${activeTab === tab.id ? 'bg-[#FDBC3C] text-[#221F26] shadow-lg shadow-[#FDBC3C]/20 scale-105' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] shadow-sm hover:-translate-y-0.5'}`}>
              <span className="text-xl flex items-center justify-center">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 relative">
          {activeTab === 'ia' && (
            <>
              <div className="bg-[var(--bg-card)] rounded-[36px] overflow-hidden border border-[var(--border-color)] shadow-[0_12px_40px_rgb(0,0,0,0.05)] animate-in fade-in slide-in-from-right-8 duration-500 theme-transition">
                <div className="bg-gradient-to-r from-[#FFCE45] to-[#FDBC3C] px-6 py-5 flex justify-between items-center text-[#221F26] relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/30 skew-x-12 transform translate-x-10"></div>
                  <div className="flex items-center gap-3 font-black text-xl relative z-10"><span className="text-2xl bg-white/40 w-12 h-12 rounded-[16px] flex items-center justify-center shadow-inner">🤖</span> Mango IA</div>
                  <div className="text-xs font-bold bg-white/30 px-4 py-2 rounded-full backdrop-blur-md border border-white/50 relative z-10">Conectado</div>
                </div>
                <div className="p-5 h-[380px] flex flex-col justify-between bg-[var(--bg-base)] relative theme-transition">
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_#221F26_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_#FFFFFF_1px,_transparent_1px)] bg-[length:20px_20px]"></div>

                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 relative z-10">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-3xl max-w-[85%] text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-[#FFCE45] text-[#221F26] rounded-br-sm' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[#FFCE45]/30 text-gray-400 rounded-bl-sm text-sm font-bold shadow-sm flex gap-1">
                          <span className="animate-bounce">.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative mt-2 z-10">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Preguntale a Mango... ✨" className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[24px] py-4.5 pl-6 pr-16 text-sm outline-none focus:border-[#FDBC3C] transition-all duration-300 placeholder:text-[var(--text-muted)] font-medium text-[var(--text-main)] shadow-sm" />
                    <button onClick={handleSendChat} disabled={isTyping || !chatInput.trim()} className="absolute right-2 top-2 bottom-2 aspect-square bg-[#FDBC3C] hover:bg-[#E5A82F] disabled:opacity-50 transition-all duration-300 text-[#221F26] rounded-[18px] flex items-center justify-center shadow-sm active:scale-95"><Send size={20} className="ml-0.5" /></button>
                  </div>
                </div>
              </div>
              <div onClick={() => onNavigate('pro')} className="mt-4 bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] rounded-[28px] p-5 text-white flex items-center justify-between shadow-[0_8px_24px_rgba(157,80,255,0.3)] group cursor-pointer hover:shadow-[0_12px_30px_rgba(157,80,255,0.4)] transition-all animate-in slide-in-from-bottom-4 duration-500 delay-100 hover:-translate-y-1">
                <div>
                  <p className="font-black text-sm mb-0.5 group-hover:text-[#D6B5FF] transition-colors">¿Necesitás más consultas?</p>
                  <p className="text-xs font-medium text-white/80">Ilimitadas por $6.999 ARS/mes</p>
                </div>
                <button className="bg-white text-[#8B3DED] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">Ser PRO</button>
              </div>
            </>
          )}
          {activeTab === 'tips' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
              <p className="text-sm text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-2 mb-5 pl-1"><span>💡</span> Tip del día</p>
              <Card className="group hover:border-[#FFCE45]/60 transition-all cursor-pointer !p-7">
                <h3 className="font-black text-[#FDBC3C] flex items-center gap-4 mb-4 text-xl"><span className="w-12 h-12 bg-yellow-50 dark:bg-yellow-500/10 rounded-[16px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">{todayTip.icon}</span> {todayTip.title}</h3>
                <p className="text-[var(--text-main)] text-sm leading-relaxed font-medium">{todayTip.desc}</p>
              </Card>
            </div>
          )}
          {(activeTab === 'instagram' || activeTab === 'youtube') && (
            <Card className="flex flex-col items-center text-center py-14 mt-2 animate-in fade-in slide-in-from-right-8 duration-500 border-0 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
              <div className="w-24 h-24 mb-6 relative transform transition-transform hover:scale-110 duration-500 flex items-center justify-center">
                {activeTab === 'instagram' ? <InstagramLogo className="w-full h-full drop-shadow-md" /> : <YouTubeLogo className="w-full h-full drop-shadow-md" />}
              </div>
              <h3 className="text-3xl font-black text-[var(--text-main)] mb-3 tracking-tight">{activeTab === 'instagram' ? 'Recomendación Diaria' : 'Canal en Alta'}</h3>
              <p className="text-base text-[var(--text-muted)] mb-10 px-4 leading-relaxed font-medium">{activeTab === 'instagram' ? 'Exponente rotativo cada 24hs para dominar áreas distintas de tus finanzas.' : 'Video y contenido extenso rotativo sobre tácticas de inversión por día.'}</p>
              <button className={`border-2 border-[var(--border-color)] rounded-[28px] py-6 px-8 w-full max-w-[280px] hover:border-${activeTab === 'instagram' ? '[#FDBC3C]' : '[#3B82F6]'} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-[var(--bg-card)]`}>
                <p className={`font-black text-[var(--text-main)] text-2xl mb-1 group-hover:text-${activeTab === 'instagram' ? '[#FDBC3C]' : '[#3B82F6]'} transition-colors tracking-tight`}>{activeTab === 'instagram' ? '@ramiromarra' : 'El Arte de Invertir'}</p>
                <p className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider mt-2">{activeTab === 'instagram' ? 'Economía y Mercados' : 'Inversión en Bolsa'}</p>
              </button>
            </Card>
          )}
        </div>
      </main>
      <BottomNav activeTab="learn" onNavigate={onNavigate} />
    </div>
  );
};

const MoreScreen = ({ onNavigate, userProfile, triggerLock }) => {
  const ListItem = ({ icon, title, value, isPro, isLast, onClick }) => (
    <div onClick={onClick} className={`flex items-center justify-between py-5 px-3 hover:bg-[var(--border-color)] rounded-[20px] transition-all duration-200 cursor-pointer group ${!isLast ? 'border-b border-[var(--border-color)]/50' : ''}`}>
      <div className="flex items-center gap-4">
        <span className="text-2xl w-8 text-center group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-base font-bold text-[var(--text-main)]">{title}</span>
        {isPro && <span className="text-xs opacity-80">🔒</span>}
      </div>
      <div className="flex items-center gap-3">
        {value && <span className={`text-sm font-black ${value === 'PRO' ? 'bg-[#9D50FF]/10 text-[#9D50FF] px-3 py-1.5 rounded-xl text-[10px] tracking-widest' : 'text-[var(--text-muted)]'}`}>{value}</span>}
        <ChevronRight size={20} className="text-gray-400 group-hover:text-[#FFCE45] transition-colors stroke-[2.5]"/>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} />
      <main className="px-6 space-y-8 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)]"><Settings size={24} className="text-[var(--text-muted)] stroke-[2.5]" /></div>
            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Más</h2>
          </div>
          <button onClick={triggerLock} className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FFCE45] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors shadow-sm active:scale-95 hover:-translate-y-0.5">
            <LockKeyhole size={14} /> Bloquear
          </button>
        </div>

        <div className={`rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-xs shadow-sm border ${CONFIG.IS_LOCAL_MODE ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
          {CONFIG.IS_LOCAL_MODE ? <><CloudOff size={16} /> Modo Local (Sin Conexión)</> : <><Cloud size={16} /> Conectado a Render</>}
        </div>

        <Card className="flex flex-col items-center text-center pt-10 pb-8 border-0 relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('configurar_perfil')}>
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FFF0CC] to-[var(--bg-card)] dark:from-[#3a2f1b] group-hover:h-32 transition-all duration-500"></div>
          <div className="w-28 h-28 bg-[#221F26] rounded-[36px] flex items-center justify-center text-white mb-5 shadow-xl shadow-[#221F26]/20 relative z-10 border-[6px] border-[var(--bg-card)] transform group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
            {userProfile?.profilePic ? <img src={userProfile.profilePic} alt="Perfil" className="w-full h-full object-cover" /> : <User size={44} strokeWidth={2.5}/>}
          </div>
          <h3 className="text-3xl font-black text-[var(--text-main)] mb-1.5 relative z-10 tracking-tight">{userProfile?.name}</h3>
          
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest bg-[var(--input-bg)] px-4 py-1.5 rounded-xl border border-[var(--border-color)]">ID: 1802947883</span>
            {userProfile?.authProvider === 'google' && <span className="text-[10px] text-[#4A5568] bg-gray-100 dark:bg-gray-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3 h-3"/> Google</span>}
          </div>

          <Button variant="secondary" className="w-[85%] py-4 text-base shadow-none">Configurar Perfil</Button>
        </Card>

        <div>
           <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest mb-4 px-2">Ajustes Generales</h3>
           <Card className="!p-3 border-0">
             <ListItem icon="💰" title="Moneda Principal" value={userProfile?.mainCurrency || 'ARS'} onClick={() => onNavigate('configurar_perfil')}/>
             <ListItem icon="🎯" title="Presupuestos y Metas" onClick={() => onNavigate('presupuestos')}/>
             <ListItem icon="⚙️" title="Gestionar Categorías" onClick={() => onNavigate('categorias')}/>
             <ListItem icon="🏦" title="Conexión Bancaria" onClick={() => onNavigate('conexion_bancaria')}/>
             <ListItem icon="💵" title="Cotizaciones" onClick={() => onNavigate('cotizaciones')}/>
             <ListItem icon="📊" title="Exportar a Excel" isPro value="PRO" onClick={() => onNavigate('exportar')}/>
             <ListItem icon="👫" title="Modo Pareja" isPro value="PRO" onClick={() => onNavigate('modo_pareja')} isLast/>
           </Card>
        </div>

        <div onClick={() => onNavigate('pro')} className="bg-gradient-to-br from-[#2D1B36] to-[#1A0F20] rounded-[40px] p-8 shadow-2xl shadow-indigo-900/30 text-white relative overflow-hidden group hover:shadow-indigo-900/40 transition-shadow cursor-pointer hover:-translate-y-1">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[100px] opacity-30 group-hover:opacity-60 transition-opacity duration-700"></div>
          <div className="text-center relative z-10">
            <div className="text-5xl mb-3 animate-bounce" style={{animationDuration: '3s'}}>⭐</div>
            <h3 className="text-3xl font-black mb-1 tracking-tight">Manguito PRO</h3>
            <div className="bg-white/10 rounded-2xl p-5 mb-6 mt-4 text-left border border-white/20 backdrop-blur-sm max-w-[260px] mx-auto shadow-inner">
               <ul className="space-y-3 text-[13px] font-bold text-[#D6B5FF]">
                 <li className="flex items-center gap-2"><span className="text-lg">🤖</span> IA Extendida (20/día)</li>
                 <li className="flex items-center gap-2"><span className="text-lg">📊</span> Exportar a Excel y PDF</li>
                 <li className="flex items-center gap-2"><span className="text-lg">👫</span> Modo Pareja (Compartido)</li>
                 <li className="flex items-center gap-2"><span className="text-lg">🏦</span> Conexión Bancaria Auto</li>
               </ul>
            </div>
            <div className="bg-white/10 inline-block px-5 py-2.5 rounded-2xl mb-6 border border-white/20 backdrop-blur-md">
              <span className="text-3xl font-black">$6.999</span>
              <span className="text-xs font-medium ml-1 text-[#D6B5FF]">ARS / mes</span>
            </div>
            <Button variant="pro" className="py-4.5 text-base font-black shadow-[0_10px_30px_-10px_rgba(157,80,255,0.6)] flex items-center justify-center gap-3 group-hover:scale-[1.02] transition-transform">
              Quiero ser PRO 🚀
              <div className="bg-white/20 p-1.5 rounded-lg flex items-center shadow-inner"><MercadoPagoLogo className="w-4 h-4"/></div>
            </Button>
          </div>
        </div>
      </main>
      <BottomNav activeTab="more" onNavigate={onNavigate} />
    </div>
  );
};


const ProScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#110f13] pb-32 animate-in slide-in-from-bottom-full duration-500 z-50 relative overflow-hidden">
      <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[140px] opacity-30 animate-pulse"></div>
      <div className="absolute -right-20 top-60 w-[400px] h-[400px] bg-[#009EE3] rounded-full mix-blend-screen filter blur-[140px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <header className="px-6 pt-10 pb-4 flex items-center justify-between bg-transparent sticky top-0 z-40 relative">
        <button onClick={() => onNavigate('home')} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 border border-white/10 shadow-sm">
          <span className="text-xl font-bold">✕</span>
        </button>
      </header>

      <main className="px-6 mt-2 relative z-10">
        <div className="text-center mb-10">
          <div className="text-[80px] mb-4 drop-shadow-[0_0_30px_rgba(255,206,69,0.5)]">👑</div>
          <h2 className="text-[44px] font-black text-white mb-2 tracking-tighter leading-none">Manguito <span className="text-[#D6B5FF] bg-clip-text text-transparent bg-gradient-to-r from-[#9D50FF] to-[#D6B5FF]">PRO</span></h2>
          <p className="text-gray-400 font-bold tracking-wide">Llevá tus finanzas al siguiente nivel.</p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-[#D36F11]/20 p-3.5 rounded-[20px] border border-[#D36F11]/30">🤖</div>
            <div>
              <h4 className="text-white font-black text-lg tracking-tight">Mango IA Extendida</h4>
              <p className="text-gray-400 text-sm font-medium leading-snug mt-0.5">Hasta 20 consultas por día (límite de cuota IA).</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-[#639639]/20 p-3.5 rounded-[20px] border border-[#639639]/30">📊</div>
            <div>
              <h4 className="text-white font-black text-lg tracking-tight">Exportá todo</h4>
              <p className="text-gray-400 text-sm font-medium leading-snug mt-0.5">Descargá tus reportes en PDF y Excel para el contador.</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-[#009EE3]/20 p-3.5 rounded-[20px] border border-[#009EE3]/30">🏦</div>
            <div>
              <h4 className="text-white font-black text-lg tracking-tight">Sincronización Bancaria</h4>
              <p className="text-gray-400 text-sm font-medium leading-snug mt-0.5">Conectá con Mercado Pago y Ualá directamente.</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden border border-white/20">
          <p className="text-gray-300 font-black uppercase tracking-widest text-xs mb-2">Inversión mensual</p>
          <div className="flex justify-center items-end gap-1 mb-8">
            <span className="text-[52px] font-black text-white leading-none">$6.999</span>
            <span className="text-lg font-bold text-gray-400 mb-1.5">ARS</span>
          </div>

          <Button onClick={() => window.open('AQUI_VA_TU_LINK_DE_MERCADO_PAGO', '_blank')} className="!bg-[#009EE3] hover:!bg-[#0089C5] !text-white flex items-center justify-center gap-4 py-5 text-lg shadow-[0_12px_30px_-10px_rgba(0,158,227,0.7)] border-none">
            <MercadoPagoLogo className="w-8 h-8 bg-white/20 p-1.5 rounded-xl shadow-inner" />
            Pagar suscripción
          </Button>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-5">Podés cancelar en cualquier momento</p>
        </div>
      </main>
    </div>
  );
};

const ModoParejaScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Modo Pareja" />
      <main className="px-6 mt-4">
        <div className="text-center pt-4 pb-8">
          <div className="flex justify-center items-center mb-6">
            <div className="w-20 h-20 bg-[#221F26] rounded-full border-4 border-[var(--bg-card)] shadow-lg flex items-center justify-center text-white z-10"><User size={32} /></div>
            <div className="w-12 h-1 bg-[var(--border-color)] -mx-2 z-0"></div>
            <div className="w-20 h-20 bg-[var(--input-bg)] rounded-full border-4 border-[var(--bg-card)] shadow-lg flex items-center justify-center text-[var(--text-muted)] z-10 border-dashed"><Plus size={32} /></div>
          </div>
          <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-3">Finanzas de a dos</h2>
          <p className="text-[var(--text-muted)] font-medium leading-relaxed px-4">Lleven los gastos de la casa juntos. Vas a poder ver quién pagó qué sin tener que usar un Excel.</p>
        </div>

        <div className="relative mb-8">
          <Card className="opacity-40 blur-[3px] pointer-events-none select-none border-0">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-[#8B7C72] uppercase tracking-widest text-[10px]">🏠 Gastos del Hogar</p>
              <div className="flex -space-x-3"><div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div><div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div></div>
            </div>
            <p className="text-4xl font-black text-[#221F26] mb-6">$450.000</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-300"></div><span className="text-sm font-bold text-[#221F26]">Vos pagaste</span></div><span className="text-sm font-black text-[#221F26]">$250.000</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-400"></div><span className="text-sm font-bold text-[#221F26]">Tu pareja pagó</span></div><span className="text-sm font-black text-[#221F26]">$200.000</span></div>
            </div>
          </Card>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
            <div className="bg-[var(--bg-card)] p-3 rounded-2xl shadow-xl shadow-[#9D50FF]/20 text-[#9D50FF] mb-3"><LockKeyhole size={28} /></div>
            <Button variant="pro" onClick={() => onNavigate('pro')} className="shadow-[0_8px_24px_rgba(157,80,255,0.4)] hover:-translate-y-1">Desbloquear Modo Pareja</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const ExportarScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Exportar Reportes" />
      <main className="px-6 mt-4 relative">
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 bg-green-50/50 dark:bg-green-500/10 rounded-[24px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">📊</div>
          <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-2">Tus datos en Excel</h2>
          <p className="text-[var(--text-muted)] text-sm font-medium px-4">Descargá tus movimientos listos para el contador o tu propio análisis profundo.</p>
        </div>
        <div className="relative">
          <Card className="opacity-30 blur-[2px] pointer-events-none select-none border-0">
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-black text-[#8B7C72] mb-3">Seleccionar Período</label>
                <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-[#221F26] font-bold flex justify-between items-center">Este mes (Marzo) <ChevronRight size={18} className="text-gray-400 rotate-90" /></div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-black text-[#8B7C72] mb-3">Formato de Descarga</label>
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#E6F4EA] text-[#38A169] border-2 border-[#38A169] rounded-[20px] py-4 text-center font-black flex flex-col items-center gap-2"><FileText size={24} /> Excel (.xlsx)</div>
                  <div className="flex-1 bg-gray-50 text-gray-400 border-2 border-transparent rounded-[20px] py-4 text-center font-bold flex flex-col items-center gap-2"><Download size={24} /> PDF (.pdf)</div>
                </div>
              </div>
              <div className="mt-8 bg-gray-200 text-gray-400 py-5 rounded-2xl font-black text-center text-lg">Generar Reporte</div>
            </div>
          </Card>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
            <div className="bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] p-4 rounded-[20px] shadow-xl shadow-purple-500/30 text-white mb-5"><LockKeyhole size={36} strokeWidth={2.5} /></div>
            <h3 className="font-black text-[var(--text-main)] text-xl mb-2">Función exclusiva PRO</h3>
            <p className="text-sm text-[var(--text-muted)] font-medium mb-8 px-2">Mantené tus finanzas documentadas en todo momento.</p>
            <Button variant="pro" onClick={() => onNavigate('pro')} className="shadow-[0_8px_24px_rgba(157,80,255,0.4)] py-5 hover:-translate-y-1">Desbloquear por $6.999 /mes</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const ConfigurarPerfilScreen = ({ onNavigate, userProfile, setUserProfile, triggerToast, resetData, theme, toggleTheme }) => {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    dob: userProfile?.dob || '',
    password: '',
    hideBalances: userProfile?.hideBalances || false,
    biometricAuth: userProfile?.biometricAuth || false,
    mainCurrency: userProfile?.mainCurrency || 'ARS'
  });

  const hasPassword = userProfile?.password && userProfile.password.length > 0;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserProfile({ ...userProfile, profilePic: imageUrl });
      triggerToast("Foto de perfil actualizada");
    }
  };

  const handleSave = () => {
    const updatedProfile = { ...userProfile, ...formData };
    if (!formData.password && hasPassword) updatedProfile.password = userProfile.password;
    setUserProfile(updatedProfile);
    triggerToast("Perfil guardado con éxito");
    onNavigate('more');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Mi Perfil" />
      <main className="px-6 mt-6 space-y-6">
        <div className="flex flex-col items-center">
          <input type="file" id="profilePicInput" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <label htmlFor="profilePicInput" className="w-32 h-32 bg-[#221F26] rounded-[40px] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#221F26]/20 border-[6px] border-[var(--bg-card)] cursor-pointer relative group overflow-hidden transition-all hover:scale-105 active:scale-95 flex-shrink-0">
            {userProfile?.profilePic || userProfile?.picture ? <img src={userProfile.profilePic || userProfile.picture} alt="Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User size={50} strokeWidth={2.5} />}
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-2xl mb-1">📷</span><span className="text-[10px] font-bold tracking-wider text-white">CAMBIAR</span></div>
          </label>
        </div>

        <Card className="!p-6 border-0">
          <h3 className="font-black text-[var(--text-main)] text-base mb-5 uppercase tracking-widest text-[11px]">Apariencia</h3>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFCE45]/20 text-[#FDBC3C] rounded-xl flex items-center justify-center">
                {theme === 'dark' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
              </div>
              <div><p className="font-bold text-[var(--text-main)] text-sm">Modo Oscuro</p></div>
            </div>
            <button onClick={toggleTheme} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${theme === 'dark' ? 'bg-[#FFCE45]' : 'bg-[var(--border-color)]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </Card>

        <Card className="!p-6 border-0">
          <h3 className="font-black text-[var(--text-main)] text-base mb-5 uppercase tracking-widest text-[11px]">Datos Personales</h3>
          <div className="mb-5">
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">¿Cómo te llamás?</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold outline-none focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] theme-transition shadow-sm" />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Fecha de nacimiento</label>
            <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold outline-none focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] theme-transition cursor-text shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Moneda Principal</label>
            <div className="relative">
              <select value={formData.mainCurrency} onChange={(e) => setFormData({ ...formData, mainCurrency: e.target.value })} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[18px] py-4 px-5 text-[var(--text-main)] font-bold outline-none appearance-none cursor-pointer focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] theme-transition shadow-sm">
                <option value="ARS">🇦🇷 Pesos Argentinos (ARS)</option><option value="USD">🇺🇸 Dólares (USD)</option><option value="EUR">🇪🇺 Euros (EUR)</option><option value="GBP">🇬🇧 Libras (GBP)</option><option value="BRL">🇧🇷 Reales (BRL)</option>
              </select>
              <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-[var(--text-muted)] pointer-events-none stroke-[3]" />
            </div>
          </div>
        </Card>

        <Card className="!p-6 border-0">
          <h3 className="font-black text-[var(--text-main)] text-base mb-5 uppercase tracking-widest text-[11px]">Privacidad & Seguridad</h3>
          <div className="mb-6">
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Contraseña de Acceso</label>
            <div className="flex items-center gap-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-2 px-4 focus-within:border-[#FFCE45] focus-within:ring-4 focus-within:ring-[#FFCE45]/20 theme-transition shadow-sm">
              <KeyRound size={20} className="text-[var(--text-muted)]" />
              <input type="password" placeholder={hasPassword ? "••••••••" : "Crear contraseña"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-transparent border-none text-[var(--text-main)] font-bold outline-none py-2 placeholder:text-[var(--text-muted)] placeholder:font-medium" />
            </div>
            {userProfile?.authProvider === 'google' && !hasPassword && (
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-2 ml-1">Usaste Google. Agregá una para entrar con mail.</p>
            )}
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)] mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFF5E5] dark:bg-orange-500/10 text-[#FDBC3C] rounded-xl flex items-center justify-center"><EyeOff size={20} strokeWidth={2.5} /></div>
              <div><p className="font-bold text-[var(--text-main)] text-sm">Modo Privacidad</p><p className="text-[11px] text-[var(--text-muted)] font-medium">Ocultar saldos al abrir</p></div>
            </div>
            <button onClick={() => setFormData({ ...formData, hideBalances: !formData.hideBalances })} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${formData.hideBalances ? 'bg-[#639639]' : 'bg-[var(--border-color)]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${formData.hideBalances ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F3E8FF] dark:bg-purple-500/10 text-[#9D50FF] rounded-xl flex items-center justify-center"><Smartphone size={20} strokeWidth={2.5} /></div>
              <div><p className="font-bold text-[var(--text-main)] text-sm">Biometría</p><p className="text-[11px] text-[var(--text-muted)] font-medium">Requerir huella/Face ID</p></div>
            </div>
            <button onClick={() => setFormData({ ...formData, biometricAuth: !formData.biometricAuth })} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${formData.biometricAuth ? 'bg-[#9D50FF]' : 'bg-[var(--border-color)]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${formData.biometricAuth ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </Card>

        <Button onClick={handleSave} className="py-5 text-lg mt-8 shadow-md hover:-translate-y-1">Guardar Cambios</Button>

        <div className="bg-[#FFEBEB]/50 dark:bg-[#3B1212]/50 border-2 border-[#FFEBEB] dark:border-red-900/50 rounded-[36px] p-8 mt-8">
          <h3 className="font-black text-[#E53E3E] mb-3 flex items-center gap-3 text-xl tracking-tight"><span className="text-2xl">⚠️</span> Zona de Peligro</h3>
          <p className="text-sm text-[#E53E3E] opacity-80 mb-8 font-semibold leading-relaxed">Al borrar tu cuenta perderás todos tus movimientos permanentemente.</p>
          <Button variant="danger" onClick={resetData} className="py-4.5 text-base shadow-none">Eliminar cuenta definitivamente</Button>
        </div>
      </main>
    </div>
  );
};

const CotizacionesScreen = ({ onNavigate }) => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares');
        const data = await response.json();
        const iconMap = { blue: '💸', oficial: '🏛️', bolsa: '📈', contadoconliqui: '📊', tarjeta: '💳', mayorista: '🏭', cripto: '🪙' };
        const nameMap = { blue: 'BLUE', oficial: 'OFICIAL', bolsa: 'MEP / BOLSA', contadoconliqui: 'CCL', tarjeta: 'TARJETA', mayorista: 'MAYORISTA', cripto: 'CRIPTO' };

        const formattedData = data.map(d => ({
          name: nameMap[d.casa] || d.nombre.toUpperCase(),
          price: d.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
          compra: d.compra.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
          icon: iconMap[d.casa] || '💵'
        }));
        setCotizaciones(formattedData);
      } catch (error) {
        setCotizaciones([{ name: 'SIN CONEXIÓN', price: '0', compra: '0', icon: '⚠️' }]);
      } finally { setLoading(false); }
    };
    fetchCotizaciones();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Cotización del dólar" />
      <main className="px-6 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-24 animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-[#FFCE45] border-t-transparent rounded-full animate-spin mb-4 shadow-sm"></div>
            <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">Actualizando valores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
            {cotizaciones.map((cot, idx) => (
              <Card key={idx} className="flex flex-col items-center text-center !p-6 !rounded-[28px] hover:scale-105 transition-transform border-0">
                <div className="flex items-center gap-1.5 mb-2"><span className="text-base">{cot.icon}</span><span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{cot.name}</span></div>
                <h3 className="text-3xl font-black text-[#639639] mb-1">${cot.price}</h3>
                <p className="text-xs font-bold text-[var(--text-muted)]">Compra: ${cot.compra}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const ConexionBancariaScreen = ({ onNavigate }) => {
  const [entidad, setEntidad] = useState('mercadopago');
  const infoEntidades = {
    mercadopago: { icon: '💙', name: 'MercadoPago', steps: ['Abrí la app de Mercado Pago', 'Tocá "Consultar todo"', 'Generar Resumen de Cuenta', 'Descargá el archivo CSV'] },
    uala: { icon: '💜', name: 'Ualá', steps: ['Abrí la app de Ualá', 'Ver cuenta > Resúmenes', 'Descargá el archivo CSV'] },
    naranja: { icon: '🧡', name: 'Naranja X', steps: ['Abrí Naranja X', 'Resumen > Descargar', 'Descargá el archivo CSV'] }
  };
  const currentInfo = infoEntidades[entidad];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Importar Movimientos" />
      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[#E6F4EA]/50 dark:bg-green-900/10 border border-[#639639]/20 rounded-[24px] p-5 flex gap-4 items-start shadow-sm">
          <span className="text-[#009EE3] text-2xl mt-0.5 drop-shadow-sm">🛡️</span>
          <p className="text-sm text-[var(--text-main)] font-medium leading-relaxed"><strong className="text-[#639639] font-black">100% Seguro:</strong> Manguito nunca te pide contraseñas.</p>
        </div>
        <Card className="!p-6 border-0">
          <h3 className="font-black text-[var(--text-main)] text-base mb-4">1. Seleccioná tu entidad</h3>
          <div className="relative mb-6">
            <select value={entidad} onChange={(e) => setEntidad(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[18px] py-4 px-5 text-[var(--text-main)] font-bold outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-[#FFCE45]/20 focus:border-[#FFCE45] transition-all shadow-sm">
              <option value="mercadopago">💙 MercadoPago</option><option value="uala">💜 Ualá</option><option value="naranja">🧡 Naranja X</option>
            </select>
            <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <div className="bg-[var(--bg-base)] border border-[var(--border-color)] rounded-[20px] p-5 mb-8">
            <h4 className="font-black text-[var(--text-main)] text-sm mb-4 flex items-center gap-2"><span>{currentInfo.icon}</span> Cómo exportar:</h4>
            <ul className="space-y-3 mb-2">
              {currentInfo.steps.map((step, idx) => (
                <li key={idx} className="text-sm text-[var(--text-muted)] font-medium flex gap-3 items-start"><span className="text-[var(--text-main)] font-black bg-[var(--bg-card)] w-5 h-5 flex items-center justify-center rounded-md border border-[var(--border-color)] flex-shrink-0 mt-0.5 shadow-sm">{idx + 1}</span> <span className="pt-0.5">{step}</span></li>
              ))}
            </ul>
          </div>
          <h3 className="font-black text-[var(--text-main)] text-base mb-4">2. Subí tu archivo</h3>
          <Button className="!bg-[#E67E22] hover:!bg-[#D36F11] !text-white shadow-[0_8px_20px_rgba(230,126,34,0.25)] py-4.5 gap-3 hover:-translate-y-1"><span className="text-xl">📄</span> Subir archivo CSV</Button>
        </Card>
      </main>
    </div>
  );
};

const NewMovementScreen = ({ onNavigate, onSave, userProfile, categories }) => {
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
    if (!amount || !category) return;
    onSave({
      type,
      amount: Number(amount),
      category,
      description,
      currency,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32 animate-in slide-in-from-bottom-full duration-500">
      <Header onNavigate={() => onNavigate('home')} backButton={true} title="Nuevo Movimiento" />
      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex border border-[var(--border-color)]">
           {['gasto', 'ingreso'].map(t => (
             <button key={t} onClick={() => setType(t)} className={`flex-1 py-3.5 rounded-[18px] text-sm font-black transition-all ${type === t ? (t === 'gasto' ? 'bg-[#E53E3E] text-white shadow-lg' : 'bg-[#639639] text-white shadow-lg') : 'text-[var(--text-muted)]'}`}>
               {t === 'gasto' ? 'Gasto' : 'Ingreso'}
             </button>
           ))}
        </div>
        
        <Card className="!p-8">
          <div className="text-center mb-8">
            <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] mb-2">Monto del {type}</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black opacity-40">{currency}</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus className="w-full text-5xl font-black text-center bg-transparent outline-none placeholder:opacity-20" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 ml-1">Categoría</label>
              <div className="grid grid-cols-4 gap-3">
                {categories[type].map(cat => (
                  <button key={cat.label} onClick={() => setCategory(cat.label)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${category === cat.label ? 'border-[#FFCE45] bg-[#FFCE45]/5' : 'border-transparent bg-[var(--input-bg)]'}`}>
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-[10px] font-black truncate w-full text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input placeholder="Descripción (opcional)" icon={FileText} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </Card>

        <Button onClick={handleSave} className="py-5 text-lg shadow-xl" style={{ backgroundColor: type === 'gasto' ? '#E53E3E' : '#639639', color: 'white' }}>
          Guardar {type === 'gasto' ? 'Gasto' : 'Ingreso'}
        </Button>
      </main>
    </div>
  );
};

const PresupuestosMetasScreen = ({ onNavigate, budgets, setBudgets, goals, setGoals, triggerToast }) => (
  <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-500">
    <Header onNavigate={() => onNavigate('more')} backButton={true} title="Metas y Presupuestos" />
    <main className="px-6 mt-20 text-center">
      <div className="text-6xl mb-6">🎯</div>
      <h3 className="font-black text-3xl text-[var(--text-main)] mb-3 tracking-tight">Metas de Ahorro</h3>
      <p className="text-[var(--text-muted)] font-medium leading-relaxed max-w-xs mx-auto mb-10">Estamos puliendo esta sección para vos. Pronto vas a poder gestionar tus ahorros aquí.</p>
      <Button onClick={() => onNavigate('home')}>Volver al Dashboard</Button>
    </main>
  </div>
);

const CategoriasScreen = ({ onNavigate, categories, setCategories, triggerToast }) => (
  <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-500">
    <Header onNavigate={() => onNavigate('more')} backButton={true} title="Categorías" />
    <main className="px-6 mt-20 text-center">
      <div className="text-5xl mb-6">🏷️</div>
      <h3 className="font-black text-3xl text-[var(--text-main)] mb-3 tracking-tight">Administrar Categorías</h3>
      <p className="text-[var(--text-muted)] font-medium leading-relaxed max-w-xs mx-auto mb-10">Personalizá cómo agrupamos tus gastos. Esta función llegará en la próxima actualización.</p>
      <Button onClick={() => onNavigate('more')}>Volver</Button>
    </main>
  </div>
);

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isLocked, setIsLocked] = useState(false);
  const [toast, setToast] = useState(null);

  // Persistencia de datos local rápida y segura
  const [theme, setTheme] = useLocalState('manguito_theme', 'light');
  const [movements, setMovements] = useLocalState('manguito_movements', []);
  const [categories, setCategories] = useLocalState('manguito_categories', {
    gasto: [{ icon: '🍔', label: 'Comida' }, { icon: '🚌', label: 'Transporte' }, { icon: '🛒', label: 'Super' }, { icon: '🎮', label: 'Ocio' }, { icon: '🧾', label: 'Servicios' }, { icon: '🏥', label: 'Salud' }, { icon: '🎓', label: 'Educación' }, { icon: '👕', label: 'Ropa' }],
    ingreso: [{ icon: '💼', label: 'Sueldo' }, { icon: '💻', label: 'Freelance' }, { icon: '📈', label: 'Inversión' }, { icon: '🛍️', label: 'Venta' }, { icon: '🎁', label: 'Regalo' }, { icon: '🏠', label: 'Alquiler' }]
  });
  const [budgets, setBudgets] = useLocalState('manguito_budgets', []);
  const [goals, setGoals] = useLocalState('manguito_goals', []);
  const [userProfile, setUserProfile] = useLocalState('manguito_profile', null);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveMovement = async (movement) => {
    try {
      if (!CONFIG.IS_LOCAL_MODE) {
        // Guardamos en la base de datos real (Nube)
        await apiFetch('/movimientos', {
          method: 'POST',
          body: JSON.stringify({
            type: movement.type,
            amount: Number(movement.amount),
            category: movement.category,
            description: movement.description || "",
            currency: movement.currency
          })
        });

        // Volvemos a traer los movimientos reales del servidor
        const res = await apiFetch('/movimientos');
        if (res.status === 'success') {
          setMovements(res.data);
        }
      } else {
        // Modo local (Offline/Pruebas)
        setMovements([{ ...movement, id: Date.now() }, ...movements]);
      }

      // Actualizamos presupuesto/meta localmente para reflejo instantáneo
      if (movement.type === 'gasto') setBudgets(budgets.map(b => b.name === movement.category && b.currency === movement.currency ? { ...b, spent: b.spent + Number(movement.amount) } : b));
      else setGoals(goals.map(g => g.name === movement.category && g.currency === movement.currency ? { ...g, saved: g.saved + Number(movement.amount) } : g));

      showToast(CONFIG.IS_LOCAL_MODE ? '¡Movimiento guardado!' : '¡Guardado en la nube! ☁️');
      setCurrentScreen('home');

    } catch (error) {
      showToast('Error guardando movimiento: ' + error.message, 'error');
      // Fallback local si el servidor falla
      setMovements([{ ...movement, id: Date.now() }, ...movements]);
      setCurrentScreen('home');
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Seguro que querés borrar todos tus datos? Esta acción no se puede deshacer.')) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  // Traer los datos reales al loguearse (si estamos conectados a Render)
  useEffect(() => {
    if (userProfile?.token && !CONFIG.IS_LOCAL_MODE) {
      apiFetch('/movimientos')
        .then(res => { if (res.status === 'success') setMovements(res.data); })
        .catch(err => console.error("No se pudieron cargar movimientos", err));
    }
  }, [userProfile?.token]);

  useEffect(() => { window.scrollTo(0, 0); }, [currentScreen]);

  if (isLocked) return <div className={theme === 'dark' ? 'dark' : ''}><ThemeStyles /><BiometricLockScreen onUnlock={() => setIsLocked(false)} /></div>;

  const navigateWithSecurity = (screen) => {
    if (screen === 'home' && userProfile?.biometricAuth && currentScreen === 'login') setIsLocked(true);
    setCurrentScreen(screen);
  };

  // Se asegura que "currentScreen" siempre se evalúe de manera segura
  const screenName = typeof currentScreen === 'object' ? currentScreen.name : currentScreen;

  const currentView = () => {
    if (screenName === 'login') return (
      <LoginScreen
        onNavigate={(s, data) => {
          if (s === 'register') setCurrentScreen('register');
          else if (s === 'register_google') setCurrentScreen({ name: 'register_google', initialData: data });
          else navigateWithSecurity('home');
        }}
        triggerToast={showToast}
        isRegistered={!!userProfile}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
    );

    if (screenName === 'register') return <OnboardingFlow mode="manual" onFinish={(data, initialSetup) => {
      setUserProfile({ ...data, hideBalances: false, biometricAuth: false });
      if (initialSetup.type === 'budget') setBudgets([{ id: Date.now(), name: initialSetup.name, amount: initialSetup.amount, spent: 0, currency: data.mainCurrency, icon: '🛒' }]);
      if (initialSetup.type === 'goal') setGoals([{ id: Date.now(), name: initialSetup.name, amount: initialSetup.amount, saved: 0, currency: data.mainCurrency, icon: '🚗' }]);
      navigateWithSecurity('home');
    }} onBack={() => setCurrentScreen('login')} />;

    if (screenName === 'register_google') return <OnboardingFlow mode="google" initialData={currentScreen.initialData || {}} onFinish={(data, initialSetup) => {
      setUserProfile({ ...data, hideBalances: false, biometricAuth: false });
      if (initialSetup.type === 'budget') setBudgets([{ id: Date.now(), name: initialSetup.name, amount: initialSetup.amount, spent: 0, currency: data.mainCurrency, icon: '🛒' }]);
      if (initialSetup.type === 'goal') setGoals([{ id: Date.now(), name: initialSetup.name, amount: initialSetup.amount, saved: 0, currency: data.mainCurrency, icon: '🚗' }]);
      navigateWithSecurity('home');
    }} onBack={() => setCurrentScreen('login')} />;

    if (screenName === 'home') return <DashboardScreen onNavigate={navigateWithSecurity} movements={movements} userProfile={userProfile} />;
    if (screenName === 'movements') return <MovementsScreen onNavigate={navigateWithSecurity} movements={movements} />;
    if (screenName === 'learn') return <LearnScreen onNavigate={navigateWithSecurity} />;
    if (screenName === 'more') return <MoreScreen onNavigate={navigateWithSecurity} userProfile={userProfile} triggerLock={() => setIsLocked(true)} />;
    if (screenName === 'new_movement') return <NewMovementScreen onNavigate={navigateWithSecurity} onSave={handleSaveMovement} userProfile={userProfile} categories={categories} />;
    if (screenName === 'pro') return <ProScreen onNavigate={navigateWithSecurity} />;
    if (screenName === 'modo_pareja') return <ModoParejaScreen onNavigate={navigateWithSecurity} />;
    if (screenName === 'exportar') return <ExportarScreen onNavigate={navigateWithSecurity} />;
    if (screenName === 'configurar_perfil') return <ConfigurarPerfilScreen onNavigate={navigateWithSecurity} userProfile={userProfile} setUserProfile={setUserProfile} triggerToast={showToast} resetData={handleResetData} theme={theme} toggleTheme={toggleTheme} />;
    if (screenName === 'cotizaciones') return <CotizacionesScreen onNavigate={navigateWithSecurity} />;
    if (screenName === 'conexion_bancaria') return <ConexionBancariaScreen onNavigate={navigateWithSecurity} />;
    if (screenName === 'presupuestos') return <PresupuestosMetasScreen onNavigate={navigateWithSecurity} budgets={budgets} setBudgets={setBudgets} goals={goals} setGoals={setGoals} triggerToast={showToast} />;
    if (screenName === 'categorias') return <CategoriasScreen onNavigate={navigateWithSecurity} categories={categories} setCategories={setCategories} triggerToast={showToast} />;

    // Fallback por defecto
    return <LoginScreen onNavigate={(s) => s === 'register' ? setCurrentScreen('register') : navigateWithSecurity('home')} triggerToast={showToast} isRegistered={!!userProfile} userProfile={userProfile} setUserProfile={setUserProfile} />;
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ThemeStyles />
      <div className="max-w-md mx-auto overflow-x-hidden shadow-2xl min-h-screen bg-[var(--bg-base)] font-sans selection:bg-[#FFCE45]/30 text-[var(--text-main)] relative theme-transition">
        <Toast message={toast?.msg} type={toast?.type} />
        {currentView()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}