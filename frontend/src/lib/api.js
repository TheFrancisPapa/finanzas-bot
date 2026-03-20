/**
 * Capa de comunicación con el backend FastAPI.
 * Token JWT se almacena en localStorage.
 */

const TOKEN_KEY = 'manguito_token';

const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const hasToken = () => !!getToken();

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`/api/${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    console.warn("Token inválido o expirado. Limpiando sesión local...");
    window.localStorage.clear();
    window.location.href = "/"; // Redirige a la raíz para forzar el Login
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  return res.json();
}

// --- Auth ---
export const login = (email, password) =>
  apiFetch('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (email, password, nombre) =>
  apiFetch('auth/register', { method: 'POST', body: JSON.stringify({ email, password, nombre }) });

export const completeOnboarding = (edad, objetivo) =>
  apiFetch('auth/onboarding', { method: 'POST', body: JSON.stringify({ edad, objetivo }) });

export const googleLoginUrl = () => '/api/auth/google';
export const googleAuth = (credential) =>
  apiFetch('auth/google/verify', { method: 'POST', body: JSON.stringify({ credential }) });

// --- Perfil ---
export const getPerfil = () => apiFetch('perfil');
export const updateApodo = (apodo) =>
  apiFetch('perfil/apodo', { method: 'POST', body: JSON.stringify({ apodo }) });
export const updateMoneda = (moneda) =>
  apiFetch('perfil/moneda', { method: 'POST', body: JSON.stringify({ moneda }) });
export const updateAjustes = (hide_balances, theme, profile_pic = null) =>
  apiFetch('perfil/ajustes', { method: 'POST', body: JSON.stringify({ hide_balances, theme, profile_pic }) });
export const deleteCuenta = () => apiFetch('perfil/cuenta', { method: 'DELETE' });

// --- Resumen ---
export const getResumen = () => apiFetch('resumen');

// --- Movimientos ---
export const getMovimientos = (limite = 20, offset = 0, tipo = null) => {
  let url = `movimientos?limite=${limite}&offset=${offset}`;
  if (tipo) url += `&tipo=${tipo}`;
  return apiFetch(url);
};

export const crearMovimiento = (datos) =>
  apiFetch('movimientos', { method: 'POST', body: JSON.stringify(datos) });

export const borrarMovimiento = (id) =>
  apiFetch(`movimientos/${id}`, { method: 'DELETE' });

// --- Presupuestos ---
export const getPresupuestos = () => apiFetch('presupuestos');
export const crearPresupuesto = (categoria, monto) =>
  apiFetch('presupuestos', { method: 'POST', body: JSON.stringify({ categoria, monto }) });

// --- Metas ---
export const getMetas = () => apiFetch('metas');
export const crearMeta = (nombre, objetivo) =>
  apiFetch('metas', { method: 'POST', body: JSON.stringify({ nombre, objetivo }) });
export const aportarMeta = (metaId, monto) =>
  apiFetch(`metas/${metaId}/aportar`, { method: 'POST', body: JSON.stringify({ monto }) });

// --- Categorías ---
export const getCategorias = (tipo = 'egreso') => apiFetch(`categorias?tipo=${tipo}`);
export const agregarCategoria = (nombre, tipo = 'egreso') =>
  apiFetch('categorias', { method: 'POST', body: JSON.stringify({ nombre, tipo }) });
export const borrarCategoria = (nombre, tipo = 'egreso') =>
  apiFetch(`categorias/${encodeURIComponent(nombre)}?tipo=${tipo}`, { method: 'DELETE' });

// --- Cotizaciones ---
export const getCotizaciones = () => apiFetch('dolar');

// --- IA ---
export const getIALimits = () => apiFetch('ia/limits');
export const chatIA = (mensaje) =>
  apiFetch('ia/chat', { method: 'POST', body: JSON.stringify({ mensaje }) });

// --- Pagos ---
export const crearPreferenciaPago = (plan = 'mensual') =>
  apiFetch('pago/crear-preferencia', { method: 'POST', body: JSON.stringify({ plan }) });

// --- Export ---
export const exportarExcelUrl = () => `/api/exportar/excel?token=${getToken()}`;
