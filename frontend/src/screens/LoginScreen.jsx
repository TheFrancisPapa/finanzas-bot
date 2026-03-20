import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MangoLogo } from '../assets/logos';
import GoogleAccountSelector from '../components/GoogleAccountSelector';
import * as api from '../lib/api';

const LoginScreen = ({ onNavigate, triggerToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      triggerToast('Completá tus datos para entrar.', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(email, password);
      api.setToken(data.token);
      if (data.onboarding_pendiente) {
        onNavigate('register');
      } else {
        onNavigate('home');
      }
    } catch (err) {
      triggerToast(err.message || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth flow
    window.location.href = api.googleLoginUrl();
  };

  const handleGoogleSuccess = (selectedEmail, selectedName) => {
    setShowGoogleModal(false);
    // In production, use the real Google OAuth redirect
    handleGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      {showGoogleModal && <GoogleAccountSelector onClose={() => setShowGoogleModal(false)} onSelect={handleGoogleSuccess} />}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
      
      <div className="mb-10 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-32 h-32 bg-[var(--bg-card)] rounded-[40px] flex items-center justify-center mb-6 shadow-lg mx-auto border border-[var(--border-color)] relative transform hover:scale-105 transition-transform duration-500">
          <MangoLogo className="w-20 h-20 drop-shadow-sm" />
        </div>
        <h1 className="text-5xl font-black text-[var(--text-main)] mb-2 tracking-tight">Manguito</h1>
        <p className="text-[var(--text-muted)] font-semibold text-sm tracking-wide">Tu copiloto financiero</p>
      </div>

      <div className="w-full max-w-md bg-[var(--bg-card)] backdrop-blur-2xl rounded-[40px] p-8 border border-[var(--border-color)] relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both" style={{boxShadow: 'var(--card-shadow)'}}>
        <h3 className="font-black text-xl text-[var(--text-main)] mb-6 text-center">¡Qué bueno verte!</h3>
        <Input placeholder="Email" type="email" icon={Mail} value={email} onChange={e=>setEmail(e.target.value)} className="mb-4" />
        <Input placeholder="Contraseña" type="password" icon={Lock} value={password} onChange={e=>setPassword(e.target.value)} className="mb-2" />
        <div className="text-right mb-6"><button className="text-xs font-bold text-[#FFCE45] hover:text-[#FDBC3C] transition-colors">¿Olvidaste tu contraseña?</button></div>
        <Button onClick={handleLogin} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)] font-bold tracking-wider rounded-full">o</span></div>
        </div>

        <Button variant="google" className="py-4 mb-4" onClick={handleGoogleLogin}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> Continuar con Google
        </Button>
        
        <p className="text-center text-sm font-bold text-[var(--text-muted)] mt-6">
          ¿No tenés cuenta? <button onClick={() => onNavigate('register')} className="text-[#FFCE45] hover:underline ml-1">Registrate acá</button>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
