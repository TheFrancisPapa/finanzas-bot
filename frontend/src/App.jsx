import React, { useState, useEffect, useCallback } from 'react';
import useLocalState from './hooks/useLocalState';
import { DEFAULT_CATEGORIES } from './lib/utils';
import { hasToken, clearToken, setToken } from './lib/api';

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
        setCurrentScreen('home');
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check login state on mount
  useEffect(() => {
    if (isLoggedIn && hasToken()) {
      setCurrentScreen('home');
    } else if (isLoggedIn && !hasToken()) {
      setIsLoggedIn(false);
      setCurrentScreen('login');
    }
  }, []);

  // Theme management
  useEffect(() => {
    if (userProfile.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile.theme]);

  const triggerToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const handleNavigate = useCallback((screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleLogin = useCallback(() => {
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

  const handleSaveMovement = useCallback((movement) => {
    setMovements(prev => [movement, ...prev]);
    setCurrentScreen('home');
    triggerToast(`${movement.type === 'gasto' ? 'Gasto' : 'Ingreso'} registrado ✅`);
  }, []);

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
          onNavigate={(screen) => { if (screen === 'home') handleLogin(); else handleNavigate(screen); }} 
          triggerToast={triggerToast} 
          isRegistered={!!userProfile.email}
          userProfile={userProfile}
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
    <div className="max-w-lg mx-auto relative overflow-hidden" style={{ fontFamily: "SF Pro Display, Inter, system-ui, sans-serif" }}>
      <Toast message={toastMessage} type={toastType} />
      {renderScreen()}
    </div>
  );
}

export default App;
