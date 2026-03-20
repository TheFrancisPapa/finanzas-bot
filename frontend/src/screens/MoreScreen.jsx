import React from 'react';
import { ChevronRight, Settings, User, LockKeyhole } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MercadoPagoLogo } from '../assets/logos';

const MoreScreen = ({ onNavigate, userProfile, triggerLock }) => {
  const ListItem = ({ icon, title, value, isPro, isLast, onClick }) => (
    <div onClick={onClick} className={`flex items-center justify-between py-5 px-3 hover:bg-[var(--border-color)] rounded-[20px] transition-all duration-200 cursor-pointer group ${!isLast ? 'border-b border-[var(--border-color)]/50' : ''}`}>
      <div className="flex items-center gap-4">
        <span className="text-2xl w-8 text-center group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-base font-bold text-[var(--text-main)]">{title}</span>
        {isPro && <span className="text-xs opacity-80">🔒</span>}
      </div>
      <div className="flex items-center gap-3">
        {value && <span className={`text-sm font-black ${value === 'PRO' ? 'bg-[#9D50FF]/10 text-[#9D50FF] px-3 py-1.5 rounded-xl text-[10px] tracking-widest' : 'text-[var(--text-muted)]'}`}>{value}</span>}
        <ChevronRight size={20} className="text-gray-400 group-hover:text-[#FFCE45] transition-colors stroke-[2.5]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} />
      <main className="px-6 space-y-8 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)]"><Settings size={24} className="text-[var(--text-muted)] stroke-[2.5]" /></div>
            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Más</h2>
          </div>
          <button onClick={triggerLock} className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FFCE45] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors">
            <LockKeyhole size={14} /> Bloquear
          </button>
        </div>

        <Card className="flex flex-col items-center text-center pt-10 pb-8 border-0 relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('configurar_perfil')}>
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FFF0CC] to-[var(--bg-card)] dark:from-[#3a2f1b] group-hover:h-32 transition-all duration-500"></div>
          <div className="w-28 h-28 bg-[#221F26] rounded-[36px] flex items-center justify-center text-white mb-5 shadow-xl shadow-[#221F26]/20 relative z-10 border-[6px] border-[var(--bg-card)] transform group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
            {userProfile?.profilePic ? <img src={userProfile.profilePic} alt="Perfil" className="w-full h-full object-cover" /> : <User size={44} strokeWidth={2.5} />}
          </div>
          <h3 className="text-3xl font-black text-[var(--text-main)] mb-1.5 relative z-10 tracking-tight">{userProfile?.name}</h3>
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest bg-[var(--input-bg)] px-4 py-1.5 rounded-xl border border-[var(--border-color)]">ID: {userProfile?.id || '---'}</span>
            {userProfile?.authProvider === 'google' && <span className="text-[10px] text-[#4A5568] bg-gray-100 dark:bg-gray-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3 h-3" /> Google</span>}
          </div>
          <Button variant="secondary" className="w-[85%] py-4 text-base shadow-none">Configurar Perfil</Button>
        </Card>

        <div>
          <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 px-2">Ajustes Generales</h3>
          <Card className="!p-3 border-0">
            <ListItem icon="💰" title="Moneda Principal" value={userProfile?.mainCurrency || 'ARS'} onClick={() => onNavigate('configurar_perfil')} />
            <ListItem icon="🎯" title="Presupuestos y Metas" onClick={() => onNavigate('presupuestos')} />
            <ListItem icon="⚙️" title="Gestionar Categorías" onClick={() => onNavigate('categorias')} />
            <ListItem icon="🏦" title="Conexión Bancaria" onClick={() => onNavigate('conexion_bancaria')} />
            <ListItem icon="💵" title="Cotizaciones" onClick={() => onNavigate('cotizaciones')} />
            <ListItem icon="📊" title="Exportar a Excel" isPro value="PRO" onClick={() => onNavigate('exportar')} />
            <ListItem icon="👫" title="Modo Pareja" isPro value="PRO" onClick={() => onNavigate('modo_pareja')} isLast />
          </Card>
        </div>

        <div onClick={() => onNavigate('pro')} className="bg-gradient-to-br from-[#2D1B36] to-[#1A0F20] rounded-[40px] p-8 shadow-2xl shadow-indigo-900/30 text-white relative overflow-hidden group hover:shadow-indigo-900/40 transition-shadow cursor-pointer">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[100px] opacity-30 group-hover:opacity-60 transition-opacity duration-700"></div>
          <div className="text-center relative z-10">
            <div className="text-5xl mb-3 animate-bounce" style={{ animationDuration: '3s' }}>⭐</div>
            <h3 className="text-3xl font-black mb-1 tracking-tight">Manguito PRO</h3>
            <div className="bg-white/10 rounded-2xl p-5 mb-6 mt-4 text-left border border-white/20 backdrop-blur-sm max-w-[260px] mx-auto shadow-inner">
              <ul className="space-y-3 text-[13px] font-bold text-[#D6B5FF]">
                <li className="flex items-center gap-2"><span className="text-lg">🤖</span> IA Extendida (20/día)</li>
                <li className="flex items-center gap-2"><span className="text-lg">📊</span> Exportar a Excel y PDF</li>
                <li className="flex items-center gap-2"><span className="text-lg">👫</span> Modo Pareja (Compartido)</li>
                <li className="flex items-center gap-2"><span className="text-lg">🏦</span> Conexión Bancaria Auto</li>
              </ul>
            </div>
            <div className="bg-white/10 inline-block px-5 py-2.5 rounded-2xl mb-6 border border-white/20 backdrop-blur-md">
               <span className="text-3xl font-black">$6.999</span>
               <span className="text-xs font-medium ml-1 text-[#D6B5FF]">ARS / mes</span>
            </div>
            <Button variant="pro" className="py-4.5 text-base font-black shadow-[0_10px_30px_-10px_rgba(157,80,255,0.6)] flex items-center justify-center gap-3 group-hover:scale-[1.02] transition-transform">
              Quiero ser PRO 🚀
              <div className="bg-white/20 p-1.5 rounded-lg flex items-center shadow-inner"><MercadoPagoLogo className="w-4 h-4" /></div>
            </Button>
          </div>
        </div>
      </main>
      <BottomNav activeTab="more" onNavigate={onNavigate} />
    </div>
  );
};

export default MoreScreen;
