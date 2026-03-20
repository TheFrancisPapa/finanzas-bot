import React, { useState } from 'react';
import { Plus, Target, Trash2, ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatMoney, convertCurrency } from '../lib/utils';

const PresupuestosMetasScreen = ({ onNavigate, budgets = [], savingsGoals = [], movements = [], userProfile, onUpdateBudgets, onUpdateGoals }) => {
  const [tab, setTab] = useState('presupuestos');
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', maxAmount: '' });
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });

  const mainCurrency = userProfile.mainCurrency || 'ARS';

  const getSpent = (cat) => movements
    .filter(m => m.type === 'gasto' && m.category === cat)
    .reduce((acc, m) => acc + convertCurrency(m.amount, m.currency, mainCurrency), 0);

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.maxAmount) return;
    onUpdateBudgets([...budgets, { id: Date.now(), ...newBudget, maxAmount: Number(newBudget.maxAmount) }]);
    setNewBudget({ category: '', maxAmount: '' });
    setShowNewBudget(false);
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    onUpdateGoals([...savingsGoals, { id: Date.now(), ...newGoal, target: Number(newGoal.target), current: 0 }]);
    setNewGoal({ name: '', target: '' });
    setShowNewGoal(false);
  };

  const removeBudget = (id) => onUpdateBudgets(budgets.filter(b => b.id !== id));
  const removeGoal = (id) => onUpdateGoals(savingsGoals.filter(g => g.id !== id));

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-24 animate-in fade-in duration-500">
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 pt-12 pb-6">
        <button onClick={() => onNavigate('more')} className="flex items-center gap-2 text-[var(--text-muted)] font-black text-xs uppercase tracking-widest mb-6 hover:text-[#FFCE45] transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
        </button>
        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Planificación</h2>
      </div>

      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-sm border border-[var(--border-color)]">
          {['presupuestos', 'metas'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3.5 rounded-[20px] text-sm font-black transition-all duration-400 ${tab === t ? 'bg-[#FFCE45] text-[#221F26] shadow-lg shadow-[#FFCE45]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              {t === 'presupuestos' ? '📊 Presupuestos' : '🎯 Metas'}
            </button>
          ))}
        </div>

        {tab === 'presupuestos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">Límites mensuales</p>
              {!showNewBudget && <button onClick={() => setShowNewBudget(true)} className="text-[#639639] font-black text-xs flex items-center gap-1 hover:underline"><Plus size={14} strokeWidth={3} /> Nuevo</button>}
            </div>

            {budgets.map(b => {
              const spent = getSpent(b.category);
              const perc = Math.min((spent / (b.maxAmount || 1)) * 100, 100);
              const isOver = spent > b.maxAmount;
              
              return (
                <Card key={b.id} className="!p-6 group relative overflow-hidden border-0 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-[var(--text-main)] text-xl tracking-tight">{b.category}</h4>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Categoría</p>
                    </div>
                    <button onClick={() => removeBudget(b.id)} className="p-2 text-gray-300 hover:text-[#E53E3E] transition-colors"><Trash2 size={16} /></button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-xl font-black ${isOver ? 'text-[#E53E3E]' : 'text-[var(--text-main)]'}`}>{formatMoney(spent, mainCurrency)}</span>
                      <span className="text-xs font-bold text-[var(--text-muted)]">de {formatMoney(b.maxAmount, mainCurrency)}</span>
                    </div>
                    <div className="w-full bg-[var(--input-bg)] rounded-full h-3.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-out fill-mode-both ${perc > 90 ? 'bg-[#E53E3E]' : perc > 70 ? 'bg-[#FDBC3C]' : 'bg-[#639639]'}`} style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                  
                  {isOver && <div className="flex items-center gap-2 text-[10px] font-black text-[#E53E3E] uppercase tracking-widest bg-red-50 dark:bg-red-900/10 p-2 rounded-xl border border-red-100 dark:border-red-900/20"><AlertCircle size={12} /> ¡Te pasaste del límite!</div>}
                </Card>
              );
            })}

            {showNewBudget && (
              <Card className="!p-6 border-2 border-dashed border-[#FFCE45]/40 animate-in zoom-in-95 duration-300">
                <h4 className="font-black text-[var(--text-main)] mb-6 text-xl tracking-tight">Configurar Límite</h4>
                <div className="space-y-4">
                  <Input placeholder="Ej: Comida afuera" value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} />
                  <Input placeholder="Monto Máximo ($)" type="number" value={newBudget.maxAmount} onChange={e => setNewBudget({...newBudget, maxAmount: e.target.value})} />
                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => setShowNewBudget(false)} variant="secondary" className="flex-1">Cancelar</Button>
                    <Button onClick={handleAddBudget} className="flex-1">Guardar</Button>
                  </div>
                </div>
              </Card>
            )}

            {budgets.length === 0 && !showNewBudget && (
              <div className="py-20 text-center opacity-30 grayscale items-center flex flex-col">
                <div className="text-7xl mb-4">📉</div>
                <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-xs">Sin límites configurados</p>
              </div>
            )}
          </div>
        )}

        {tab === 'metas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">Tus sueños hoy</p>
              {!showNewGoal && <button onClick={() => setShowNewGoal(true)} className="text-[#9D50FF] font-black text-xs flex items-center gap-1 hover:underline"><Plus size={14} strokeWidth={3} /> Nueva Meta</button>}
            </div>

            {savingsGoals.map(g => {
              const perc = Math.min(((g.current || 0) / (g.target || 1)) * 100, 100);
              return (
                <Card key={g.id} className="!p-6 relative overflow-hidden border-0 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-all">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-[#9D50FF]/5 to-transparent rounded-full -mr-8 -mt-8"></div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#9D50FF]/10 text-[#9D50FF] rounded-2xl flex items-center justify-center text-2xl shadow-inner">🎯</div>
                      <div>
                        <h4 className="font-black text-[var(--text-main)] text-xl tracking-tight">{g.name}</h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Meta de ahorro</p>
                      </div>
                    </div>
                    <button onClick={() => removeGoal(g.id)} className="p-2 text-gray-300 hover:text-[#E53E3E] transition-colors"><Trash2 size={16} /></button>
                  </div>

                  <div className="relative z-10 border-t border-[var(--border-color)] pt-6">
                    <div className="flex justify-between items-end mb-3">
                      <p className="text-[var(--text-muted)] font-bold text-xs">Progreso actual</p>
                      <span className="text-2xl font-black text-[#9D50FF]">{Math.round(perc)}%</span>
                    </div>
                    <div className="w-full bg-[var(--input-bg)] rounded-full h-4 overflow-hidden mb-4 shadow-inner">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#9D50FF] to-[#FDBC3C] transition-all duration-1000 ease-out fill-mode-both" style={{ width: `${perc}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border-color)]">
                      <div className="text-center flex-1 border-r border-[var(--border-color)]">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Ahorrado</p>
                        <span className="font-black text-[var(--text-main)]">{formatMoney(g.current || 0, mainCurrency)}</span>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Objetivo</p>
                        <span className="font-black text-[var(--text-main)]">{formatMoney(g.target, mainCurrency)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {showNewGoal && (
              <Card className="!p-6 border-2 border-dashed border-[#9D50FF]/40 animate-in zoom-in-95 duration-300">
                <h4 className="font-black text-[var(--text-main)] mb-6 text-xl tracking-tight">Nueva Meta</h4>
                <div className="space-y-4">
                  <Input placeholder="Ej: Viaje a Brasil 🏖️" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
                  <Input placeholder="Monto Objetivo ($)" type="number" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} />
                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => setShowNewGoal(false)} variant="secondary" className="flex-1">Cerrar</Button>
                    <Button onClick={handleAddGoal} className="flex-1 bg-[#9D50FF] text-white hover:bg-[#8B3DED]">¡A por ello!</Button>
                  </div>
                </div>
              </Card>
            )}

            {savingsGoals.length === 0 && !showNewGoal && (
               <div className="py-20 text-center opacity-30 grayscale items-center flex flex-col">
                 <div className="text-7xl mb-4">🏆</div>
                 <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-xs">Sin metas activas</p>
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PresupuestosMetasScreen;
