import React, { useState, useEffect, useCallback } from 'react';
import useLocalState from './hooks/useLocalState';
import { DEFAULT_CATEGORIES } from './lib/utils';
import { hasToken, clearToken, setToken, getPerfil, updateAjustes, getMovimientos, crearMovimiento } from './lib/api';

// Screens
import LoginScreen from './screens/LoginScreen';
import OnboardingFlow from './screens/OnboardingFlow';
import DashboardScreen from './screens/DashboardScreen';
import MovementsScreen from './screens/MovementsScreen';
import NewMovementScreen from './screens/NewMovementScreen';
import LearnScreen from './screens/LearnScreen';
import MoreScreen from './screens/MoreScreen';
import ProScreen from './screens/ProScreen';
import ConfigurarPerfilScreen from './screens/ConfigurarPerfilScreen';
import CotizacionesScreen from './screens/CotizacionesScreen';
import ConexionBancariaScreen from './screens/ConexionBancariaScreen';
import PresupuestosMetasScreen from './screens/PresupuestosMetasScreen';
import CategoriasScreen from './screens/CategoriasScreen';
import ModoParejaScreen from './screens/ModoParejaScreen';
import ExportarScreen from './screens/ExportarScreen';

// Components
import Toast from './components/ui/Toast';
import BiometricLockScreen from './components/BiometricLockScreen';
import { AlertCircle } from 'lucide-react';

// --- Escudo Antifallos (Error Boundary) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFBF2] dark:bg-[#0D0B0F] flex flex-col items-center justify-center p-8 text-center theme-transition">
          <div className="w-24 h-24 bg-[#FFEBEB] dark:bg-[#3B1212] rounded-3xl flex items-center justify-center text-[#E53E3E] mb-6 shadow-sm">
            <AlertCircle size={40} strokeWidth={2.5}/>
          </div>
          <h2 className="text-3xl font-black text-[var(--text-main)] mb-3 tracking-tight">¡Uy! Un tropezón.</h2>
          <p className="text-[var(--text-muted)] font-medium mb-8">Algo no cargó bien, pero tus datos están a salvo.</p>
          <button onClick={() => window.location.reload()} className="bg-[#FFCE45] text-[#221F26] px-8 py-4 rounded-2xl font-black shadow-md hover:scale-105 transition-all">
            Volver a intentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Inyección de Temas y Estilos Premium ---
const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root { 
      --bg-base: #FFFBF2; 
      --bg-card: #FFFFFF; 
      --text-main: #221F26; 
      --text-muted: #8B7C72; 
      --border-color: #F3F4F6; 
      --input-bg: rgba(249, 250, 251, 0.8); 
      --nav-bg: rgba(255, 255, 255, 0.85);
      --card-shadow: 0 8px 30px rgba(0,0,0,0.03);
      --card-shadow-hover: 0 14px 40px rgba(0,0,0,0.06);
    }
    .dark { 
      --bg-base: #0D0B0F; 
      --bg-card: #16141A; 
      --text-main: #F3F4F6; 
      --text-muted: #9CA3AF; 
      --border-color: #2D2936; 
      --input-bg: rgba(45, 41, 54, 0.4); 
      --nav-bg: rgba(22, 20, 26, 0.85);
      --card-shadow: 0 8px 30px rgba(0,0,0,0.4);
      --card-shadow-hover: 0 14px 40px rgba(0,0,0,0.6);
    }
    body { background-color: var(--bg-base); color: var(--text-main); transition: background-color 0.4s ease, color 0.4s ease; }
    .theme-transition { transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease; }
    
    @keyframes slideLeft {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .step-animate { animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  `}} />
);

function App() {
  // Auth state - check for token from URL (Google OAuth callback) or localStorage
  const [isLoggedIn, setIsLoggedIn] = useLocalState('manguito_loggedIn', false);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLocked, setIsLocked] = useState(false);

  // User data (localStorage fallback until API integration is complete)
  const [userProfile, setUserProfile] = useLocalState('manguito_profile', {
    name: '', email: '', dob: '', goal: '', mainCurrency: 'ARS',
    authProvider: 'manual', profilePic: null, hideBalances: false, theme: 'light',
    biometricEnabled: false
  });
  const [movements, setMovements] = useLocalState('manguito_movements', []);
  const [budgets, setBudgets] = useLocalState('manguito_budgets', []);
  const [savingsGoals, setSavingsGoals] = useLocalState('manguito_goals', []);
  const [categories, setCategories] = useLocalState('manguito_categories', DEFAULT_CATEGORIES);

  // Handle Google OAuth callback token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const onboarding = params.get('onboarding');
    if (token) {
      setToken(token);
      setIsLoggedIn(true);
      if (onboarding === '1') {
        setCurrentScreen('register');
      } else {
        // Al entrar por Google, el perfil se cargará en el siguiente effect
        setCurrentScreen('home');
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setIsLoggedIn]);

  // Sync profile & movements data from backend on login
  useEffect(() => {
    if (isLoggedIn && hasToken()) {
      // Fetch Profile
      getPerfil()
        .then(data => {
          if (data) {
            setUserProfile(prev => ({
              ...prev,
              name: data.nombre || prev.name,
              email: data.email || prev.email,
              dob: data.edad || prev.dob,
              goal: data.objetivo || prev.goal,
              mainCurrency: data.moneda_principal || prev.mainCurrency,
              hideBalances: data.hide_balances ?? prev.hideBalances,
              theme: data.theme || prev.theme,
              profilePic: data.profile_pic || prev.profilePic,
              plan: data.plan || prev.plan
            }));
          }
        })
        .catch(err => console.error("Error al sincronizar perfil:", err));

      // Fetch Movements
      getMovimientos(50)
        .then(data => {
          if (data && data.movimientos) {
            // Mapear el formato del backend al que espera el frontend
            const mappedMovs = data.movimientos.map(m => ({
              id: m.id,
              description: m.descripcion,
              amount: m.monto,
              type: m.tipo === 'egreso' ? 'gasto' : 'ingreso',
              category: m.categoria,
              date: m.fecha,
              currency: m.moneda || 'ARS'
            }));
            setMovements(mappedMovs);
          }
        })
        .catch(err => console.error("Error al sincronizar movimientos:", err));
    }
  }, [isLoggedIn, setMovements, setUserProfile]);

  // Check login state on mount
  useEffect(() => {
    if (isLoggedIn && hasToken()) {
      setCurrentScreen('home');
    } else if (isLoggedIn && !hasToken()) {
      setIsLoggedIn(false);
      setCurrentScreen('login');
    }
  }, []);

  // Theme management & Backend Setting Sync
  useEffect(() => {
    if (userProfile.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Sync settings to backend only if we are logged in
    if (isLoggedIn && hasToken()) {
      updateAjustes(userProfile.hideBalances, userProfile.theme, userProfile.profilePic)
        .catch(err => console.error("Error sync settings:", err));
    }
  }, [userProfile.theme, userProfile.hideBalances, userProfile.profilePic, isLoggedIn]);

  const triggerToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const handleNavigate = useCallback((screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleLogin = useCallback((token) => {
    if (token) setToken(token);
    setIsLoggedIn(true);
    setCurrentScreen('home');
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setIsLoggedIn(false);
    setCurrentScreen('login');
    triggerToast('Sesión cerrada');
  }, []);

  const handleOnboardingFinish = useCallback((formData, initialSetup) => {
    setUserProfile(prev => ({
      ...prev,
      name: formData.name,
      email: formData.email,
      dob: formData.dob,
      goal: formData.goal,
      mainCurrency: formData.mainCurrency,
      authProvider: formData.authProvider
    }));
    if (initialSetup?.type === 'budget' && initialSetup.name) {
      setBudgets([{ id: Date.now(), category: initialSetup.name, maxAmount: Number(initialSetup.amount), spent: 0 }]);
    }
    if (initialSetup?.type === 'goal' && initialSetup.name) {
      setSavingsGoals([{ id: Date.now(), name: initialSetup.name, target: Number(initialSetup.amount), current: 0 }]);
    }
    setIsLoggedIn(true);
    setCurrentScreen('home');
    triggerToast(`¡Bienvenido/a, ${formData.name}! 🥭`);
  }, []);

  const handleSaveMovement = useCallback(async (movement) => {
    // UI Optimista
    setMovements(prev => [movement, ...prev]);
    setCurrentScreen('home');
    triggerToast(`${movement.type === 'gasto' ? 'Gasto' : 'Ingreso'} registrado ✅`);

    // Sincronizar con Backend
    if (hasToken()) {
      try {
        await crearMovimiento({
          tipo: movement.type === 'gasto' ? 'egreso' : 'ingreso',
          monto: Number(movement.amount),
          categoria: movement.category,
          descripcion: movement.description,
          moneda: movement.currency
        });
      } catch (err) {
        console.error("Error al guardar movimiento en la nube:", err);
      }
    }
  }, [setMovements, triggerToast]);

  const triggerLock = useCallback(() => {
    if (userProfile.biometricEnabled) setIsLocked(true);
  }, [userProfile.biometricEnabled]);

  if (isLocked) {
    return <BiometricLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  // Routing
  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen 
          onLoginSuccess={handleLogin}
          onNavigate={handleNavigate} 
          triggerToast={triggerToast} 
        />;
      case 'register':
        return <OnboardingFlow onFinish={handleOnboardingFinish} onBack={() => handleNavigate('login')} mode="manual" />;
      case 'home':
        return <DashboardScreen onNavigate={handleNavigate} movements={movements} userProfile={userProfile} triggerToast={triggerToast} />;
      case 'movements':
        return <MovementsScreen onNavigate={handleNavigate} movements={movements} />;
      case 'new_movement':
        return <NewMovementScreen onNavigate={handleNavigate} onSave={handleSaveMovement} userProfile={userProfile} categories={categories} />;
      case 'learn':
        return <LearnScreen onNavigate={handleNavigate} />;
      case 'more':
        return <MoreScreen onNavigate={handleNavigate} userProfile={userProfile} triggerLock={triggerLock} triggerToast={triggerToast} />;
      case 'pro':
        return <ProScreen onNavigate={handleNavigate} />;
      case 'config_perfil':
      case 'configurar_perfil':
        return <ConfigurarPerfilScreen onNavigate={handleNavigate} userProfile={userProfile} setUserProfile={setUserProfile} onLogout={handleLogout} triggerToast={triggerToast} />;
      case 'cotizaciones':
        return <CotizacionesScreen onNavigate={handleNavigate} />;
      case 'conexion_bancaria':
        return <ConexionBancariaScreen onNavigate={handleNavigate} />;
      case 'presupuestos':
        return <PresupuestosMetasScreen onNavigate={handleNavigate} budgets={budgets} savingsGoals={savingsGoals} movements={movements} userProfile={userProfile} onUpdateBudgets={setBudgets} onUpdateGoals={setSavingsGoals} />;
      case 'categorias':
        return <CategoriasScreen onNavigate={handleNavigate} categories={categories} setCategories={setCategories} />;
      case 'modo_pareja':
        return <ModoParejaScreen onNavigate={handleNavigate} />;
      case 'exportar':
        return <ExportarScreen onNavigate={handleNavigate} triggerToast={triggerToast} />;
      default:
        return <DashboardScreen onNavigate={handleNavigate} movements={movements} userProfile={userProfile} />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeStyles />
      <div className="max-w-lg mx-auto relative overflow-hidden" style={{ fontFamily: "SF Pro Display, Inter, system-ui, sans-serif" }}>
        <Toast message={toastMessage} type={toastType} />
        {renderScreen()}
      </div>
    </ErrorBoundary>
  );
}

export default App;
