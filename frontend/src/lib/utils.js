// --- Tasas de cambio (MOCK — se reemplazará por /api/dolar) ---
export const EXCHANGE_RATES = { ARS: 1, USD: 1000, EUR: 1100, GBP: 1400, BRL: 200 };

export const convertCurrency = (amount, fromCurr, toCurr) => 
  (Number(amount) * EXCHANGE_RATES[fromCurr]) / EXCHANGE_RATES[toCurr];

export const formatMoney = (val, currency = 'ARS') => {
  const symbols = { ARS: '$', USD: 'US$', EUR: '€', GBP: '£', BRL: 'R$' };
  return `${symbols[currency] || '$'} ${Math.abs(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const DEFAULT_CATEGORIES = {
  gasto: [
    { icon: '🍔', label: 'Comida' }, { icon: '🚌', label: 'Transporte' }, 
    { icon: '🛒', label: 'Super' }, { icon: '🎮', label: 'Ocio' }, 
    { icon: '🧾', label: 'Servicios' }, { icon: '🏥', label: 'Salud' }, 
    { icon: '🎓', label: 'Educación' }, { icon: '👕', label: 'Ropa' }
  ],
  ingreso: [
    { icon: '💼', label: 'Sueldo' }, { icon: '💻', label: 'Freelance' }, 
    { icon: '📈', label: 'Inversión' }, { icon: '🛍️', label: 'Venta' }, 
    { icon: '🎁', label: 'Regalo' }, { icon: '🏠', label: 'Alquiler' }
  ]
};
