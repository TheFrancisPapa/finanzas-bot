import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, DollarSign, Plus, BookOpen, MoreHorizontal, 
  Bell, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Eye, EyeOff, Sparkles, TrendingUp, Camera, Trash2, Pencil,
  Mail, Lock, User, CheckCircle2, ShieldCheck, AlertCircle,
  Settings, LockKeyhole, KeyRound, Smartphone, Target,
  FileText, Download, CloudOff, Cloud, Send, Handshake
} from 'lucide-react';

// ==========================================
// 1. CONFIGURACIÓN, LÓGICA COMPARTIDA Y UI BASE
// ==========================================

const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000/api' : '/api',
  IS_LOCAL_MODE: false 
};

const EXCHANGE_RATES = { ARS: 1, USD: 1000, EUR: 1100, GBP: 1400, BRL: 200 };

const useLocalState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) { return initialValue; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
  }, [key, state]);
  return [state, setState];
};

const apiFetch = async (endpoint, options = {}) => {
  const profileStr = window.localStorage.getItem('manguito_profile');
  const profile = profileStr ? JSON.parse(profileStr) : null;
  const token = profile?.token;
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...options.headers };
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) { window.localStorage.clear(); window.location.reload(); return null; }
    if (!response.ok) throw new Error('Error en la petición');
    return response.json();
  } catch (e) { throw e; }
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
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `}} />
);

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
    primary: 'bg-[#FFCE45] text-[#221F26] hover:bg-[#FDBD3A] shadow-md active:scale-95',
    secondary: 'bg-white text-[#221F26] border-2 border-[var(--border-color)] hover:border-[#FFCE45]',
    google: 'bg-white border-2 border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50',
    pro: 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] text-white'
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
  <div onClick={onClick} className={`bg-[var(--bg-card)] rounded-[32px] ${noPadding ? '' : 'p-6'} border border-[var(--border-color)] theme-transition ${onClick ? 'cursor-pointer hover:border-[#FFCE45]/50' : ''} ${className}`} style={{ boxShadow: 'var(--card-shadow)' }}>{children}</div>
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

const Header = ({ title = "Manguito", userName = "Amigo", showGreeting = false, backButton = false, onNavigate }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-[var(--nav-bg)] backdrop-blur-xl z-40 border-b border-transparent">
    <div className="flex items-center gap-3">
      {backButton ? (
        <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-white rounded-full shadow-sm border border-[var(--border-color)] hover:border-[#FFCE45] active:scale-90">
          <ChevronRight className="rotate-180" size={24} />
        </button>
      ) : ( <MangoLogo className="w-10 h-10" /> )}
      <div>
        {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)]">¡Hola, {userName}!</p>}
        <span className="text-xl font-black tracking-tight">{title}</span>
      </div>
    </div>
    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[var(--border-color)] shadow-sm"><Bell size={20}/></button>
  </header>
);

const BottomNav = ({ activeTab, onNavigate }) => (
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

const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
};

const convertCurrency = (amount, fromCurr, toCurr) => (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];

// ==========================================
// 2. COMPONENTES DE PANTALLAS (Módulos Consolidados)
// ==========================================

// --- AUTH ---
const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile, setUserProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = () => { 
    if (!isRegistered || !userProfile) return triggerToast('Creá tu cuenta primero', 'error');
    if (email.toLowerCase().trim() !== userProfile.email?.toLowerCase().trim() || password !== userProfile.password) return triggerToast('Email o contraseña incorrectos', 'error');
    onNavigate('home'); 
  };
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-8">
        <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mb-6 shadow-lg mx-auto border border-[var(--border-color)]">
          <MangoLogo className="w-20 h-20" />
        </div>
        <h1 className="text-5xl font-black mb-2 tracking-tight">Manguito</h1>
      </div>
      <div className="w-full max-w-md bg-white rounded-[40px] p-8 border border-[var(--border-color)] shadow-[var(--card-shadow)]">
        <Input placeholder="correo@ejemplo.com" icon={Mail} value={email} onChange={e=>setEmail(e.target.value)} className="mb-4" />
        <Input placeholder="Contraseña" type="password" icon={Lock} value={password} onChange={e=>setPassword(e.target.value)} className="mb-6" />
        <Button onClick={handleLogin}>Entrar</Button>
        <div className="my-6 text-center text-[10px] font-black uppercase text-[var(--text-muted)]">o</div>
        <Button variant="google" onClick={() => onNavigate('home')}>Continuar con Google</Button>
      </div>
      <button onClick={() => onNavigate('register')} className="mt-8 font-black text-sm">¿Sos nuevo? Creá tu cuenta gratis</button>
    </div>
  );
};

const OnboardingFlow = ({ onFinish, onBack, mode = 'manual' }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', dob: '', mainCurrency: 'ARS' });
  const steps = [
    { id: 'data', title: '¡Hola!\nVamos a conocerte', desc: 'Ingresá tu nombre y correo' },
    { id: 'pass', title: 'Tu seguridad\nes clave 🔒', desc: 'Creá una contraseña' },
    { id: 'currency', title: 'Último paso', desc: '¿En qué moneda querés tu balance?' }
  ];
  if (step > steps.length) { onFinish(formData); return null; }
  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6 flex flex-col">
      <header className="py-6"><button onClick={onBack}><ChevronRight className="rotate-180"/></button></header>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto step-animate" key={step}>
        <h2 className="text-4xl font-black mb-3 whitespace-pre-line">{steps[step-1].title}</h2>
        <p className="text-[var(--text-muted)] mb-8 text-lg">{steps[step-1].desc}</p>
        {step === 1 && <><Input placeholder="Nombre" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="mb-4"/><Input placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/></>}
        {step === 2 && <Input placeholder="Contraseña" type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})}/>}
        {step === 3 && <div className="grid grid-cols-2 gap-3">{['ARS', 'USD', 'EUR', 'BRL'].map(c=><button key={c} onClick={()=>setFormData({...formData, mainCurrency:c})} className={`p-5 rounded-2xl border-2 font-black ${formData.mainCurrency===c?'border-[#FFCE45]':'border-gray-100'}`}>{c}</button>)}</div>}
        <Button onClick={()=>setStep(step+1)} className="mt-10">Continuar</Button>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const DashboardScreen = ({ onNavigate, movements = [], userProfile }) => {
  const mainCurrency = userProfile?.mainCurrency || 'ARS';
  const totalIn = movements.filter(m=>m.type==='ingreso').reduce((a,m)=>a+m.amount,0);
  const totalOut = movements.filter(m=>m.type==='gasto').reduce((a,m)=>a+m.amount,0);
  const balance = totalIn - totalOut;

  return (
    <div className="pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} showGreeting={true} userName={userProfile?.name?.split(' ')[0]} />
      <main className="px-6 space-y-6 mt-2">
        <div className="bg-white rounded-[40px] p-8 text-center border border-[var(--border-color)] shadow-sm">
          <p className="text-[var(--text-muted)] font-bold text-xs uppercase mb-2">Balance Total</p>
          <h2 className={`text-5xl font-black tracking-tighter ${balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatMoney(balance, mainCurrency)}</h2>
          <div className="grid grid-cols-2 mt-8 pt-6 border-t border-gray-100">
            <div><p className="text-[10px] font-black text-gray-400">INGRESOS</p><p className="font-bold text-green-600">{formatMoney(totalIn, mainCurrency)}</p></div>
            <div className="border-l border-gray-100"><p className="text-[10px] font-black text-gray-400">GASTOS</p><p className="font-bold text-red-500">{formatMoney(totalOut, mainCurrency)}</p></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center">🔥 <span className="text-2xl font-black">3</span> <span className="text-[10px] font-bold text-gray-400">RACHA</span></Card>
          <Card className="flex flex-col items-center">💰 <span className="text-xl font-black text-red-500">{formatMoney(totalOut, mainCurrency)}</span> <span className="text-[10px] font-bold text-gray-400">HOY</span></Card>
        </div>
        <div>
          <div className="flex justify-between items-center mb-4"><h3 className="font-black">Actividad reciente</h3><button onClick={()=>onNavigate('movements')} className="text-xs font-bold text-[#FFCE45]">Ver todo</button></div>
          <div className="space-y-3">
            {movements.slice(0,3).map((m,i)=>(
              <Card key={i} noPadding className="p-4 flex justify-between items-center bg-white/50 shadow-none">
                <div className="flex items-center gap-4"><span className="text-2xl">{m.icon}</span><div><p className="font-bold text-sm">{m.category}</p><p className="text-[10px] text-gray-400">{m.description}</p></div></div>
                <span className={`font-black ${m.type==='gasto'?'text-red-500':'text-green-600'}`}>{m.type==='gasto'?'-':'+'}{formatMoney(m.amount, m.currency)}</span>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
};

// --- MOVEMENTS ---
const MovementsScreen = ({ onNavigate, movements = [] }) => {
  const [filter, setFilter] = useState('todos');
  const filtered = movements.filter(m => filter === 'todos' || m.type === filter.slice(0, -1));
  return (
    <div className="pb-32 animate-in fade-in">
      <Header onNavigate={onNavigate} title="Movimientos" />
      <main className="px-6 space-y-6 mt-2">
        <div className="bg-white p-1 rounded-2xl flex border border-gray-100">
          {['gastos', 'ingresos', 'todos'].map(t=><button key={t} onClick={()=>setFilter(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${filter===t?'bg-[#FFCE45] text-[#221F26]':'text-gray-400'}`}>{t.toUpperCase()}</button>)}
        </div>
        <div className="space-y-3">
          {filtered.map((m,i)=>(
            <Card key={i} noPadding className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-4"><span className="text-xl">{m.icon}</span><div><p className="font-bold text-sm">{m.category}</p><p className="text-[10px] text-gray-400">{m.description}</p></div></div>
              <span className={`font-black ${m.type==='gasto'?'text-red-500':'text-green-600'}`}>{formatMoney(m.amount, m.currency)}</span>
            </Card>
          ))}
        </div>
      </main>
      <BottomNav activeTab="movements" onNavigate={onNavigate} />
    </div>
  );
};

// --- NEW MOVEMENT ---
const NewMovementScreen = ({ onNavigate, onSave, categories }) => {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6">
      <header className="mb-8"><button onClick={()=>onNavigate('home')}><ChevronRight className="rotate-180"/></button><h2 className="text-2xl font-black mt-4">Nuevo registro</h2></header>
      <div className="space-y-6">
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100">
          <button onClick={()=>setType('gasto')} className={`flex-1 py-3 rounded-xl font-bold ${type==='gasto'?'bg-red-50 text-red-500':'text-gray-400'}`}>Gasto</button>
          <button onClick={()=>setType('ingreso')} className={`flex-1 py-3 rounded-xl font-bold ${type==='ingreso'?'bg-green-50 text-green-600':'text-gray-400'}`}>Ingreso</button>
        </div>
        <Card className="text-center py-10">
          <p className="text-xs font-bold text-gray-400 mb-2">MONTO</p>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-5xl font-black text-center w-full outline-none" autoFocus/>
        </Card>
        <Card className="space-y-4">
          <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none">
            <option value="">Categoría</option>
            {categories[type].map(c=><option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
          </select>
          <input placeholder="Nota opcional" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none"/>
        </Card>
        <Button onClick={()=>onSave({type, amount:Number(amount), category:cat, description:desc, icon: categories[type].find(c=>c.label===cat)?.icon || '💰', currency:'ARS', date:new Date().toISOString()})}>Guardar</Button>
      </div>
    </div>
  );
};

// --- LEARN ---
const LearnScreen = ({ onNavigate }) => {
  const [chat, setChat] = useState([{role:'model', text:'¡Hola! Soy Mango IA. Preguntame lo que quieras sobre tus mangos.'}]);
  const [input, setInput] = useState('');
  const handleSend = async () => {
    if(!input.trim()) return;
    const newHistory = [...chat, {role:'user', text:input}];
    setChat(newHistory); setInput('');
    const res = await callGeminiText(input);
    setChat([...newHistory, {role:'model', text:res}]);
  };
  return (
    <div className="pb-32">
      <Header title="Aprender" />
      <main className="px-6 space-y-4">
        <div className="bg-white rounded-3xl h-[400px] flex flex-col p-4 border border-gray-100 shadow-sm">
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
            {chat.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`p-3 rounded-2xl max-w-[80%] text-sm font-bold ${m.role==='user'?'bg-[#FFCE45]':'bg-gray-100'}`}>{m.text}</div></div>)}
          </div>
          <div className="flex gap-2 mt-4"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Escribí acá..." className="flex-1 bg-gray-50 rounded-xl px-4 outline-none text-sm"/><button onClick={handleSend} className="bg-[#FFCE45] p-3 rounded-xl"><Send size={18}/></button></div>
        </div>
      </main>
      <BottomNav activeTab="learn" onNavigate={onNavigate} />
    </div>
  );
};

// --- MORE & SETTINGS ---
const MoreScreen = ({ onNavigate, userProfile }) => (
  <div className="pb-32">
    <Header title="Más" />
    <main className="px-6 space-y-6">
      <Card onClick={()=>onNavigate('configurar_perfil')} className="text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-white mb-4"><User size={40}/></div>
        <h3 className="font-black text-xl">{userProfile?.name}</h3>
        <p className="text-xs text-gray-400 font-bold">{userProfile?.email}</p>
      </Card>
      <Card className="!p-2 space-y-1">
        <button onClick={()=>onNavigate('presupuestos')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl font-bold">🎯 Presupuestos <ChevronRight size={18}/></button>
        <button onClick={()=>onNavigate('categorias')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl font-bold">⚙️ Categorías <ChevronRight size={18}/></button>
        <button onClick={()=>onNavigate('cotizaciones')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl font-bold">💵 Cotizaciones <ChevronRight size={18}/></button>
      </Card>
      <div onClick={()=>onNavigate('pro')} className="bg-gradient-to-br from-purple-900 to-black p-8 rounded-[40px] text-white text-center cursor-pointer shadow-xl">
        <h3 className="text-xl font-black mb-4">Pasate a PRO</h3>
        <Button>Activar Beneficios 🚀</Button>
      </div>
    </main>
    <BottomNav activeTab="more" onNavigate={onNavigate} />
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
  const [movements, setMovements] = useLocalState('manguito_movements', []);
  const [userProfile, setUserProfile] = useLocalState('manguito_profile', null);
  const [categories, setCategories] = useLocalState('manguito_categories', {
    gasto: [{ icon: '🍔', label: 'Comida' }, { icon: '🚌', label: 'Transporte' }, { icon: '🛒', label: 'Super' }],
    ingreso: [{ icon: '💼', label: 'Sueldo' }, { icon: '📈', label: 'Inversión' }]
  });

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
    switch(currentScreen) {
      case 'login': return <LoginScreen onNavigate={setCurrentScreen} triggerToast={showToast} userProfile={userProfile} isRegistered={!!userProfile}/>;
      case 'register': return <OnboardingFlow onFinish={(d)=>{setUserProfile(d); setCurrentScreen('home')}} onBack={()=>setCurrentScreen('login')}/>;
      case 'home': return <DashboardScreen onNavigate={setCurrentScreen} movements={movements} userProfile={userProfile} />;
      case 'movements': return <MovementsScreen onNavigate={setCurrentScreen} movements={movements} />;
      case 'new_movement': return <NewMovementScreen onNavigate={setCurrentScreen} onSave={handleSaveMovement} categories={categories} />;
      case 'learn': return <LearnScreen onNavigate={setCurrentScreen} />;
      case 'more': return <MoreScreen onNavigate={setCurrentScreen} userProfile={userProfile} />;
      default: return <DashboardScreen onNavigate={setCurrentScreen} movements={movements} userProfile={userProfile} />;
    }
  };

  return (
    <div className="max-w-md mx-auto shadow-2xl min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] relative overflow-x-hidden">
      <ThemeStyles />
      <Toast message={toast?.msg} type={toast?.type} />
      {renderScreen()}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}