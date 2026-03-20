import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StockChart from '../components/ui/StockChart';
import { formatMoney, convertCurrency } from '../lib/utils';
import { chatIA } from '../lib/api';

const DashboardScreen = ({ onNavigate, movements = [], userProfile, triggerToast }) => {
  const [revealBalances, setRevealBalances] = useState(!userProfile.hideBalances);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insight, setInsight] = useState("Tus finanzas se movieron. Tocá el botón abajo para analizar tus hábitos con IA.");
  const mainCurrency = userProfile.mainCurrency || 'ARS';

  useEffect(() => { setRevealBalances(!userProfile.hideBalances); }, [userProfile.hideBalances]);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const balance = totalIngresos - totalGastos;

  const displayMoney = (val) => revealBalances ? formatMoney(val, mainCurrency) : `${mainCurrency === 'USD'? 'US$' : mainCurrency==='EUR' ? '€' : '$'} ••••••`;

  const isBirthday = () => {
    if (!userProfile.dob) return false;
    const today = new Date();
    const dob = new Date(userProfile.dob);
    return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
  };

  const handleGenerateInsight = async (promptType = 'consejo') => {
    if (movements.length === 0) {
      triggerToast("Anotá algo primero", "error");
      return;
    }
    setLoadingInsight(true);
    try {
      const prompt = promptType === 'resumen' 
        ? "Dame un resumen semanal de mis gastos en 3 puntos clave." 
        : "Dame un consejo financiero corto basado en mis últimos movimientos.";
      const result = await chatIA(prompt);
      setInsight(result.respuesta);
    } catch {
      triggerToast("Hubo un error con la IA", "error");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32">
      <Header 
        onNavigate={onNavigate} 
        showGreeting={true} 
        userName={userProfile.name} 
        profilePic={userProfile.profilePic} 
        onProfileClick={() => onNavigate('config_perfil')}
      />

      <main className="px-6 space-y-6 mt-4">
        {isBirthday() && (
          <div className="stagger-animate bg-gradient-to-r from-[#FFCE45] to-[#FDBC3C] rounded-[32px] p-6 shadow-lg shadow-[#FFCE45]/30 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-20 rotate-12">🎉</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-[#221F26] mb-2 tracking-tight">¡Feliz cumple, {userProfile.name}! 🎂</h3>
              <p className="text-[#221F26] text-sm font-black opacity-80 leading-relaxed">¡Hoy los mangos se disfrutan! Date un gustito, te lo merecés.</p>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="stagger-animate bg-[var(--bg-card)] rounded-[40px] p-8 text-center border border-[var(--border-color)] relative overflow-hidden group shadow-[var(--card-shadow)] active:scale-[0.98] transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[70px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <p className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em] opacity-80">Tu balance hoy</p>
            <button onClick={() => setRevealBalances(!revealBalances)} className="text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors p-1 active:scale-90">
              {revealBalances ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="h-[72px] flex items-center justify-center relative z-10">
             <h2 className={`text-[52px] font-black tracking-tighter drop-shadow-sm transition-all duration-500 ${balance < 0 ? 'text-[#E53E3E]' : 'text-[#639639]'}`} key={revealBalances ? balance : 'hidden'}>
               {displayMoney(balance)}
             </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border-color)] relative z-10 mt-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                <ArrowUpRight size={14} className="text-[#639639] stroke-[4]" />
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ingresos</p>
              </div>
              <span className="text-lg font-black text-[var(--text-main)]">{displayMoney(totalIngresos)}</span>
            </div>
            <div className="border-l border-[var(--border-color)] flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                <ArrowDownRight size={14} className="text-[#E53E3E] stroke-[4]" />
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Gastos</p>
              </div>
              <span className="text-lg font-black text-[var(--text-main)]">{displayMoney(totalGastos)}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="stagger-animate flex flex-col items-center text-center !p-6" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 bg-orange-50/50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-2xl mb-3">🔥</div>
            <span className="text-3xl font-black text-[var(--text-main)]">3</span>
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight">Días de racha</span>
          </Card>
          <Card className="stagger-animate flex flex-col items-center text-center !p-6" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 bg-yellow-50/50 dark:bg-yellow-500/10 rounded-2xl flex items-center justify-center text-2xl mb-3">🏷️</div>
            <span className="text-xl font-black text-[var(--text-main)] leading-none mt-1">Cena</span>
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight mt-1">Mayor gasto</span>
          </Card>
        </div>

        {/* AI Insight Card */}
        <Card className="stagger-animate !p-0 overflow-hidden border-2 border-[#FFCE45]/20 group" style={{ animationDelay: '0.3s' }}>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#FFCE45] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#FFCE45]/20 animate-bounce" style={{ animationDuration: '3s' }}>🧠</div>
              <div className="flex-1">
                <p className="font-black text-[var(--text-main)] text-sm uppercase tracking-tight">Manguito AI</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] bg-[#639639]/10 text-[#639639] px-2 py-0.5 rounded-full font-bold">Activo</span>
                  <span className="text-[10px] bg-[#9D50FF]/10 text-[#9D50FF] px-2 py-0.5 rounded-full font-bold">Pro</span>
                </div>
              </div>
            </div>
            <p className="text-[13px] font-bold text-[var(--text-muted)] leading-relaxed italic bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border-color)]">
              "{insight}"
            </p>
          </div>
          <div className="grid grid-cols-2 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
            <button onClick={() => handleGenerateInsight('consejo')} className="py-4 text-[11px] font-black uppercase tracking-widest text-[var(--text-main)] hover:bg-[#FFCE45]/10 border-r border-[var(--border-color)] transition-colors flex items-center justify-center gap-2">
               <Sparkles size={14} className="text-[#FFCE45]" /> Consejo
            </button>
            <button onClick={() => handleGenerateInsight('resumen')} className="py-4 text-[11px] font-black uppercase tracking-widest text-[var(--text-main)] hover:bg-[#FFCE45]/10 transition-colors flex items-center justify-center gap-2">
               📄 Resumen
            </button>
          </div>
        </Card>

        {/* PRO Banner */}
        <div onClick={() => onNavigate('pro')} className="stagger-animate bg-gradient-to-br from-[#16141A] to-[#2D2936] rounded-[32px] p-6 flex items-center justify-between gap-4 shadow-xl relative overflow-hidden group cursor-pointer border border-white/5" style={{ animationDelay: '0.4s' }}>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#9D50FF] rounded-full filter blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative z-10">
            <h4 className="text-white font-black text-lg tracking-tight group-hover:text-[#FFCE45] transition-colors">Modo Pareja 👩‍❤️‍👨</h4>
            <p className="text-gray-400 text-xs font-bold mt-1 leading-snug">Sincronizá tus finanzas con alguien más y dividan gastos.</p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white font-black text-xs uppercase tracking-widest">Ver</div>
        </div>

        {/* Evolution Card */}
        <Card className="stagger-animate !p-7" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-[var(--text-main)] text-xl tracking-tight">Tu evolución</h3>
            <div className="flex gap-2">
              <span className="bg-[#639639]/10 text-[#639639] text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">+12% vs ayer</span>
            </div>
          </div>
          <StockChart movements={movements} mainCurrency={mainCurrency} />
        </Card>

        {/* Tip del Día */}
        <div className="stagger-animate py-6 px-4 text-center" style={{ animationDelay: '0.6s' }}>
           <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3 opacity-50">Tip del día</p>
           <p className="text-sm font-black text-[var(--text-main)] leading-relaxed italic opacity-80">"El que ahorra en mangos, cosecha banquetes." 🥭</p>
        </div>
      </main>
      
      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
};

export default DashboardScreen;
