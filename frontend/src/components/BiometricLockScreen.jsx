import React, { useState } from 'react';
import { Fingerprint, LockKeyhole } from 'lucide-react';
import { MangoLogo } from '../assets/logos';

const BiometricLockScreen = ({ onUnlock }) => {
  const [loading, setLoading] = useState(false);
  const handleUnlock = () => { setLoading(true); setTimeout(() => { setLoading(false); onUnlock(); }, 1200); };
  return (
    <div className="fixed inset-0 z-50 bg-[#110F13] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(255,206,69,0.1)]"><MangoLogo className="w-14 h-14 opacity-80" /></div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Manguito Bloqueado</h2>
        <p className="text-gray-400 text-sm mb-12 font-medium">Usá tu huella o Face ID para entrar</p>
        <button onClick={handleUnlock} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${loading ? 'bg-[#FFCE45] shadow-[0_0_40px_rgba(255,206,69,0.5)] scale-110' : 'bg-white/5 border border-white/20 hover:bg-white/10'}`}>
          {loading ? <LockKeyhole size={36} className="text-[#221F26] animate-pulse" /> : <Fingerprint size={40} className="text-[#FFCE45] opacity-80 animate-pulse" />}
        </button>
        <p className="text-gray-500 text-xs mt-6 font-bold tracking-widest uppercase">{loading ? 'Verificando...' : 'Toca para desbloquear'}</p>
      </div>
    </div>
  );
};

export default BiometricLockScreen;
