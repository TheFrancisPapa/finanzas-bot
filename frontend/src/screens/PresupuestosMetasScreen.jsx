import React, { useState } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatMoney } from '../lib/utils';

const PresupuestosMetasScreen = ({ onNavigate, budgets = [], savingsGoals = [], onUpdateBudgets, onUpdateGoals }) => {
  const [tab, setTab] = useState('presupuestos');
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', maxAmount: '' });
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.maxAmount) return;
    onUpdateBudgets([...budgets, { id: Date.now(), ...newBudget, spent: 0 }]);
    setNewBudget({ category: '', maxAmount: '' });
    setShowNewBudget(false);
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    onUpdateGoals([...savingsGoals, { id: Date.now(), ...newGoal, current: 0 }]);
    setNewGoal({ name: '', target: '' });
    setShowNewGoal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-12 animate-in fade-in duration-500">
      <Header onNavigate={() => onNavigate('more')} title="Presupuestos y Metas" backButton />
      <main className="px-6 mt-4 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-sm border border-[var(--border-color)]">
          {['presupuestos', 'metas'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all duration-300 ${tab === t ? 'bg-[#FFCE45] text-[#221F26] shadow-md' : 'text-[var(--text-muted)]'}`}>
              {t === 'presupuestos' ? '📊 Presupuestos' : '🎯 Metas'}
            </button>
          ))}
        </div>

        {tab === 'presupuestos' && (
          <div className="space-y-4">
            {budgets.map(b => (
              <Card key={b.id} className="!p-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-[var(--text-main)]">{b.category}</h4>
                  <span className="text-sm font-bold text-[var(--text-muted)]">{formatMoney(b.spent || 0)} / {formatMoney(Number(b.maxAmount))}</span>
                </div>
                <div className="w-full bg-[var(--input-bg)] rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${((b.spent || 0) / b.maxAmount) > 0.8 ? 'bg-[#E53E3E]' : 'bg-[#FFCE45]'}`} style={{ width: `${Math.min(((b.spent || 0) / b.maxAmount) * 100, 100)}%` }}></div>
                </div>
              </Card>
            ))}
            {budgets.length === 0 && !showNewBudget && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-[var(--text-muted)] font-bold mb-4">No tenés presupuestos aún</p>
              </div>
            )}
            {showNewBudget ? (
              <Card className="!p-6 border-[#FFCE45]/50 animate-in fade-in duration-300">
                <h4 className="font-black text-[var(--text-main)] mb-4">Nuevo Presupuesto</h4>
                <Input placeholder="Categoría (ej: Comida)" value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} className="mb-3" />
                <Input placeholder="Monto máximo ($)" type="number" value={newBudget.maxAmount} onChange={e => setNewBudget({...newBudget, maxAmount: e.target.value})} className="mb-4" />
                <div className="flex gap-3">
                  <Button onClick={() => setShowNewBudget(false)} variant="secondary" className="flex-1 py-3">Cancelar</Button>
                  <Button onClick={handleAddBudget} className="flex-1 py-3">Guardar</Button>
                </div>
              </Card>
            ) : (
              <Button onClick={() => setShowNewBudget(true)} variant="secondary" className="border-dashed"><Plus size={18} /> Agregar presupuesto</Button>
            )}
          </div>
        )}

        {tab === 'metas' && (
          <div className="space-y-4">
            {savingsGoals.map(g => (
              <Card key={g.id} className="!p-5">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-[var(--text-main)] flex items-center gap-2"><Target size={16} className="text-[#FFCE45]" /> {g.name}</h4>
                  <span className="text-xs font-bold text-[var(--text-muted)]">{Math.round(((g.current || 0) / g.target) * 100)}%</span>
                </div>
                <div className="w-full bg-[var(--input-bg)] rounded-full h-3 overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FFCE45] to-[#639639] transition-all duration-500" style={{ width: `${Math.min(((g.current || 0) / g.target) * 100, 100)}%` }}></div>
                </div>
                <p className="text-sm text-[var(--text-muted)] font-bold">{formatMoney(g.current || 0)} / {formatMoney(Number(g.target))}</p>
              </Card>
            ))}
            {savingsGoals.length === 0 && !showNewGoal && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎯</div>
                <p className="text-[var(--text-muted)] font-bold mb-4">No tenés metas de ahorro aún</p>
              </div>
            )}
            {showNewGoal ? (
              <Card className="!p-6 border-[#FFCE45]/50 animate-in fade-in duration-300">
                <h4 className="font-black text-[var(--text-main)] mb-4">Nueva Meta</h4>
                <Input placeholder="Nombre (ej: Viaje a Europa)" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="mb-3" />
                <Input placeholder="Objetivo ($)" type="number" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} className="mb-4" />
                <div className="flex gap-3">
                  <Button onClick={() => setShowNewGoal(false)} variant="secondary" className="flex-1 py-3">Cancelar</Button>
                  <Button onClick={handleAddGoal} className="flex-1 py-3">Guardar</Button>
                </div>
              </Card>
            ) : (
              <Button onClick={() => setShowNewGoal(true)} variant="secondary" className="border-dashed"><Plus size={18} /> Agregar meta</Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PresupuestosMetasScreen;
