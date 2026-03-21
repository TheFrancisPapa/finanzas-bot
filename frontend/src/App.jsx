import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, BarChart2, DollarSign, Plus, BookOpen, MoreHorizontal, RefreshCcw, 
  LogOut, Mail, Lock, User, ChevronRight, Settings, Send, Bell, ArrowUpRight, 
  ArrowDownRight, Eye, EyeOff, Smartphone, Fingerprint, LockKeyhole, Trash2, 
  Pencil, Handshake, Camera, Users, Target, FileText, Download, CheckCircle2, 
  Sparkles, TrendingUp, ShieldCheck, AlertCircle, Moon, Sun, KeyRound, CloudOff, Cloud
} from 'lucide-react';

// --- CONFIGURACIÓN DE ENTORNO ---
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000/api' : '/api',
  IS_LOCAL_MODE: false 
};

// --- HOOK NATIVO DE GOOGLE ---
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

// --- ESCUDO ANTIFALLOS ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFBF2] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-[#FFEBEB] rounded-3xl flex items-center justify-center text-[#E53E3E] mb-6 shadow-sm"><AlertCircle size={40} strokeWidth={2.5}/></div>
          <h2 className="text-3xl font-black text-[#221F26] mb-3 tracking-tight">¡Uy! Un tropezón.</h2>
          <p className="text-[#8B7C72] font-medium mb-8">Algo no cargó bien, pero tus datos están a salvo.</p>
          <button onClick={() => window.location.reload()} className="bg-[#FFCE45] text-[#221F26] px-8 py-4 rounded-2xl font-black shadow-md hover:scale-105 transition-all">Volver a intentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- PETICIONES A LA API ---
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
    window.localStorage.clear();
    window.location.href = "/";
    return null;
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la petición al backend');
  }
  return response.json();
};

const useLocalState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) { return initialValue; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)); } catch (error) {}
  }, [key, state]);
  return [state, setState];
};

// --- FORMATEO DE MONEDA EN TIEMPO REAL ---
const formatCurrencyInput = (value) => {
  if (!value) return '';
  let val = value.toString().replace(/[^0-9,]/g, '');
  const parts = val.split(',');
  if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.length > 1 ? intPart + ',' + parts[1].substring(0,2) : intPart;
};

const parseCurrencyInput = (formattedValue) => {
  if (!formattedValue) return 0;
  return parseFloat(formattedValue.toString().replace(/\./g, '').replace(',', '.'));
};

// --- ESTILOS COMPARTIDOS ---
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
    @keyframes pageFade { from { opacity: 0; transform: translateY(15px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .animate-page { animation: pageFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `}} />
);

// --- IA ---
const callGeminiText = async (prompt) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: `Sos Manguito, un asistente financiero experto y argentino.` }] }
  };
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) { return "Me quedé sin señal. ¡Intentá de nuevo en un ratito! 🔌"; }
};

// --- HELPERS ---
const EXCHANGE_RATES = { ARS: 1, USD: 1040, EUR: 1120, GBP: 1400, BRL: 205, PYG: 0.14, UYU: 26 };
const convertCurrency = (amount, fromCurr, toCurr) => (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];
const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€', GBP: '£', BRL: 'R$', PYG: '₲', UYU: '$U' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

// --- LOGOS ---
const InstagramLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FEE411"/><stop offset="10%" stopColor="#FEDB16"/><stop offset="25%" stopColor="#FEC125"/><stop offset="40%" stopColor="#FE983D"/><stop offset="55%" stopColor="#FE5F5E"/><stop offset="70%" stopColor="#E53688"/><stop offset="85%" stopColor="#CE239B"/><stop offset="100%" stopColor="#5258CF"/></linearGradient></defs><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const YouTubeLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#FF0000" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const MercadoPagoLogo = ({ className }) => {
  return <img src="https://img.icons8.com/color/512/mercado-pago.png" alt="Mercado Pago" className={`object-contain ${className}`} />;
};

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

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBD3A] shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-main)] border-2 border-[var(--border-color)] hover:border-[#FFCE45] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]',
    danger: 'bg-[#FFEBEB] text-[#E53E3E] hover:bg-[#FFD6D6] dark:bg-[#3B1212] dark:hover:bg-[#4A1717] hover:-translate-y-1 active:scale-[0.98]',
  };
  return <button className={`w-full py-3.5 px-6 rounded-2xl font-black transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className={`relative group ${className}`}>
    {Icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#FFCE45] transition-colors duration-300"><Icon size={20} strokeWidth={2.5} /></div>}
    <input className={`w-full bg-[var(--input-bg)] border-2 border-transparent rounded-[20px] py-4 ${Icon ? 'pl-14' : 'pl-6'} pr-6 text-[var(--text-main)] outline-none focus:border-[#FFCE45] focus:bg-[var(--bg-card)] focus:shadow-[0_0_0_4px_rgba(255,206,69,0.15)] theme-transition placeholder:text-[var(--text-muted)]`} {...props} />
  </div>
);

const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50 hover:-translate-y-1 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-all duration-300' : 'shadow-[var(--card-shadow)]'} ${className}`}>{children}</div>
);

const Toast = ({ message, type = 'success' }) => {
  if (!message) return null;
  return (
    <div className="fixed top-8 left-0 right-0 z-[100] flex justify-center animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-none">
      <div className={`${type === 'error' ? 'bg-[#E53E3E] text-white' : 'bg-[#221F26] text-white'} px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md bg-opacity-95 border border-white/10`}>
        {type === 'error' ? <AlertCircle size={20} strokeWidth={3} /> : <CheckCircle2 size={20} strokeWidth={3} className="text-[#99CF43]" />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};

const Header = ({ onNavigate, showGreeting = false, userName = "", profilePic = null, backButton = false, title = "Manguito" }) => {
  return (
    <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl border-b border-transparent transition-all" style={{ backgroundColor: 'var(--nav-bg)' }}>
      <div className="flex items-center gap-4">
        {backButton ? (
          <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full transition-all active:scale-90 shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] hover:-translate-x-1"><ChevronRight size={24} className="rotate-180" /></button>
        ) : (
          <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] cursor-pointer"><MangoLogo className="w-8 h-8" /></div>
        )}
        <div>
          {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)] mb-0.5">¡Hola, {userName}!</p>}
          <span className="text-xl font-black text-[var(--text-main)] tracking-tight">{title}</span>
        </div>
      </div>
      <button className="w-11 h-11 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[#FFCE45] transition-all shadow-sm border border-[var(--border-color)]"><Bell size={20} strokeWidth={2.5} /></button>
    </header>
  );
};

const BottomNav = ({ activeTab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'home' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><Home size={24} fill={activeTab === 'home' ? "currentColor" : "none"} fillOpacity={activeTab === 'home' ? 0.2 : 0} /><span className="text-[10px] font-bold">Inicio</span></button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'movements' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><DollarSign size={24} strokeWidth={activeTab === 'movements' ? 3 : 2} /><span className="text-[10px] font-bold">Historial</span></button>
    <div className="-mt-16 relative group">
      <div className={`absolute inset-0 bg-[#FFCE45] rounded-[24px] blur-xl opacity-40 transition-opacity duration-300 ${activeTab === 'new' ? 'opacity-100 animate-pulse' : ''}`}></div>
      <button onClick={() => onNavigate('new_movement')} className={`relative w-16 h-16 bg-[#FFCE45] rounded-[24px] shadow-lg shadow-[#FFCE45]/40 text-[#221F26] flex items-center justify-center active:scale-90 transition-all duration-300 border-[3px] border-[var(--bg-base)] ${activeTab === 'new' ? 'scale-95 ring-4 ring-[#FFCE45]/20 rotate-45' : 'hover:-translate-y-2 hover:shadow-xl'}`}><Plus size={32} strokeWidth={3} className={activeTab === 'new' ? 'rotate-45 transition-transform' : 'transition-transform'} /></button>
    </div>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'learn' ? 'text-[#FDBC3C] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><BookOpen size={24} fill={activeTab === 'learn' ? "currentColor" : "none"} fillOpacity={activeTab === 'learn' ? 0.2 : 0} /><span className="text-[10px] font-bold">Aprender</span></button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'more' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><MoreHorizontal size={24} strokeWidth={activeTab === 'more' ? 3 : 2} /><span className="text-[10px] font-bold">Más</span></button>
  </nav>
);

// ==========================================
// PANTALLAS (Reducidas y Unidas)
// ==========================================

const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoadingGoogle(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } });
        const userInfo = await res.json();
        
        const apiRes = await fetch(`${CONFIG.API_BASE_URL}/auth/google`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, name: userInfo.name, picture: userInfo.picture })
        });
        if (!apiRes.ok) throw new Error('Fallo al conectar');
        const apiData = await apiRes.json();

        if (apiData.user?.isNewUser) onNavigate('register_google', { email: apiData.user.email, name: apiData.user.name, picture: apiData.user.picture });
        else onNavigate('home');
      } catch (error) {
        if (isRegistered) onNavigate('home');
        else onNavigate('register_google', { email: 'usuario@gmail.com', name: 'Usuario' });
      } finally { setIsLoadingGoogle(false); }
    },
    onError: () => triggerToast('Cancelado', 'error'),
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#FFCE45] rounded-full filter blur-[100px] opacity-20"></div>
      <div className="mb-8 text-center relative z-10">
        <div className="w-32 h-32 bg-[var(--bg-card)] rounded-[40px] flex items-center justify-center mb-6 shadow-lg mx-auto border border-[var(--border-color)]"><MangoLogo className="w-20 h-20" /></div>
        <h1 className="text-5xl font-black text-[var(--text-main)] mb-2 tracking-tight">Manguito</h1>
        <p className="text-[var(--text-muted)] font-semibold text-sm tracking-wide">Tu copiloto financiero</p>
      </div>
      <div className="w-full max-w-md bg-[var(--bg-card)] backdrop-blur-2xl rounded-[40px] p-8 border border-[var(--border-color)] relative z-10 shadow-[var(--card-shadow)]">
        <h3 className="font-black text-2xl text-[var(--text-main)] mb-6 text-center">Acceder</h3>
        <Input placeholder="correo@ejemplo.com" icon={Mail} value={email} onChange={e=>setEmail(e.target.value)} className="mb-4" />
        <Input placeholder="Contraseña" type="password" icon={Lock} value={password} onChange={e=>setPassword(e.target.value)} className="mb-6" />
        <Button onClick={() => onNavigate('home')}>Entrar a mi cuenta</Button>
        <div className="relative my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)] rounded-full">o ingresar con</span></div></div>
        <button onClick={loginConGoogle} disabled={isLoadingGoogle} className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          {isLoadingGoogle ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />}
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

const DashboardScreen = ({ onNavigate, movements = [], userProfile }) => {
  const mainCurrency = userProfile?.mainCurrency || 'ARS';
  const totalIn = movements.filter(m => m.type === 'ingreso').reduce((a, m) => a + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const totalOut = movements.filter(m => m.type === 'gasto').reduce((a, m) => a + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const balance = totalIn - totalOut;

  return (
    <div className="pb-32">
      <Header onNavigate={onNavigate} showGreeting={true} userName={userProfile?.name?.split(' ')[0]} />
      <main className="px-6 space-y-6 mt-2">
        <div className="bg-[var(--bg-card)] rounded-[40px] p-8 text-center border border-[var(--border-color)] relative shadow-[var(--card-shadow)]">
          <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest mb-2">Balance Total</p>
          <h2 className={`text-[52px] font-black tracking-tighter ${balance < 0 ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>{formatMoney(balance, mainCurrency)}</h2>
          <div className="grid grid-cols-2 mt-6 pt-6 border-t border-[var(--border-color)]">
            <div><p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Ingresos</p><span className="text-xl font-black">{formatMoney(totalIn, mainCurrency)}</span></div>
            <div className="border-l border-[var(--border-color)]"><p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Gastos</p><span className="text-xl font-black">{formatMoney(totalOut, mainCurrency)}</span></div>
          </div>
        </div>

        <div onClick={() => onNavigate('learn')} className="bg-[#221F26] rounded-[32px] p-6 flex justify-between items-center text-white cursor-pointer shadow-lg">
          <div className="flex gap-4 items-center">
            <span className="text-3xl">🤖</span>
            <div><p className="font-black text-sm text-[#FFCE45]">¿Dudas financieras?</p><p className="text-xs font-bold text-gray-400">Hablá con Mango IA</p></div>
          </div>
          <ArrowUpRight className="text-[#FFCE45]" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4 px-2"><h3 className="font-black text-lg">Actividad reciente</h3><button onClick={()=>onNavigate('movements')} className="text-xs font-bold text-[#FFCE45]">Ver todo</button></div>
          {movements.slice(0,3).map((m, i) => (
             <Card key={i} noPadding className="p-4 flex justify-between items-center shadow-sm mb-3">
               <div className="flex items-center gap-4"><span className="text-2xl">{m.icon}</span><div><p className="font-bold text-sm">{m.category}</p><p className="text-[10px] text-[var(--text-muted)]">{m.description}</p></div></div>
               <span className={`font-black ${m.type==='gasto'?'text-[#E53E3E]':'text-[#639639]'}`}>{m.type==='gasto'?'-':'+'}{formatMoney(m.amount, m.currency)}</span>
             </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

const MovementsScreen = ({ onNavigate, movements = [], onEdit, onDelete }) => {
  const [filter, setFilter] = useState('todos');
  const filtered = movements.filter(m => filter === 'todos' || m.type === filter.slice(0, -1));

  return (
    <div className="pb-32">
      <Header onNavigate={() => onNavigate('home')} backButton={true} title="Movimientos" />
      <main className="px-6 space-y-6 mt-4">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex border border-[var(--border-color)]">
          {['gastos', 'ingresos', 'todos'].map(t=><button key={t} onClick={()=>setFilter(t)} className={`flex-1 py-3 rounded-[18px] text-sm font-bold transition-all ${filter===t?'bg-[#FFCE45] text-[#221F26]':'text-[var(--text-muted)]'}`}>{t.toUpperCase()}</button>)}
        </div>
        
        <div className="space-y-3 mt-8">
          {filtered.map((m,i)=>(
            <Card key={i} noPadding className="p-4 flex justify-between items-center shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <span className="text-2xl w-12 h-12 bg-[var(--input-bg)] flex justify-center items-center rounded-2xl">{m.icon}</span>
                <div><p className="font-bold text-[var(--text-main)] text-sm">{m.category}</p><p className="text-[11px] text-[var(--text-muted)]">{m.description}</p></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`font-black ${m.type==='gasto'?'text-[#E53E3E]':'text-[#639639]'}`}>{m.type==='gasto'?'-':'+'}{formatMoney(m.amount, m.currency)}</span>
                <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(m)} className="p-1 hover:text-blue-500"><Pencil size={14}/></button>
                  <button onClick={() => onDelete(m.id)} className="p-1 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

const NewMovementScreen = ({ onNavigate, onSave, categories, initialData }) => {
  const [type, setType] = useState(initialData?.type || 'gasto');
  const [amountStr, setAmountStr] = useState(initialData?.amount ? formatCurrencyInput(initialData.amount) : '');
  const [cat, setCat] = useState(initialData?.category || '');
  const [currency, setCurrency] = useState(initialData?.currency || 'ARS');
  const [desc, setDesc] = useState(initialData?.description || '');

  useEffect(() => {
    if (!initialData?.category && categories[type] && categories[type].length > 0) setCat(categories[type][0].label);
  }, [type, categories, initialData]);

  const handleGuardar = () => {
    const numericAmount = parseCurrencyInput(amountStr);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) return;
    onSave({
      id: initialData?.id, // ID para saber si es edición
      type, amount: numericAmount, category: cat, description: desc,
      icon: categories[type].find(c=>c.label===cat)?.icon || '💰', 
      currency, date: initialData?.date || new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header onNavigate={() => onNavigate('home')} backButton={true} title={initialData ? "Editar Registro" : "Nuevo Registro"} />
      <div className="p-6 space-y-6">
        {!initialData && (
          <div className="flex bg-[var(--bg-card)] p-1.5 rounded-[24px] border border-[var(--border-color)] shadow-sm">
            <button onClick={()=>setType('gasto')} className={`flex-1 py-3 rounded-[18px] font-black transition-all ${type==='gasto'?'bg-[#FFEBEB] text-[#E53E3E] shadow-sm':'text-[var(--text-muted)]'}`}>Gasto</button>
            <button onClick={()=>setType('ingreso')} className={`flex-1 py-3 rounded-[18px] font-black transition-all ${type==='ingreso'?'bg-[#E6F4EA] text-[#639639] shadow-sm':'text-[var(--text-muted)]'}`}>Ingreso</button>
          </div>
        )}
        
        <Card className="text-center py-8 shadow-md">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Monto</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-black ${type==='gasto'?'text-[#E53E3E]':'text-[#639639]'}`}>$</span>
            <input 
              type="text" inputMode="decimal" value={amountStr} onChange={(e)=>setAmountStr(formatCurrencyInput(e.target.value))} 
              placeholder="0,00" className={`bg-transparent text-6xl font-black text-center w-3/4 outline-none ${type==='gasto'?'text-[#E53E3E]':'text-[#639639]'}`} autoFocus
            />
          </div>
        </Card>
        
        <div>
          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest px-2 mb-3 block">Categoría</label>
          <div className="grid grid-cols-4 gap-2">
            {categories[type].map(c => (
              <button key={c.label} onClick={() => setCat(c.label)} className={`p-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${cat === c.label ? 'border-[#FFCE45] bg-[var(--bg-card)] shadow-md text-[var(--text-main)]' : 'border-transparent bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}>
                <span className="text-2xl">{c.icon}</span><span className="text-[9px] font-black uppercase truncate w-full text-center">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] p-4 flex gap-4 shadow-sm">
           <div className="flex-[0.8] border-r border-[var(--border-color)] pr-4">
             <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1 block">Moneda</label>
             <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-transparent font-bold text-[var(--text-main)] outline-none text-sm cursor-pointer">
               <option value="ARS">ARS 🇦🇷</option><option value="USD">USD 🇺🇸</option><option value="EUR">EUR 🇪🇺</option>
               <option value="BRL">BRL 🇧🇷</option><option value="PYG">PYG 🇵🇾</option><option value="UYU">UYU 🇺🇾</option>
             </select>
           </div>
           <div className="flex-1">
             <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1 block">Nota</label>
             <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Opcional" className="w-full bg-transparent font-bold text-[var(--text-main)] outline-none placeholder-[var(--text-muted)] text-sm" />
           </div>
        </div>
        <Button onClick={handleGuardar} disabled={!amountStr} className="py-5 shadow-xl text-lg mt-4">Guardar {type}</Button>
      </div>
    </div>
  );
};

const LearnScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('social');
  
  const allCreators = [
    { name: 'Joven Inversor', plat: 'youtube', link: 'https://www.youtube.com/@JovenInversor' },
    { name: 'Mujer Financiera', plat: 'ig', link: 'https://www.instagram.com/mujer_financiera' },
    { name: 'Moris Dieck', plat: 'youtube', link: 'https://www.youtube.com/@MorisDieck' },
    { name: 'César Dabián', plat: 'youtube', link: 'https://www.youtube.com/@CesarDabianFinanzas' },
    { name: 'Andrés Garza', plat: 'youtube', link: 'https://www.youtube.com/@andresgarzam' },
    { name: 'Negocios TV', plat: 'youtube', link: 'https://www.youtube.com/@NegociosTV' },
    { name: 'Ramiro Marra', plat: 'ig', link: 'https://www.instagram.com/ramiromarra' },
    { name: 'Gisela B. (Inversiones)', plat: 'ig', link: 'https://www.instagram.com/inversiones' }
  ];
  
  const todayIndex = new Date().getDate();
  const dailyCreators = [
    allCreators[(todayIndex) % allCreators.length],
    allCreators[(todayIndex + 1) % allCreators.length],
    allCreators[(todayIndex + 2) % allCreators.length],
    allCreators[(todayIndex + 3) % allCreators.length]
  ];

  return (
    <div className="pb-32">
      <Header title="Aprender" onNavigate={onNavigate} />
      <main className="px-6 mt-2">
        <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar">
          {[{ id: 'ia', label: 'IA 🤖' }, { id: 'tips', label: 'Tips 💡' }, { id: 'social', label: 'Comunidad 👥' }].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#FDBC3C] text-[#221F26] shadow-md' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]'}`}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'ia' && (
           <Card className="flex flex-col items-center text-center py-14 mt-4">
              <span className="text-6xl mb-4">🤖</span>
              <h3 className="font-black text-xl mb-2">Mango IA</h3>
              <p className="text-sm font-medium text-[var(--text-muted)]">Pronto podrás charlar con nuestra IA.</p>
           </Card>
        )}

        {activeTab === 'tips' && (
          <div className="space-y-4 mt-4">
             <Card className="!p-8 border-0 shadow-md">
               <span className="text-5xl block mb-4">🛡️</span>
               <h3 className="font-black text-[var(--text-main)] text-2xl mb-3">Fondo de emergencia</h3>
               <p className="text-[var(--text-muted)] font-medium leading-relaxed">Tené entre 3 y 6 meses de tus gastos fijos ahorrados. Te va a dar una tranquilidad financiera invaluable.</p>
             </Card>
          </div>
        )}

        {activeTab === 'social' && (
           <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-right-8 duration-500">
             <h3 className="font-black text-sm uppercase tracking-widest text-[var(--text-muted)] ml-2 mb-2">Comunidad y Expertos</h3>
             {dailyCreators.map((c, i) => (
               <a key={i} href={c.link} target="_blank" rel="noopener noreferrer" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-4 flex items-center justify-between shadow-sm hover:border-[#FFCE45] transition-all group block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-[var(--bg-base)] rounded-xl shadow-inner border border-[var(--border-color)]">
                      {c.plat === 'ig' ? <InstagramLogo className="w-7 h-7 drop-shadow-sm" /> : <YouTubeLogo className="w-7 h-7 drop-shadow-sm" />}
                    </div>
                    <div>
                       <span className="font-black text-[var(--text-main)] text-base tracking-tight block">{c.name}</span>
                       <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{c.plat === 'ig' ? 'Instagram' : 'YouTube'}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-[var(--text-muted)] group-hover:text-[#FFCE45] group-hover:translate-x-1 transition-all"/>
               </a>
             ))}
             <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-6">Expertos rotativos cada 24hs</p>
           </div>
        )}
      </main>
    </div>
  );
};

const MoreScreen = ({ onNavigate, userProfile }) => (
  <div className="pb-32">
    <Header title="Más" onNavigate={onNavigate} />
    <main className="px-6 space-y-6 mt-2">
      <Card onClick={()=>onNavigate('configurar_perfil')} className="text-center flex flex-col items-center shadow-sm border-[var(--border-color)] group bg-[var(--bg-card)]">
        <div className="w-20 h-20 bg-[#FFCE45] rounded-[28px] flex items-center justify-center text-4xl mb-4 group-hover:scale-105 transition-transform border-4 border-[var(--bg-card)] shadow-lg overflow-hidden">
          {userProfile?.profilePic ? <img src={userProfile.profilePic} className="w-full h-full object-cover"/> : '😎'}
        </div>
        <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">{userProfile?.name || 'Usuario'}</h3>
        <p className="text-xs text-[var(--text-muted)] font-bold tracking-wider mt-1">{userProfile?.email || 'usuario@mail.com'}</p>
      </Card>
      
      <Card className="!p-2 space-y-1 shadow-sm border border-[var(--border-color)] bg-[var(--bg-card)]">
        <button onClick={()=>onNavigate('configurar_perfil')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">⚙️</span> Perfil y Ajustes</span> <ChevronRight size={18} className="text-[var(--text-muted)]"/></button>
        <button onClick={()=>onNavigate('presupuestos')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">🎯</span> Presupuestos y Metas</span> <ChevronRight size={18} className="text-[var(--text-muted)]"/></button>
        <button onClick={()=>onNavigate('categorias')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">📂</span> Mis Categorías</span> <ChevronRight size={18} className="text-[var(--text-muted)]"/></button>
        <button onClick={()=>onNavigate('cotizaciones')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">💵</span> Cotización Dólar</span> <ChevronRight size={18} className="text-[var(--text-muted)]"/></button>
      </Card>
    </main>
  </div>
);

// --- Pantallas Secundarias (Borradas en esta vista compacta por simplicidad visual, funcionan en AppContent) ---
const ConfigurarPerfilScreen = ({ onNavigate, theme, toggleTheme }) => (
  <div className="pb-32"><Header onNavigate={()=>onNavigate('more')} backButton title="Mi Perfil"/><main className="px-6 mt-6"><Card><p>Acá configurás todo tu perfil. <button onClick={toggleTheme} className="bg-[#FFCE45] px-3 py-1 rounded-xl ml-2 font-bold text-xs">{theme==='dark'?'A Claro':'A Oscuro'}</button></p></Card></main></div>
);

// ==========================================
// 4. ORQUESTADOR PRINCIPAL
// ==========================================
function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [toast, setToast] = useState(null);
  
  const [theme, setTheme] = useLocalState('manguito_theme', 'light');
  const [movements, setMovements] = useLocalState('manguito_movements', [
    { id: 1, type: 'gasto', amount: 15500, category: 'Super', description: 'Coto semanal', currency: 'ARS', icon: '🛒', date: new Date().toISOString() }
  ]);
  const [categories, setCategories] = useLocalState('manguito_categories', {
    gasto: [{ icon: '🍔', label: 'Comida' }, { icon: '🚌', label: 'Transporte' }, { icon: '🛒', label: 'Super' }],
    ingreso: [{ icon: '💼', label: 'Sueldo' }, { icon: '📈', label: 'Inversión' }]
  });
  const [budgets, setBudgets] = useLocalState('manguito_budgets', []);
  const [goals, setGoals] = useLocalState('manguito_goals', []);
  const [userProfile, setUserProfile] = useLocalState('manguito_profile', {name: 'Manguito User', mainCurrency: 'ARS', email: 'hola@manguito.com'});

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSaveMovement = async (mov) => {
    const isEditing = !!mov.id;
    let finalMovements = [...movements];

    if (isEditing) {
      // Revertir prespuestos viejos
      const oldMov = movements.find(m => m.id === mov.id);
      if (oldMov && oldMov.type === 'gasto') setBudgets(prev => prev.map(b => b.name === oldMov.category ? {...b, spent: b.spent - Number(oldMov.amount)} : b));
      // Aplicar nuevo presupuesto
      if (mov.type === 'gasto') setBudgets(prev => prev.map(b => b.name === mov.category ? {...b, spent: b.spent + Number(mov.amount)} : b));
      
      finalMovements = movements.map(m => m.id === mov.id ? mov : m);
      showToast('Movimiento actualizado');
    } else {
      mov.id = Date.now();
      finalMovements = [mov, ...movements];
      if (mov.type === 'gasto') setBudgets(prev => prev.map(b => b.name === mov.category ? {...b, spent: b.spent + Number(mov.amount)} : b));
      showToast('¡Movimiento guardado!');
    }
    
    setMovements(finalMovements);
    setCurrentScreen('home');
  };

  const handleDeleteMovement = (id) => {
    if(!window.confirm("¿Seguro que querés borrar este registro?")) return;
    const movToDelete = movements.find(m => m.id === id);
    if(!movToDelete) return;
    
    setMovements(movements.filter(m => m.id !== id));
    
    // Devolver plata al presupuesto/meta
    if (movToDelete.type === 'gasto') setBudgets(prev => prev.map(b => b.name === movToDelete.category ? {...b, spent: b.spent - Number(movToDelete.amount)} : b));
    else setGoals(prev => prev.map(g => g.name === movToDelete.category ? {...g, saved: g.saved - Number(movToDelete.amount)} : g));
    
    showToast('Movimiento eliminado', 'error');
  };

  useEffect(() => { window.scrollTo(0, 0); }, [currentScreen]);

  const screenName = typeof currentScreen === 'object' ? currentScreen.name : currentScreen;

  const renderScreen = () => {
    switch (screenName) {
      case 'home': return <DashboardScreen onNavigate={setCurrentScreen} movements={movements} userProfile={userProfile} />;
      case 'movements': return <MovementsScreen onNavigate={setCurrentScreen} movements={movements} onEdit={(mov) => setCurrentScreen({name: 'new_movement', initialData: mov})} onDelete={handleDeleteMovement} />;
      case 'new_movement': return <NewMovementScreen onNavigate={setCurrentScreen} onSave={handleSaveMovement} categories={categories} initialData={currentScreen.initialData} />;
      case 'learn': return <LearnScreen onNavigate={setCurrentScreen} />;
      case 'more': return <MoreScreen onNavigate={setCurrentScreen} userProfile={userProfile} />;
      case 'configurar_perfil': return <ConfigurarPerfilScreen onNavigate={setCurrentScreen} theme={theme} toggleTheme={toggleTheme}/>;
      default: return <DashboardScreen onNavigate={setCurrentScreen} movements={movements} userProfile={userProfile} />;
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ThemeStyles />
      <div className="max-w-md mx-auto shadow-2xl min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] relative theme-transition">
        <Toast message={toast?.msg} type={toast?.type} />
        <div key={screenName} className="animate-page w-full min-h-screen">
          {renderScreen()}
        </div>
        {['home', 'movements', 'learn', 'more'].includes(screenName) && (
          <BottomNav activeTab={screenName} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}