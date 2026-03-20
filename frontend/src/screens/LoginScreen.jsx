import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MangoLogo } from '../assets/logos';
import GoogleAccountSelector from '../components/GoogleAccountSelector';
import * as api from '../lib/api';

const LoginScreen = ({ onNavigate, triggerToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    // Check password strength
    if (!password) setPasswordStrength(0);
    else if (password.length < 6) setPasswordStrength(1);
    else if (password.length < 10) setPasswordStrength(2);
    else setPasswordStrength(3);
  }, [password]);

  const handleEmailBlur = async () => {
    if (!emailPattern.test(email)) return;
    // Optional: Check if user exists via API
    try {
      // Logic for pre-checking if user exists
    } catch (e) {}
  };

  const handleAction = async () => {
    if (!emailPattern.test(email)) {
      triggerToast('Ingresá un email válido.', 'error');
      return;
    }
    if (password.length < 6) {
      triggerToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email, password);
      api.setToken(data.token);
      if (data.onboarding_pendiente) {
        onNavigate('onboarding');
      } else {
        onNavigate('home');
      }
    } catch (err) {
      if (err.status === 404) {
        onNavigate('register');
      } else {
        triggerToast(err.message || 'Error de acceso', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = api.googleLoginUrl();
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {showGoogleModal && <GoogleAccountSelector onClose={() => setShowGoogleModal(false)} onSelect={() => handleGoogleLogin()} />}
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#9D50FF] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-24 h-24 bg-[var(--bg-card)] rounded-[32px] flex items-center justify-center mb-6 shadow-xl mx-auto border border-[var(--border-color)] transform hover:scale-110 transition-transform duration-500">
            <MangoLogo className="w-14 h-14" />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-main)] mb-1 tracking-tight">Manguito</h1>
          <p className="text-[var(--text-muted)] font-black uppercase text-[10px] tracking-[0.2em] opacity-80">Tu copiloto financiero</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-8 shadow-[var(--card-shadow)] animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[var(--text-main)]">¡Hola! 🥭</h2>
            <p className="text-sm font-bold text-[var(--text-muted)] mt-1">Ingresá para continuar</p>
          </div>

          <div className="space-y-4">
            <Input 
              icon={Mail} 
              placeholder="Tu email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
            />
            
            <div className="relative group">
              <Input 
                icon={Lock} 
                placeholder="Tu contraseña" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password && (
              <div className="flex gap-1.5 px-1 pt-1 opacity-70 group-focus-within:opacity-100 transition-opacity">
                {[1, 2, 3].map(lvl => (
                  <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= lvl ? (passwordStrength === 1 ? 'bg-[#E53E3E]' : passwordStrength === 2 ? 'bg-[#FFCE45]' : 'bg-[#99CF43]') : 'bg-[var(--border-color)]'}`} />
                ))}
              </div>
            )}
          </div>

          <Button 
            className="mt-8 py-4" 
            onClick={handleAction} 
            disabled={loading}
          >
            {loading ? 'Procesando...' : (isNewUser ? 'Crear cuenta' : 'Entrar')}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)]">O USANDO</span></div>
          </div>

          <Button 
            variant="google" 
            onClick={() => {
              triggerToast('Iniciando conexión con Google...', 'success');
              setShowGoogleModal(true);
            }}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              className="w-5 h-5 mr-3" 
              alt="G" 
              style={{ pointerEvents: 'none' }}
            />
            <span style={{ pointerEvents: 'none' }}>Google</span>
          </Button>

          <p className="text-center text-xs font-bold text-[var(--text-muted)] mt-8">
            Al continuar aceptás nuestros <button className="text-[var(--text-main)] underline">Términos</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
