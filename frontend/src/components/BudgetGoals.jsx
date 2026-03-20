import React, { useState } from 'react';
import { Plus, Target, Pencil } from 'lucide-react';
// Importamos los componentes compartidos para mantener la coherencia visual
import { Header, Card, Button, formatMoney } from './Shared';

export const BudgetGoalsScreen = ({ onNavigate, budgets, setBudgets, goals, setGoals, triggerToast }) => {
  const [activeTab, setActiveTab] = useState('presupuestos');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', amount: '', currency: 'ARS', icon: '🎯' });

  // Función para guardar o editar un presupuesto/meta
  const handleAdd = () => {
    if (!formData.name || !formData.amount) return;
    const isPresupuesto = activeTab === 'presupuestos';
    const listUpdater = isPresupuesto ? setBudgets : setGoals;
    const currentList = isPresupuesto ? budgets : goals;

    if (editingId) {
      listUpdater(currentList.map(item => item.id === editingId ? { ...item, ...formData } : item));
      triggerToast(`${isPresupuesto ? 'Presupuesto' : 'Meta'} editado con éxito`);
    } else {
      listUpdater([...currentList, { ...formData, [isPresupuesto ? 'spent' : 'saved']: 0, id: Date.now() }]);
      triggerToast(`${isPresupuesto ? 'Presupuesto' : 'Meta'} guardado correctamente`);
    }
    
    // Limpiamos el formulario
    setIsAdding(false); 
    setEditingId(null); 
    setFormData({ name: '', amount: '', currency: 'ARS', icon: '🎯' });
  };

  const handleEdit = (item) => { 
    setFormData(item); 
    setEditingId(item.id); 
    setIsAdding(true); 
  };

  const list = activeTab === 'presupuestos' ? budgets : goals;
  const labelActual = activeTab === 'presupuestos' ? 'Gastado' : 'Ahorrado';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in slide-in-from-right-8 duration-300">
      {/* Botón de volver a la pantalla 'Más' */}
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Presupuestos y Metas" />
      
      <main className="px-6 mt-6 space-y-6">
        {/* Selector de Pestaña: Presupuestos vs Metas */}
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-inner border border-[var(--border-color)]">
          <button 
            onClick={() => { setActiveTab('presupuestos'); setIsAdding(false); }} 
            className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'presupuestos' ? 'bg-[#FFCE45] text-[#221F26] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            Presupuestos
          </button>
          <button 
            onClick={() => { setActiveTab('metas'); setIsAdding(false); }} 
            className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'metas' ? 'bg-[#FFCE45] text-[#221F26] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            Metas
          </button>
        </div>

        {isAdding ? (
          <Card className="!p-6 border-0 animate-in fade-in duration-300 shadow-lg">
            <h3 className="font-black text-[var(--text-main)] text-base mb-5">
              {editingId ? 'Editar' : 'Nuevo'} {activeTab === 'presupuestos' ? 'Presupuesto' : 'Meta'}
            </h3>
            
            <div className="flex gap-4 mb-4">
              <div className="w-1/4">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Emoji</label>
                <input 
                  type="text" 
                  value={formData.icon} 
                  onChange={(e) => setFormData({...formData, icon: e.target.value})} 
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-4 text-center text-xl outline-none focus:border-[#FFCE45]" 
                />
              </div>
              <div className="w-3/4">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Nombre</label>
                <input 
                  type="text" 
                  placeholder="Ej: Supermercado" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-4 px-4 text-[var(--text-main)] font-bold outline-none focus:border-[#FFCE45]" 
                />
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="w-2/3">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Monto Objetivo</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-4 px-4 text-[var(--text-main)] font-bold outline-none focus:border-[#FFCE45]" 
                />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Moneda</label>
                <select 
                  value={formData.currency} 
                  onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-4 px-2 text-[var(--text-main)] font-bold outline-none"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingId(null); }} className="!bg-transparent border-none">Cancelar</Button>
              <Button onClick={handleAdd}>Guardar</Button>
            </div>
          </Card>
        ) : (
          <>
            <Button 
              onClick={() => setIsAdding(true)} 
              className="py-4 border-2 border-dashed border-[var(--border-color)] bg-transparent text-[var(--text-muted)] hover:border-[#FFCE45] hover:text-[var(--text-main)] shadow-none"
            >
              <Plus size={20} /> Agregar {activeTab === 'presupuestos' ? 'Presupuesto' : 'Meta'}
            </Button>

            {list.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <Target size={40} className="mx-auto mb-3" />
                <p className="font-bold text-sm">Todavía no creaste ningún item</p>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {list.map((item) => {
                  const current = activeTab === 'presupuestos' ? item.spent : item.saved;
                  const percentage = Math.min((current / item.amount) * 100, 100);
                  return (
                    <Card key={item.id} className="!p-5 border-0 shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl bg-[var(--input-bg)] w-12 h-12 rounded-[16px] flex items-center justify-center shadow-inner">{item.icon}</span>
                          <div>
                            <h4 className="font-black text-[var(--text-main)] text-base tracking-tight">{item.name}</h4>
                            <p className="text-xs text-[var(--text-muted)] font-bold">{labelActual}: {formatMoney(current, item.currency)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-black text-[var(--text-main)] text-lg">{formatMoney(item.amount, item.currency)}</p>
                          <button onClick={() => handleEdit(item)} className="text-[var(--text-muted)] hover:text-[#FFCE45] p-1 active:scale-90 transition-transform">
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--border-color)] rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${activeTab === 'presupuestos' ? (percentage > 90 ? 'bg-[#E53E3E]' : percentage > 70 ? 'bg-[#FFCE45]' : 'bg-[#639639]') : 'bg-gradient-to-r from-[#9D50FF] to-[#8B3DED]'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};