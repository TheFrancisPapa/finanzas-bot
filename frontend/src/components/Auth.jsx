import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ChevronRight, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
// Importamos los componentes base desde el archivo Shared
import { MangoLogo, Button, Input, CONFIG } from './Shared';

// ==========================================
// 1. HOOK NATIVO DE GOOGLE
// ==========================================
export const useGoogleLogin = ({ onSuccess, onError }) => {
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

// ==========================================
// 2. PANTALLA PRINCIPAL DE LOGIN
// ==========================================
export const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile, setUserProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        
        const apiRes = await fetch(`${CONFIG.API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email, name: userInfo.name, picture: userInfo.picture })
        });

        const apiData = await apiRes.json();
        if (apiData.user?.isNewUser) {
          onNavigate('register_google', userInfo);
        } else {
          setUserProfile({ ...apiData.user, token: apiData.token });
          onNavigate('home');
        }
      } catch (error) {
        triggerToast('Error en la conexión con Google', 'error');
      } finally {
        setLoading(false);
      }
    },
    onError: () => triggerToast('Se canceló el inicio de sesión', 'error'),
  });

  const handleLogin = () => { 
    if (!isRegistered || !userProfile) return triggerToast('Creá tu cuenta primero', 'error');
    if (!email || !password) return triggerToast('Completá email y contraseña', 'error');
    if (email.toLowerCase().trim() !== userProfile.email?.toLowerCase().trim() || password !== userProfile.password) return triggerToast('Email o contraseña incorrectos', 'error');
    onNavigate('home'); 
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#FFCE45] rounded-full filter blur-[100px] opacity-20"></div>
      
      <div className="mb-8 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8">
        <div className="w-32 h-32 bg-[var(--bg-card)] rounded-[40px] flex items-center justify-center mb-6 shadow-lg mx-auto border border-[var(--border-color)]">
          <MangoLogo className="w-20 h-20" />
        </div>
        <h1 className="text-5xl font-black text-[var(--text-main)] mb-2 tracking-tight">Manguito</h1>
        <p className="text-[var(--text-muted)] font-semibold text-sm">Tu copiloto financiero</p>
      </div>

      <div className="w-full max-w-md bg-[var(--bg-card)] backdrop-blur-2xl rounded-[40px] p-8 border border-[var(--border-color)] shadow-[var(--card-shadow)] z-10 animate-in fade-in slide-in-from-bottom-12">
        <h3 className="font-black text-2xl mb-6 text-center">Acceder</h3>
        
        <Input placeholder="correo@ejemplo.com" type="email" icon={Mail} value={email} onChange={e=>setEmail(e.target.value)} className="mb-4" />
        <Input placeholder="Contraseña secreta" type="password" icon={Lock} value={password} onChange={e=>setPassword(e.target.value)} className="mb-6" />
        
        <Button onClick={handleLogin}>Entrar a mi cuenta</Button>
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)] rounded-full">o ingresar con</span>
          </div>
        </div>
        
        <Button variant="google" onClick={loginConGoogle} disabled={loading}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded-full" alt="G" />
          )}
          Continuar con Google
        </Button>
      </div>

      <div className="w-full max-w-md mt-6 relative z-10">
        <button onClick={() => onNavigate('register')} className="group w-full rounded-[32px] bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-2 hover:border-[#FFCE45] transition-all">
          <div className="flex items-center justify-between px-5 py-4 text-left">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1 block">¿Sos nuevo por acá?</span>
              <span className="text-xl font-black">Creá tu cuenta gratis</span>
            </div>
            <div className="w-12 h-12 bg-[#FFCE45] rounded-2xl flex items-center justify-center text-[#221F26] group-hover:scale-110 transition-transform">
              <ArrowUpRight size={24} strokeWidth={3}/>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 3. FLUJO DE REGISTRO (ONBOARDING)
// ==========================================
export const OnboardingFlow = ({ onFinish, onBack, mode = 'manual', initialData = {} }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: initialData.name || '', email: initialData.email || '', password: '', 
    dob: '', goal: '', mainCurrency: 'ARS', authProvider: mode, profilePic: initialData.picture || null 
  });

  const hasLen = formData.password.length >= 8; 
  const hasUpper = /[A-Z]/.test(formData.password); 
  const hasNum = /[0-9]/.test(formData.password);
  const passSecure = hasLen && hasUpper && hasNum;

  const stepsFlow = mode === 'manual' ? [
    { id: 'name_email', title: '¡Hola!\nVamos a conocerte', desc: '¿Cómo te llamás y cuál es tu email?' },
    { id: 'password', title: 'Tu seguridad\nes clave 🔒', desc: 'Creá una contraseña fuerte para proteger tus mangos.' },
    { id: 'dob', title: '¿Cuándo naciste?', desc: 'Para adaptar los consejos a tu edad.' },
    { id: 'currency', title: 'Último paso', desc: '¿En qué moneda querés ver tu balance principal?' },
    { id: 'loading', title: 'Preparando todo...', desc: 'Personalizando el dashboard para vos.' }
  ] : [
    { id: 'name_email', title: 'Confirmá tus datos', desc: 'Extraídos de forma segura de Google.' },
    { id: 'dob', title: 'Falta un datito', desc: '¿Cuándo naciste?' },
    { id: 'currency', title: 'Último paso', desc: '¿En qué moneda querés ver tu balance principal?' },
    { id: 'loading', title: 'Preparando todo...', desc: 'Personalizando el dashboard para vos.' }
  ];

  const currentStepData = stepsFlow[step - 1];

  useEffect(() => { 
    if (currentStepData.id === 'loading') setTimeout(() => onFinish(formData), 2500); 
  }, [step]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col p-6 relative">
      {currentStepData.id !== 'loading' && (
        <header className="pt-6 pb-4 flex justify-between items-center z-20">
          <button onClick={() => step === 1 ? onBack() : setStep(step - 1)} className="w-10 h-10 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-sm border border-[var(--border-color)]">
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div className="flex gap-2">
            {stepsFlow.map((s, i) => s.id !== 'loading' && (
              <div key={i} className={`h-2 w-6 rounded-full transition-all ${i < step ? 'bg-[#FFCE45]' : 'bg-[var(--border-color)]'}`}></div>
            ))}
          </div>
        </header>
      )}
      
      <div className="flex-1 flex flex-col justify-center relative z-10 max-w-md w-full mx-auto step-animate" key={step}>
        {currentStepData.id !== 'loading' && (
          <>
            <h2 className="text-4xl font-black mb-3 whitespace-pre-line text-[var(--text-main)]">{currentStepData.title}</h2>
            <p className="text-[var(--text-muted)] mb-8 text-lg">{currentStepData.desc}</p>
          </>
        )}
        
        {currentStepData.id === 'name_email' && (
          <>
            <Input placeholder="Tu nombre" icon={User} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mb-4" />
            <Input placeholder="correo@ejemplo.com" type="email" icon={Mail} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={mode === 'google'} className={mode === 'google' ? 'opacity-60' : ''} />
          </>
        )}
        
        {currentStepData.id === 'password' && (
          <>
            <Input placeholder="Contraseña secreta" type="password" icon={Lock} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mb-6" />
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-[24px]">
              <p className="text-xs font-black uppercase text-[var(--text-muted)] mb-3">Requisitos</p>
              <ul className="space-y-3">
                <li className={`flex gap-3 text-sm font-bold ${hasLen ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasLen ? <CheckCircle2 size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full"/>} 8 caracteres</li>
                <li className={`flex gap-3 text-sm font-bold ${hasUpper ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasUpper ? <CheckCircle2 size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full"/>} 1 Mayúscula</li>
                <li className={`flex gap-3 text-sm font-bold ${hasNum ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasNum ? <CheckCircle2 size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full"/>} 1 Número</li>
              </ul>
            </div>
          </>
        )}
        
        {currentStepData.id === 'dob' && <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />}

        {currentStepData.id === 'currency' && (
          <div className="grid grid-cols-2 gap-3">
            {['ARS', 'USD', 'EUR', 'BRL'].map(cur => (
              <button key={cur} onClick={() => setFormData({...formData, mainCurrency: cur})} className={`p-5 rounded-[24px] border-2 font-black text-xl transition-all ${formData.mainCurrency === cur ? 'border-[#FFCE45] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>{cur}</button>
            ))}
          </div>
        )}
        
        {currentStepData.id === 'loading' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-[var(--bg-card)] rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-xl border border-[var(--border-color)] relative">
              <MangoLogo className="w-14 h-14 animate-pulse" />
              <div className="absolute inset-0 border-4 border-[#FFCE45] rounded-[32px] animate-spin border-t-transparent"></div>
            </div>
            <h2 className="text-3xl font-black text-[var(--text-main)] mb-2">{currentStepData.title}</h2>
          </div>
        )}
      </div>

      {currentStepData.id !== 'loading' && (
        <div className="relative z-20 pt-8 mt-auto">
          <Button onClick={() => {
            if (currentStepData.id === 'name_email' && (!formData.name || !formData.email)) return;
            if (currentStepData.id === 'password' && !passSecure) return;
            if (currentStepData.id === 'dob' && !formData.dob) return;
            if (step < stepsFlow.length) setStep(step + 1);
          }} className="py-5 text-lg">{currentStepData.id === 'currency' ? 'Empezar 🚀' : 'Continuar'}</Button>
        </div>
      )}
    </div>
  );
};