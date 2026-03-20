import React, { useState, useEffect } from 'react';
import { 
  Settings, LockKeyhole, User, ChevronRight, KeyRound, 
  EyeOff, Smartphone, Pencil, Trash2, Plus, Target, 
  FileText, Download, Camera, CloudOff, Cloud
} from 'lucide-react';
// Importamos los componentes y helpers desde Shared
import { 
  Header, BottomNav, Card, Button, 
  CONFIG, formatMoney, MercadoPagoLogo 
} from './Shared';

// ==========================================
// 1. PANTALLA PRINCIPAL: MÁS (Ajustes)
// ==========================================
export const MoreScreen = ({ onNavigate, userProfile, triggerLock }) => {
  const ListItem = ({ icon, title, value, isPro, isLast, onClick }) => (
    <div 
      onClick={onClick} 
      className={`flex items-center justify-between py-5 px-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-[20px] transition-all cursor-pointer group ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl w-8 text-center group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-base font-bold">{title}</span>
        {isPro && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-md font-black">PRO</span>}
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm font-black text-[var(--text-muted)]">{value}</span>}
        <ChevronRight size={20} className="text-gray-300 group-hover:text-[#FFCE45] transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32 animate-in fade-in duration-500">
      <Header onNavigate={onNavigate} title="Más" />
      
      <main className="px-6 space-y-8 mt-2">
        <div className="flex items-center justify-between">
            <div className={`rounded-2xl p-3 flex items-center gap-2 font-bold text-[10px] shadow-sm border ${CONFIG.IS_LOCAL_MODE ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                {CONFIG.IS_LOCAL_MODE ? <><CloudOff size={14} /> Modo Local</> : <><Cloud size={14} /> En la nube</>}
            </div>
            <button onClick={triggerLock} className="bg-white border border-gray-200 hover:border-[#FFCE45] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                <LockKeyhole size={14} /> Bloquear
            </button>
        </div>

        {/* Perfil del Usuario */}
        <Card className="flex flex-col items-center text-center pt-10 pb-8 relative overflow-hidden group" onClick={() => onNavigate('configurar_perfil')}>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#FFF0CC] to-transparent dark:from-orange-900/20"></div>
          <div className="w-24 h-24 bg-[#221F26] rounded-[36px] flex items-center justify-center text-white mb-4 shadow-xl border-[6px] border-white relative z-10 overflow-hidden">
            {userProfile?.profilePic ? <img src={userProfile.profilePic} alt="Perfil" className="w-full h-full object-cover" /> : <User size={40} />}
          </div>
          <h3 className="text-2xl font-black mb-1 relative z-10">{userProfile?.name}</h3>
          <p className="text-xs text-[var(--text-muted)] font-bold mb-6 relative z-10 uppercase tracking-widest">{userProfile?.email}</p>
          <Button variant="secondary" className="w-[80%] py-3 text-sm shadow-none">Editar Perfil</Button>
        </Card>

        {/* Opciones de Configuración */}
        <div>
          <h3 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-4 px-2">Ajustes Generales</h3>
          <Card className="!p-3 border-0 shadow-sm">
            <ListItem icon="💰" title="Moneda Principal" value={userProfile?.mainCurrency || 'ARS'} onClick={() => onNavigate('configurar_perfil')} />
            <ListItem icon="🎯" title="Presupuestos y Metas" onClick={() => onNavigate('presupuestos')} />
            <ListItem icon="⚙️" title="Gestionar Categorías" onClick={() => onNavigate('categorias')} />
            <ListItem icon="🏦" title="Conexión Bancaria" onClick={() => onNavigate('conexion_bancaria')} />
            <ListItem icon="💵" title="Cotizaciones" onClick={() => onNavigate('cotizaciones')} />
            <ListItem icon="📊" title="Exportar a Excel" isPro onClick={() => onNavigate('exportar')} />
            <ListItem icon="👫" title="Modo Pareja" isPro onClick={() => onNavigate('modo_pareja')} isLast />
          </Card>
        </div>

        {/* Banner PRO */}
        <div onClick={() => onNavigate('pro')} className="bg-gradient-to-br from-[#2D1B36] to-[#1A0F20] rounded-[40px] p-8 text-white relative overflow-hidden group cursor-pointer shadow-2xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#9D50FF] rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="text-center relative z-10">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-2xl font-black mb-4">Pasate a PRO</h3>
            <div className="bg-white/10 inline-block px-4 py-2 rounded-xl mb-6 border border-white/20">
               <span className="text-2xl font-black">$6.999</span><span className="text-[10px] font-bold ml-1 opacity-60">ARS/mes</span>
            </div>
            <Button variant="primary" className="!bg-[#FFCE45] !text-[#221F26] border-none shadow-xl">Activar Beneficios 🚀</Button>
          </div>
        </div>
      </main>
      
      <BottomNav activeTab="more" onNavigate={onNavigate} />
    </div>
  );
};

// ==========================================
// 2. PANTALLA: CONFIGURAR PERFIL
// ==========================================
export const ConfigurarPerfilScreen = ({ onNavigate, userProfile, setUserProfile, triggerToast, resetData, theme, toggleTheme }) => {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    dob: userProfile?.dob || '',
    password: '',
    hideBalances: userProfile?.hideBalances || false,
    biometricAuth: userProfile?.biometricAuth || false,
    mainCurrency: userProfile?.mainCurrency || 'ARS'
  });

  const handleSave = () => {
    setUserProfile({ ...userProfile, ...formData });
    triggerToast("Perfil actualizado correctamente");
    onNavigate('more');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Mi Perfil" />
      <main className="px-6 mt-6 space-y-6">
        <Card className="!p-6 border-0 shadow-sm">
          <h3 className="font-black text-xs mb-5 uppercase tracking-widest text-[var(--text-muted)]">Apariencia</h3>
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm">Modo Oscuro</p>
            <button onClick={toggleTheme} className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#FFCE45]' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </Card>

        <Card className="!p-6 border-0 shadow-sm space-y-5">
          <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-muted)]">Datos Personales</h3>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Nombre</label>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 font-bold outline-none focus:border-[#FFCE45] transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Moneda Principal</label>
            <select value={formData.mainCurrency} onChange={e=>setFormData({...formData, mainCurrency: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 font-bold outline-none">
              <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
          </div>
        </Card>

        <Button onClick={handleSave}>Guardar Cambios</Button>
        <Button variant="danger" onClick={resetData} className="!bg-red-50 !text-red-500 border-none shadow-none">Eliminar cuenta</Button>
      </main>
    </div>
  );
};

// ==========================================
// 3. PANTALLA: PRO (Venta)
// ==========================================
export const ProScreen = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#110f13] flex flex-col p-6 text-white relative animate-in slide-in-from-bottom-full duration-500">
    <button onClick={() => onNavigate('more')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-10 self-start">
        <ChevronRight className="rotate-180" />
    </button>
    <div className="text-center mb-12">
      <span className="text-6xl mb-4 block">👑</span>
      <h2 className="text-4xl font-black mb-2">Manguito <span className="text-[#D6B5FF]">PRO</span></h2>
      <p className="text-gray-400 font-bold">Llevá tus finanzas al siguiente nivel</p>
    </div>
    <Card className="bg-white/5 border-white/10 !p-8 space-y-6 mb-10">
      <div className="flex gap-4 items-center"><span className="text-2xl">🤖</span> <p className="text-sm font-bold">IA Extendida (20 consultas por día)</p></div>
      <div className="flex gap-4 items-center"><span className="text-2xl">📊</span> <p className="text-sm font-bold">Exportar a Excel y PDF sin límites</p></div>
      <div className="flex gap-4 items-center"><span className="text-2xl">🏦</span> <p className="text-sm font-bold">Sincronización bancaria automática</p></div>
    </Card>
    <Button className="!bg-[#009EE3] !text-white border-none py-5 text-lg" onClick={() => window.open('https://www.mercadopago.com.ar/', '_blank')}>
      <MercadoPagoLogo className="w-6 h-6 mr-2" /> Pagar Suscripción
    </Button>
  </div>
);

// ==========================================
// 4. PANTALLA: COTIZACIONES
// ==========================================
export const CotizacionesScreen = ({ onNavigate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-32 animate-in slide-in-from-right-8 duration-300">
      <Header onNavigate={() => onNavigate('more')} backButton={true} title="Dólar Hoy" />
      <main className="px-6 mt-6">
        {loading ? <div className="text-center py-20 font-bold animate-pulse">Cargando valores...</div> : (
          <div className="grid grid-cols-2 gap-4">
            {data.map((d, i) => (
              <Card key={i} className="text-center !p-6">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">{d.nombre}</p>
                <p className="text-2xl font-black text-green-600">${d.venta}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Nota: Se pueden agregar el resto de sub-pantallas (Categorías, Metas, etc.) aquí mismo si son cortas ---