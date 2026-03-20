import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Tag } from 'lucide-react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { DEFAULT_CATEGORIES } from '../lib/utils';

const CategoriasScreen = ({ onNavigate, categories, setCategories }) => {
  const [tab, setTab] = useState('gasto');
  const [newCat, setNewCat] = useState({ icon: '📌', label: '' });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!newCat.label.trim()) return;
    const updated = { ...categories };
    updated[tab] = [...(updated[tab] || []), { icon: newCat.icon, label: newCat.label.trim() }];
    setCategories(updated);
    setNewCat({ icon: '📌', label: '' });
    setShowAdd(false);
  };

  const handleDelete = (label) => {
    const isDefault = DEFAULT_CATEGORIES[tab]?.some(c => c.label === label);
    if (isDefault) return;
    const updated = { ...categories };
    updated[tab] = updated[tab].filter(c => c.label !== label);
    setCategories(updated);
  };

  const emojis = ['📌', '🏪', '🎭', '🐾', '🏋️', '✈️', '🎨', '🎸', '📦', '🏡', '💊', '📱', '🚕', '🍕', '🍰', '🍿', '🎬', '🎮', '🚗', '💡'];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-24 animate-in fade-in duration-500">
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 pt-12 pb-6">
        <button onClick={() => onNavigate('more')} className="flex items-center gap-2 text-[var(--text-muted)] font-black text-xs uppercase tracking-widest mb-6 hover:text-[#FFCE45] transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
        </button>
        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Categorías</h2>
      </div>

      <main className="px-6 mt-6 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-sm border border-[var(--border-color)]">
          {['gasto', 'ingreso'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3.5 rounded-[20px] text-sm font-black transition-all duration-400 ${tab === t ? 'bg-[#FFCE45] text-[#221F26] shadow-lg shadow-[#FFCE45]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              {t === 'gasto' ? '💸 Gastos' : '💰 Ingresos'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(categories[tab] || []).map((cat, idx) => {
            const isDefault = DEFAULT_CATEGORIES[tab]?.some(c => c.label === cat.label);
            return (
              <Card key={idx} noPadding className="p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-base)] rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                  <div>
                    <span className="font-black text-[var(--text-main)] block">{cat.label}</span>
                    {isDefault && <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Predeterminada</span>}
                  </div>
                </div>
                {!isDefault && (
                  <button onClick={() => handleDelete(cat.label)} className="p-3 text-gray-300 hover:text-[#E53E3E] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                )}
              </Card>
            );
          })}
        </div>

        {showAdd ? (
          <Card className="!p-7 border-2 border-dashed border-[#FFCE45]/40 animate-in zoom-in-95 duration-300">
            <h4 className="font-black text-[var(--text-main)] mb-6 text-xl tracking-tight">Nueva Categoría</h4>
            
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 pl-1">Elegí un ícono</p>
            <div className="flex gap-2.5 flex-wrap mb-6 max-h-40 overflow-y-auto p-2 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-color)]">
              {emojis.map(e => (
                <button key={e} onClick={() => setNewCat({...newCat, icon: e})} className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl transition-all ${newCat.icon === e ? 'bg-[#FFCE45] scale-110 shadow-lg text-[#221F26]' : 'bg-[var(--bg-card)] hover:scale-105 active:scale-95 border border-[var(--border-color)]/50'}`}>
                  {e}
                </button>
              ))}
            </div>
            
            <Input placeholder="Nombre (ej: Sushi 🍣)" value={newCat.label} onChange={e => setNewCat({...newCat, label: e.target.value})} className="mb-6" />
            
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-main)] transition-colors">Cancelar</button>
              <Button onClick={handleAdd} className="flex-1">Agregar</Button>
            </div>
          </Card>
        ) : (
          <button onClick={() => setShowAdd(true)} className="w-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-[28px] text-[var(--text-muted)] hover:border-[#FFCE45] hover:text-[#FFCE45] transition-all flex flex-col items-center gap-2 group active:scale-[0.98]">
             <div className="w-10 h-10 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-color)] group-hover:border-[#FFCE45] transition-colors"><Plus size={20} strokeWidth={3} /></div>
             <span className="font-black text-xs uppercase tracking-widest">Nueva Categoría</span>
          </button>
        )}
      </main>
    </div>
  );
};

export default CategoriasScreen;
