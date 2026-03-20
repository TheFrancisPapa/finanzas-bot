import React, { useState, useEffect, useRef } from 'react';
import { Send, Instagram as InstagramIcon, Youtube as YoutubeIcon } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Card from '../components/ui/Card';
import { InstagramLogo, YouTubeLogo } from '../assets/logos';
import { chatIA } from '../lib/api';

const LearnScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('ia');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: '¡Hola! Soy Mango IA ✨. Hacé una pregunta sobre tus finanzas, presupuestos o cómo invertir tus ahorros.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const financialTips = [
    { icon: '🛡️', title: 'Fondo de emergencia', desc: 'El primer paso para la tranquilidad es tener entre 3 y 6 meses de tus gastos fijos ahorrados.' },
    { icon: '⏳', title: 'Regla de las 24 horas', desc: 'Antes de una compra grande, esperá 24hs. Si la seguís queriendo, comprala. Evita gastos impulsivos.' },
    { icon: '📊', title: 'Regla 50/30/20', desc: 'Destiná 50% a necesidades, 30% a gustos y 20% a ahorro o inversión. Ideal para arrancar.' },
    { icon: '💳', title: 'Ojo con las cuotas', desc: 'Si compras en cuotas sin interés, asegurate de que la cuota no supere el 30% de tu sueldo.' },
    { icon: '📈', title: 'Interés compuesto', desc: 'Invertir poco pero constante a largo plazo genera más plata que invertir mucho de golpe muy tarde.' },
    { icon: '🐜', title: 'Gastos hormiga', desc: 'Ese café diario o suscripción que no usás suma un montón a fin de mes. Revisalos.' },
    { icon: '🎯', title: 'Pagate a vos primero', desc: 'Apenas cobres, separá la plata del ahorro. No ahorres lo que sobra después de gastar.' }
  ];
  const todayTip = financialTips[new Date().getDate() % financialTips.length];

  const tabs = [
    { id: 'ia', icon: '🤖', label: 'IA' },
    { id: 'tips', icon: '💡', label: 'Tips' },
    { id: 'instagram', icon: <InstagramLogo className="w-5 h-5" />, label: 'Instagram' },
    { id: 'youtube', icon: <YouTubeLogo className="w-5 h-5" />, label: 'YouTube' }
  ];

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatHistory, isTyping]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const newMsg = { role: 'user', text: chatInput };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsTyping(true);

    try {
      // Use existing chatIA from lib/api but provide context if possible
      const contextStr = updatedHistory.slice(-5).map(m => `${m.role === 'user' ? 'Usuario' : 'Manguito'}: ${m.text}`).join('\n');
      const result = await chatIA(`Historial reciente:\n${contextStr}\n\nResponde como Manguito.`);
      setChatHistory([...updatedHistory, { role: 'model', text: result.respuesta || "Uy, tuve un problemita técnico. ¡Intentá de nuevo!" }]);
    } catch (error) {
       setChatHistory([...updatedHistory, { role: 'model', text: "Uy, tuve un problemita técnico. ¡Intentá de nuevo!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} />
      <main className="px-6 mt-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[var(--bg-card)] rounded-[18px] flex items-center justify-center shadow-sm border border-[var(--border-color)] text-2xl theme-transition">📚</div>
          <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Aprender</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3.5 rounded-[20px] font-bold text-sm whitespace-nowrap snap-start transition-all duration-300 ${activeTab === tab.id ? 'bg-[#FDBC3C] text-[#221F26] shadow-lg shadow-[#FDBC3C]/20 scale-105' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] shadow-sm hover:-translate-y-0.5'}`}>
              <span className="text-xl flex items-center justify-center">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 relative">
          {activeTab === 'ia' && (
            <>
              <div className="bg-[var(--bg-card)] rounded-[36px] overflow-hidden border border-[var(--border-color)] shadow-[0_12px_40px_rgb(0,0,0,0.05)] animate-in fade-in slide-in-from-right-8 duration-500 theme-transition">
                <div className="bg-gradient-to-r from-[#FFCE45] to-[#FDBC3C] px-6 py-5 flex justify-between items-center text-[#221F26] relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/30 skew-x-12 transform translate-x-10"></div>
                  <div className="flex items-center gap-3 font-black text-xl relative z-10"><span className="text-2xl bg-white/40 w-12 h-12 rounded-[16px] flex items-center justify-center shadow-inner">🤖</span> Mango IA</div>
                  <div className="text-xs font-bold bg-white/30 px-4 py-2 rounded-full backdrop-blur-md border border-white/50 relative z-10">Conectado</div>
                </div>
                <div className="p-5 h-[380px] flex flex-col justify-between bg-[var(--bg-base)] relative theme-transition">
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_#221F26_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_#FFFFFF_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
                  
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 relative z-10">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-3xl max-w-[85%] text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-[#FFCE45] text-[#221F26] rounded-br-sm' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[#FFCE45]/30 text-gray-400 rounded-bl-sm text-sm font-bold shadow-sm flex gap-1">
                          <span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span><span className="animate-bounce" style={{animationDelay: '0.4s'}}>.</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative mt-2 z-10">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Preguntale a Mango... ✨" className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[24px] py-4.5 pl-6 pr-16 text-sm outline-none focus:border-[#FDBC3C] transition-all duration-300 placeholder:text-[var(--text-muted)] font-medium text-[var(--text-main)] shadow-sm" />
                    <button onClick={handleSendChat} disabled={isTyping || !chatInput.trim()} className="absolute right-2 top-2 bottom-2 aspect-square bg-[#FDBC3C] hover:bg-[#E5A82F] disabled:opacity-50 transition-all duration-300 text-[#221F26] rounded-[18px] flex items-center justify-center shadow-sm active:scale-95"><Send size={20} className="ml-0.5" /></button>
                  </div>
                </div>
              </div>
              <div onClick={() => onNavigate('pro')} className="mt-4 bg-gradient-to-r from-[#9D50FF] to-[#8B3DED] rounded-[28px] p-5 text-white flex items-center justify-between shadow-[0_8px_24px_rgba(157,80,255,0.3)] group cursor-pointer hover:shadow-[0_12px_30px_rgba(157,80,255,0.4)] transition-all animate-in slide-in-from-bottom-4 duration-500 delay-100 hover:-translate-y-1">
                <div>
                  <p className="font-black text-sm mb-0.5 group-hover:text-[#D6B5FF] transition-colors">¿Necesitás más consultas?</p>
                  <p className="text-xs font-medium text-white/80">Ilimitadas por $6.999 ARS/mes</p>
                </div>
                <button className="bg-white text-[#8B3DED] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">Ser PRO</button>
              </div>
            </>
          )}
          {activeTab === 'tips' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
              <p className="text-sm text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-2 mb-5 pl-1"><span>💡</span> Tip del día</p>
              <Card className="group hover:border-[#FFCE45]/60 transition-all cursor-pointer !p-7">
                <h3 className="font-black text-[#FDBC3C] flex items-center gap-4 mb-4 text-xl"><span className="w-12 h-12 bg-yellow-50 dark:bg-yellow-500/10 rounded-[16px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">{todayTip.icon}</span> {todayTip.title}</h3>
                <p className="text-[var(--text-main)] text-sm leading-relaxed font-medium">{todayTip.desc}</p>
              </Card>
            </div>
          )}
          {(activeTab === 'instagram' || activeTab === 'youtube') && (
            <Card className="flex flex-col items-center text-center py-14 mt-2 animate-in fade-in slide-in-from-right-8 duration-500 border-0 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] transition-all">
              <div className="w-24 h-24 mb-6 relative transform transition-transform hover:scale-110 duration-500 flex items-center justify-center">
                {activeTab === 'instagram' ? <InstagramLogo className="w-full h-full drop-shadow-md" /> : <YouTubeLogo className="w-full h-full drop-shadow-md" />}
              </div>
              <h3 className="text-3xl font-black text-[var(--text-main)] mb-3 tracking-tight">{activeTab === 'instagram' ? 'Recomendación Diaria' : 'Canal en Alta'}</h3>
              <p className="text-base text-[var(--text-muted)] mb-10 px-4 leading-relaxed font-medium">{activeTab === 'instagram' ? 'Exponente rotativo cada 24hs para dominar áreas distintas de tus finanzas.' : 'Video y contenido extenso rotativo sobre tácticas de inversión por día.'}</p>
              <button className="border-2 border-[var(--border-color)] rounded-[28px] py-6 px-8 w-full max-w-[280px] hover:border-[#FFCE45] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-[var(--bg-card)]">
                <p className="font-black text-[var(--text-main)] text-2xl mb-1 group-hover:text-[#FFCE45] transition-colors tracking-tight">{activeTab === 'instagram' ? '@ramiromarra' : 'El Arte de Invertir'}</p>
                <p className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider mt-2">{activeTab === 'instagram' ? 'Economía y Mercados' : 'Inversión en Bolsa'}</p>
              </button>
            </Card>
          )}
        </div>
      </main>
      <BottomNav activeTab="learn" onNavigate={onNavigate} />
    </div>
  );
};

export default LearnScreen;
