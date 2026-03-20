import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
    updated[tab] = [...updated[tab], { icon: newCat.icon, label: newCat.label.trim() }];
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

  const emojis = ['📌', '🏪', '🎭', '🐾', '🏋️', '✈️', '🎨', '🎸', '📦', '🏡', '💊', '📱', '🚕', '🍕'];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-12 animate-in fade-in duration-500">
      <Header onNavigate={() => onNavigate('more')} title="Categorías" backButton />
      <main className="px-6 mt-4 space-y-6">
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex shadow-sm border border-[var(--border-color)]">
          {['gasto', 'ingreso'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all duration-300 ${tab === t ? 'bg-[#FFCE45] text-[#221F26] shadow-md' : 'text-[var(--text-muted)]'}`}>
              {t === 'gasto' ? '💸 Gastos' : '💰 Ingresos'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(categories[tab] || []).map((cat, idx) => {
            const isDefault = DEFAULT_CATEGORIES[tab]?.some(c => c.label === cat.label);
            return (
              <Card key={idx} noPadding className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center">{cat.icon}</span>
                  <span className="font-bold text-[var(--text-main)]">{cat.label}</span>
                  {isDefault && <span className="text-[10px] text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-1 rounded-md font-bold">Default</span>}
                </div>
                {!isDefault && (
                  <button onClick={() => handleDelete(cat.label)} className="text-[#E53E3E] hover:bg-[#FFEBEB] p-2 rounded-xl transition-colors"><Trash2 size={16} /></button>
                )}
              </Card>
            );
          })}
        </div>

        {showAdd ? (
          <Card className="!p-6 border-[#FFCE45]/50 animate-in fade-in duration-300">
            <h4 className="font-black text-[var(--text-main)] mb-4">Nueva Categoría</h4>
            <div className="flex gap-2 flex-wrap mb-4">
              {emojis.map(e => (
                <button key={e} onClick={() => setNewCat({...newCat, icon: e})} className={`text-2xl p-2 rounded-xl transition-all ${newCat.icon === e ? 'bg-[#FFCE45] scale-110 shadow-sm' : 'bg-[var(--input-bg)] hover:scale-105'}`}>{e}</button>
              ))}
            </div>
            <Input placeholder="Nombre de la categoría" value={newCat.label} onChange={e => setNewCat({...newCat, label: e.target.value})} className="mb-4" />
            <div className="flex gap-3">
              <Button onClick={() => setShowAdd(false)} variant="secondary" className="flex-1 py-3">Cancelar</Button>
              <Button onClick={handleAdd} className="flex-1 py-3">Agregar</Button>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setShowAdd(true)} variant="secondary" className="border-dashed"><Plus size={18} /> Agregar categoría</Button>
        )}
      </main>
    </div>
  );
};

export default CategoriasScreen;
