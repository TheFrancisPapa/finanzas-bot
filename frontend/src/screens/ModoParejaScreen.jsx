import React from 'react';
import { Heart, Users, ArrowRight, Star } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/ui/Button';

const ModoParejaScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Modo Pareja" />
      <main className="px-6 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="stagger-animate bg-gradient-to-br from-[#FFCE45] to-[#FDBC3C] rounded-[40px] p-10 text-center relative overflow-hidden shadow-xl">
           <div className="absolute top-[-20%] left-[-20%] w-40 h-40 bg-white opacity-20 rounded-full blur-3xl animate-pulse"></div>
           <div className="text-7xl mb-6 drop-shadow-lg">👩‍❤️‍👨</div>
           <h2 className="text-3xl font-black text-[#221F26] mb-3 tracking-tight leading-tight">Finanzas de a dos, mangos compartidos</h2>
           <p className="text-[#221F26] font-black opacity-80 leading-relaxed text-sm">Sincronizá tus gastos con tu pareja, dividan cuentas y ahorren para metas juntos.</p>
        </div>

        <div className="space-y-4">
          {[
            { icon: <Users className="text-blue-500" />, title: "Cuentas vinculadas", desc: "Vean el balance total del hogar en tiempo real." },
            { icon: <Heart className="text-red-500" />, title: "Metas compartidas", desc: "Ahorren para el casamiento, la casa o un viaje." },
            { icon: <Star className="text-purple-500" />, title: "División automática", desc: "Dividan gastos 50/50 o por porcentajes." }
          ].map((item, i) => (
            <div key={i} className="stagger-animate flex gap-4 p-5 bg-[var(--bg-card)] rounded-[24px] border border-[var(--border-color)] group hover:border-[#FFCE45] transition-all shadow-sm" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="w-12 h-12 bg-[var(--input-bg)] rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="flex-1">
                <h4 className="font-black text-[var(--text-main)] text-sm">{item.title}</h4>
                <p className="text-xs font-bold text-[var(--text-muted)] mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="stagger-animate p-8 bg-[#16141A] rounded-[40px] text-white text-center border border-white/5 shadow-2xl" style={{ animationDelay: '0.45s' }}>
           <h3 className="text-xl font-black mb-4">Exclusivo Manguito PRO</h3>
           <p className="text-gray-400 text-sm font-bold mb-8 italic opacity-70">"El amor no se acaba por la plata, se acaba por no hablar de ella." 🥭</p>
           <Button variant="pro" className="py-5 text-lg" onClick={() => onNavigate('pro')}>Desbloquear Modo Pareja <ArrowRight size={20} className="ml-2" /></Button>
        </div>
      </main>
    </div>
  );
};

export default ModoParejaScreen;
