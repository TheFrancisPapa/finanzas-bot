import React from 'react';
import Button from '../components/ui/Button';
import { MercadoPagoLogo } from '../assets/logos';
import { crearPreferenciaPago } from '../lib/api';

const ProScreen = ({ onNavigate }) => {
  const handlePay = async (plan) => {
    try {
      const result = await crearPreferenciaPago(plan);
      if (result.url) window.open(result.url, '_blank');
    } catch {
      // Fallback for when backend is not running
      alert('Error creando preferencia de pago. Asegurate de que el backend esté corriendo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#110f13] pb-32 animate-in slide-in-from-bottom-full duration-500 z-50 relative overflow-hidden">
      <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[140px] opacity-30 animate-pulse"></div>
      <div className="absolute -right-20 top-60 w-[400px] h-[400px] bg-[#009EE3] rounded-full mix-blend-screen filter blur-[140px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <header className="px-6 pt-10 pb-4 flex items-center justify-between bg-transparent sticky top-0 z-40 relative">
        <button onClick={() => onNavigate('home')} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 border border-white/10">
          <span className="text-xl font-bold">✕</span>
        </button>
      </header>

      <main className="px-6 mt-2 relative z-10">
        <div className="text-center mb-10">
          <div className="text-[80px] mb-4 drop-shadow-[0_0_30px_rgba(255,206,69,0.5)]">👑</div>
          <h2 className="text-[44px] font-black text-white mb-2 tracking-tighter leading-none">Manguito <span className="text-[#D6B5FF] bg-clip-text text-transparent bg-gradient-to-r from-[#9D50FF] to-[#D6B5FF]">PRO</span></h2>
          <p className="text-gray-400 font-bold tracking-wide">Llevá tus finanzas al siguiente nivel.</p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-[#D36F11]/20 p-3.5 rounded-[20px] border border-[#D36F11]/30">🤖</div>
            <div><h4 className="text-white font-black text-lg tracking-tight">Mango IA Extendida</h4><p className="text-gray-400 text-sm font-medium leading-snug mt-0.5">Hasta 20 consultas por día (límite de cuota IA).</p></div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-[#639639]/20 p-3.5 rounded-[20px] border border-[#639639]/30">📊</div>
            <div><h4 className="text-white font-black text-lg tracking-tight">Exportá todo</h4><p className="text-gray-400 text-sm font-medium leading-snug mt-0.5">Descargá tus reportes en PDF y Excel para el contador.</p></div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="text-3xl bg-[#009EE3]/20 p-3.5 rounded-[20px] border border-[#009EE3]/30">🏦</div>
            <div><h4 className="text-white font-black text-lg tracking-tight">Sincronización Bancaria</h4><p className="text-gray-400 text-sm font-medium leading-snug mt-0.5">Conectá con Mercado Pago y Ualá directamente.</p></div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden border border-white/20">
          <p className="text-gray-300 font-black uppercase tracking-widest text-xs mb-2">Inversión mensual</p>
          <div className="flex justify-center items-end gap-1 mb-8">
            <span className="text-[52px] font-black text-white leading-none">$6.999</span>
            <span className="text-lg font-bold text-gray-400 mb-1.5">ARS</span>
          </div>

          <Button onClick={() => handlePay('mensual')} className="!bg-[#009EE3] hover:!bg-[#0089C5] !text-white flex items-center justify-center gap-4 py-5 text-lg shadow-[0_12px_30px_-10px_rgba(0,158,227,0.7)] border-none">
            <MercadoPagoLogo className="w-8 h-8 bg-white/20 p-1.5 rounded-xl shadow-inner" />
            Pagar suscripción
          </Button>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-5">Podés cancelar en cualquier momento</p>
        </div>
      </main>
    </div>
  );
};

export default ProScreen;
