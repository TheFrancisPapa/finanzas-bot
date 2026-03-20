import React, { useState } from 'react';
import { Mail, Lock, User, ArrowUpRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MangoLogo } from '../assets/logos';
import * as api from '../lib/api';

const LoginScreen = ({ onNavigate, triggerToast, isRegistered, userProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => { 
    if (!isRegistered || !userProfile) {
      return triggerToast('No encontramos tu cuenta. ¡Creala tocando abajo en "Crear cuenta"! 👇', 'error');
    } 
    if (!email || !password) {
      return triggerToast('¡Che! Completá tu email y contraseña para entrar.', 'error');
    }
    
    if (email.toLowerCase().trim() !== userProfile.email.toLowerCase().trim() || password !== userProfile.password) {
      return triggerToast('Email o contraseña incorrectos. Revisalos bien.', 'error');
    }
    
    onNavigate('home'); 
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return triggerToast('Escribí tu email primero y te mandamos las instrucciones.', 'error');
    }
    triggerToast(`Te enviamos un link de recuperación a ${email} 📧`);
  }

  const handleGoogleLogin = () => {
    triggerToast('Redirigiendo a Google...');
    window.location.href = api.googleLoginUrl();
  };

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

      <div className="w-full max-w-md bg-[var(--bg-card)] backdrop-blur-2xl rounded-[40px] p-8 border border-[var(--border-color)] relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both" style={{boxShadow: 'var(--card-shadow)'}}>
        
        <h3 className="font-black text-2xl text-[var(--text-main)] mb-6 text-center tracking-tight">Acceder</h3>
        
        <Input placeholder="correo@ejemplo.com" type="email" icon={Mail} value={email} onChange={e=>setEmail(e.target.value)} className="mb-4" />
        <Input placeholder="Contraseña secreta" type="password" icon={Lock} value={password} onChange={e=>setPassword(e.target.value)} className="mb-2" />
        
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
          onClick={handleGoogleLogin} 
          className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-0.5 active:bg-gray-100 dark:active:bg-gray-900 active:translate-y-0 active:scale-[0.98] transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded-full" alt="Google" />
          Continuar con Google
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
              <ArrowUpRight size={24} strokeWidth={3}/>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
