import React from 'react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ConexionBancariaScreen = ({ onNavigate }) => (
  <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-12 animate-in fade-in duration-500">
    <Header onNavigate={() => onNavigate('more')} title="Conexión Bancaria" backButton />
    <main className="px-6 mt-8 text-center">
      <div className="text-7xl mb-6">🏦</div>
      <h2 className="text-3xl font-black text-[var(--text-main)] mb-3 tracking-tight">Próximamente</h2>
      <p className="text-[var(--text-muted)] font-medium mb-8 max-w-xs mx-auto">Estamos trabajando para conectar con Mercado Pago, Ualá y más bancos argentinos.</p>
      <Card className="!p-8 text-left">
        <h4 className="font-black text-[var(--text-main)] mb-4">Bancos y billeteras planeadas</h4>
        <div className="space-y-3">
          {[
            { name: 'Mercado Pago', emoji: '💚', status: 'En desarrollo' },
            { name: 'Ualá', emoji: '💜', status: 'Próximamente' },
            { name: 'Brubank', emoji: '🔵', status: 'Próximamente' },
            { name: 'Naranja X', emoji: '🟠', status: 'Próximamente' }
          ].map(bank => (
            <div key={bank.name} className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{bank.emoji}</span>
                <span className="font-bold text-[var(--text-main)]">{bank.name}</span>
              </div>
              <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">{bank.status}</span>
            </div>
          ))}
        </div>
      </Card>
      <Button variant="secondary" onClick={() => onNavigate('more')} className="mt-6">Volver</Button>
    </main>
  </div>
);

export default ConexionBancariaScreen;
