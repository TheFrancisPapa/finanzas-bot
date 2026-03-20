import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, Sparkles, TrendingUp 
} from 'lucide-react';
// Importamos la artillería pesada desde Shared
import { 
  Header, BottomNav, Card, Button, 
  formatMoney, convertCurrency, callGeminiText 
} from './Shared';

// ==========================================
// 1. COMPONENTE INTERNO: GRÁFICO DE EVOLUCIÓN
// ==========================================
const StockChart = ({ movements, mainCurrency }) => {
  if (!movements || movements.length === 0) {
    return (
      <div className="w-full h-28 mt-2 flex flex-col items-center justify-center bg-[var(--input-bg)] rounded-2xl border-2 border-dashed border-[var(--border-color)]">
        <TrendingUp size={24} className="text-[var(--text-muted)] mb-2 opacity-50" />
        <p className="text-xs font-bold text-[var(--text-muted)]">Anotá tu primer movimiento</p>
      </div>
    );
  }

  let chartData = [40, 42, 41, 45, 44, 48, 47, 52, 50, 56, 54, 60, 58, 65, 63, 70];
  let currentVal = chartData[chartData.length - 1];
  const recentMovs = [...movements].reverse().slice(-8); 
  
  recentMovs.forEach(mov => {
    const convertedAmount = convertCurrency(mov.amount, mov.currency, mainCurrency);
    const impact = (convertedAmount / 1000) || 5; 
    currentVal += (mov.type === 'ingreso' ? impact : -impact);
    chartData.push(currentVal);
  });

  const max = Math.max(...chartData) + 5;
  const min = Math.min(...chartData) - 5;
  const range = max - min || 1; 
  const points = chartData.map((val, i) => 
    `${(i / (chartData.length - 1)) * 100},${40 - ((val - min) / range) * 40}`
  ).join(' ');

  const isPositive = chartData.length > 1 ? chartData[chartData.length - 1] >= chartData[chartData.length - 2] : true;
  const strokeColor = isPositive ? '#639639' : '#E53E3E';

  return (
    <div className="relative w-full h-28 mt-2 group">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="glowGreen" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#639639" stopOpacity="0.3" /><stop offset="100%" stopColor="#639639" stopOpacity="0" /></linearGradient>
          <linearGradient id="glowRed" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#E53E3E" stopOpacity="0.3" /><stop offset="100%" stopColor="#E53E3E" stopOpacity="0" /></linearGradient>
        </defs>
        <polygon points={`0,40 ${points} 100,40`} fill={isPositive ? 'url(#glowGreen)' : 'url(#glowRed)'} className="transition-all duration-700" />
        <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy={40 - ((chartData[chartData.length - 1] - min) / range) * 40} r="1.5" fill={strokeColor} className="animate-pulse shadow-lg" />
      </svg>
    </div>
  );
};

// ==========================================
// 2. PANTALLA PRINCIPAL: DASHBOARD
// ==========================================
export const DashboardScreen = ({ onNavigate, movements = [], userProfile }) => {
  const [revealBalances, setRevealBalances] = useState(!userProfile?.hideBalances);
  const [insight, setInsight] = useState("Aún no registraste gastos. ¡Cargá tu primer movimiento para activar la IA!");
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  const mainCurrency = userProfile?.mainCurrency || 'ARS';
  const shortName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Amigo';
  
  useEffect(() => { setRevealBalances(!userProfile?.hideBalances); }, [userProfile?.hideBalances]);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);
  const balance = totalIngresos - totalGastos;
  const displayMoney = (val) => revealBalances ? formatMoney(val, mainCurrency) : `${mainCurrency === 'USD'? 'US$' : mainCurrency==='EUR' ? '€' : '$'} ••••••`;

  const handleGenerateInsight = async () => {
    if (movements.length === 0) return;
    setLoadingInsight(true);
    const movsData = movements.slice(0, 5).map(m => `${m.type}: ${m.amount} ${m.currency} en ${m.category}`);
    const prompt = `Analizá estos últimos gastos/ingresos y dame un consejo financiero corto de 2 oraciones. Datos: ${JSON.stringify(movsData)}`;
    const result = await callGeminiText(prompt);
    setInsight(result || "Hubo un error analizando tus datos. Intentá más tarde.");
    setLoadingInsight(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} showGreeting={true} userName={shortName} profilePic={userProfile?.profilePic} />

      <main className="px-6 space-y-6 mt-2">
        {/* Tarjeta de Balance Principal */}
        <div className="bg-[var(--bg-card)] rounded-[40px] p-8 text-center border border-[var(--border-color)] relative overflow-hidden shadow-[var(--card-shadow)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFCE45] rounded-full blur-[70px] opacity-10"></div>
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest">Balance en {mainCurrency}</p>
            <button onClick={() => setRevealBalances(!revealBalances)} className="text-[var(--text-muted)] hover:text-[#FFCE45]">
              {revealBalances ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <h2 className={`text-[52px] font-black tracking-tighter relative z-10 ${balance < 0 ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
            {displayMoney(balance)}
          </h2>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border-color)] relative z-10 mt-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowUpRight size={14} className="text-[#639639] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Ingresos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalIngresos)}</span>
            </div>
            <div className="border-l border-[var(--border-color)] flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <ArrowDownRight size={14} className="text-[#E53E3E] stroke-[4]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Gastos</p>
              </div>
              <span className="text-xl font-black text-[var(--text-main)]">{displayMoney(totalGastos)}</span>
            </div>
          </div>
        </div>

        {/* Widgets Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">🔥</div>
            <span className="text-3xl font-black">3</span>
            <span className="text-xs font-bold text-[var(--text-muted)]">Días de racha</span>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-yellow-50 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-inner">💰</div>
            <span className="text-2xl font-black mt-1">{displayMoney(totalGastos)}</span>
            <span className="text-xs font-bold text-[var(--text-muted)] mt-1">Gastado hoy</span>
          </Card>
          
          <Card className="col-span-2 flex flex-col gap-3 !p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">🧠</div>
              <div className="text-left flex-1">
                <p className="font-black text-sm">Análisis con IA</p>
                <p className="text-xs font-medium text-[var(--text-muted)] leading-snug mt-0.5" key={insight}>{insight}</p>
              </div>
            </div>
            {movements.length > 0 && (
              <Button onClick={handleGenerateInsight} variant="secondary" className="py-2 text-xs w-full shadow-none border-dashed hover:border-[#FFCE45]">
                {loadingInsight ? "Analizando..." : <><Sparkles size={14} className="text-[#FFCE45]"/> Generar nuevo consejo</>}
              </Button>
            )}
          </Card>
        </div>

        {/* Gráfico de Evolución */}
        <Card className="!p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg">Evolución</h3>
            <span className="bg-[var(--bg-base)] text-[var(--text-muted)] text-[10px] font-black px-3 py-1.5 rounded-[10px] uppercase border border-[var(--border-color)]">30 días</span>
          </div>
          <StockChart movements={movements} mainCurrency={mainCurrency} />
        </Card>

        {/* Últimos Movimientos (Previsualización) */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-black text-lg">Actividad reciente</h3>
            <button onClick={() => onNavigate('movements')} className="text-xs font-bold text-[var(--text-muted)] hover:text-[#FFCE45]">Ver todos</button>
          </div>
          <div className="space-y-3">
            {movements.slice(0, 3).map((mov, idx) => (
              <Card key={idx} noPadding className="p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${mov.type === 'gasto' ? 'bg-[#FFEBEB] text-[#E53E3E]' : 'bg-[#E6F4EA] text-[#38A169]'}`}>
                    {mov.icon}
                  </div>
                  <div>
                    <p className="font-bold">{mov.category}</p>
                    <p className="text-xs text-[var(--text-muted)]">{mov.description}</p>
                  </div>
                </div>
                <span className={`font-black ${mov.type === 'gasto' ? 'text-[#E53E3E]' : 'text-[#639639]'}`}>
                  {mov.type === 'gasto' ? '-' : '+'}{formatMoney(mov.amount, mov.currency)}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
};