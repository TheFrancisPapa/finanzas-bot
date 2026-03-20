import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StockChart from '../components/ui/StockChart';
import { formatMoney, convertCurrency } from '../lib/utils';
import { chatIA } from '../lib/api';

const DashboardScreen = ({ onNavigate, movements = [], userProfile }) => {
  const [revealBalances, setRevealBalances] = useState(!userProfile.hideBalances);
  const [insight, setInsight] = useState("Aún no registraste gastos. ¡Cargá tu primer movimiento para activar la IA!");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const mainCurrency = userProfile.mainCurrency;
  
  useEffect(() => { setRevealBalances(!userProfile.hideBalances); }, [userProfile.hideBalances]);

  useEffect(() => {
    if (movements.length > 0 && !loadingInsight && insight.includes("Aún no")) {
      setInsight("Tus finanzas se movieron. Tocá el botón abajo para analizar tus hábitos con IA.");
    }
  }, [movements]);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const balance = totalIngresos - totalGastos;
  const displayMoney = (val) => revealBalances ? formatMoney(val, mainCurrency) : `${mainCurrency === 'USD'? 'US$' : mainCurrency==='EUR' ? '€' : '$'} ••••••`;

  const isBirthday = () => {
    if (!userProfile.dob) return false;
    const today = new Date();
    const [year, month, day] = userProfile.dob.split('-');
    return today.getMonth() + 1 === parseInt(month) && today.getDate() === parseInt(day);
  };

  const handleGenerateInsight = async () => {
    if (movements.length === 0) return;
    setLoadingInsight(true);
    try {
      const movsData = movements.slice(0, 5).map(m => `${m.type}: ${m.amount} ${m.currency} en ${m.category}`);
      const result = await chatIA(`Analizá estos últimos gastos/ingresos y dame un consejo financiero corto de 2 oraciones. Datos: ${JSON.stringify(movsData)}`);
      setInsight(result.respuesta || "Hubo un error analizando tus datos.");
    } catch {
      setInsight("Hubo un error analizando tus datos. Intentá más tarde.");
    }
    setLoadingInsight(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} showGreeting={true} userName={userProfile.name} profilePic={userProfile.profilePic} />

      <main className="px-6 space-y-6 mt-2">
        {isBirthday() && (
          <div className="bg-gradient-to-r from-[#FFCE45] to-[#FDBC3C] rounded-[32px] p-6 shadow-lg shadow-[#FFCE45]/30 relative overflow-hidden animate-in slide-in-from-top-4 duration-700">
            <div className="absolute -right-4 -top-4 text-8xl opacity-20 rotate-12">🎉</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-[#221F26] mb-2 tracking-tight">¡Feliz cumpleaños, {userProfile.name}! 🎂</h3>
              <p className="text-[#221F26] text-sm font-medium leading-relaxed opacity-90">Un año más de vida. Venís con una racha genial, ¡hoy date un buen gustito!</p>
            </div>
          </div>
        )}

        <div className="bg-[var(--bg-card)] rounded-[40px] p-8 text-center border border-[var(--border-color)] relative overflow-hidden group theme-transition" style={{boxShadow: 'var(--card-shadow)'}}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFCE45] rounded-full mix-blend-multiply filter blur-[70px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 dark:mix-blend-screen"></div>
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest opacity-80">Balance en {mainCurrency}</p>
            <button onClick={() => setRevealBalances(!revealBalances)} className="text-[var(--text-muted)] hover:text-[#FFCE45] transition-colors p-1 active:scale-90">
              {revealBalances ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="h-[72px] flex items-center justify-center">
             <h2 className={`text-[52px] font-black tracking-tighter relative z-10 drop-shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-500 ${balance < 0 ? 'text-[#E53E3E]' : 'text-[#639639]'}`} key={revealBalances ? balance : 'hidden'}>
               {displayMoney(balance)}
             </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border-color)] relative z-10">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowUpRight size={14} className="text-[#639639] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ingresos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalIngresos)}</span>
            </div>
            <div className="border-l border-[var(--border-color)] flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowDownRight size={14} className="text-[#E53E3E] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Gastos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalGastos)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
            <div className="w-14 h-14 bg-orange-50/50 dark:bg-orange-500/10 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">🔥</div>
            <span className="text-3xl font-black text-[var(--text-main)]">3</span>
            <span className="text-xs font-bold text-[var(--text-muted)]">Días de racha</span>
          </Card>
          <Card className="flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
            <div className="w-14 h-14 bg-yellow-50/50 dark:bg-yellow-500/10 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">💰</div>
            <span className="text-2xl font-black text-[var(--text-main)] mt-1">{displayMoney(totalGastos)}</span>
            <span className="text-xs font-bold text-[var(--text-muted)] mt-1">Gastado hoy</span>
          </Card>
          
          <Card className="col-span-2 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300 cursor-default !p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50/50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">🧠</div>
              <div className="text-left flex-1">
                <p className="font-black text-[var(--text-main)] text-sm">Análisis Inteligente</p>
                <p className="text-xs font-medium text-[var(--text-muted)] leading-snug mt-0.5 animate-in fade-in" key={insight}>{insight}</p>
              </div>
            </div>
            {movements.length > 0 && (
              <Button onClick={handleGenerateInsight} variant="secondary" className="py-2 text-xs w-full shadow-none border-dashed border-[var(--border-color)] hover:border-[#FFCE45]">
                {loadingInsight ? "Analizando..." : <><Sparkles size={14} className="text-[#FFCE45]"/> Generar nuevo análisis con IA</>}
              </Button>
            )}
          </Card>
        </div>

        <div onClick={() => onNavigate('pro')} className="bg-gradient-to-r from-[#FFF8E7] to-[#FFF2D6] dark:from-[#3B2F1D] dark:to-[#221A0F] border border-[#FFCE45]/40 rounded-[32px] p-6 flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(255,206,69,0.1)] relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgba(255,206,69,0.2)] transition-all">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFCE45]/15 to-transparent transform group-hover:scale-x-150 transition-transform origin-right"></div>
          <div className="flex-1 relative z-10">
            <p className="text-[var(--text-main)] font-black text-sm mb-1 group-hover:text-[#FDBC3C] transition-colors">¿Querés exportar tus datos?</p>
            <p className="text-[var(--text-muted)] text-xs font-bold">Por $6.999 ARS/mes descargá PDFs.</p>
          </div>
          <button className="bg-[#FFCE45] text-[#221F26] px-5 py-3 rounded-[14px] text-xs font-black uppercase tracking-wider shadow-md group-hover:scale-105 group-active:scale-95 transition-transform relative z-10">Ser PRO</button>
        </div>

        <Card className="!p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-[var(--text-main)] text-lg">Evolución ({mainCurrency})</h3>
            <span className="bg-[var(--bg-base)] text-[var(--text-muted)] text-[10px] font-black px-3 py-1.5 rounded-[10px] uppercase tracking-widest border border-[var(--border-color)]">30 días</span>
          </div>
          <StockChart movements={movements} mainCurrency={mainCurrency} />
        </Card>

        {movements.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-6xl mb-5 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default transform hover:scale-110">🌱</div>
            <h4 className="font-black text-[var(--text-muted)] mb-1">Sin movimientos recientes</h4>
            <p className="text-sm text-[var(--text-muted)] font-medium">Tus últimos gastos aparecerán aquí</p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-black text-[var(--text-main)] text-lg">Últimos movimientos</h3>
              {movements.length > 3 && (
                <button onClick={() => onNavigate('movements')} className="text-xs font-bold text-[var(--text-muted)] hover:text-[#FFCE45] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg transition-colors shadow-sm">Ver todos</button>
              )}
            </div>
            <div className="space-y-3">
              {movements.slice(0, 3).map((mov, idx) => (
                <Card key={idx} noPadding className="p-4 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${mov.type === 'gasto' ? 'bg-[#FFEBEB]/80 dark:bg-red-500/10' : 'bg-[#E6F4EA]/80 dark:bg-green-500/10'}`}>
                      {mov.icon || (mov.type === 'gasto' ? '💸' : '💰')}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-main)]">{mov.category || 'General'}</p>
                      {mov.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{mov.description}</p>}
                    </div>
                  </div>
                  <span className={`font-black ${mov.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
                    {mov.type === 'gasto' ? '-' : '+'}{formatMoney(Number(mov.amount), mov.currency)}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
};

export default DashboardScreen;
