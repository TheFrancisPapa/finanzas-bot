import React from 'react';
import Header from '../components/Header';
import Card from '../components/ui/Card';

const ModoParejaScreen = ({ onNavigate }) => (
  <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-12 animate-in fade-in duration-500">
    <Header onNavigate={() => onNavigate('more')} title="Modo Pareja" backButton />
    <main className="px-6 mt-8 text-center">
      <div className="text-7xl mb-6">👫</div>
      <h2 className="text-3xl font-black text-[var(--text-main)] mb-3 tracking-tight">Modo Pareja</h2>
      <p className="text-[var(--text-muted)] font-medium mb-8 max-w-xs mx-auto">Compartí tus finanzas con tu pareja. Ambos ven los mismos movimientos, presupuestos y metas.</p>
      <Card className="!p-8 border-[#9D50FF]/30">
        <div className="inline-flex items-center gap-2 bg-[#9D50FF]/10 text-[#9D50FF] px-4 py-2 rounded-xl text-sm font-black mb-4">⭐ Función PRO</div>
        <p className="text-sm text-[var(--text-muted)] font-medium">Esta función está disponible exclusivamente para usuarios PRO.</p>
      </Card>
    </main>
  </div>
);

export default ModoParejaScreen;
