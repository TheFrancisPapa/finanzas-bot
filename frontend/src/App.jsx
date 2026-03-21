import React, { useState, useEffect, useRef } from 'react';
import {
  Home, DollarSign, Plus, BookOpen, MoreHorizontal,
  Bell, ChevronRight, ArrowUpRight, ArrowDownRight,
  Eye, EyeOff, Sparkles, TrendingUp, Camera, Trash2, Pencil,
  Mail, Lock, User, CheckCircle2, ShieldCheck, AlertCircle,
  Settings, LockKeyhole, KeyRound, Smartphone, Target,
  FileText, Download, CloudOff, Cloud, Send, Handshake, Moon, Sun,
  LogOut, Gift
} from 'lucide-react';

// ==========================================
// 1. CONFIGURACIÓN, LÓGICA COMPARTIDA Y UI BASE
// ==========================================

const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000/api' : '/api',
  IS_LOCAL_MODE: false
};

// Cotizaciones aproximadas de venta en ARS (Idealmente esto viene de la API del Dólar)
const EXCHANGE_RATES_ARS = { ARS: 1, USD: 1040, EUR: 1120, BRL: 205, PYG: 0.14, UYU: 26 };

const useLocalState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) { return initialValue; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)); } catch (e) { }
  }, [key, state]);
  return [state, setState];
};

const callGeminiText = async (prompt) => {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: `Sos Manguito, un asistente financiero experto, empático y argentino. Usa "che", "plata", "guita", "mango". Respuestas cortas.` }] }
  };
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) { return "Me quedé sin señal. ¡Intentá de nuevo! 🔌"; }
};

const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
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
    .no-scrollbar::-webkit-scrollbar { display: none; }
    
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
  `}} />
);

const MangoLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="100%" stopColor="#639639" /></linearGradient>
      <linearGradient id="bodyGrad" x1="10%" y1="0%" x2="90%" y2="100%"><stop offset="0%" stopColor="#99CF43" /><stop offset="30%" stopColor="#FFCE45" /><stop offset="60%" stopColor="#FDBC3C" /><stop offset="85%" stopColor="#E53E3E" /><stop offset="100%" stopColor="#9D50FF" /></linearGradient>
    </defs>
    <path d="M105 75 C 110 45, 150 45, 155 60 C 160 75, 140 95, 120 90 C 110 88, 105 80, 105 75 Z" fill="url(#leafGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M100 65 C 135 60, 160 100, 140 145 C 120 185, 60 180, 50 145 C 40 110, 60 85, 80 75 C 88 70, 95 66, 100 65 Z" fill="url(#bodyGrad)" stroke="#221F26" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBD3A] shadow-md active:scale-95',
    secondary: 'bg-white text-[#221F26] border-2 border-[var(--border-color)] hover:border-[#FFCE45]',
    google: 'bg-white border-2 border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50',
    pro: 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] text-white',
    danger: 'bg-[#FFEBEB] text-[#E53E3E] hover:bg-[#FFD6D6] dark:bg-red-500/20'
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
  <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50 hover:-translate-y-0.5' : ''} ${className}`} style={{ boxShadow: 'var(--card-shadow)' }}>{children}</div>
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

const Header = ({ title = "Manguito", userName = "Amigo", userPic, showGreeting = false, backButton = false, onNavigate }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-[var(--nav-bg)] backdrop-blur-xl z-40 border-b border-transparent">
    <div className="flex items-center gap-3">
      {backButton ? (
        <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] active:scale-90 transition-all hover:-translate-x-1">
          <ChevronRight className="rotate-180" size={24} />
        </button>
      ) : (
        <div className="w-10 h-10 rounded-full border-2 border-[#FFCE45] overflow-hidden flex items-center justify-center bg-[var(--bg-card)]">
          {userPic ? <img src={userPic} alt="Perfil" className="w-full h-full object-cover" /> : <MangoLogo className="w-8 h-8" />}
        </div>
      )}
      <div>
        {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)]">¡Hola, {userName}!</p>}
        <span className="text-xl font-black tracking-tight">{title}</span>
      </div>
    </div>
    <button className="w-10 h-10 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] shadow-sm text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors"><Bell size={20} /></button>
  </header>
);

const BottomNav = ({ activeTab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:-translate-y-1'}`}>
      <Home size={24} /><span className="text-[10px] font-bold">Inicio</span>
    </button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'movements' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:-translate-y-1'}`}>
      <DollarSign size={24} /><span className="text-[10px] font-bold">Movimientos</span>
    </button>
    <button onClick={() => onNavigate('new_movement')} className="w-14 h-14 bg-[#FFCE45] rounded-2xl flex items-center justify-center -mt-10 shadow-lg active:scale-90 transition-transform text-[#221F26] hover:-translate-y-2 hover:shadow-xl hover:shadow-[#FFCE45]/40">
      <Plus size={32} strokeWidth={3} />
    </button>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'learn' ? 'text-[#FDBC3C] scale-110' : 'text-[var(--text-muted)] hover:-translate-y-1'}`}>
      <BookOpen size={24} /><span className="text-[10px] font-bold">Aprender</span>
    </button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'more' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)] hover:-translate-y-1'}`}>
      <MoreHorizontal size={24} /><span className="text-[10px] font-bold">Más</span>
    </button>
  </nav>
);

const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€', BRL: 'R$', PYG: '₲', UYU: '$U' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};

const InstagramLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FEE411" /><stop offset="100%" stopColor="#5258CF" /></linearGradient></defs><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
);
const YouTubeLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#FF0000" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
);

// ==========================================
// 2. COMPONENTES DE PANTALLAS
// ==========================================

// --- AUTH ---
const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!isRegistered || !userProfile) return triggerToast('Creá tu cuenta primero', 'error');
    if (email.toLowerCase().trim() !== userProfile.email?.toLowerCase().trim() || password !== userProfile.password) return triggerToast('Email o contraseña incorrectos', 'error');
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-[#99CF43] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
      <div className="absolute top-[10%] right-[-10%] w-72 h-72 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full max-w-md mx-auto">
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-gray-100 transform -rotate-6">
            <MangoLogo className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-black mb-2 tracking-tighter" style={{ color: 'var(--text-main)' }}>Manguito</h1>
          <p className="font-medium text-lg" style={{ color: 'var(--text-muted)' }}>Tus finanzas, al fin domadas.</p>
        </div>

        <div className="w-full bg-[var(--bg-card)] backdrop-blur-xl rounded-[40px] p-8 border border-[var(--border-color)] shadow-[var(--card-shadow)]">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--text-main)' }}>Iniciá sesión</h2>
          <div className="space-y-4 mb-6">
            <Input placeholder="Correo electrónico" icon={Mail} value={email} onChange={e => setEmail(e.target.value)} />
            <Input placeholder="Contraseña" type="password" icon={LockKeyhole} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleLogin} className="text-lg py-4 shadow-[#FFCE45]/30">Entrar</Button>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-color)]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">O continuá con</span>
            <div className="h-px flex-1 bg-[var(--border-color)]"></div>
          </div>

          <button onClick={() => onNavigate('home')} className="w-full py-3.5 px-6 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl flex items-center justify-center gap-3 hover:border-gray-300 transition-all shadow-sm group">
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-bold text-[var(--text-main)]">Google</span>
          </button>
        </div>

        <p className="mt-8 text-sm font-medium text-center" style={{ color: 'var(--text-muted)' }}>
          ¿Sos nuevo por acá? <button onClick={() => onNavigate('register')} className="font-black text-[#FFCE45] hover:underline decoration-2 underline-offset-4">Creá tu cuenta</button>
        </p>
      </div>
    </div>
  );
};

const OnboardingFlow = ({ onFinish, onBack }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', mainCurrency: 'ARS', dob: '' });

  const steps = [
    { id: 'data', title: '¡Hola! 👋\nVamos a conocerte', desc: 'Ingresá tu nombre y correo para arrancar.' },
    { id: 'pass', title: 'Tu seguridad\nes clave 🔒', desc: 'Creá una contraseña y decinos cuándo es tu cumple.' },
    { id: 'currency', title: 'Último detalle 💸', desc: '¿En qué moneda querés ver tu plata?' }
  ];

  if (step > steps.length) { onFinish(formData); return null; }

  return (
    <div className="min-h-screen flex flex-col p-6 relative bg-[var(--bg-base)]">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--border-color)]">
        <div className="h-full bg-[#FFCE45] transition-all duration-500 ease-out" style={{ width: `${(step / steps.length) * 100}%` }}></div>
      </div>
      <header className="py-6 flex items-center z-10">
        <button onClick={() => step > 1 ? setStep(step - 1) : onBack()} className="w-10 h-10 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm border border-[var(--border-color)]">
          <ChevronRight className="rotate-180 text-[var(--text-main)]" size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full z-10 animate-in slide-in-from-right-8 duration-300" key={step}>
        <h2 className="text-4xl font-black mb-4 whitespace-pre-line leading-tight text-[var(--text-main)]">{steps[step - 1].title}</h2>
        <p className="text-lg font-medium mb-10 text-[var(--text-muted)]">{steps[step - 1].desc}</p>

        <div className="space-y-4">
          {step === 1 && (
            <><Input placeholder="Tu nombre" icon={User} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus /><Input placeholder="correo@ejemplo.com" icon={Mail} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></>
          )}
          {step === 2 && (
            <>
              <Input placeholder="Contraseña súper secreta" type="password" icon={KeyRound} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} autoFocus />
              <label className="block text-[10px] font-black uppercase text-[var(--text-muted)] mt-4 ml-2">Fecha de nacimiento</label>
              <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-[var(--input-bg)] border-2 border-transparent rounded-[20px] py-4 px-6 text-[var(--text-main)] outline-none focus:border-[#FFCE45] focus:bg-[var(--bg-card)] theme-transition" />
            </>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              {[{ id: 'ARS', icon: '🇦🇷', label: 'Pesos' }, { id: 'USD', icon: '🇺🇸', label: 'Dólares' }, { id: 'EUR', icon: '🇪🇺', label: 'Euros' }, { id: 'BRL', icon: '🇧🇷', label: 'Reales' }].map(c => (
                <button key={c.id} onClick={() => setFormData({ ...formData, mainCurrency: c.id })} className={`p-6 rounded-[24px] border-2 font-black flex flex-col items-center gap-2 transition-all duration-300 ${formData.mainCurrency === c.id ? 'border-[#FFCE45] bg-[var(--bg-card)] shadow-md text-[var(--text-main)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-60 text-[var(--text-muted)]'}`}>
                  <span className="text-3xl">{c.icon}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <Button onClick={() => setStep(step + 1)} disabled={(step === 1 && (!formData.name || !formData.email)) || (step === 2 && !formData.password)}>
            {step === steps.length ? '¡Arrancar!' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const DashboardScreen = ({ onNavigate, movements = [], userProfile, triggerToast }) => {
  const mainCurrency = userProfile?.mainCurrency || 'ARS';
  const totalIn = movements.filter(m => m.type === 'ingreso').reduce((a, m) => a + m.amount, 0);
  const totalOut = movements.filter(m => m.type === 'gasto').reduce((a, m) => a + m.amount, 0);
  const balance = totalIn - totalOut;
  const [revealBalances, setRevealBalances] = useState(true);
  const displayMoney = (val) => revealBalances ? formatMoney(val, mainCurrency) : `${mainCurrency === 'USD' ? 'US$' : mainCurrency === 'EUR' ? '€' : '$'} ••••••`;

  // Comprobar cumpleaños
  useEffect(() => {
    if (userProfile?.dob) {
      const today = new Date();
      const dob = new Date(userProfile.dob);
      if (today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth()) {
        const hasCelebrated = sessionStorage.getItem('birthday_celebrated');
        if (!hasCelebrated) {
          triggerToast(`¡Feliz cumpleaños ${userProfile.name.split(' ')[0]}! 🎂🎉`, 'success');
          sessionStorage.setItem('birthday_celebrated', 'true');
        }
      }
    }
  }, [userProfile]);

  return (
    <div className="pb-32 relative">
      {/* Fondos dinámicos globales */}
      <div className="fixed top-[-10%] left-[-10%] w-72 h-72 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob pointer-events-none dark:mix-blend-screen"></div>
      <div className="fixed bottom-[10%] right-[-10%] w-80 h-80 bg-[#99CF43] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob animation-delay-2000 pointer-events-none dark:mix-blend-screen"></div>

      <Header onNavigate={onNavigate} showGreeting={true} userName={userProfile?.name?.split(' ')[0]} userPic={userProfile?.pic} />
      <main className="px-6 space-y-6 mt-2 relative z-10">
        <div className="bg-[var(--bg-card)] rounded-[40px] p-8 text-center border border-[var(--border-color)] relative overflow-hidden group theme-transition" style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest opacity-80">Balance Total</p>
            <button onClick={() => setRevealBalances(!revealBalances)} className="text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors p-1 active:scale-90">
              {revealBalances ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="h-[72px] flex items-center justify-center">
            <h2 className={`text-[52px] font-black tracking-tighter relative z-10 drop-shadow-sm ${balance < 0 ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
              {displayMoney(balance)}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border-color)] relative z-10 mt-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowUpRight size={14} className="text-[#639639] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ingresos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalIn)}</span>
            </div>
            <div className="border-l border-[var(--border-color)] flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowDownRight size={14} className="text-[#E53E3E] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Gastos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalOut)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-orange-50/50 dark:bg-orange-500/10 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">🔥</div>
            <span className="text-3xl font-black text-[var(--text-main)]">3</span>
            <span className="text-xs font-bold text-[var(--text-muted)]">Días de racha</span>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-yellow-50/50 dark:bg-yellow-500/10 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">💰</div>
            <span className="text-2xl font-black text-[var(--text-main)] mt-1">{displayMoney(totalOut)}</span>
            <span className="text-xs font-bold text-[var(--text-muted)] mt-1">Gastado hoy</span>
          </Card>
        </div>

        <div onClick={() => onNavigate('learn')} className="bg-[#221F26] border border-[#221F26] rounded-[32px] p-6 flex items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.15)] relative overflow-hidden group cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all">
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#FFCE45]/10 to-transparent transform group-hover:scale-x-150 transition-transform origin-right"></div>
          <div className="flex-1 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">🤖</div>
            <div>
              <p className="text-white font-black text-sm mb-0.5 group-hover:text-[#FFCE45] transition-colors">¿Tenés dudas financieras?</p>
              <p className="text-gray-400 text-xs font-bold">Chateá con Mango IA</p>
            </div>
          </div>
          <button className="bg-[#FFCE45] text-[#221F26] p-3 rounded-2xl shadow-md group-hover:scale-110 transition-transform relative z-10">
            <ArrowUpRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-black text-[var(--text-main)] text-lg">Actividad reciente</h3>
            <button onClick={() => onNavigate('movements')} className="text-xs font-bold text-[#FFCE45] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95">Ver todo</button>
          </div>

          {movements.length === 0 ? (
            <div className="py-10 text-center bg-[var(--bg-card)] rounded-[32px] border border-[var(--border-color)] border-dashed">
              <div className="text-4xl mb-3 grayscale opacity-40">🌱</div>
              <p className="text-sm text-[var(--text-muted)] font-medium">Anotá tu primer gasto para empezar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.slice(0, 3).map((m, i) => (
                <Card key={i} noPadding className="p-4 flex justify-between items-center shadow-sm hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${m.type === 'gasto' ? 'bg-[#FFEBEB]/80 dark:bg-red-500/10' : 'bg-[#E6F4EA]/80 dark:bg-green-500/10'}`}>
                      {m.icon || (m.type === 'gasto' ? '💸' : '💰')}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-main)] text-sm">{m.category}</p>
                      {m.description && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">{m.description}</p>}
                    </div>
                  </div>
                  <span className={`font-black ${m.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
                    {m.type === 'gasto' ? '-' : '+'}{formatMoney(m.amount, m.currency)}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- MOVEMENTS ---
const MovementsScreen = ({ onNavigate, movements = [] }) => {
  const [filter, setFilter] = useState('todos');
  const filtered = movements.filter(m => filter === 'todos' || m.type === filter.slice(0, -1));

  const emptyStateText = () => {
    if (filter === 'gastos') return "Registrá tu primer gasto para llevar el control y saber a dónde se te va la plata.";
    if (filter === 'ingresos') return "Registrá tu primer ingreso para ver cómo crece tu billetera mes a mes.";
    return "Anotá un gasto o un ingreso usando el botón central (+) para empezar a ver tu actividad acá.";
  };

  return (
    <div className="pb-32">
      <Header onNavigate={() => onNavigate('home')} backButton={true} title="Movimientos" />
      <main className="px-6 space-y-6 mt-4">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex border border-[var(--border-color)]">
          {['gastos', 'ingresos', 'todos'].map(t => <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${filter === t ? 'bg-[#FFCE45] text-[#221F26] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>{t.toUpperCase()}</button>)}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="text-6xl mb-4 opacity-50">👀</div>
            <h3 className="font-black text-[var(--text-main)] text-xl mb-2">Nada por acá</h3>
            <p className="text-[var(--text-muted)] font-medium text-sm leading-relaxed mx-auto">
              {emptyStateText()}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m, i) => (
              <Card key={i} noPadding className="p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${m.type === 'gasto' ? 'bg-[#FFEBEB]/80 dark:bg-red-500/10' : 'bg-[#E6F4EA]/80 dark:bg-green-500/10'}`}>
                    {m.icon}
                  </div>
                  <div><p className="font-bold text-[var(--text-main)] text-sm">{m.category}</p><p className="text-[11px] text-[var(--text-muted)] mt-0.5">{m.description}</p></div>
                </div>
                <span className={`font-black ${m.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>{m.type === 'gasto' ? '-' : '+'}{formatMoney(m.amount, m.currency)}</span>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- NEW MOVEMENT ---
const NewMovementScreen = ({ onNavigate, onSave, categories, userProfile }) => {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('');
  const [currency, setCurrency] = useState(userProfile?.mainCurrency || 'ARS');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (categories[type] && categories[type].length > 0) {
      setCat(categories[type][0].label);
    }
  }, [type, categories]);

  const approxArs = amount ? (Number(amount) * (EXCHANGE_RATES_ARS[currency] || 1)) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header onNavigate={() => onNavigate('home')} backButton={true} title="Nuevo registro" />
      <div className="p-6 space-y-6">
        <div className="flex bg-[var(--bg-card)] p-1.5 rounded-[24px] border border-[var(--border-color)] shadow-sm">
          <button onClick={() => setType('gasto')} className={`flex-1 py-3 rounded-[18px] font-black transition-all ${type === 'gasto' ? 'bg-[#FFEBEB] text-[#E53E3E] shadow-sm' : 'text-[var(--text-muted)]'}`}>Gasto</button>
          <button onClick={() => setType('ingreso')} className={`flex-1 py-3 rounded-[18px] font-black transition-all ${type === 'ingreso' ? 'bg-[#E6F4EA] text-[#639639] shadow-sm' : 'text-[var(--text-muted)]'}`}>Ingreso</button>
        </div>

        <Card className="text-center py-8 shadow-md">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Monto</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-black ${type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={`bg-transparent text-6xl font-black text-center w-3/4 outline-none ${type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`} autoFocus />
          </div>
          {currency !== 'ARS' && amount && (
            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 animate-in fade-in">
              ≈ ARS ${approxArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} (Aprox)
            </p>
          )}
        </Card>

        <div>
          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest px-2 mb-3 block">Categoría</label>
          <div className="grid grid-cols-4 gap-2">
            {categories[type].map(c => (
              <button key={c.label} onClick={() => setCat(c.label)} className={`p-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${cat === c.label ? 'border-[#FFCE45] bg-[var(--bg-card)] shadow-md text-[var(--text-main)]' : 'border-transparent bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}>
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-wider truncate w-full text-center">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] p-4 flex gap-4 shadow-sm">
          <div className="flex-[0.8] border-r border-[var(--border-color)] pr-4">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1 block">Moneda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-transparent font-bold text-[var(--text-main)] outline-none text-sm cursor-pointer">
              <option value="ARS">ARS 🇦🇷</option>
              <option value="USD">USD 🇺🇸</option>
              <option value="EUR">EUR 🇪🇺</option>
              <option value="BRL">BRL 🇧🇷</option>
              <option value="PYG">PYG 🇵🇾</option>
              <option value="UYU">UYU 🇺🇾</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1 block">Nota</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Supermercado" className="w-full bg-transparent font-bold text-[var(--text-main)] outline-none placeholder-[var(--text-muted)] text-sm" />
          </div>
        </div>

        <Button onClick={() => onSave({ type, amount: Number(amount), category: cat, description: desc, icon: categories[type].find(c => c.label === cat)?.icon || '💰', currency, date: new Date().toISOString() })} className="py-5 shadow-xl text-lg mt-4">Guardar {type}</Button>
      </div>
    </div>
  );
};

// --- LEARN ---
const LearnScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('ia');
  const [chat, setChat] = useState([{ role: 'model', text: '¡Hola! Soy Mango IA ✨. Preguntame lo que quieras sobre tus mangos.' }]);
  const [input, setInput] = useState('');

  const [dailyTip, setDailyTip] = useState(0);

  const tipsArray = [
    { icon: '🛡️', title: 'Fondo de emergencia', desc: 'Tené entre 3 y 6 meses de gastos fijos ahorrados en un instrumento seguro (como un Money Market o Plazo Fijo) para vivir en paz ante imprevistos.' },
    { icon: '📊', title: 'Regla 50/30/20', desc: 'Destiná 50% de tus ingresos a necesidades básicas, 30% a gustos y salidas, y asegurate de separar un 20% para ahorro o inversión ni bien cobrás.' },
    { icon: '🛒', title: 'La regla de las 48hs', desc: '¿Viste algo que querés comprar y no es urgente? Esperá 48 horas. Si después de ese tiempo lo seguís queriendo (y podés pagarlo), compralo. Evitá las compras impulsivas.' },
    { icon: '📈', title: 'Interés Compuesto', desc: 'La magia de invertir es reinvertir las ganancias. A largo plazo, el interés que generan tus propios intereses hace que tu plata crezca exponencialmente.' }
  ];

  useEffect(() => {
    // Cambiar el tip basado en el día del mes
    setDailyTip(new Date().getDate() % tipsArray.length);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newHistory = [...chat, { role: 'user', text: input }];
    setChat(newHistory); setInput('');
    const res = await callGeminiText(input);
    setChat([...newHistory, { role: 'model', text: res }]);
  };

  const creators = [
    { name: 'Joven Inversor', plat: 'youtube', link: 'https://www.youtube.com/@JovenInversor' },
    { name: 'Mujer Financiera', plat: 'ig', link: 'https://www.instagram.com/mujer_financiera' },
    { name: 'Moris Dieck', plat: 'youtube', link: 'https://www.youtube.com/@MorisDieck' },
    { name: 'César Dabián', plat: 'youtube', link: 'https://www.youtube.com/@CesarDabianFinanzas' },
    { name: 'Andrés Garza', plat: 'youtube', link: 'https://www.youtube.com/@andresgarzam' }
  ];

  return (
    <div className="pb-32">
      <Header title="Aprender" />
      <main className="px-6 space-y-4 mt-2">
        <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar">
          {[{ id: 'ia', label: 'Mango IA 🤖' }, { id: 'tips', label: 'Tip del Día 💡' }, { id: 'social', label: 'Comunidad 👥' }].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#FDBC3C] text-[#221F26] shadow-md' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'ia' && (
          <div className="bg-[var(--bg-card)] rounded-3xl h-[400px] flex flex-col p-4 border border-[var(--border-color)] shadow-sm animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
              {chat.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl max-w-[85%] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-[#FFCE45] text-[#221F26]' : 'bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]'}`}>{m.text}</div></div>)}
            </div>
            <div className="flex gap-2 mt-4 relative">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribí acá..." className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[20px] py-4 pl-5 pr-14 outline-none text-sm text-[var(--text-main)] focus:border-[#FFCE45]" />
              <button onClick={handleSend} className="absolute right-2 top-2 bottom-2 aspect-square bg-[#FFCE45] text-[#221F26] rounded-[16px] flex items-center justify-center hover:bg-[#FDBD3A]"><Send size={18} /></button>
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
            <Card className="border-2 border-[#FFCE45] !p-8 text-center bg-gradient-to-b from-[#FFFBF2] to-white dark:from-[#221A0F] dark:to-[var(--bg-card)]">
              <span className="text-5xl block mb-4">{tipsArray[dailyTip].icon}</span>
              <h3 className="font-black text-[var(--text-main)] text-2xl mb-3">{tipsArray[dailyTip].title}</h3>
              <p className="text-[var(--text-muted)] font-medium leading-relaxed">{tipsArray[dailyTip].desc}</p>
            </Card>
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">¡Mañana hay un tip nuevo!</p>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-8 duration-300">
            <h3 className="font-black text-sm uppercase tracking-widest text-[var(--text-muted)] ml-2 mb-2">Creadores recomendados</h3>
            {creators.map((c, i) => (
              <a key={i} href={c.link} target="_blank" rel="noopener noreferrer" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-4 flex items-center justify-between shadow-sm hover:border-[#FFCE45] transition-all group block">
                <div className="flex items-center gap-4">
                  {c.plat === 'ig' ? <InstagramLogo className="w-8 h-8" /> : <YouTubeLogo className="w-8 h-8" />}
                  <span className="font-bold text-[var(--text-main)]">{c.name}</span>
                </div>
                <ChevronRight className="text-[var(--text-muted)] group-hover:text-[#FFCE45] group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- CONFIG PERFIL ---
const ConfigurarPerfilScreen = ({ onNavigate, userProfile, setUserProfile, triggerToast, theme, toggleTheme }) => {
  const [formData, setFormData] = useState({ name: userProfile?.name || '', dob: userProfile?.dob || '' });
  const fileInputRef = useRef(null);

  const handleSave = () => {
    setUserProfile({ ...userProfile, ...formData });
    triggerToast("Perfil actualizado correctamente");
    onNavigate('more');
  };

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, pic: reader.result });
        triggerToast("Foto actualizada");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('manguito_profile');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Mi Perfil" />
      <main className="px-6 mt-6 space-y-6">

        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-[var(--bg-card)] shadow-lg overflow-hidden bg-[#FFCE45] relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            {userProfile?.pic ? <img src={userProfile.pic} alt="Perfil" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">😎</div>}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" /></div>
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePicUpload} />
          <p className="text-xs font-bold text-[var(--text-muted)] mt-3 tracking-widest uppercase">Cambiar foto</p>
        </div>

        <Card className="!p-6 border-0 shadow-sm flex items-center justify-between">
          <p className="font-bold text-sm text-[var(--text-main)]">Modo Oscuro</p>
          <button onClick={toggleTheme} className={`w-14 h-8 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#FFCE45]' : 'bg-[var(--border-color)]'}`}>
            <div className={`w-6 h-6 bg-white rounded-full transform transition-transform shadow-sm flex items-center justify-center ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
              {theme === 'dark' ? <Moon size={12} className="text-[#221F26]" /> : <Sun size={12} className="text-yellow-500" />}
            </div>
          </button>
        </Card>

        <Card className="!p-6 border-0 shadow-sm space-y-5">
          <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-muted)]">Datos Personales</h3>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 ml-1">Nombre</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[20px] py-4 px-5 font-bold outline-none text-[var(--text-main)] focus:border-[#FFCE45]" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 ml-1">Fecha de nacimiento</label>
            <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[20px] py-4 px-5 font-bold outline-none text-[var(--text-main)] focus:border-[#FFCE45]" />
          </div>
        </Card>

        <Button onClick={handleSave} className="py-4 shadow-md text-lg">Guardar Cambios</Button>

        <div className="pt-8 border-t border-[var(--border-color)] space-y-4">
          <button onClick={handleLogout} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] py-4 rounded-[20px] font-bold text-[var(--text-main)] flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#2D2936] transition-colors shadow-sm">
            <LogOut size={20} /> Cerrar Sesión
          </button>
          <button onClick={() => { if (window.confirm('¿Seguro? Esta acción borra todo tu local storage.')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 font-bold text-[#E53E3E] text-sm hover:underline">
            Eliminar cuenta y datos
          </button>
        </div>
      </main>
    </div>
  );
};

// --- PRESUPUESTOS Y METAS ---
const PresupuestosMetasScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('presupuestos');
  const [items, setItems] = useLocalState('manguito_metas', []);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', monto: '' });

  const handleAdd = () => {
    if (!formData.nombre || !formData.monto) return;
    setItems([...items, { ...formData, tipo: activeTab, id: Date.now() }]);
    setFormData({ nombre: '', monto: '' });
    setIsAdding(false);
  };

  const filteredItems = items.filter(i => i.tipo === activeTab);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Presupuestos y Metas" />
      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-sm border border-[var(--border-color)]">
          <button onClick={() => { setActiveTab('presupuestos'); setIsAdding(false); }} className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'presupuestos' ? 'bg-[#FFCE45] text-[#221F26] shadow-sm' : 'text-[var(--text-muted)]'}`}>Presupuestos</button>
          <button onClick={() => { setActiveTab('metas'); setIsAdding(false); }} className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'metas' ? 'bg-[#FFCE45] text-[#221F26] shadow-sm' : 'text-[var(--text-muted)]'}`}>Metas</button>
        </div>

        {isAdding ? (
          <Card className="animate-in fade-in slide-in-from-top-4">
            <h3 className="font-black text-lg mb-4">Nuevo {activeTab.slice(0, -1)}</h3>
            <input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder={`Ej: ${activeTab === 'metas' ? 'Vacaciones' : 'Supermercado'}`} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[16px] py-3 px-4 font-bold outline-none mb-3 text-[var(--text-main)]" />
            <input type="number" value={formData.monto} onChange={e => setFormData({ ...formData, monto: e.target.value })} placeholder="Monto objetivo ($)" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[16px] py-3 px-4 font-bold outline-none mb-4 text-[var(--text-main)]" />
            <div className="flex gap-3">
              <Button onClick={handleAdd}>Guardar</Button>
              <button onClick={() => setIsAdding(false)} className="px-6 font-bold text-[var(--text-muted)] hover:text-[#E53E3E]">Cancelar</button>
            </div>
          </Card>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Target size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="font-bold text-sm text-[var(--text-muted)]">No tenés {activeTab} activos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <Card key={item.id} className="flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-black text-[var(--text-main)]">{item.nombre}</h4>
                      <p className="text-xs font-bold text-[var(--text-muted)]">Objetivo: {formatMoney(item.monto)}</p>
                    </div>
                    <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-10 h-10 bg-[#FFEBEB] dark:bg-red-500/20 text-[#E53E3E] rounded-xl flex items-center justify-center"><Trash2 size={16} /></button>
                  </Card>
                ))}
              </div>
            )}
            <Button onClick={() => setIsAdding(true)} variant="secondary" className="border-dashed !border-[var(--text-muted)] text-[var(--text-muted)] opacity-70 hover:opacity-100"><Plus /> Agregar {activeTab.slice(0, -1)}</Button>
          </>
        )}
      </main>
    </div>
  );
};

// --- CATEGORÍAS ---
const CategoriasScreen = ({ onNavigate, categories, setCategories, triggerToast }) => {
  const [activeTab, setActiveTab] = useState('gasto');
  const [newCat, setNewCat] = useState({ label: '', icon: '🌟' });

  const handleAdd = () => {
    if (!newCat.label.trim()) return;
    const updated = { ...categories };
    updated[activeTab].push(newCat);
    setCategories(updated);
    setNewCat({ label: '', icon: '🌟' });
    triggerToast("Categoría agregada");
  };

  const handleRemove = (label) => {
    if (categories[activeTab].length <= 1) return triggerToast("No podés quedarte sin categorías", "error");
    const updated = { ...categories };
    updated[activeTab] = updated[activeTab].filter(c => c.label !== label);
    setCategories(updated);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Mis Categorías" />
      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex border border-[var(--border-color)] shadow-sm">
          <button onClick={() => setActiveTab('gasto')} className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'gasto' ? 'bg-[#FFEBEB] text-[#E53E3E] shadow-sm' : 'text-[var(--text-muted)]'}`}>Gastos</button>
          <button onClick={() => setActiveTab('ingreso')} className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'ingreso' ? 'bg-[#E6F4EA] text-[#639639] shadow-sm' : 'text-[var(--text-muted)]'}`}>Ingresos</button>
        </div>

        <div className="bg-[var(--bg-card)] p-2 rounded-[24px] border border-[var(--border-color)] flex gap-2">
          <input value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} className="w-12 h-12 bg-[var(--input-bg)] rounded-[16px] text-center text-xl outline-none" maxLength={2} />
          <input value={newCat.label} onChange={e => setNewCat({ ...newCat, label: e.target.value })} placeholder="Nueva categoría..." className="flex-1 bg-[var(--input-bg)] rounded-[16px] px-4 font-bold text-sm outline-none text-[var(--text-main)]" />
          <button onClick={handleAdd} className="w-12 h-12 bg-[#FFCE45] rounded-[16px] flex items-center justify-center text-[#221F26] shadow-sm"><Plus /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories[activeTab].map((cat, i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-[24px] flex items-center justify-between shadow-sm group">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-black text-[var(--text-main)] text-sm truncate max-w-[80px]">{cat.label}</span>
              </div>
              <button onClick={() => handleRemove(cat.label)} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[#E53E3E] transition-all"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- COTIZACIONES ---
const CotizacionesScreen = ({ onNavigate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Dólar Hoy" />
      <main className="px-6 mt-6">
        {loading ? <div className="text-center py-20 font-bold text-[var(--text-muted)] animate-pulse">Cargando valores oficiales...</div> : (
          <div className="grid grid-cols-2 gap-4">
            {data.map((d, i) => (
              <Card key={i} className="text-center !p-6 border border-[var(--border-color)] shadow-sm hover:scale-105 transition-transform bg-[var(--bg-card)]">
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2">{d.nombre}</p>
                <p className="text-2xl font-black text-[#639639] mb-1">${d.venta}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)]">Compra: ${d.compra}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- MORE & SETTINGS ---
const MoreScreen = ({ onNavigate, userProfile }) => (
  <div className="pb-32">
    <Header title="Más" />
    <main className="px-6 space-y-6 mt-2">
      <Card onClick={() => onNavigate('configurar_perfil')} className="text-center flex flex-col items-center shadow-md border-none group bg-[var(--bg-card)]">
        <div className="w-20 h-20 bg-[#FFCE45] rounded-[28px] flex items-center justify-center text-4xl mb-4 group-hover:scale-105 transition-transform border-4 border-white dark:border-[#221F26] shadow-xl overflow-hidden">
          {userProfile?.pic ? <img src={userProfile.pic} className="w-full h-full object-cover" /> : '😎'}
        </div>
        <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">{userProfile?.name || 'Usuario'}</h3>
        <p className="text-xs text-[var(--text-muted)] font-bold tracking-wider mt-1">{userProfile?.email || 'usuario@mail.com'}</p>
      </Card>
      <Card className="!p-2 space-y-1 shadow-sm border border-[var(--border-color)] bg-[var(--bg-card)]">
        <button onClick={() => onNavigate('configurar_perfil')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">⚙️</span> Perfil y Ajustes</span> <ChevronRight size={18} className="text-[var(--text-muted)]" /></button>
        <button onClick={() => onNavigate('presupuestos')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">🎯</span> Presupuestos y Metas</span> <ChevronRight size={18} className="text-[var(--text-muted)]" /></button>
        <button onClick={() => onNavigate('categorias')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">📂</span> Mis Categorías</span> <ChevronRight size={18} className="text-[var(--text-muted)]" /></button>
        <button onClick={() => onNavigate('cotizaciones')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--input-bg)] rounded-[20px] font-bold text-[var(--text-main)] transition-colors"><span className="flex items-center gap-3"><span className="text-xl">💵</span> Cotización Dólar</span> <ChevronRight size={18} className="text-[var(--text-muted)]" /></button>
      </Card>
      <div className="bg-gradient-to-br from-[#2D1B36] to-[#1A0F20] p-8 rounded-[40px] text-white text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#9D50FF] rounded-full blur-[80px] opacity-30 animate-blob"></div>
        <h3 className="text-2xl font-black mb-2 tracking-tight relative z-10">Manguito PRO ⭐</h3>
        <p className="text-[#D6B5FF] text-sm font-bold mb-6 relative z-10">Exportá a Excel y liberá la IA.</p>
        <a href="https://link.mercadopago.com.ar/thefrancispapa" target="_blank" rel="noopener noreferrer" className="w-full py-3.5 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-3 cursor-pointer bg-[#FFCE45] text-[#221F26] shadow-xl relative z-10 hover:bg-[#FDBD3A] active:scale-95">
          Activar Beneficios 🚀
        </a>
      </div>
    </main>
  </div>
);

// ==========================================
// 3. COMPONENTE PRINCIPAL (ORQUESTADOR)
// ==========================================

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-[#FFFBF2] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-3xl font-black mb-4">¡Uy! Un tropezón.</h2>
        <button onClick={() => window.location.reload()} className="bg-[#FFCE45] px-8 py-4 rounded-2xl font-black">Reintentar</button>
      </div>
    );
    return this.props.children;
  }
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [toast, setToast] = useState(null);

  const [theme, setTheme] = useLocalState('manguito_theme', 'light');
  const [movements, setMovements] = useLocalState('manguito_movements', []);
  const [userProfile, setUserProfile] = useLocalState('manguito_profile', null);
  const [categories, setCategories] = useLocalState('manguito_categories', {
    gasto: [{ icon: '🍔', label: 'Comida' }, { icon: '🚌', label: 'Transporte' }, { icon: '🛒', label: 'Super' }, { icon: '🧾', label: 'Servicios' }],
    ingreso: [{ icon: '💼', label: 'Sueldo' }, { icon: '📈', label: 'Inversión' }, { icon: '🎁', label: 'Regalo' }]
  });

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveMovement = (m) => {
    setMovements([m, ...movements]);
    showToast('Movimiento guardado');
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login': return <LoginScreen onNavigate={setCurrentScreen} triggerToast={showToast} userProfile={userProfile} isRegistered={!!userProfile} />;
      case 'register': return <OnboardingFlow onFinish={(d) => { setUserProfile(d); setCurrentScreen('home') }} onBack={() => setCurrentScreen('login')} />;
      case 'home': return <DashboardScreen onNavigate={setCurrentScreen} movements={movements} userProfile={userProfile} triggerToast={showToast} />;
      case 'movements': return <MovementsScreen onNavigate={setCurrentScreen} movements={movements} />;
      case 'new_movement': return <NewMovementScreen onNavigate={setCurrentScreen} onSave={handleSaveMovement} userProfile={userProfile} categories={categories} />;
      case 'learn': return <LearnScreen onNavigate={setCurrentScreen} />;
      case 'more': return <MoreScreen onNavigate={setCurrentScreen} userProfile={userProfile} />;
      case 'configurar_perfil': return <ConfigurarPerfilScreen onNavigate={setCurrentScreen} userProfile={userProfile} setUserProfile={setUserProfile} triggerToast={showToast} theme={theme} toggleTheme={toggleTheme} />;
      case 'cotizaciones': return <CotizacionesScreen onNavigate={setCurrentScreen} />;
      case 'presupuestos': return <PresupuestosMetasScreen onNavigate={setCurrentScreen} />;
      case 'categorias': return <CategoriasScreen onNavigate={setCurrentScreen} categories={categories} setCategories={setCategories} triggerToast={showToast} />;
      default: return <DashboardScreen onNavigate={setCurrentScreen} movements={movements} userProfile={userProfile} triggerToast={showToast} />;
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ThemeStyles />
      <div className="max-w-md mx-auto shadow-2xl min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] relative overflow-x-hidden theme-transition">
        <Toast message={toast?.msg} type={toast?.type} />
        <div key={currentScreen} className="animate-in slide-in-from-right-8 fade-in duration-300">
          {renderScreen()}
        </div>
        {['home', 'movements', 'learn', 'more'].includes(currentScreen) && (
          <BottomNav activeTab={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}