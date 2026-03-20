import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, BarChart2, DollarSign, Plus, BookOpen, MoreHorizontal, RefreshCcw, 
  LogOut, Mail, Lock, User, ChevronRight, Settings, Send, Bell, ArrowUpRight, 
  ArrowDownRight, Eye, EyeOff, Smartphone, Fingerprint, LockKeyhole, Trash2, 
  Pencil, Handshake, Camera, Users, Target, FileText, Download, CheckCircle2, 
  Sparkles, TrendingUp, ShieldCheck, AlertCircle, Moon, Sun, KeyRound, CloudOff, Cloud
} from 'lucide-react';

// Mock de seguridad para que el entorno de previsualización compile sin errores
const useGoogleLogin = ({ onSuccess }) => {
  return () => {
    setTimeout(() => onSuccess({ access_token: "mock_token" }), 1000);
  };
};

// --- CONFIGURACIÓN DE ENTORNO (PRODUCCIÓN RENDER) ---
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000/api' : '/api',
  IS_LOCAL_MODE: false 
};

// --- Escudo Antifallos (Error Boundary) ---
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
          <p className="text-[#8B7C72] font-medium mb-8">Algo no cargó bien, pero tus datos están a salvo.</p>
          <button onClick={() => window.location.reload()} className="bg-[#FFCE45] text-[#221F26] px-8 py-4 rounded-2xl font-black shadow-md hover:scale-105 transition-all">
            Volver a intentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- MOTOR DE PETICIONES (Fetch Helper) ---
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
    throw new Error(errorData.detail || 'Error en la petición al backend');
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
    } catch (error) {}
  }, [key, state]);
  return [state, setState];
};

const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root { 
      --bg-base: #FFFBF2; --bg-card: #FFFFFF; --text-main: #221F26; --text-muted: #8B7C72; --border-color: #F3F4F6; --input-bg: rgba(249, 250, 251, 0.8); --nav-bg: rgba(255, 255, 255, 0.85); --card-shadow: 0 8px 30px rgba(0,0,0,0.03); --card-shadow-hover: 0 14px 40px rgba(0,0,0,0.06);
    }
    .dark { 
      --bg-base: #0D0B0F; --bg-card: #16141A; --text-main: #F3F4F6; --text-muted: #9CA3AF; --border-color: #2D2936; --input-bg: rgba(45, 41, 54, 0.4); --nav-bg: rgba(22, 20, 26, 0.85); --card-shadow: 0 8px 30px rgba(0,0,0,0.4); --card-shadow-hover: 0 14px 40px rgba(0,0,0,0.6);
    }
    body { background-color: var(--bg-base); color: var(--text-main); transition: background-color 0.4s ease, color 0.4s ease; }
    .theme-transition { transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease; }
  `}} />
);

const callGeminiText = async (prompt) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: `Sos Manguito...` }] }
  };
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) { return "Uy, tuve un problemita técnico. ✨"; }
};

const EXCHANGE_RATES = { ARS: 1, USD: 1000, EUR: 1100, GBP: 1400, BRL: 200 };
const convertCurrency = (amount, fromCurr, toCurr) => (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];
const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€', GBP: '£', BRL: 'R$' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

const MangoLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none"><path d="M105 75 C 110 45, 150 45, 155 60 C 160 75, 140 95, 120 90 C 110 88, 105 80, 105 75 Z" fill="#99CF43" stroke="#221F26" strokeWidth="12"/><path d="M100 65 C 135 60, 160 100, 140 145 C 120 185, 60 180, 50 145 C 40 110, 60 85, 80 75 C 88 70, 95 66, 100 65 Z" fill="#FFCE45" stroke="#221F26" strokeWidth="12"/></svg>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const v = { primary: 'bg-[#FFCE45] text-[#221F26]', secondary: 'bg-white text-[#221F26] border', ghost: 'bg-transparent', google: 'bg-white border', danger: 'bg-red-100 text-red-600', pro: 'bg-purple-600 text-white' };
  return <button className={`w-full py-3.5 px-6 rounded-2xl font-black ${v[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className={`relative ${className}`}>
    {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
    <input className={`w-full bg-gray-50 border-2 border-transparent rounded-[20px] py-4 ${Icon ? 'pl-14' : 'pl-6'} pr-6 outline-none focus:border-[#FFCE45]`} {...props} />
  </div>
);

const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-[32px] ${noPadding ? '' : 'p-6'} border ${className}`}>{children}</div>
);

const Toast = ({ message, type = 'success' }) => message ? (
  <div className="fixed top-8 left-0 right-0 z-[100] flex justify-center"><div className="bg-black text-white px-5 py-3 rounded-2xl shadow-2xl">{message}</div></div>
) : null;

const Header = ({ onNavigate, showGreeting = false, userName = "", profilePic = null, backButton = false, title = "Manguito" }) => (
  <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl transition-all" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <div className="flex items-center gap-4">
      {backButton ? (
        <button onClick={onNavigate} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full border border-[var(--border-color)] transition-all hover:-translate-x-1 outline-none"><ChevronRight size={24} className="rotate-180" /></button>
      ) : (
        <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center border border-[var(--border-color)] transform transition-transform hover:scale-105"><MangoLogo className="w-8 h-8" /></div>
      )}
      <div>
        {showGreeting && <p className="text-xs font-bold text-[var(--text-muted)] mb-0.5">¡Hola, {userName}!</p>}
        <span className="text-xl font-black text-[var(--text-main)] tracking-tight">{title}</span>
      </div>
    </div>
    <div className="flex gap-2 items-center">
      <button className="w-11 h-11 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[#FFCE45] transition-all border border-[var(--border-color)]"><Bell size={20} /></button>
    </div>
  </header>
);

const BottomNav = ({ activeTab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-[var(--border-color)] px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]" style={{ backgroundColor: 'var(--nav-bg)' }}>
    <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-[#FFCE45] scale-110' : 'text-[var(--text-muted)]'}`}>
      <Home size={24} /> <span className="text-[10px] font-bold">Inicio</span>
    </button>
    <button onClick={() => onNavigate('movements')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'movements' ? 'text-[#FFCE45]' : 'text-[var(--text-muted)]'}`}>
      <DollarSign size={24} /> <span className="text-[10px] font-bold">Movimientos</span>
    </button>
    <div className="-mt-16 group relative">
       <button onClick={() => onNavigate('new_movement')} className="w-16 h-16 bg-[#FFCE45] rounded-[24px] shadow-lg text-[#221F26] flex items-center justify-center active:scale-90 transition-all border-[3px] border-[var(--bg-base)]">
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
    <button onClick={() => onNavigate('learn')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'learn' ? 'text-[#FDBC3C]' : 'text-[var(--text-muted)]'}`}>
      <BookOpen size={24} /> <span className="text-[10px] font-bold">Aprender</span>
    </button>
    <button onClick={() => onNavigate('more')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'more' ? 'text-[#FFCE45]' : 'text-[var(--text-muted)]'}`}>
      <MoreHorizontal size={24} /> <span className="text-[10px] font-bold">Más</span>
    </button>
  </nav>
);

const BiometricLockScreen = ({ onUnlock }) => (
  <div className="fixed inset-0 z-50 bg-[#110F13] flex flex-col items-center justify-center">
    <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-8 border border-white/10"><MangoLogo className="w-14 h-14 opacity-80" /></div>
    <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Manguito Bloqueado</h2>
    <button onClick={onUnlock} className="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
      <Fingerprint size={40} className="text-[#FFCE45] animate-pulse" />
    </button>
  </div>
);

// PLACEHOLDER FOR REMAINING SCREANS
const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile, setUserProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = { email: "usuario.prueba@gmail.com", name: "Usuario Prueba" };
        const apiRes = await fetch(`${CONFIG.API_BASE_URL}/auth/google`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, name: userInfo.name })
        });
        const apiData = await apiRes.json();
        if (apiData.user?.isNewUser) onNavigate('register_google', apiData.user);
        else { setUserProfile({ ...userProfile, ...apiData.user, token: apiData.token }); onNavigate('home'); }
      } catch (e) { onNavigate('register_google', { email: 'usuario@gmail.com', name: 'Usuario Google' }); }
    }
  });
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 text-center">
      <MangoLogo className="mb-6 w-20 h-20" />
      <h1 className="text-4xl font-black mb-8">Manguito</h1>
      <Card className="w-full max-w-sm p-8 space-y-4">
        <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} icon={Mail} />
        <Input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} icon={Lock} />
        <Button onClick={() => onNavigate('home')}>Entrar</Button>
        <button onClick={() => loginConGoogle()} className="w-full py-3 border rounded-xl font-bold flex items-center justify-center gap-2">Google</button>
      </Card>
      <button onClick={() => onNavigate('register')} className="mt-6 font-bold text-[var(--text-muted)]">Crear cuenta</button>
    </div>
  );
};

const OnboardingFlow = ({ onFinish, onBack, mode = 'manual', initialData = {} }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: initialData.name || '', email: initialData.email || '', password: '', mainCurrency: 'ARS' });
  if (step === 3) return <div className="p-8 text-center"><h2 className="text-2xl font-black">Preparando...</h2><button onClick={() => onFinish(formData, {})} className="mt-8">Empezar</button></div>;
  return (
    <div className="p-8">
      <h2 className="text-3xl font-black mb-6">{step === 1 ? '¡Hola!' : 'Contraseña'}</h2>
      {step === 1 ? <Input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} placeholder="Nombre" /> : <Input type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} placeholder="Secreto" />}
      <Button onClick={() => setStep(step + 1)} className="mt-6">Siguiente</Button>
    </div>
  );
};

const DashboardScreen = ({ onNavigate, movements = [], userProfile }) => {
  const balance = movements.reduce((acc, m) => acc + (m.type === 'ingreso' ? m.amount : -m.amount), 0);
  return (
    <div className="min-h-screen pb-32">
      <Header onNavigate={onNavigate} showGreeting userName={userProfile?.name} />
      <main className="px-6 space-y-6">
        <Card className="text-center p-10 bg-gradient-to-br from-[#FFCE45] to-[#FDBC3C]">
          <p className="font-bold text-sm uppercase opacity-70">Balance Total</p>
          <h2 className="text-5xl font-black mt-2">{formatMoney(balance, userProfile?.mainCurrency)}</h2>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center"><p className="text-xs font-bold opacity-60">Gastos</p><p className="text-xl font-black">- {formatMoney(0)}</p></Card>
          <Card className="text-center"><p className="text-xs font-bold opacity-60">Ingresos</p><p className="text-xl font-black">+ {formatMoney(0)}</p></Card>
        </div>
        <h3 className="font-black text-lg">Últimos movimientos</h3>
        {movements.length === 0 ? <p className="text-center py-10 opacity-40">Sin datos</p> : (
          <div className="space-y-3">
            {movements.slice(0, 5).map((m, i) => (
              <Card key={i} className="flex justify-between items-center p-4">
                <span className="font-bold">{m.category}</span>
                <span className={`font-black ${m.type === 'gasto' ? 'text-red-500' : 'text-green-500'}`}>{m.type === 'gasto' ? '-' : '+'}{formatMoney(m.amount)}</span>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
};

const LearnScreen = ({ onNavigate }) => {
  const [chatIn, setChatIn] = useState('');
  return (
    <div className="min-h-screen pb-32">
      <Header onNavigate={onNavigate} title="Aprender" />
      <main className="px-6 space-y-4">
        <Card className="p-6 bg-blue-50">🤖 Mango IA: ¡Hola! Soy tu asistente financiero.</Card>
        <Input value={chatIn} onChange={e=>setChatIn(e.target.value)} placeholder="Preguntame algo..." />
      </main>
      <BottomNav activeTab="learn" onNavigate={onNavigate} />
    </div>
  );
};

const MoreScreen = ({ onNavigate, userProfile, triggerLock }) => (
  <div className="min-h-screen pb-32">
    <Header onNavigate={onNavigate} title="Más" />
    <main className="px-6 space-y-4">
      <Card onClick={() => onNavigate('configurar_perfil')} className="p-6 flex items-center justify-between"><span>👤 Perfil</span> <ChevronRight /></Card>
      <Card onClick={() => onNavigate('cotizaciones')} className="p-6 flex items-center justify-between"><span>💵 Dólar</span> <ChevronRight /></Card>
      <Card onClick={() => onNavigate('presupuestos')} className="p-6 flex items-center justify-between"><span>🎯 Metas</span> <ChevronRight /></Card>
      <Button variant="danger" onClick={() => window.location.reload()}>Cerrar Sesión</Button>
    </main>
    <BottomNav activeTab="more" onNavigate={onNavigate} />
  </div>
);

const ProScreen = ({ onNavigate }) => <div className="p-20 text-center bg-purple-900 text-white min-h-screen"><h2 className="text-3xl font-black">Manguito PRO</h2><Button className="mt-8" onClick={() => onNavigate('home')}>Volver</Button></div>;
const ModoParejaScreen = ({ onNavigate }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Pareja" /></div>;
const ExportarScreen = ({ onNavigate }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Exportar" /></div>;
const ConfigurarPerfilScreen = ({ onNavigate, userProfile }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Perfil" /><Button className="mt-8" onClick={() => onNavigate('more')}>Guardar</Button></div>;
const CotizacionesScreen = ({ onNavigate }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Dólar" /></div>;
const ConexionBancariaScreen = ({ onNavigate }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Bancos" /></div>;
const PresupuestosMetasScreen = ({ onNavigate }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Metas" /></div>;
const CategoriasScreen = ({ onNavigate }) => <div className="p-8"><Header onNavigate={() => onNavigate('more')} backButton title="Categorías" /></div>;

const MovementsScreen = ({ onNavigate, movements = [] }) => (
  <div className="min-h-screen pb-32">
    <Header onNavigate={onNavigate} title="Movimientos" />
    <main className="px-6 space-y-3 mt-4">
      {movements.map((m, i) => (
        <Card key={i} className="flex justify-between p-4">
          <span>{m.category}</span>
          <span className={m.type === 'gasto' ? 'text-red-500' : 'text-green-500'}>{formatMoney(m.amount)}</span>
        </Card>
      ))}
    </main>
    <BottomNav activeTab="movements" onNavigate={onNavigate} />
  </div>
);

const NewMovementScreen = ({ onNavigate, onSave, userProfile, categories }) => {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories['gasto'][0].label);
  const handleSave = () => {
    onSave({ type, amount: parseFloat(amount), category, currency: userProfile.mainCurrency, date: new Date().toISOString() });
  };
  return (
    <div className="p-8">
      <Header onNavigate={() => onNavigate('home')} backButton title="Nuevo" />
      <div className="flex gap-4 my-6">
        <button onClick={() => setType('gasto')} className={type === 'gasto' ? 'font-bold' : ''}>Gasto</button>
        <button onClick={() => setType('ingreso')} className={type === 'ingreso' ? 'font-bold' : ''}>Ingreso</button>
      </div>
      <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" />
      <Button onClick={handleSave} className="mt-8">Guardar</Button>
    </div>
  );
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isLocked, setIsLocked] = useState(false);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useLocalState('manguito_theme', 'light');
  const [movements, setMovements] = useLocalState('manguito_movements', []);
  const [userProfile, setUserProfile] = useLocalState('manguito_profile', { name: 'Usuario', mainCurrency: 'ARS' });
  const [categories] = useState({ 
    gasto: [{ icon: '🍔', label: 'Comida' }], 
    ingreso: [{ icon: '💼', label: 'Sueldo' }] 
  });
  const [budgets, setBudgets] = useLocalState('manguito_budgets', []);
  const [goals, setGoals] = useLocalState('manguito_goals', []);

  const showToast = (msg) => { setToast({msg}); setTimeout(() => setToast(null), 3000); };
  const navigateWithSecurity = (s) => setCurrentScreen(s);

  const handleSaveMovement = async (m) => {
    setMovements([m, ...movements]); showToast('¡Guardado!'); setCurrentScreen('home');
  };

  const handleResetData = () => { window.localStorage.clear(); window.location.reload(); };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const currentView = () => {
    const s = typeof currentScreen === 'object' ? currentScreen.name : currentScreen;
    if (s === 'login') return <LoginScreen onNavigate={navigateWithSecurity} setUserProfile={setUserProfile} />;
    if (s === 'home') return <DashboardScreen onNavigate={navigateWithSecurity} movements={movements} userProfile={userProfile} />;
    if (s === 'new_movement') return <NewMovementScreen onNavigate={navigateWithSecurity} onSave={handleSaveMovement} userProfile={userProfile} categories={categories} />;
    if (s === 'movements') return <MovementsScreen onNavigate={navigateWithSecurity} movements={movements} />;
    if (s === 'learn') return <LearnScreen onNavigate={navigateWithSecurity} />;
    if (s === 'more') return <MoreScreen onNavigate={navigateWithSecurity} userProfile={userProfile} triggerLock={() => setIsLocked(true)} />;
    if (s === 'configurar_perfil') return <ConfigurarPerfilScreen onNavigate={navigateWithSecurity} userProfile={userProfile} />;
    return <DashboardScreen onNavigate={navigateWithSecurity} movements={movements} userProfile={userProfile} />;
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ThemeStyles />
      <Toast message={toast?.msg} />
      {currentView()}
    </div>
  );
}

export default function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }
