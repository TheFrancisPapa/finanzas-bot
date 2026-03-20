import React from 'react';
import { ShieldCheck, Sparkles, Download, Heart, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import { MercadoPagoLogo } from '../assets/logos';
import { crearPreferenciaPago } from '../lib/api';

const ProScreen = ({ onNavigate }) => {
  const handlePay = async (plan) => {
    try {
      const result = await crearPreferenciaPago(plan);
      if (result.url) window.location.href = result.url;
    } catch {
      alert('Error en el pago. Reintentar más tarde.');
    }
  };

  const Feature = ({ icon: Icon, title, desc, delay = 0 }) => (
    <div 
      className="stagger-animate bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex items-center gap-5 hover:bg-white/10 transition-all duration-300 group shadow-lg"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-14 h-14 bg-gradient-to-br from-[#9D50FF]/20 to-[#6E36B3]/20 rounded-2xl flex items-center justify-center text-2xl border border-white/5 group-hover:scale-110 transition-transform">
        <Icon className="text-[#D6B5FF]" size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-white font-black text-lg tracking-tight mb-0.5">{title}</h4>
        <p className="text-gray-400 text-[13px] font-bold leading-snug">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#16141A] pb-32 relative overflow-hidden animate-in fade-in duration-700">
      {/* Background Glows */}
      <div className="absolute -left-20 -top-20 w-[600px] h-[600px] bg-[#9D50FF] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute -right-20 top-60 w-[600px] h-[600px] bg-[#009EE3] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute left-1/4 bottom-0 w-[500px] h-[500px] bg-[#FFCE45] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

      <header className="px-6 pt-10 pb-4 sticky top-0 z-[60] flex items-center justify-between">
        <button 
          onClick={() => onNavigate('home')} 
          className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all shadow-xl"
        >
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <div className="px-4 py-2 bg-[#9D50FF] rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#9D50FF]/40 border-2 border-white/20 animate-pulse">
          Mejor valorado
        </div>
      </header>

      <main className="px-6 mt-6 relative z-10 flex flex-col items-center">
        <div className="text-center mb-10 stagger-animate">
          <div className="w-24 h-24 bg-[#FFCE45] rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-[#FFCE45]/30 mx-auto transform rotate-12 relative animate-bounce" style={{ animationDuration: '4s' }}>
            👑
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg transform -rotate-12">
               <Sparkles className="text-[#FFCE45]" size={20} />
            </div>
          </div>
          <h2 className="text-[48px] font-black text-white leading-none tracking-tighter mb-4">
             Manguito<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFCE45] via-[#D6B5FF] to-[#9D50FF]">PRO</span>
          </h2>
          <p className="text-gray-400 font-black text-sm uppercase tracking-[0.2em] opacity-80">El poder total de tus finanzas</p>
        </div>

        <div className="w-full space-y-4 mb-10">
          <Feature 
            icon={Sparkles} 
            title="Mango AI Senior" 
            desc="Análisis profundo y consultas ilimitadas sobre tus gastos."
            delay={0.1}
          />
          <Feature 
            icon={Download} 
            title="Exportación Total" 
            desc="Descargá PDFs estéticos y Excels para tus reportes."
            delay={0.2}
          />
          <Feature 
            icon={Heart} 
            title="Modo Pareja Plus" 
            desc="Cuentas compartidas sincronizadas en tiempo real."
            delay={0.3}
          />
          <Feature 
            icon={ShieldCheck} 
            title="Seguridad Bancaria" 
            desc="Conexión automática con tus bancos favoritos."
            delay={0.4}
          />
        </div>

        <div className="stagger-animate w-full bg-white/10 backdrop-blur-3xl rounded-[40px] p-8 text-center border-2 border-white/10 shadow-2xl relative overflow-hidden" style={{ animationDelay: '0.5s' }}>
          <div className="absolute top-0 right-0 p-4">
             <div className="bg-[#639639] text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">-50% OFF</div>
          </div>
          
          <p className="text-gray-400 font-bold text-sm mb-2 opacity-80 italic">Un solo pago, beneficios para siempre.</p>
          <div className="flex justify-center items-end gap-1 mb-10">
            <span className="text-6xl font-black text-white leading-none tracking-tighter">$6.999</span>
            <span className="text-sm font-bold text-gray-400 mb-1.5 uppercase">ARS</span>
          </div>

          <Button 
            onClick={() => handlePay('full')} 
            className="w-full !bg-[#009EE3] hover:!bg-[#0089C5] !text-white flex items-center justify-center gap-4 py-5.5 text-lg font-black shadow-xl shadow-[#009EE3]/30 border-none group active:scale-95 transition-all"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
               <MercadoPagoLogo className="w-6 h-6" />
            </div>
            PAGAR CON MERCADO PAGO
          </Button>
          
          <div className="flex items-center justify-center gap-6 mt-10 p-4 bg-white/5 rounded-[24px]">
             <div className="text-center">
                <p className="text-white font-black text-lg leading-none">1.5k+</p>
                <p className="text-gray-500 font-bold text-[9px] uppercase tracking-widest mt-1">Usuarios</p>
             </div>
             <div className="w-px h-8 bg-white/10"></div>
             <div className="text-center">
                <p className="text-white font-black text-lg leading-none">4.9/5</p>
                <div className="flex gap-0.5 mt-1">
                   {[...Array(5)].map((_, i) => <Star key={i} size={8} fill="#FFCE45" className="text-[#FFCE45]" />)}
                </div>
             </div>
             <div className="w-px h-8 bg-white/10"></div>
             <div className="text-center text-white">
                <p className="font-black text-lg leading-none">ARS</p>
                <p className="text-gray-500 font-bold text-[9px] uppercase tracking-widest mt-1">Soporte</p>
             </div>
          </div>
        </div>

        <p className="stagger-animate mt-8 text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed" style={{ animationDelay: '0.6s' }}>
           Seguridad garantizada por cifrado de punta a punta.
        </p>
      </main>
    </div>
  );
};

export default ProScreen;
