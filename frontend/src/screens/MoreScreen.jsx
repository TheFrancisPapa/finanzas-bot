import React from 'react';
import { ChevronRight, Settings, User, LockKeyhole, CreditCard, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MercadoPagoLogo } from '../assets/logos';

const MoreScreen = ({ onNavigate, userProfile, triggerLock }) => {
  const ListItem = ({ icon, title, value, isPro, isLast, onClick, delay = 0 }) => (
    <div 
      onClick={onClick} 
      className={`flex items-center justify-between py-5 px-3 hover:bg-[var(--border-color)]/30 rounded-[20px] transition-all duration-300 cursor-pointer group ${!isLast ? 'border-b border-[var(--border-color)]/30' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl w-8 text-center group-hover:scale-125 transition-transform duration-300">{icon}</span>
        <span className="text-base font-black text-[var(--text-main)] group-hover:translate-x-1 transition-transform tracking-tight">{title}</span>
        {isPro && <span className="text-[10px] bg-[#9D50FF]/10 text-[#9D50FF] px-2 py-0.5 rounded-full font-black ml-1 uppercase tracking-widest">PRO</span>}
      </div>
      <div className="flex items-center gap-3">
        {value && <span className={`text-xs font-black ${value === 'PRO' ? 'text-[#9D50FF]' : 'text-[var(--text-muted)] opacity-60'}`}>{value}</span>}
        <ChevronRight size={18} className="text-gray-400 group-hover:text-[#FFCE45] group-hover:translate-x-1 transition-all stroke-[3]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} />
      <main className="px-6 space-y-6 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] text-2xl theme-transition">⚙️</div>
            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Más</h2>
          </div>
          <button onClick={triggerLock} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] hover:border-[#FFCE45] text-[var(--text-main)] px-4 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            <ShieldCheck size={14} strokeWidth={3} /> Cerrar Sesión
          </button>
        </div>

        <Card className="flex flex-col items-center text-center pt-10 pb-8 relative overflow-hidden group cursor-pointer theme-transition hover:border-[#FFCE45]/40" onClick={() => onNavigate('config_perfil')} style={{boxShadow: 'var(--card-shadow)'}}>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#FFF0CC] to-transparent dark:from-[#2d2936] opacity-20"></div>
          
          <div className="w-28 h-28 bg-[var(--bg-card)] rounded-[36px] flex items-center justify-center mb-5 shadow-2xl relative z-10 border-[6px] border-[var(--bg-base)] transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
            {userProfile?.profilePic ? (
              <img src={userProfile.profilePic} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={44} className="text-[var(--text-muted)]" strokeWidth={2.5} />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Editar</div>
          </div>
          
          <h3 className="text-3xl font-black text-[var(--text-main)] mb-1 relative z-10 tracking-tight">{userProfile?.name || 'Invitado'}</h3>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 relative z-10 opacity-60">ID: {userProfile?.id?.slice(0,8) || 'MANGUITO'}</p>
          
          <div className="flex gap-2 w-full px-4 relative z-10">
            <Button variant="secondary" className="flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-none hover:bg-[var(--bg-base)]">Configurar Perfil</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2 opacity-50">Gestionar</p>
          <Card className="!p-3 border-0 theme-transition" style={{boxShadow: 'var(--card-shadow)'}}>
            <ListItem icon="🎯" title="Presupuestos y Metas" onClick={() => onNavigate('presupuestos')} delay={0.1} />
            <ListItem icon="🏷️" title="Gestionar Categorías" onClick={() => onNavigate('categorias')} delay={0.2} />
            <ListItem icon="🏦" title="Conexión Bancaria" onClick={() => onNavigate('conexion_bancaria')} delay={0.3} />
            <ListItem icon="📊" title="Exportar Datos" isPro value="EXCEL / PDF" onClick={() => onNavigate('exportar')} delay={0.4} />
            <ListItem icon="👫" title="Modo Pareja" isPro value="MODO PRO" onClick={() => onNavigate('modo_pareja')} isLast delay={0.5} />
          </Card>
        </div>

        <div onClick={() => onNavigate('pro')} className="bg-[#16141A] dark:bg-[#000000] rounded-[40px] p-8 shadow-2xl text-white relative overflow-hidden group hover:shadow-[#9D50FF]/20 transition-all cursor-pointer border border-white/5">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[100px] opacity-10 group-hover:opacity-30 transition-all duration-1000"></div>
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#9D50FF] rounded-3xl mb-6 shadow-lg shadow-[#9D50FF]/40 text-3xl group-hover:scale-110 transition-transform">🥭</div>
            <h3 className="text-3xl font-black mb-2 tracking-tight italic">Manguito <span className="text-[#9D50FF]">PRO</span></h3>
            <p className="text-gray-400 text-sm font-bold mb-8">Descubrí todo el potencial de tu manguito.</p>
            
            <div className="bg-white/5 rounded-[32px] p-6 mb-8 text-left border border-white/10 backdrop-blur-md">
              <ul className="space-y-4 text-[13px] font-bold text-gray-300">
                <li className="flex items-center gap-4"><div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-lg">♾️</div> Consultas IA Ilimitadas</li>
                <li className="flex items-center gap-4"><div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-lg">👫</div> Sincronizá con tu pareja</li>
                <li className="flex items-center gap-4"><div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-lg">📦</div> Copia de seguridad en la nube</li>
              </ul>
            </div>
            
            <button className="w-full bg-white text-[#16141A] py-5 rounded-[24px] text-lg font-black tracking-tight shadow-xl group-hover:scale-[1.02] active:scale-[0.98] transition-all">¡Quiero ser PRO! 🚀</button>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-6 opacity-60">Suscripción mensual o anual</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center pt-4 pb-8 opacity-40">
           <MangoLogo className="w-10 h-10 mb-4 grayscale" />
           <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">v2.4.0 • Hecho con 💛 en Argentina</p>
        </div>
      </main>
      <BottomNav activeTab="more" onNavigate={onNavigate} />
    </div>
  );
};

export default MoreScreen;
