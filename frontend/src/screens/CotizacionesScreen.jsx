import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import { getCotizaciones } from '../lib/api';

const CotizacionesScreen = ({ onNavigate }) => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const data = await getCotizaciones();
        setRates(data);
        setLastUpdate(new Date().toLocaleTimeString('es-AR'));
      } catch {
        // fallback mock
        setRates({
          oficial: { nombre: 'Oficial', compra: 1080, venta: 1120 },
          blue: { nombre: 'Blue', compra: 1310, venta: 1350 },
          tarjeta: { nombre: 'Tarjeta', compra: null, venta: 1680 },
          mep: { nombre: 'MEP/Bolsa', compra: 1280, venta: 1300 },
          ccl: { nombre: 'CCL', compra: 1290, venta: 1320 },
          cripto: { nombre: 'Cripto', compra: 1300, venta: 1340 },
        });
        setLastUpdate('Datos de ejemplo');
      }
      setLoading(false);
    };
    fetchRates();
  }, []);

  const typeConfig = {
    oficial: { emoji: '🏛️', color: 'bg-blue-50 dark:bg-blue-500/10' },
    blue: { emoji: '💵', color: 'bg-green-50 dark:bg-green-500/10' },
    tarjeta: { emoji: '💳', color: 'bg-purple-50 dark:bg-purple-500/10' },
    mep: { emoji: '📊', color: 'bg-orange-50 dark:bg-orange-500/10' },
    ccl: { emoji: '🌐', color: 'bg-red-50 dark:bg-red-500/10' },
    cripto: { emoji: '₿', color: 'bg-yellow-50 dark:bg-yellow-500/10' },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-12 animate-in fade-in duration-500">
      <Header onNavigate={() => onNavigate('more')} title="Cotizaciones" backButton />
      <main className="px-6 space-y-4 mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-black text-[var(--text-main)]">Dólar hoy 💵</h3>
          {lastUpdate && <span className="text-xs font-bold text-[var(--text-muted)]">{lastUpdate}</span>}
        </div>
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-4 border-[#FFCE45] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-muted)] font-bold">Cargando cotizaciones...</p>
          </div>
        ) : rates && (
          <div className="space-y-3">
            {Object.entries(rates).map(([key, rate]) => {
              const cfg = typeConfig[key] || { emoji: '💰', color: 'bg-gray-50 dark:bg-gray-500/10' };
              return (
                <Card key={key} className="flex items-center justify-between !p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${cfg.color} rounded-2xl flex items-center justify-center text-xl`}>{cfg.emoji}</div>
                    <div>
                      <p className="font-black text-[var(--text-main)]">{rate.nombre || key}</p>
                      <p className="text-xs text-[var(--text-muted)] font-bold">ARS / USD</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {rate.compra && <p className="text-sm text-[var(--text-muted)]">Compra: <span className="font-black text-[var(--text-main)]">${Number(rate.compra).toLocaleString('es-AR')}</span></p>}
                    <p className="text-sm text-[var(--text-muted)]">Venta: <span className="font-black text-[#639639]">${Number(rate.venta).toLocaleString('es-AR')}</span></p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CotizacionesScreen;
