import React, { useState } from 'react';
import { User, Save, LogOut, Trash2, Sun, Moon, Link2, ShieldCheck, Fingerprint, EyeOff, Lock, ChevronRight, X, Camera } from 'lucide-react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ConfigurarPerfilScreen = ({ onNavigate, userProfile, setUserProfile, onLogout, triggerToast }) => {
  const [editData, setEditData] = useState({ 
    name: userProfile.name || '', 
    email: userProfile.email || '',
    dob: userProfile.dob || ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    setUserProfile({ ...userProfile, ...editData });
    triggerToast('¡Perfil actualizado! ✨');
    onNavigate('more');
  };

  const Switch = ({ enabled, onChange, icon: Icon }) => (
    <button 
      onClick={onChange}
      className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${enabled ? 'bg-[#FFCE45]' : 'bg-[var(--border-color)]'}`}
    >
      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${enabled ? 'translate-x-6' : 'translate-x-0'}`}>
        {Icon && <Icon size={12} className={enabled ? 'text-[#FFCE45]' : 'text-gray-400'} />}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header onNavigate={() => onNavigate('more')} title="Mi Perfil" backButton />
      
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/20 animate-in fade-in duration-300">
          <Card className="w-full max-w-sm relative !p-8 shadow-2xl">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[#FFCE45]"><X size={20}/></button>
            <h3 className="text-xl font-black text-[var(--text-main)] mb-6">Nueva Contraseña</h3>
            <div className="space-y-4">
              <Input placeholder="Contraseña actual" type="password" icon={Lock} />
              <Input placeholder="Nueva contraseña" type="password" icon={Lock} />
              <Input placeholder="Confirmar nueva" type="password" icon={Lock} />
            </div>
            <Button onClick={() => { setShowPasswordModal(false); triggerToast("Contraseña cambiada"); }} className="mt-8">Actualizar</Button>
          </Card>
        </div>
      )}

      <main className="px-6 space-y-6 mt-4">
        {/* Identidad */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2 opacity-50">Identidad</p>
          <Card className="relative overflow-hidden !p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-24 h-24 bg-[#221F26] rounded-[32px] flex items-center justify-center text-white shadow-xl border-4 border-[var(--bg-card)] overflow-hidden">
                  {userProfile.profilePic ? <img src={userProfile.profilePic} alt="P" className="w-full h-full object-cover" /> : <User size={40} />}
                </div>
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#FFCE45] text-[#221F26] rounded-2xl flex items-center justify-center shadow-lg border-4 border-[var(--bg-card)] active:scale-95 transition-all">
                  <Camera size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <Input placeholder="Tu nombre" icon={User} value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              <Input 
                placeholder="Email" 
                type="email" 
                value={editData.email} 
                disabled={userProfile.authProvider === 'google'} 
                className={userProfile.authProvider === 'google' ? 'opacity-60' : ''}
              />
              {userProfile.authProvider === 'google' && (
                <div className="bg-[#4285F4]/10 p-3 rounded-2xl flex items-center gap-3 border border-[#4285F4]/20 mx-1">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 bg-white p-0.5 rounded-full" alt="G" />
                  <p className="text-[11px] font-black text-[#4285F4] uppercase tracking-wider">Cuenta Google Vinculada</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Seguridad */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2 opacity-50">Seguridad & Privacidad</p>
          <Card className="!p-4 space-y-1">
            <div className="flex items-center justify-between p-4 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#FFCE45] shadow-sm"><Fingerprint size={20} strokeWidth={2.5}/></div>
                <div><p className="text-sm font-black text-[var(--text-main)]">Biometría</p><p className="text-[10px] font-bold text-[var(--text-muted)]">FaceID o Huella</p></div>
              </div>
              <Switch enabled={userProfile.biometrics} onChange={() => setUserProfile({...userProfile, biometrics: !userProfile.biometrics})} icon={Fingerprint} />
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><EyeOff size={20} strokeWidth={2.5}/></div>
                <div><p className="text-sm font-black text-[var(--text-main)]">Modo Oculto</p><p className="text-[10px] font-bold text-[var(--text-muted)]">Ocultar saldos al entrar</p></div>
              </div>
              <Switch enabled={userProfile.hideBalances} onChange={() => setUserProfile({...userProfile, hideBalances: !userProfile.hideBalances})} icon={EyeOff} />
            </div>

            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--border-color)]/30 rounded-3xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 shadow-sm"><Lock size={20} strokeWidth={2.5}/></div>
                <p className="text-sm font-black text-[var(--text-main)]">Cambiar Contraseña</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          </Card>
        </div>

        {/* Preferencias */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2 opacity-50">Preferencias</p>
          <Card className="!p-6 space-y-6">
            <div>
              <h4 className="font-black text-[var(--text-main)] text-sm mb-4">Moneda principal</h4>
              <div className="grid grid-cols-4 gap-3">
                {['ARS', 'USD', 'EUR', 'BRL'].map(cur => (
                  <button key={cur} onClick={() => setUserProfile({...userProfile, mainCurrency: cur})} className={`py-4 rounded-2xl font-black text-xs transition-all ${userProfile.mainCurrency === cur ? 'bg-[#FFCE45] text-[#221F26] shadow-md border-2 border-[#FFCE45]' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-2 border-transparent hover:border-[var(--border-color)]'}`}>{cur}</button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-black text-[var(--text-main)] text-sm mb-4">Tema dinámico</h4>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { document.documentElement.classList.remove('dark'); setUserProfile({...userProfile, theme: 'light'}); }} className={`p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 border-2 transition-all ${userProfile.theme !== 'dark' ? 'border-[#FFCE45] bg-[var(--input-bg)] text-[var(--text-main)] shadow-sm' : 'border-[var(--border-color)] text-[var(--text-muted)] opacity-60'}`}>
                  <Sun size={18} /> CLARO
                </button>
                <button onClick={() => { document.documentElement.classList.add('dark'); setUserProfile({...userProfile, theme: 'dark'}); }} className={`p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 border-2 transition-all ${userProfile.theme === 'dark' ? 'border-[#FFCE45] bg-[var(--input-bg)] text-[var(--text-main)] shadow-sm' : 'border-[var(--border-color)] text-[var(--text-muted)] opacity-60'}`}>
                  <Moon size={18} /> OSCURO
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-3 pt-6">
          <Button onClick={handleSave} className="py-4.5 text-base shadow-lg shadow-[#FFCE45]/20">Guardar todos los cambios</Button>
          <Button onClick={onLogout} variant="secondary" className="!bg-transparent !border-[var(--border-color)] text-[var(--text-muted)]"><LogOut size={18} /> Cerrar Sesión</Button>
          
          <div className="pt-8 text-center">
            {showDeleteConfirm ? (
              <div className="bg-[#FFEBEB] dark:bg-[#3B1212] p-6 rounded-[32px] border border-[#E53E3E]/20 animate-in zoom-in duration-300">
                <p className="font-black text-[#E53E3E] text-xs uppercase tracking-widest mb-4">⚠️ ¿Borrar cuenta permanentemente?</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary" className="flex-1 py-3 text-xs">NO, VOLVER</Button>
                  <Button onClick={() => { onLogout(); triggerToast('Cuenta eliminada'); }} variant="danger" className="flex-1 py-3 text-xs shadow-none">SÍ, BORRAR</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] font-black text-[#E53E3E]/50 uppercase tracking-[0.3em] hover:text-[#E53E3E] transition-colors flex items-center justify-center gap-2 mx-auto">
                <Trash2 size={12} /> Eliminar mi cuenta
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfigurarPerfilScreen;
