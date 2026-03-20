import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Toast = ({ message, type = 'success' }) => {
  if (!message) return null;
  return (
    <div className="fixed top-8 left-0 right-0 z-[100] flex justify-center animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-none">
      <div className={`${type === 'error' ? 'bg-[#E53E3E]' : 'bg-[#221F26]'} text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md bg-opacity-95`}>
        {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-[#639639]" />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
