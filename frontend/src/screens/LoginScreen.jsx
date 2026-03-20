import { Mail, Lock, User, ArrowUpRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MangoLogo } from '../assets/logos';
import * as api from '../lib/api';

const LoginScreen = ({ onNavigate, triggerToast, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => { 
    if (!email || !password) {
      return triggerToast('¡Che! Completá tu email y contraseña para entrar.', 'error');
    }
    
    setLoading(true);
    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.token);
    } catch (err) {
      triggerToast(err.message || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return triggerToast('Escribí tu email primero y te mandamos las instrucciones.', 'error');
    }
    triggerToast(`Te enviamos un link de recuperación a ${email} 📧`);
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.googleAuth(credentialResponse.credential);
      onLoginSuccess(res.token);
    } catch (err) {
      triggerToast('Error al autenticar con Google. Intentá de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
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
        
        <Button onClick={handleLogin} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar a mi cuenta'}
        </Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)] rounded-full">o ingresar con</span></div>
        </div>

        <div className="flex justify-center flex-col items-center">
          <GoogleLogin 
            onSuccess={handleGoogleSuccess}
            onError={() => triggerToast('Error en el login de Google', 'error')}
            theme="filled_blue"
            shape="pill"
            text="continue_with"
            locale="es"
            width="100%"
          />
        </div>
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
