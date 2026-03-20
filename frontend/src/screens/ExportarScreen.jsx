import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ExportarScreen = ({ onNavigate, triggerToast }) => {
  const [format, setFormat] = useState('pdf');

  const handleExport = () => {
    triggerToast(`Exportando datos a ${format.toUpperCase()}...`, 'success');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Exportar Datos" />
      <main className="px-6 mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center">
           <div className="w-20 h-20 bg-[var(--bg-card)] rounded-[24px] flex items-center justify-center mx-auto mb-5 border border-[var(--border-color)] shadow-xl transform animate-bounce" style={{ animationDuration: '3s' }}><Download size={32} className="text-[#FFCE45]" /></div>
           <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Tus reportes listos</h2>
           <p className="text-[var(--text-muted)] font-black uppercase text-[10px] tracking-widest mt-1 opacity-70">Descargá tus finanzas</p>
        </div>

        <div className="space-y-3">
          {[
            { id: 'pdf', title: 'PDF Estético', desc: 'Gráficos elegantes, ideal para imprimir.', icon: '📄' },
            { id: 'excel', title: 'Excel Detallado', desc: 'Todas las transacciones para usar filtros.', icon: '📊' },
            { id: 'json', title: 'Formato JSON', desc: 'Para desarrolladores y backup total.', icon: '🛠️' }
          ].map((item, i) => (
            <button key={item.id} onClick={() => setFormat(item.id)} className={`stagger-animate w-full p-6 text-left rounded-[28px] border-2 transition-all duration-300 flex items-center gap-5 ${format === item.id ? 'border-[#FFCE45] bg-[var(--bg-card)] shadow-lg scale-[1.02]' : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-70 hover:opacity-100 hover:border-[#FFCE45]/40 shadow-sm'}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <h4 className="font-black text-[var(--text-main)]">{item.title}</h4>
                <p className="text-xs font-bold text-[var(--text-muted)] mt-0.5">{item.desc}</p>
              </div>
              {format === item.id && <CheckCircle2 size={24} className="text-[#639639] animate-in zoom-in" />}
            </button>
          ))}
        </div>

        <Card className="stagger-animate bg-[#9D50FF]/5 border-dashed border-[#9D50FF]/30 !p-6 shadow-none" style={{ animationDelay: '0.4s' }}>
           <div className="flex gap-4 items-start">
              <Sparkles className="text-[#9D50FF] flex-shrink-0 animate-pulse" size={20} />
              <p className="text-xs font-bold text-[var(--text-main)] leading-relaxed">
                Como usuario <span className="text-[#9D50FF] font-black underline">PRO</span> tenés exportaciones ilimitadas y reportes personalizados por IA incluidos.
              </p>
           </div>
        </Card>

        <div className="stagger-animate pt-4" style={{ animationDelay: '0.5s' }}>
          <Button onClick={handleExport} className="py-5 text-lg shadow-[0_10px_30px_-5px_rgba(255,206,69,0.3)]">Descargar {format.toUpperCase()}</Button>
        </div>
      </main>
    </div>
  );
};

export default ExportarScreen;
