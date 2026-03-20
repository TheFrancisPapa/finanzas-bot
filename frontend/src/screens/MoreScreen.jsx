import React from 'react';
import { ChevronRight, Settings, User, LockKeyhole } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MercadoPagoLogo } from '../assets/logos';

const MoreScreen = ({ onNavigate, userProfile, triggerLock }) => {
  const ListItem = ({ icon, title, value, isPro, isLast, onClick, delay = 0 }) => (
    <div 
      onClick={onClick} 
      className={`stagger-animate flex items-center justify-between py-5 px-3 hover:bg-[var(--border-color)]/50 rounded-[20px] transition-all duration-300 cursor-pointer group ${!isLast ? 'border-b border-[var(--border-color)]/30' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl w-8 text-center group-hover:scale-125 transition-transform duration-300">{icon}</span>
        <span className="text-base font-black text-[var(--text-main)] group-hover:translate-x-1 transition-transform">{title}</span>
        {isPro && <span className="text-[10px] bg-[#9D50FF]/10 text-[#9D50FF] px-2 py-0.5 rounded-full font-black">PRO</span>}
      </div>
      <div className="flex items-center gap-3">
        {value && <span className={`text-xs font-black ${value === 'PRO' ? 'text-[#9D50FF]' : 'text-[var(--text-muted)] opacity-60'}`}>{value}</span>}
        <ChevronRight size={18} className="text-gray-400 group-hover:text-[#FFCE45] group-hover:translate-x-1 transition-all stroke-[3]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header onNavigate={onNavigate} />
      <main className="px-6 space-y-8 mt-4 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFCE45] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFCE45]/20 animate-in zoom-in duration-500">
              <Settings size={24} className="text-[#221F26] stroke-[3]" />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Menú</h2>
          </div>
          <button onClick={triggerLock} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] hover:border-[#FFCE45] text-[var(--text-main)] px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            <LockKeyhole size={14} strokeWidth={3} /> Bloquear
          </button>
        </div>

        <Card className="stagger-animate flex flex-col items-center text-center pt-10 pb-8 border-0 relative overflow-hidden group cursor-pointer shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-all" onClick={() => onNavigate('config_perfil')}>
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FFF0CC] to-transparent dark:from-[#2d2936] group-hover:h-32 transition-all duration-500 opacity-30"></div>
          <div className="w-28 h-28 bg-[#221F26] rounded-[36px] flex items-center justify-center text-white mb-5 shadow-2xl relative z-10 border-[6px] border-[var(--bg-card)] transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 overflow-hidden">
            {userProfile?.profilePic ? (
              <img src={userProfile.profilePic} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={44} strokeWidth={2.5} />
            )}
          </div>
          <h3 className="text-3xl font-black text-[var(--text-main)] mb-1.5 relative z-10 tracking-tight">{userProfile?.name || 'Usuario'}</h3>
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest bg-[var(--input-bg)] px-4 py-1.5 rounded-full border border-[var(--border-color)]">ID: {userProfile?.id?.slice(0, 8) || 'MANGUITO'}</span>
            {userProfile?.authProvider === 'google' && (
              <span className="text-[9px] text-white bg-[#4285F4] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3.5 h-3.5 bg-white p-0.5 rounded-full" alt="G" /> Google
              </span>
            )}
          </div>
          <Button variant="secondary" className="w-[85%] py-3 text-sm font-black uppercase tracking-widest shadow-none hover:bg-[#FFCE45] hover:text-[#221F26] transition-all">Configurar Perfil</Button>
        </Card>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2 opacity-50">Gestionar</p>
          <Card className="!p-3 border-0 shadow-[var(--card-shadow)]">
            <ListItem icon="💰" title="Moneda Principal" value={userProfile?.mainCurrency || 'ARS'} onClick={() => onNavigate('config_perfil')} delay={0.1} />
            <ListItem icon="🎯" title="Presupuestos y Metas" onClick={() => onNavigate('presupuestos')} delay={0.2} />
            <ListItem icon="⚙️" title="Gestionar Categorías" onClick={() => onNavigate('categorias')} delay={0.3} />
            <ListItem icon="🏦" title="Conexión Bancaria" onClick={() => onNavigate('conexion_bancaria')} delay={0.4} />
            <ListItem icon="💵" title="Cotizaciones" onClick={() => onNavigate('cotizaciones')} delay={0.5} />
            <ListItem icon="📊" title="Exportar Datos" isPro value="PRO" onClick={() => onNavigate('exportar')} delay={0.6} />
            <ListItem icon="👫" title="Modo Pareja" isPro value="PRO" onClick={() => onNavigate('modo_pareja')} isLast delay={0.7} />
          </Card>
        </div>

        <div onClick={() => onNavigate('pro')} className="stagger-animate bg-gradient-to-br from-[#2D1B36] to-[#16141A] rounded-[40px] p-8 shadow-2xl shadow-indigo-900/40 text-white relative overflow-hidden group hover:shadow-indigo-900/60 transition-all cursor-pointer border border-white/5" style={{ animationDelay: '0.8s' }}>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[100px] opacity-20 group-hover:opacity-50 transition-all duration-1000"></div>
          <div className="text-center relative z-10">
            <div className="text-5xl mb-4 animate-bounce" style={{ animationDuration: '4s' }}>⭐</div>
            <h3 className="text-3xl font-black mb-1 tracking-tight">Manguito PRO</h3>
            <div className="bg-white/5 rounded-3xl p-6 mb-8 mt-6 text-left border border-white/10 backdrop-blur-md max-w-[280px] mx-auto">
              <ul className="space-y-4 text-[13px] font-black tracking-tight text-indigo-100">
                <li className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">🤖</div> IA Extendida (20/día)</li>
                <li className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">📊</div> Exportar Excel y PDF</li>
                <li className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">👫</div> Modo Pareja (Compartido)</li>
              </ul>
            </div>
            <Button variant="pro" className="py-5 text-lg font-black shadow-[0_15px_35px_-10px_rgba(157,80,255,0.7)] group-hover:scale-105 transition-all">
              ¡Quiero ser PRO! 🚀
            </Button>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-6 opacity-60">Pago único o suscripción</p>
          </div>
        </div>
      </main>
      <BottomNav activeTab="more" onNavigate={onNavigate} />
    </div>
  );
};

export default MoreScreen;
