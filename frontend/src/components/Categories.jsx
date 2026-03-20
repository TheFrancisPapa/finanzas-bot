import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
// Importamos la base visual desde Shared
import { Header, Card, Button } from './Shared';

export const CategoriasScreen = ({ onNavigate, categories, setCategories, triggerToast }) => {
  const [activeTab, setActiveTab] = useState('gasto');
  const [newCat, setNewCat] = useState({ icon: '✨', label: '' });

  // Función para agregar una categoría nueva a la lista (gasto o ingreso)
  const handleAdd = () => {
    if (!newCat.label.trim()) return;
    
    setCategories({
      ...categories,
      [activeTab]: [...categories[activeTab], newCat]
    });
    
    // Limpiamos los campos
    setNewCat({ icon: '✨', label: '' });
    triggerToast("Categoría agregada con éxito");
  };

  // Función para eliminar una categoría por su índice
  const handleDelete = (index) => {
    const updated = categories[activeTab].filter((_, i) => i !== index);
    setCategories({
      ...categories,
      [activeTab]: updated
    });
    triggerToast("Categoría eliminada", "error");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32 animate-in slide-in-from-right-8 duration-300">
      {/* Botón para volver a la pantalla de Ajustes (More) */}
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Mis Categorías" />
      
      <main className="px-6 mt-6 space-y-6">
        {/* Selector: Gastos vs Ingresos */}
        <div className="bg-[var(--bg-card)] p-1.5 rounded-[24px] flex border border-[var(--border-color)]">
          <button 
            onClick={() => setActiveTab('gasto')} 
            className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'gasto' ? 'bg-[#FFEBEB] text-[#E53E3E]' : 'text-[var(--text-muted)]'}`}
          >
            Gastos
          </button>
          <button 
            onClick={() => setActiveTab('ingreso')} 
            className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all ${activeTab === 'ingreso' ? 'bg-[#E6F4EA] text-[#639639]' : 'text-[var(--text-muted)]'}`}
          >
            Ingresos
          </button>
        </div>

        {/* Card para crear una nueva categoría */}
        <Card className="!p-6 space-y-4 shadow-md border-none">
          <h3 className="font-black text-xs uppercase text-[var(--text-muted)] tracking-widest px-1">Nueva categoría</h3>
          <div className="flex gap-3">
            <div className="w-16">
              <input 
                type="text" 
                maxLength="2"
                value={newCat.icon} 
                onChange={e => setNewCat({...newCat, icon: e.target.value})}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl py-3.5 text-center text-xl outline-none focus:border-[#FFCE45] transition-all"
              />
            </div>
            <input 
              type="text" 
              placeholder="Nombre de la categoría..." 
              value={newCat.label}
              onChange={e => setNewCat({...newCat, label: e.target.value})}
              className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl py-3 px-4 font-bold outline-none focus:border-[#FFCE45] transition-all"
            />
            <button 
              onClick={handleAdd} 
              className="bg-[#FFCE45] text-[#221F26] px-4 rounded-xl active:scale-90 transition-transform shadow-sm"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </Card>

        {/* Listado de categorías actuales */}
        <div className="space-y-3">
          <h3 className="font-black text-xs uppercase text-[var(--text-muted)] tracking-widest px-2 mt-4">Tus categorías de {activeTab}s</h3>
          {categories[activeTab].map((cat, i) => (
            <Card key={i} noPadding className="p-4 flex justify-between items-center bg-white/50 border-none shadow-sm hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-4">
                <span className="text-2xl w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-inner border border-gray-50">{cat.icon}</span>
                <span className="font-black text-[var(--text-main)]">{cat.label}</span>
              </div>
              <button 
                onClick={() => handleDelete(i)} 
                className="text-gray-300 hover:text-[#E53E3E] p-2 transition-colors active:scale-90"
              >
                <Trash2 size={20} />
              </button>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};