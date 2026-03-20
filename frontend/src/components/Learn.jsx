import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, BookOpen } from 'lucide-react';
// Importamos los componentes de navegación y diseño desde Shared
import { Header, BottomNav, Card, Button } from './Shared';

// ==========================================
// 1. LÓGICA DE CONEXIÓN CON GEMINI (IA)
// ==========================================
const callGeminiText = async (prompt) => {
  const apiKey = ""; // La clave se inyecta en el entorno de ejecución
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { 
      parts: [{ text: `Sos Manguito, un asistente financiero experto, empático y argentino. Tus respuestas deben ser cortas, directas, usar vocabulario amigable (che, plata, guita, mango) y emojis. Solo hablas de finanzas.` }] 
    }
  };

  try {
    const response = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return "Uy, me quedé sin señal en la billetera. ¡Intentá de nuevo en un ratito! 🔌";
  }
};

// ==========================================
// 2. LOGOS SOCIALES (SVG internos para evitar dependencias)
// ==========================================
const InstagramLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FEE411"/><stop offset="100%" stopColor="#5258CF"/></linearGradient></defs><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);

const YouTubeLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#FF0000" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);

// ==========================================
// 3. PANTALLA DE APRENDER (IA + TIPS)
// ==========================================
export const LearnScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('ia');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: '¡Hola! Soy Mango IA ✨. Hacé una pregunta sobre tus finanzas o cómo ahorrar mejor.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const financialTips = [
    { icon: '🛡️', title: 'Fondo de emergencia', desc: 'Tené entre 3 y 6 meses de gastos fijos ahorrados.' },
    { icon: '📊', title: 'Regla 50/30/20', desc: '50% necesidades, 30% gustos y 20% ahorro.' },
    { icon: '📈', title: 'Interés compuesto', desc: 'Invertir poco pero constante es la clave del éxito.' }
  ];
  const todayTip = financialTips[new Date().getDate() % financialTips.length];

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

    const prompt = `Historial: ${JSON.stringify(updatedHistory)}\nPregunta: ${chatInput}`;
    const response = await callGeminiText(prompt);
    
    setChatHistory([...updatedHistory, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} title="Aprender" />
      
      <main className="px-6 mt-2">
        {/* Selector de pestañas internas */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'ia', label: 'Mango IA 🤖' },
            { id: 'tips', label: 'Tips 💡' },
            { id: 'social', label: 'Comunidad 👥' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#FDBC3C] text-[#221F26] shadow-md' : 'bg-white border border-[var(--border-color)] text-[var(--text-muted)]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === 'ia' && (
            <div className="bg-white rounded-[36px] overflow-hidden border border-[var(--border-color)] shadow-sm">
              <div className="bg-gradient-to-r from-[#FFCE45] to-[#FDBC3C] px-6 py-4 flex justify-between items-center text-[#221F26]">
                <span className="font-black">🤖 Mango IA</span>
                <span className="text-[10px] font-bold bg-white/30 px-3 py-1 rounded-full">En línea</span>
              </div>
              
              <div className="p-5 h-[400px] flex flex-col justify-between bg-gray-50/30">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 rounded-[24px] max-w-[85%] text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-[#FFCE45] text-[#221F26]' : 'bg-white text-[var(--text-main)]'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && <div className="text-xs font-bold text-gray-400 animate-pulse pl-2">Mango está pensando...</div>}
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Preguntale a Mango..." 
                    className="w-full bg-white border border-[var(--border-color)] rounded-2xl py-4 pl-6 pr-14 text-sm outline-none focus:border-[#FDBC3C] transition-all"
                  />
                  <button onClick={handleSendChat} className="absolute right-2 top-2 bottom-2 aspect-square bg-[#FDBC3C] text-[#221F26] rounded-xl flex items-center justify-center active:scale-90">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-4">
              <Card className="!p-8 hover:border-[#FFCE45] transition-colors">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">{todayTip.icon}</div>
                <h3 className="font-black text-xl mb-2 text-[#FDBC3C]">{todayTip.title}</h3>
                <p className="text-[var(--text-main)] font-medium leading-relaxed">{todayTip.desc}</p>
              </Card>
              <p className="text-center text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest pt-4">Nuevos consejos cada 24hs</p>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <Card className="flex flex-col items-center text-center py-10">
                <InstagramLogo className="w-16 h-16 mb-4" />
                <h3 className="font-black text-xl">Seguinos en redes</h3>
                <p className="text-[var(--text-muted)] text-sm mb-8 px-6">Contenido diario para aprender a invertir y ahorrar.</p>
                <Button variant="secondary" className="w-[80%]">Ver @manguito.app</Button>
              </Card>
              <Card className="flex flex-col items-center text-center py-10">
                <YouTubeLogo className="w-16 h-16 mb-4" />
                <h3 className="font-black text-xl">Canal de YouTube</h3>
                <p className="text-[var(--text-muted)] text-sm mb-8 px-6">Tutoriales largos sobre bolsa y economía real.</p>
                <Button variant="secondary" className="w-[80%]">Suscribirse</Button>
              </Card>
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="learn" onNavigate={onNavigate} />
    </div>
  );
};