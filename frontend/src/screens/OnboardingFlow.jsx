import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const OnboardingFlow = ({ onFinish, onBack, mode = 'manual', initialData = {} }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: initialData.name || '', email: initialData.email || '', password: '', dob: '', goal: '', mainCurrency: 'ARS', authProvider: mode 
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
          <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-card)] rounded-full transition-colors active:scale-90 shadow-sm border border-[var(--border-color)]">
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
              <Input placeholder="Tu nombre o apodo" icon={User} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus className="mb-4" />
              <div className="relative">
                <Input placeholder="correo@ejemplo.com" type="email" icon={Mail} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={mode === 'google'} className={mode === 'google' ? 'opacity-60 pointer-events-none' : ''} />
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
              <Input placeholder="Contraseña secreta" type="password" icon={Lock} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} autoFocus className="mb-6" />
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-[24px] shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Requisitos</p>
                <ul className="space-y-3">
                  <li className={`flex items-center gap-3 font-bold text-sm transition-colors ${hasLen ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasLen ? <CheckCircle2 size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full"/>} Mínimo 8 caracteres</li>
                  <li className={`flex items-center gap-3 font-bold text-sm transition-colors ${hasUpper ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasUpper ? <CheckCircle2 size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full"/>} Una mayúscula</li>
                  <li className={`flex items-center gap-3 font-bold text-sm transition-colors ${hasNum ? 'text-[#639639]' : 'text-[var(--text-muted)]'}`}>{hasNum ? <CheckCircle2 size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full"/>} Un número</li>
                </ul>
              </div>
            </>
          )}

          {currentStepData.id === 'dob' && (
            <>
              <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="mb-6" autoFocus/>
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
                {id: 'control', icon: '📝', title: 'Controlar gastos', desc: 'Saber en qué se me va la plata.'},
                {id: 'save', icon: '🎯', title: 'Ahorrar para una meta', desc: 'Viaje, auto, mudanza...'},
                {id: 'invest', icon: '📈', title: 'Aprender a invertir', desc: 'Hacer rendir mis ahorros.'}
              ].map(opt => (
                <button key={opt.id} onClick={() => setFormData({...formData, goal: opt.id})} className={`w-full p-5 rounded-[24px] border-2 text-left flex gap-4 transition-all ${formData.goal === opt.id ? 'border-[#FFCE45] bg-[var(--bg-card)] shadow-md scale-[1.02]' : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-70 hover:opacity-100 hover:border-[#FFCE45]/50'}`}>
                  <span className="text-3xl">{opt.icon}</span>
                  <div><h4 className="font-black text-[var(--text-main)]">{opt.title}</h4><p className="text-xs text-[var(--text-muted)] font-bold mt-1">{opt.desc}</p></div>
                </button>
              ))}
              <button onClick={nextStep} className="w-full text-center text-sm font-bold text-[var(--text-muted)] hover:text-[#FFCE45] mt-4 py-2 transition-colors">Omitir este paso</button>
            </div>
          )}

          {currentStepData.id === 'initial_setup' && (
            <div className="space-y-4">
              {!initialSetup.type ? (
                <>
                  <button onClick={() => setInitialSetup({...initialSetup, type: 'budget'})} className="w-full p-6 rounded-[24px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-left flex items-center gap-4 hover:border-[#FFCE45] hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl">🛒</div>
                    <div><h4 className="font-black text-[var(--text-main)] text-lg">Presupuesto Mensual</h4><p className="text-xs text-[var(--text-muted)] font-medium">Ej: Gastar máx. $100.000 en Super</p></div>
                  </button>
                  <button onClick={() => setInitialSetup({...initialSetup, type: 'goal'})} className="w-full p-6 rounded-[24px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-left flex items-center gap-4 hover:border-[#FFCE45] hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl">🚗</div>
                    <div><h4 className="font-black text-[var(--text-main)] text-lg">Meta de Ahorro</h4><p className="text-xs text-[var(--text-muted)] font-medium">Ej: Juntar US$5.000 para un auto</p></div>
                  </button>
                  <button onClick={nextStep} className="w-full text-center text-sm font-bold text-[var(--text-muted)] hover:text-[#FFCE45] mt-2 py-2 transition-colors">Omitir, lo armo después</button>
                </>
              ) : (
                <div className="animate-in fade-in duration-300 bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black text-[var(--text-main)] text-lg flex items-center gap-2">
                       {initialSetup.type === 'budget' ? '🛒 Tu Presupuesto' : '🚗 Tu Meta'}
                    </h4>
                    <button onClick={() => setInitialSetup({ type: null, name: '', amount: '' })} className="text-xs font-bold text-[#E53E3E] bg-[#FFEBEB] px-3 py-1.5 rounded-lg">Cancelar</button>
                  </div>
                  <Input placeholder={initialSetup.type === 'budget' ? "Ej: Supermercado" : "Ej: Auto 0km"} value={initialSetup.name} onChange={e => setInitialSetup({...initialSetup, name: e.target.value})} className="mb-4" />
                  <Input placeholder="Monto objetivo ($)" type="number" value={initialSetup.amount} onChange={e => setInitialSetup({...initialSetup, amount: e.target.value})} />
                </div>
              )}
            </div>
          )}

          {currentStepData.id === 'currency' && (
            <div className="grid grid-cols-2 gap-3">
              {['ARS', 'USD', 'EUR', 'BRL'].map(cur => (
                <button key={cur} onClick={() => setFormData({...formData, mainCurrency: cur})} className={`p-5 rounded-[24px] border-2 font-black text-xl transition-all ${formData.mainCurrency === cur ? 'border-[#FFCE45] bg-[var(--bg-card)] text-[var(--text-main)] shadow-md scale-105' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                  {cur}
                </button>
              ))}
            </div>
          )}

          {currentStepData.id === 'loading' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[var(--bg-card)] rounded-[32px] flex items-center justify-center mb-8 shadow-xl border border-[var(--border-color)] relative">
                <div className="w-14 h-14 animate-pulse text-5xl flex items-center justify-center">🥭</div>
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
            className="py-5 text-lg shadow-[0_10px_30px_rgba(255,206,69,0.3)]"
          >
            {currentStepData.id === 'currency' ? 'Empezar con Manguito 🚀' : 'Continuar'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;
