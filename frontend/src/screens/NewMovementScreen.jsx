import React, { useState } from 'react';
import { RefreshCcw, Camera, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const NewMovementScreen = ({ onNavigate, onSave, userProfile, categories }) => {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [movementCurrency, setMovementCurrency] = useState(userProfile.mainCurrency);
  const [hasReceipt, setHasReceipt] = useState(false);

  const cycleCurrency = () => {
    const currencies = ['ARS', 'USD', 'EUR', 'GBP', 'BRL'];
    const nextIdx = (currencies.indexOf(movementCurrency) + 1) % currencies.length;
    setMovementCurrency(currencies[nextIdx]);
  };

  const currentCategories = type === 'gasto' ? categories.gasto : categories.ingreso;
  const currSymbol = movementCurrency === 'ARS' ? '$' : movementCurrency === 'USD' ? 'US$' : movementCurrency === 'EUR' ? '€' : movementCurrency === 'GBP' ? '£' : 'R$';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-bottom-full duration-500 z-50 relative">
      <header className="px-6 pt-10 pb-4 flex items-center justify-between bg-transparent sticky top-0 z-40">
        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Nuevo movimiento</h2>
        <button onClick={() => onNavigate('home')} className="w-12 h-12 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm border border-[var(--border-color)] transition-all active:scale-95"><span className="text-xl font-bold">✕</span></button>
      </header>

      <main className="px-6 mt-4">
        <Card noPadding className="overflow-hidden border-0">
          <div className={`p-8 pb-12 transition-colors duration-700 ${type === 'gasto' ? 'bg-[#FFEBEB] dark:bg-[#3B1212]' : 'bg-[#E6F4EA] dark:bg-[#0A2617]'}`}>
            <div className="bg-[var(--bg-card)] p-2 rounded-[24px] flex shadow-inner mb-10 border border-[var(--border-color)]">
              <button onClick={() => { setType('gasto'); setCategory(''); }} className={`flex-1 py-4 rounded-[18px] text-sm font-black transition-all duration-300 flex justify-center items-center gap-2 tracking-wide ${type === 'gasto' ? 'bg-white text-[#E53E3E] dark:bg-[#E53E3E] dark:text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:text-[var(--text-main)]'}`}>Gasto</button>
              <button onClick={() => { setType('ingreso'); setCategory(''); }} className={`flex-1 py-4 rounded-[18px] text-sm font-black transition-all duration-300 flex justify-center items-center gap-2 tracking-wide ${type === 'ingreso' ? 'bg-white text-[#38A169] dark:bg-[#38A169] dark:text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:text-[var(--text-main)]'}`}>Ingreso</button>
            </div>
            <div className="flex justify-between items-center px-2 mb-2">
              <p className="text-xs font-black uppercase tracking-widest opacity-60 text-[var(--text-main)]">Monto</p>
              <button onClick={cycleCurrency} className="bg-[var(--bg-card)] px-3 py-1.5 rounded-lg text-xs font-black text-[var(--text-main)] shadow-sm flex items-center gap-1 transition-colors border border-[var(--border-color)]">{movementCurrency} <RefreshCcw size={12} /></button>
            </div>
            <div className="flex justify-center items-center text-[var(--text-main)]">
              <span className="text-5xl font-black opacity-50 mr-2">{currSymbol}</span>
              <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full text-[80px] font-black text-[var(--text-main)] bg-transparent outline-none text-center placeholder:text-[var(--text-muted)] placeholder:opacity-30 tracking-tighter h-24" autoFocus />
            </div>
          </div>
          <div className="p-8 pt-10 bg-[var(--bg-card)] rounded-t-[40px] -mt-8 relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="mb-10">
              <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-5 px-1">Categoría</p>
              <div className="grid grid-cols-4 gap-4">
                {currentCategories.map((cat) => (
                  <button key={cat.label} onClick={() => setCategory(cat.label)} className={`flex flex-col items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-300 border-2 ${category === cat.label ? `bg-[var(--input-bg)] border-[#FFCE45] text-[var(--text-main)] scale-110 shadow-sm` : 'bg-[var(--bg-card)] border-transparent text-[var(--text-muted)] hover:bg-[var(--input-bg)] border border-[var(--border-color)]'}`}>
                    <span className="text-3xl">{cat.icon}</span><span className="text-[11px] font-bold">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-10">
              <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 px-1">Descripción (Opcional)</p>
              <input type="text" placeholder="Ej: Café con medialunas" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-lg font-bold text-[var(--text-main)] bg-[var(--input-bg)] rounded-[20px] py-5 px-6 outline-none focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[#FFCE45]/20 border border-[var(--border-color)] focus:border-[#FFCE45] transition-all duration-300 placeholder:text-gray-400 mb-4" />
              <button onClick={() => setHasReceipt(!hasReceipt)} className={`w-full py-4 px-5 rounded-[20px] border-2 border-dashed transition-all duration-300 flex items-center justify-between group ${hasReceipt ? 'border-[#FFCE45] bg-[#FFCE45]/10' : 'border-[var(--border-color)] hover:border-[#FFCE45] hover:bg-[var(--input-bg)]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${hasReceipt ? 'bg-[#FFCE45] text-[#221F26]' : 'bg-[var(--bg-card)] text-[var(--text-muted)] group-hover:text-[var(--text-main)] shadow-sm'}`}><Camera size={20} /></div>
                  <span className={`font-bold ${hasReceipt ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{hasReceipt ? 'Comprobante adjuntado' : 'Adjuntar ticket o factura'}</span>
                </div>
                {!hasReceipt && <span className="bg-[#9D50FF]/10 text-[#9D50FF] px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest">PRO</span>}
              </button>
            </div>
            <Button onClick={() => {
                if (!amount || Number(amount) <= 0) return;
                const selectedCat = currentCategories.find(c => c.label === category);
                onSave({ type, amount, currency: movementCurrency, category: category || 'General', icon: selectedCat ? selectedCat.icon : null, description, hasReceipt, date: new Date().toISOString() });
              }} 
              className={`py-5 text-xl tracking-wide shadow-xl ${type === 'gasto' ? '!bg-[#E53E3E] hover:!bg-[#C53030] !text-white dark:!bg-[#E53E3E]' : '!bg-[#38A169] hover:!bg-[#2F855A] !text-white dark:!bg-[#38A169]'}`}
            >
              Guardar {type}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default NewMovementScreen;
