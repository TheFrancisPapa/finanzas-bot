import React from 'react';
import { TrendingUp } from 'lucide-react';

const EXCHANGE_RATES = { ARS: 1, USD: 1000, EUR: 1100, GBP: 1400, BRL: 200 };
const convertCurrency = (amount, fromCurr, toCurr) => (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];

const StockChart = ({ movements, mainCurrency }) => {
  if (!movements || movements.length === 0) {
    return (
      <div className="w-full h-28 mt-2 flex flex-col items-center justify-center bg-[var(--input-bg)] rounded-2xl border-2 border-dashed border-[var(--border-color)] theme-transition hover:border-[#FFCE45]/50 transition-colors">
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
  const points = chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100},${40 - ((val - min) / range) * 40}`).join(' ');

  const isPositive = chartData.length > 1 ? chartData[chartData.length - 1] >= chartData[chartData.length - 2] : true;
  const strokeColor = isPositive ? '#639639' : '#E53E3E';
  const fillUrl = isPositive ? 'url(#glowGreen)' : 'url(#glowRed)';

  return (
    <div className="relative w-full h-28 mt-2 group">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="glowGreen" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#639639" stopOpacity="0.3" /><stop offset="100%" stopColor="#639639" stopOpacity="0" /></linearGradient>
          <linearGradient id="glowRed" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#E53E3E" stopOpacity="0.3" /><stop offset="100%" stopColor="#E53E3E" stopOpacity="0" /></linearGradient>
        </defs>
        <polygon points={`0,40 ${points} 100,40`} fill={fillUrl} className="transition-all duration-700 ease-out" />
        <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-out drop-shadow-md group-hover:stroke-[2.5px]" />
        <circle cx="100" cy={40 - ((chartData[chartData.length - 1] - min) / range) * 40} r="1.5" fill={strokeColor} className="animate-pulse shadow-lg group-hover:r-2 transition-all" />
      </svg>
    </div>
  );
};

export default StockChart;
