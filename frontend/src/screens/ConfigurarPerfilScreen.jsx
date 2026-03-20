import React, { useState } from 'react';
import { User, Save, LogOut, Trash2, Sun, Moon, Link2 } from 'lucide-react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ConfigurarPerfilScreen = ({ onNavigate, userProfile, setUserProfile, onLogout, triggerToast }) => {
  const [editData, setEditData] = useState({ name: userProfile.name || '', email: userProfile.email || '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    setUserProfile({ ...userProfile, name: editData.name, email: editData.email });
    triggerToast('¡Perfil actualizado! ✨');
    onNavigate('more');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={() => onNavigate('more')} title="Mi Perfil" backButton />
      <main className="px-6 space-y-6 mt-4">
        <Card className="flex flex-col items-center pt-10 pb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FFF0CC] to-transparent dark:from-[#3a2f1b]"></div>
          <div className="w-28 h-28 bg-[#221F26] rounded-[36px] flex items-center justify-center text-white mb-6 shadow-xl relative z-10 border-4 border-[var(--bg-card)] overflow-hidden">
            {userProfile.profilePic ? <img src={userProfile.profilePic} alt="Perfil" className="w-full h-full object-cover" /> : <User size={44} />}
          </div>
          <div className="w-full space-y-4 mt-2 relative z-10">
            <Input placeholder="Tu nombre" icon={User} value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
            <Input placeholder="Email" type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} disabled={userProfile.authProvider === 'google'} />
          </div>
          <Button onClick={handleSave} className="mt-6 w-full"><Save size={18} /> Guardar cambios</Button>
        </Card>

        <Card>
          <h4 className="font-black text-[var(--text-main)] mb-4">Moneda principal</h4>
          <div className="grid grid-cols-4 gap-3">
            {['ARS', 'USD', 'EUR', 'BRL'].map(cur => (
              <button key={cur} onClick={() => setUserProfile({...userProfile, mainCurrency: cur})} className={`p-4 rounded-2xl font-black text-lg transition-all ${userProfile.mainCurrency === cur ? 'bg-[#FFCE45] text-[#221F26] shadow-md scale-105' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}>{cur}</button>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="font-black text-[var(--text-main)] mb-4">Apariencia</h4>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { document.documentElement.classList.remove('dark'); setUserProfile({...userProfile, theme: 'light'}); }} className={`p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${userProfile.theme !== 'dark' ? 'border-[#FFCE45] bg-[var(--input-bg)] text-[var(--text-main)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>
              <Sun size={18} /> Claro
            </button>
            <button onClick={() => { document.documentElement.classList.add('dark'); setUserProfile({...userProfile, theme: 'dark'}); }} className={`p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${userProfile.theme === 'dark' ? 'border-[#FFCE45] bg-[var(--input-bg)] text-[var(--text-main)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>
              <Moon size={18} /> Oscuro
            </button>
          </div>
        </Card>

        <Card>
          <h4 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2"><Link2 size={18} /> Vincular Telegram</h4>
          <p className="text-sm text-[var(--text-muted)] mb-4 font-medium">Vinculá tu cuenta de Telegram para acceder desde el bot.</p>
          <Input placeholder="Código de vinculación" className="mb-4" />
          <Button variant="secondary" className="py-3">Vincular</Button>
        </Card>

        <div className="space-y-3 pt-4">
          <Button onClick={onLogout} variant="secondary" className="!border-gray-300 dark:!border-gray-700"><LogOut size={18} /> Cerrar Sesión</Button>
          {showDeleteConfirm ? (
            <div className="space-y-3 bg-[#FFEBEB] dark:bg-[#3B1212] p-5 rounded-[28px] border border-[#E53E3E]/30 animate-in fade-in duration-300">
              <p className="font-black text-[#E53E3E] text-center text-sm">¿Estás seguro? Esta acción es irreversible.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary" className="flex-1 py-3">Cancelar</Button>
                <Button onClick={() => { onLogout(); triggerToast('Cuenta eliminada'); }} variant="danger" className="flex-1 py-3"><Trash2 size={16}/> Sí, borrar</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowDeleteConfirm(true)} variant="danger"><Trash2 size={18} /> Eliminar cuenta</Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConfigurarPerfilScreen;
