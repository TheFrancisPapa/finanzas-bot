import React, { useState } from 'react';
import { User } from 'lucide-react';

const GoogleAccountSelector = ({ onSelect, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (email, name) => {
    if(!email) return;
    setLoading(true);
    setTimeout(() => { onSelect(email, name); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden text-[#221F26]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="font-bold text-gray-600 text-sm">Conectando...</p>
          </div>
        )}
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 rounded-full p-1"><span className="text-sm font-bold w-6 h-6 flex items-center justify-center">✕</span></button>
        
        <div className="text-center mb-6 pt-2">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-10 h-10 mx-auto mb-3" alt="Google"/>
          <h3 className="text-2xl font-medium tracking-tight mb-1 text-gray-900">Acceder</h3>
          <p className="text-sm text-gray-600">Ir a Manguito Finanzas</p>
        </div>

        <div className="space-y-2">
          {!showCustom ? (
            <>
              <button onClick={() => handleSelect('uriel.rosales@gmail.com', 'Uriel Rosales')} className="w-full flex items-center gap-4 p-3.5 hover:bg-blue-50 rounded-2xl transition-colors border border-gray-100 group">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">U</div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">Uriel Rosales</p>
                  <p className="text-xs text-gray-500 font-medium">uriel.rosales@gmail.com</p>
                </div>
              </button>
              <button onClick={() => setShowCustom(true)} className="w-full flex items-center gap-4 p-3.5 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">
                <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold"><User size={18}/></div>
                <div className="text-left"><p className="font-bold text-gray-800 text-sm">Usar otra cuenta</p></div>
              </button>
            </>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <input type="email" placeholder="Correo electrónico o teléfono" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-4" autoFocus />
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setShowCustom(false)} className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">Atrás</button>
                <button onClick={() => handleSelect(customEmail, customEmail.split('@')[0])} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">Siguiente</button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed max-w-[250px] mx-auto">Para continuar, Google compartirá tu nombre, dirección de correo electrónico y foto de perfil con Manguito.</p>
      </div>
    </div>
  );
};

export default GoogleAccountSelector;
