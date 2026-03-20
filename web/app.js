/* ══════════════════════════════════════════════════════
   MANGUITO WEB — APP.JS
   SPA logic: auth, API calls, routing, chart rendering
   ══════════════════════════════════════════════════════ */

// ── STATE ───────────────────────────────────────────
let TOKEN = localStorage.getItem('manguito_token') || '';
let CACHE = {};

const APP_VERSION = '1.6.0';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── ERROR REPORTING ─────────────────────────────────

window.onerror = function(mensaje, archivo, linea, columna, error) {
    try {
        fetch('/api/errores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mensaje: String(mensaje),
                archivo: archivo,
                linea: linea,
                columna: columna,
                stack: error ? error.stack : null,
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(() => {});
    } catch(e) {}
};

window.addEventListener('unhandledrejection', function(event) {
    try {
        fetch('/api/errores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mensaje: 'Unhandled Promise: ' + String(event.reason),
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(() => {});
    } catch(e) {}
});

// ── VERSION CHECK (FORCED UPDATE) ───────────────────

async function checkForUpdates() {
    try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
            showUpdateOverlay(data.version);
        }
    } catch(e) {}
}

function showUpdateOverlay(newVersion) {
    const overlay = document.createElement('div');
    overlay.id = 'update-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:white;border-radius:20px;padding:40px 30px;max-width:340px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="font-size:50px;margin-bottom:16px;">🔄</div>
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Nueva versión disponible</h2>
            <p style="color:#666;font-size:14px;line-height:1.5;margin-bottom:24px;">
                Hay una actualización importante <b>(v${newVersion})</b>. 
                Actualizá para seguir usando Manguito.
            </p>
            <button onclick="forceUpdate()" style="background:linear-gradient(135deg,#D97706,#b45309);color:white;border:none;padding:14px 32px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;width:100%;">
                Actualizar ahora
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.forceUpdate = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const reg of registrations) reg.unregister();
        });
    }
    caches.keys().then(keys => {
        return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => {
        window.location.reload(true);
    });
};

// ── AD BANNER SYSTEM (Free Users Only) ──────────────

const AD_POOL = [
    { text: '💎 Desbloqueá IA ilimitada, reportes PDF y más con Manguito PRO', cta: 'Ver planes', action: "navigate('mas')" },
    { text: '📊 ¿Querés exportar tus datos? Pasate a PRO y descargá PDFs de tu historial', cta: 'Ser PRO', action: "navigate('mas')" },
    { text: '🤖 ¿Sabías que con PRO tenés 20 consultas IA por día en vez de 5?', cta: 'Actualizar', action: "navigate('mas')" },
    { text: '💰 Ahorrá 29% con el plan anual PRO: solo $5.000/mes', cta: 'Ver oferta', action: "navigate('mas')" },
    { text: '🎯 Con PRO podés crear presupuestos ilimitados y trackear todas tus metas', cta: 'Empezar', action: "navigate('mas')" },
];

function getAdBannerHtml() {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const daySeed = Math.floor((Date.now() - tzOffsetMs) / 86400000);
    const ad = AD_POOL[daySeed % AD_POOL.length];
    return `
        <div id="ad-banner" style="background:linear-gradient(135deg,#fef3c7 0%,#fff7ed 100%);border:1px solid #f59e0b;border-radius:14px;padding:14px 16px;margin:16px 0;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="${ad.action}">
            <div style="flex:1;">
                <div style="font-size:13px;color:#92400e;line-height:1.4;">${ad.text}</div>
            </div>
            <div style="background:#d97706;color:white;padding:6px 14px;border-radius:10px;font-size:12px;font-weight:700;white-space:nowrap;">${ad.cta}</div>
        </div>
    `;
}

// ── API ─────────────────────────────────────────────

async function api(endpoint) {
    const res = await fetch(`/api/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (res.status === 401) {
        logout();
        throw new Error('Sesión expirada');
    }
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

async function apiPost(endpoint, body) {
    const res = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(body),
    });
    if (res.status === 401) { logout(); throw new Error('Sesión expirada'); }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
    }
    return res.json();
}

async function apiDelete(endpoint) {
    const res = await fetch(`/api/${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

// ── HELPERS ─────────────────────────────────────────

function fmt(n) {
    if (n == null) return '$0';
    let sim = '$';
    if (CACHE.perfil && CACHE.perfil.moneda) {
        const m = CACHE.perfil.moneda;
        sim = (m === 'EUR') ? '€' : (m === 'USD' ? 'U$D' : (m === 'ARS' ? '$' : m + ' '));
    }
    return sim + Math.round(n).toLocaleString('es-AR');
}

function fmtDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = dateStr.substring(0, 10);
        const [y, m, day] = d.split('-');
        return `${day}/${m}`;
    } catch { return dateStr; }
}

function catEmoji(cat) {
    const map = {
        'comida': '🍔', 'supermercado': '🛒', 'transporte': '🚗',
        'servicios': '📱', 'entretenimiento': '🎮', 'salud': '💊',
        'ropa': '👕', 'educacion': '📚', 'suscripciones': '📺',
        'alquiler': '🏠', 'impuestos': '🏛️', 'default': '📌',
    };
    const key = (cat || '').toLowerCase();
    for (const [k, v] of Object.entries(map)) {
        if (key.includes(k)) return v;
    }
    return map.default;
}

function showToast(msg, type = 'success') {
    let toast = $('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function promptAsync(title, defaultValue = "") {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">${title}</h3>
                <input type="text" class="modal-input" value="${defaultValue}" autocomplete="off">
                <div class="modal-actions">
                    <button class="btn-secondary modal-cancel">Cancelar</button>
                    <button class="btn-primary modal-confirm">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector('.modal-input');
        // Delay focus slightly to ensure DOM is ready and transitions don't break it
        setTimeout(() => input.focus(), 50);
        // Put cursor at the end
        input.setSelectionRange(input.value.length, input.value.length);

        const close = (val) => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 200);
            resolve(val);
        };

        overlay.querySelector('.modal-cancel').onclick = () => close(null);
        overlay.querySelector('.modal-confirm').onclick = () => close(input.value);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') close(input.value);
            if (e.key === 'Escape') close(null);
        };
    });
}

// ── AUTH ─────────────────────────────────────────────

window.switchTab = function (tab) {
    ['login', 'register', 'token'].forEach(t => {
        const panel = document.getElementById(`panel-${t}`);
        const btn = document.getElementById(`tab-${t}`);
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
        if (btn) {
            btn.className = t === tab ? 'login-tab active' : 'login-tab';
        }
    });
    if (document.getElementById('login-error'))
        document.getElementById('login-error').textContent = '';
};

function checkAuth() {
    // Check URL for token param
    const params = new URLSearchParams(window.location.search);
    const pagoParam = params.get('pago');
    if (pagoParam === 'ok') {
        window.history.replaceState({}, '', '/');
        CACHE.perfil = null; // Force fresh perfil data
        setTimeout(() => {
            showToast('🎉 ¡Bienvenido a Manguito PRO! Ya tenés todas las funciones premium.', 'success');
        }, 1000);
    } else if (pagoParam === 'error') {
        window.history.replaceState({}, '', '/');
        setTimeout(() => showToast('❌ Hubo un problema con el pago. Intentá de nuevo.', 'error'), 1000);
    }

    const urlToken = params.get('token');
    if (urlToken) {
        TOKEN = urlToken;
        localStorage.setItem('manguito_token', TOKEN);
        const needsOb = params.get('onboarding') === '1';
        window.history.replaceState({}, '', '/');
        if (needsOb) { showOnboarding(); return; }
    }

    if (TOKEN) {
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    $('#login-screen').classList.add('active');
    $('#app-screen').classList.remove('active');

    // Login con email
    document.getElementById('btn-login-email')?.addEventListener('click', async () => {
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        if (!email || !password) { document.getElementById('login-error').textContent = 'Completá los campos'; return; }
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error');
            TOKEN = data.token;
            localStorage.setItem('manguito_token', TOKEN);
            if (data.onboarding_pendiente) { showOnboarding(); } else { showApp(); }
        } catch (e) { document.getElementById('login-error').textContent = e.message; }
    });

    // Registro con email
    document.getElementById('btn-register')?.addEventListener('click', async () => {
        const nombre = document.getElementById('reg-nombre')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        if (!nombre || !email || !password) { document.getElementById('login-error').textContent = 'Completá todos los campos'; return; }
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nombre })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error');
            TOKEN = data.token;
            localStorage.setItem('manguito_token', TOKEN);
            showOnboarding();
        } catch (e) { document.getElementById('login-error').textContent = e.message; }
    });

    // Token de Telegram (igual que antes)
    const btnLogin = $('#btn-login');
    const inputToken = $('#input-token');
    if (btnLogin && inputToken) {
        inputToken.onkeydown = (e) => { if (e.key === 'Enter') btnLogin.click(); };
        btnLogin.onclick = async () => {
            const t = inputToken.value.trim();
            if (!t) { $('#login-error').textContent = 'Ingresá un token válido.'; return; }
            try {
                const res = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${t}` } });
                if (!res.ok) throw new Error();
                TOKEN = t;
                localStorage.setItem('manguito_token', TOKEN);
                showApp();
            } catch (e) { $('#login-error').textContent = 'Token incorrecto o expirado.'; }
        };
    }
}

function showOnboarding() {
    const screen = $('#login-screen');
    screen.innerHTML = `
        <div class="flex-col items-center justify-center p-4" style="min-height:100vh;">
            <div style="font-size:3rem;margin-bottom:10px;">🥭</div>
            <h2 style="color:var(--accent);margin-bottom:6px;">¡Bienvenido/a!</h2>
            <p class="text-muted text-center mb-6">Contanos un poco sobre vos para personalizar tu experiencia.</p>
            <div class="w-full max-w-400">
                <div class="mb-4">
                    <label class="form-label">¿Cuántos años tenés?</label>
                    <input type="number" id="ob-edad" class="form-input" placeholder="Ej: 25" min="13" max="100">
                </div>
                <div class="mb-6">
                    <label class="form-label mb-2">¿Cuál es tu objetivo principal?</label>
                    <div class="flex-col gap-2" id="ob-objetivos">
                        ${[
            ['ahorrar', '🐷 Quiero ahorrar más cada mes'],
            ['invertir', '📈 Quiero empezar a invertir'],
            ['deudas', '💳 Quiero salir de mis deudas'],
            ['organizar', '📊 Quiero organizar mis finanzas'],
            ['libertad', '🏖️ Quiero lograr libertad financiera'],
        ].map(([val, label]) => `
                            <button onclick="selectObjetivo(this,'${val}')" data-val="${val}" class="glass-panel">
                                ${label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <button onclick="submitOnboarding()" class="btn-primary w-full">Empezar →</button>
                <p id="ob-error" style="color:var(--red);font-size:0.85rem;text-align:center;margin-top:10px;min-height:18px;"></p>
            </div>
        </div>
    `;
}

window.selectObjetivo = function (btn, val) {
    document.querySelectorAll('#ob-objetivos button').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.04)';
        b.style.borderColor = 'rgba(255,255,255,0.1)';
        b.style.color = 'var(--text-primary)';
    });
    btn.style.background = 'rgba(255,165,0,0.15)';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    btn.dataset.selected = 'true';
};

window.submitOnboarding = async function () {
    const edad = parseInt(document.getElementById('ob-edad')?.value);
    const objetivoBtn = document.querySelector('#ob-objetivos button[data-selected="true"]');
    const objetivo = objetivoBtn?.dataset.val;
    if (!edad || edad < 13 || edad > 100) { document.getElementById('ob-error').textContent = 'Ingresá tu edad'; return; }
    if (!objetivo) { document.getElementById('ob-error').textContent = 'Seleccioná un objetivo'; return; }
    try {
        await apiPost('auth/onboarding', { edad, objetivo });
        showApp();
    } catch (e) {
        document.getElementById('ob-error').textContent = 'Error al guardar. Intentá de nuevo.';
    }
};

function showApp() {
    $('#login-screen').classList.remove('active');
    $('#app-screen').classList.add('active');
    navigate('dashboard');
}

function logout() {
    TOKEN = '';
    localStorage.removeItem('manguito_token');
    CACHE = {};
    window.history.replaceState({}, '', '/'); // Ensure URL is clean
    showLogin();
}

// ── ROUTING ─────────────────────────────────────────

let currentPage = '';

function navigate(page) {
    if (page === currentPage) return;
    currentPage = page;

    // Update nav
    $$('.nav-btn').forEach(btn => {
        // If the current page is 'metas', 'dolar', or 'bancos', we keep the 'mas' nav icon highlighted
        let targetPage = page;
        if (['metas', 'dolar', 'bancos'].includes(page)) targetPage = 'mas';
        btn.classList.toggle('active', btn.dataset.page === targetPage);
    });

    // Render
    const main = $('#main-content');
    main.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    main.scrollTop = 0;

    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'movimientos': renderMovimientos(); break;
        case 'agregar': renderAgregar(); break;
        case 'aprender': renderAprender(); break;
        case 'mas': renderMas(); break;
        case 'metas': renderMetas(); break;
        case 'dolar': renderDolar(); break;
        case 'categorias': renderCategorias(); break;
        case 'bancos': renderBancos(); break;
    }
}

// ── PAGE: DASHBOARD ─────────────────────────────────

async function renderDashboard() {
    try {
        const [resumen, perfil, movsReq] = await Promise.all([
            CACHE.resumen || api('resumen'),
            CACHE.perfil || api('perfil'),
            api('movimientos?limite=40&offset=0')
        ]);
        CACHE.resumen = resumen;
        CACHE.perfil = perfil;

        const balance = resumen.balance || 0;
        const balClass = balance >= 0 ? 'color: var(--green)' : 'color: var(--red)';

        let html = `
            <div class="page-enter">
                
                <div class="card" style="text-align: center; padding: 24px 20px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--text-secondary); margin-bottom: 4px;">Balance del mes</div>
                    <div style="font-size: 40px; font-weight: 800; ${balClass}; letter-spacing: -1px; margin-bottom: 24px; line-height: 1;">${fmt(balance)}</div>
                    <div style="display: flex; justify-content: center; gap: 40px;">
                        <div style="text-align: left;">
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Ingresos</div>
                            <div style="font-weight: 700; font-size: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--green);"></span> ${fmt(resumen.ingresos)}
                            </div>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Gastos</div>
                            <div style="font-weight: 700; font-size: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--red);"></span> ${fmt(resumen.gastos)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stat-grid">
                    <div class="card" style="margin-bottom: 0; padding: 18px;">
                        <span style="font-size: 24px; display: block; margin-bottom: 12px;">🔥</span>
                        <span style="font-weight: 800; font-size: 24px; display: block; margin-bottom: 4px; color: var(--text-primary);">${perfil.racha || 0}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">Días de racha</span>
                    </div>
                    <div class="card" style="margin-bottom: 0; padding: 18px;">
                        <span style="font-size: 24px; display: block; margin-bottom: 12px;">💰</span>
                        <span style="font-weight: 800; font-size: 24px; display: block; margin-bottom: 4px; color: var(--text-primary);">${fmt(resumen.gastos_hoy)}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">Gastado hoy</span>
                    </div>
                    <div class="card" style="margin-bottom: 0; padding: 18px;">
                        <span style="font-size: 24px; display: block; margin-bottom: 12px;">📋</span>
                        <span style="font-weight: 800; font-size: 24px; display: block; margin-bottom: 4px; color: var(--text-primary);">${resumen.movimientos_hoy}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">Movimientos hoy</span>
                    </div>
                    <div class="card" style="margin-bottom: 0; padding: 18px;">
                        <span style="font-size: 24px; display: block; margin-bottom: 12px;">📊</span>
                        <span style="font-weight: 800; font-size: 24px; display: block; margin-bottom: 4px; color: var(--text-primary);">${Math.abs(resumen.comparativo.variacion_pct)}%</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">${resumen.comparativo.variacion_pct > 0 ? 'Más gastos que' : 'Menos gastos que'} el mes pasado</span>
                    </div>
                </div>
                
                ${!(perfil && perfil.es_pro) ? getAdBannerHtml() : ''}

                <div class="card" style="padding: 20px; margin-top: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0;">Evolución del balance</h3>
                        <span style="background: var(--bg-primary); padding: 4px 10px; border-radius: 12px; font-size: 12px; color: var(--text-secondary);">30 días</span>
                    </div>
                    <div class="chart-container" style="height: 140px; width: 100%;">
                        <canvas id="chart-balance"></canvas>
                    </div>
                </div>
        `;

        if (movsReq && movsReq.movimientos && movsReq.movimientos.length > 0) {
            html += `
                <div class="card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0;">Últimos movimientos</h3>
                        <span onclick="navigate('movimientos')" style="font-size: 13px; color: var(--accent); font-weight: 600; cursor: pointer;">Ver todos ↗</span>
                    </div>
                    <ul class="mov-list" style="margin: 0;">
            `;
            movsReq.movimientos.slice(0, 5).forEach(m => {
                const emoji = catEmoji(m.categoria);
                html += `
                    <li class="mov-item" style="padding: 12px 0; border-bottom: 1px solid var(--border-glass);">
                        <div class="mov-icon ${m.tipo}" style="width: 44px; height: 44px; border-radius: 12px; background: var(--bg-primary); font-size: 20px;">${emoji}</div>
                        <div class="mov-info">
                            <div class="mov-desc" style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${m.descripcion || m.categoria}</div>
                            <div class="mov-cat" style="font-size: 12px; color: var(--text-muted);">${m.categoria} · ${fmtDate(m.fecha)}</div>
                        </div>
                        <div class="mov-amount ${m.tipo}" style="font-weight: 700; font-size: 15px;">
                            ${m.tipo === 'ingreso' ? '+' : '-'}${fmt(m.monto)}
                        </div>
                    </li>
                `;
            });
            html += `
                    </ul>
                </div>
            `;
        } else {
             html += `
                <div class="card" style="margin-top: 14px; text-align: center; padding: 30px;">
                    <span style="font-size: 30px; display: block; margin-bottom: 10px;">🌱</span>
                    <h3 style="color: var(--text-primary); font-size: 15px;">Sin movimientos</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Tus últimos gastos aparecerán aquí</p>
                </div>
            `;
        }

        html += '</div>';
        $('#main-content').innerHTML = html;
        renderDashboardChart(resumen, movsReq ? movsReq.movimientos : []);

    } catch (e) {
        console.error(e);
        $('#main-content').innerHTML = `
            <div class="empty-state">
                <span class="empty-emoji">😵</span>
                <h3 class="empty-title">Error cargando datos</h3>
                <p class="empty-desc">${e.message}</p>
            </div>
        `;
    }
}

function renderDashboardChart(resumen, movimientos) {
    const canvas = document.getElementById('chart-balance');
    if (!canvas) return;
    
    const now = new Date();
    const diaHoy = now.getDate();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    
    const balanceActual = resumen.balance || 0;

    // Filter movements to current month and sort oldest-first
    let movsDelMes = [];
    if (movimientos && movimientos.length > 0) {
        for (const m of movimientos) {
            if (typeof m.fecha === 'string' && m.fecha.length >= 10) {
                const yy = parseInt(m.fecha.substring(0, 4));
                const mm = parseInt(m.fecha.substring(5, 7)) - 1;
                const dd = parseInt(m.fecha.substring(8, 10));
                if (yy === anioActual && mm === mesActual && dd <= diaHoy) {
                    movsDelMes.push({ ...m, _dia: dd });
                }
            }
        }
    }
    // Sort oldest first (by date, then by order in array reversed = oldest first)
    movsDelMes.reverse();

    // Calculate balance before the month: walk backwards from current balance
    let balanceInicio = balanceActual;
    for (const m of movsDelMes) {
        if (m.tipo === 'ingreso') {
            balanceInicio -= m.monto;
        } else {
            balanceInicio += Math.abs(m.monto);
        }
    }

    // Build data points: one per transaction + fill flat days between
    const labels = [];
    const dataPoints = [];
    let running = balanceInicio;
    let lastPlottedDay = 0;

    // Start point at day 1
    labels.push('1/' + (mesActual + 1));
    dataPoints.push(running);
    lastPlottedDay = 1;

    for (const m of movsDelMes) {
        // Fill flat days between last plotted and this movement's day
        if (m._dia > lastPlottedDay + 1) {
            for (let d = lastPlottedDay + 1; d < m._dia; d++) {
                labels.push(d + '/' + (mesActual + 1));
                dataPoints.push(running);
            }
        }
        
        // Apply the movement
        if (m.tipo === 'ingreso') {
            running += m.monto;
        } else {
            running -= Math.abs(m.monto);
        }
        
        labels.push(m._dia + '/' + (mesActual + 1));
        dataPoints.push(running);
        lastPlottedDay = m._dia;
    }

    // Fill remaining days to today
    for (let d = lastPlottedDay + 1; d <= diaHoy; d++) {
        labels.push(d + '/' + (mesActual + 1));
        dataPoints.push(running);
    }

    const isUp = dataPoints[dataPoints.length - 1] >= dataPoints[0];
    const color = isUp ? '#059669' : '#DC2626';
    const bgColor = isUp ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)';

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balance',
                data: dataPoints,
                borderColor: color,
                backgroundColor: bgColor,
                borderWidth: 2.5,
                tension: 0.1,
                pointRadius: dataPoints.length <= 20 ? 3 : 0,
                pointBackgroundColor: color,
                pointHitRadius: 20,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#3B2E2A',
                    bodyColor: '#FF7E67',
                    borderColor: 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: { label: (ctx) => '$' + ctx.raw.toLocaleString('es-AR') }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: { color: '#a0a0a0', font: { size: 10 }, maxTicksLimit: 8 }
                },
                y: { display: false }
            },
            layout: { padding: 0 }
        }
    });
}

function renderCharts(resumen) {
    const colors = [
        '#f59e0b', '#3b82f6', '#ef4444', '#22c55e',
        '#a855f7', '#ec4899', '#06b6d4', '#84cc16',
        '#f97316', '#6366f1',
    ];
    const colorsIngresos = [
        '#22c55e', '#3b82f6', '#a855f7', '#f59e0b',
        '#06b6d4', '#ec4899', '#84cc16', '#f97316',
    ];
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#6B554D',
                    padding: 16,
                    usePointStyle: true,
                    pointStyleWidth: 10,
                    font: { family: 'Inter', size: 12, weight: '500' },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                titleColor: '#3B2E2A',
                bodyColor: '#6B554D',
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                backdropFilter: 'blur(20px)',
                bodyFont: { family: 'Inter', size: 14, weight: '600' },
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}`,
                },
            },
        },
    };

    // ── Gráfico de GASTOS ──
    const catCanvas = document.getElementById('chart-cat');
    if (catCanvas && resumen.categorias && resumen.categorias.length > 0) {
        new Chart(catCanvas, {
            type: 'doughnut',
            data: {
                labels: resumen.categorias.map(c => c.nombre),
                datasets: [{
                    data: resumen.categorias.map(c => c.total),
                    backgroundColor: colors.slice(0, resumen.categorias.length),
                    borderWidth: 0,
                    spacing: 3,
                    borderRadius: 4,
                }],
            },
            options: chartDefaults,
        });
    }

    // ── Gráfico de INGRESOS ──
    const ingCanvas = document.getElementById('chart-ing');
    if (ingCanvas && resumen.categorias_ingresos && resumen.categorias_ingresos.length > 0) {
        new Chart(ingCanvas, {
            type: 'doughnut',
            data: {
                labels: resumen.categorias_ingresos.map(c => c.nombre),
                datasets: [{
                    data: resumen.categorias_ingresos.map(c => c.total),
                    backgroundColor: colorsIngresos.slice(0, resumen.categorias_ingresos.length),
                    borderWidth: 0,
                    spacing: 3,
                    borderRadius: 4,
                }],
            },
            options: chartDefaults,
        });
    }
}

// ── PAGE: MOVIMIENTOS ───────────────────────────────

let currentMovFiltro = 'egreso';
let currentMovOffset = 0;
const MOV_POR_PAGINA = 20;

async function renderMovimientos() {
    try {
        const query = currentMovFiltro === 'todos'
            ? `movimientos?limite=${MOV_POR_PAGINA}&offset=${currentMovOffset}`
            : `movimientos?limite=${MOV_POR_PAGINA}&offset=${currentMovOffset}&tipo=${currentMovFiltro}`;
        const [data, resumen] = await Promise.all([
            api(query),
            CACHE.resumen || api('resumen')
        ]);
        CACHE.resumen = resumen;

        let html = '<div class="page-enter">';

        html += `
            <div class="form-group" style="margin-bottom: 24px;">
                <div class="toggle-group filter-movs" style="background: var(--bg-card); padding: 4px; border-radius: var(--radius-pill); border: 1px solid var(--border-glass);">
                    <button class="toggle-btn ${currentMovFiltro === 'egreso' ? 'active' : ''}" data-tipo="egreso" onclick="filtroMovs(this)" style="border-radius: 100px; padding: 8px 16px;">Gastos</button>
                    <button class="toggle-btn ${currentMovFiltro === 'ingreso' ? 'active' : ''}" data-tipo="ingreso" onclick="filtroMovs(this)" style="border-radius: 100px; padding: 8px 16px;">Ingresos</button>
                    <button class="toggle-btn ${currentMovFiltro === 'todos' ? 'active' : ''}" data-tipo="todos" onclick="filtroMovs(this)" style="border-radius: 100px; padding: 8px 16px;">Todos</button>
                </div>
            </div>
        `;

        if (!data.movimientos || data.movimientos.length === 0) {
            html += `
                <div class="empty-state">
                    <span class="empty-emoji">📭</span>
                    <h3 class="empty-title">Sin movimientos</h3>
                    <p class="empty-desc">Anotá tu primer gasto desde el bot o tocá el botón +</p>
                </div>
            `;
            html += '</div>';
            $('#main-content').innerHTML = html;
            // Still render the chart if it exists
            renderCharts(resumen);
            return;
        }

        html += `
                <div class="section-title-row">
                    <h2 class="section-title">Últimos movimientos</h2>
                    <span class="card-badge badge-blue">${data.total} total</span>
                </div>
                <div class="card">
                    <ul class="mov-list">
        `;

        for (const m of data.movimientos) {
            const emoji = catEmoji(m.categoria);
            html += `
                <li class="mov-item" style="position: relative; padding: 16px 0; border-bottom: 1px solid var(--border-glass);">
                    <div class="mov-icon ${m.tipo}" style="background: var(--bg-primary); width: 44px; height: 44px; border-radius: 12px; font-size: 20px;">${emoji}</div>
                    <div class="mov-info">
                        <div class="mov-desc" style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${m.descripcion || m.categoria}</div>
                        <div class="mov-cat" style="font-size: 13px; color: var(--text-muted);">${m.categoria} · ${fmtDate(m.fecha)}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <div class="mov-amount ${m.tipo}">${m.tipo === 'ingreso' ? '+' : '-'}${fmt(m.monto)}</div>
                        <div style="display: flex; gap: 6px;">
                            <button onclick="editarMov(${m.id}, ${m.monto})"
                                style="padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.12);
                                       background: rgba(255,255,255,0.05); color: var(--text-secondary); cursor: pointer;">✏️</button>
                            <button onclick="borrarMov(${m.id})"
                                style="padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; border: 1px solid rgba(255,50,50,0.3);
                                       background: rgba(255,50,50,0.08); color: #ff6b6b; cursor: pointer;">🗑️</button>
                        </div>
                    </div>
                </li>
            `;
        }

        const hayAnterior = currentMovOffset > 0;
        const haySiguiente = currentMovOffset + MOV_POR_PAGINA < data.total;

        if (hayAnterior || haySiguiente) {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0 4px;">
                    <button onclick="paginarMovs(-1)" 
                        style="padding: 10px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
                               background: rgba(255,255,255,0.05); color: var(--text-primary); cursor: pointer;
                               opacity: ${hayAnterior ? '1' : '0.3'}; pointer-events: ${hayAnterior ? 'auto' : 'none'};">
                        ⬅️ Anterior
                    </button>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                        ${currentMovOffset + 1}–${Math.min(currentMovOffset + MOV_POR_PAGINA, data.total)} de ${data.total}
                    </span>
                    <button onclick="paginarMovs(1)"
                        style="padding: 10px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
                               background: rgba(255,255,255,0.05); color: var(--text-primary); cursor: pointer;
                               opacity: ${haySiguiente ? '1' : '0.3'}; pointer-events: ${haySiguiente ? 'auto' : 'none'};">
                        Siguiente ➡️
                    </button>
                </div>
            `;
        }

        html += '</ul></div></div>';
        $('#main-content').innerHTML = html;

        // Render the doughnut chart
        renderCharts(resumen);

    } catch (e) {
        $('#main-content').innerHTML = errorState(e.message);
    }
}

window.filtroMovs = function (btn) {
    const tipo = btn.dataset.tipo;
    if (currentMovFiltro === tipo) return;
    currentMovFiltro = tipo;
    currentMovOffset = 0;
    // Re-render
    renderMovimientos();
};

window.paginarMovs = function (direccion) {
    currentMovOffset = Math.max(0, currentMovOffset + (direccion * MOV_POR_PAGINA));
    renderMovimientos();
};

window.borrarMov = async function (id) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content" style="text-align: center;">
            <h3 class="modal-title">🗑️ Borrar movimiento</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div class="modal-actions">
                <button class="btn-secondary modal-cancel" style="flex:1">Cancelar</button>
                <button class="btn-primary modal-confirm" style="flex:1; background:#e74c3c;">Borrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-cancel').onclick = () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 200);
    };
    overlay.querySelector('.modal-confirm').onclick = async () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 200);
        try {
            await apiDelete(`movimientos/${id}`);
            CACHE = {};
            showToast('🗑️ Movimiento eliminado');
            renderMovimientos();
        } catch (e) {
            showToast('Error al borrar: ' + e.message, 'error');
        }
    };
};

window.editarMov = async function (id, montoActual) {
    const nuevoMonto = await promptAsync('✏️ Nuevo monto:', montoActual.toString());
    if (nuevoMonto === null) return;
    const monto = parseFloat(nuevoMonto.replace(',', '.'));
    if (!monto || monto <= 0) return showToast('Monto inválido', 'error');
    try {
        await fetch(`/api/movimientos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({ nuevo_monto: monto })
        });
        CACHE = {};
        showToast('✅ Monto actualizado');
        renderMovimientos();
    } catch (e) {
        showToast('Error al editar: ' + e.message, 'error');
    }
};

async function apiFetch(endpoint, method, body = null) {
    const opts = {
        method,
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api/${endpoint}`, opts);
    if (res.status === 401) { logout(); throw new Error('Sesión expirada'); }
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

// ── PAGE: AGREGAR ───────────────────────────────────

async function renderAgregar() {
    const CATS_EGRESO_DEFAULT = [
        { nombre: 'Comida', emoji: '🍔' }, { nombre: 'Transporte', emoji: '🚌' },
        { nombre: 'Supermercado', emoji: '🛒' }, { nombre: 'Ocio', emoji: '🎮' },
        { nombre: 'Servicios', emoji: '📡' }, { nombre: 'Salud', emoji: '🏥' },
        { nombre: 'Educación', emoji: '🎓' }, { nombre: 'Ropa', emoji: '👕' },
        { nombre: 'Suscripciones', emoji: '🔄' }, { nombre: 'Varios', emoji: '📦' },
    ];
    const CATS_INGRESO_DEFAULT = [
        { nombre: 'Sueldo', emoji: '💼' }, { nombre: 'Freelance', emoji: '💻' },
        { nombre: 'Inversiones', emoji: '📈' }, { nombre: 'Venta', emoji: '🛍️' },
        { nombre: 'Regalo', emoji: '🎁' }, { nombre: 'Alquiler', emoji: '🏠' },
        { nombre: 'Bono', emoji: '💰' }, { nombre: 'Otros', emoji: '📦' },
    ];

    let catsEgreso = CATS_EGRESO_DEFAULT;
    let catsIngreso = CATS_INGRESO_DEFAULT;

    try {
        const [dataE, dataI] = await Promise.all([
            api('categorias?tipo=egreso'),
            api('categorias?tipo=ingreso'),
        ]);
        const toObj = (arr) => arr.map(c =>
            Array.isArray(c) ? { nombre: c[0], emoji: c[1] || '📌' } : { nombre: c, emoji: '📌' }
        );
        // Fusionar: primero los defaults, luego agregar los del servidor que no estén ya
        if (dataE.categorias?.length > 0) {
            const nombresDefault = new Set(CATS_EGRESO_DEFAULT.map(c => c.nombre));
            const extras = toObj(dataE.categorias).filter(c => !nombresDefault.has(c.nombre));
            catsEgreso = [...CATS_EGRESO_DEFAULT, ...extras];
        }
        if (dataI.categorias?.length > 0) {
            const nombresDefault = new Set(CATS_INGRESO_DEFAULT.map(c => c.nombre));
            const extras = toObj(dataI.categorias).filter(c => !nombresDefault.has(c.nombre));
            catsIngreso = [...CATS_INGRESO_DEFAULT, ...extras];
        }
    } catch (e) { /* usa defaults */ }

    const renderChips = (cats, id) => cats.map(c => `
        <button type="button" class="cat-chip" data-nombre="${c.nombre}"
            onclick="selectCat(this)"
            style="padding:8px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.12);
                   background:rgba(255,255,255,0.05);color:var(--text-primary);
                   font-size:0.85rem;cursor:pointer;transition:all 0.15s;">
            ${c.emoji} ${c.nombre}
        </button>
    `).join('');

    const html = `
        <div class="page-enter">
            <h2 class="section-title">Nuevo movimiento</h2>
            <div class="card">
                <div class="form-group">
                    <label class="form-label">Tipo</label>
                    <div class="toggle-group">
                        <button class="toggle-btn active" data-tipo="egreso" onclick="selectTipo(this)">Gasto 🔴</button>
                        <button class="toggle-btn" data-tipo="ingreso" onclick="selectTipo(this)">Ingreso 🟢</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Monto ($)</label>
                    <input type="number" id="add-monto" class="form-input" placeholder="5000" inputmode="decimal" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Categoría</label>
                    <div id="chips-egreso" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
                        ${renderChips(catsEgreso, 'egreso')}
                    </div>
                    <div id="chips-ingreso" style="display:none;flex-wrap:wrap;gap:8px;margin-top:4px;">
                        ${renderChips(catsIngreso, 'ingreso')}
                    </div>
                    <input type="hidden" id="add-cat" value="">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <input type="text" id="add-desc" class="form-input" placeholder="Café con medialunas">
                </div>
                <button class="btn-primary" style="width:100%;margin-top:8px" onclick="submitMov()">
                    Guardar movimiento
                </button>
            </div>
        </div>
    `;
    $('#main-content').innerHTML = html;
}

window.selectTipo = function (btn) {
    $$('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('add-cat').value = '';
    document.querySelectorAll('.cat-chip').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.borderColor = 'rgba(255,255,255,0.12)';
        b.style.color = 'var(--text-primary)';
    });
    const esIngreso = btn.dataset.tipo === 'ingreso';
    const chipsE = document.getElementById('chips-egreso');
    const chipsI = document.getElementById('chips-ingreso');
    if (chipsE) { chipsE.style.display = esIngreso ? 'none' : 'flex'; }
    if (chipsI) { chipsI.style.display = esIngreso ? 'flex' : 'none'; }
};

window.selectCat = function (btn) {
    document.querySelectorAll('.cat-chip').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.borderColor = 'rgba(255,255,255,0.12)';
        b.style.color = 'var(--text-primary)';
    });
    btn.style.background = 'rgba(255,165,0,0.2)';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    document.getElementById('add-cat').value = btn.dataset.nombre;
};

window.submitMov = async function () {
    const tipo = $('.toggle-btn.active')?.dataset.tipo || 'egreso';
    const monto = parseFloat($('#add-monto')?.value);
    const cat = $('#add-cat')?.value.trim();
    const desc = $('#add-desc')?.value.trim();

    if (!monto || monto <= 0) return showToast('Ingresá un monto válido', 'error');
    if (!cat) return showToast('Ingresá una categoría', 'error');

    try {
        await apiPost('movimientos', { tipo, monto, categoria: cat, descripcion: desc || cat });
        CACHE = {}; // Invalidate
        showToast(`✅ ${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} de ${fmt(monto)} guardado`);
        navigate(''); // Reset current page
        navigate('dashboard');
    } catch (e) {
        showToast(e.message, 'error');
    }
};

// ── PAGE: METAS ─────────────────────────────────────

async function renderMetas() {
    try {
        const [presData, metasData, subsData] = await Promise.all([
            api('presupuestos'),
            api('metas'),
            api('suscripciones'),
        ]);

        let html = '<div class="page-enter">';

        // Presupuestos
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;"><h2 class="section-title" style="margin:0;">🎯 Presupuestos</h2><button class="btn-primary" style="padding:4px 12px; font-size:12px; border-radius:12px;" onclick="modalNuevoPresupuesto()">+ Crear</button></div>';
        if (presData.presupuestos && presData.presupuestos.length > 0) {
            for (const p of presData.presupuestos) {
                const pct = p.porcentaje;
                const colorClass = pct < 60 ? 'progress-green' : pct < 85 ? 'progress-yellow' : 'progress-red';
                const pctColor = pct < 60 ? 'var(--green)' : pct < 85 ? 'var(--accent)' : 'var(--red)';
                html += `
                    <div class="card">
                        <div class="meta-header">
                            <span class="meta-name">${catEmoji(p.categoria)} ${p.categoria}</span>
                            <span class="meta-pct" style="color:${pctColor}">${pct.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill ${colorClass}" style="width:${Math.min(pct, 100)}%"></div>
                        </div>
                        <div class="meta-amounts">
                            <span>${fmt(p.gastado)} gastado</span>
                            <span>${fmt(p.maximo)} límite</span>
                        </div>
                    </div>
                `;
            }
        } else {
            html += `<div class="card"><p style="color:var(--text-secondary);text-align:center;padding:10px">Sin presupuestos. Usá <code>/presupuesto</code> en Telegram.</p></div>`;
        }

        // Metas de ahorro
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; margin-bottom: 20px;"><h2 class="section-title" style="margin:0;">💎 Metas de ahorro</h2><button class="btn-primary" style="padding:4px 12px; font-size:12px; border-radius:12px;" onclick="modalNuevaMeta()">+ Crear</button></div>';
        if (metasData.metas && metasData.metas.length > 0) {
            for (const m of metasData.metas) {
                const pct = m.porcentaje;
                const colorClass = pct >= 100 ? 'progress-green' : pct >= 50 ? 'progress-yellow' : 'progress-red';
                html += `
                    <div class="card">
                        <div class="meta-header">
                            <span class="meta-name">🎯 ${m.nombre}</span>
                            <span class="meta-pct">${pct.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill ${colorClass}" style="width:${Math.min(pct, 100)}%"></div>
                        </div>
                        <div class="meta-amounts">
                            <span>${fmt(m.actual)} ahorrado</span>
                            <span>${fmt(m.objetivo)} objetivo</span>
                        </div>
                    </div>
                `;
            }
        } else {
            html += `<div class="card"><p style="color:var(--text-secondary);text-align:center;padding:10px">Sin metas. Creá una desde el bot.</p></div>`;
        }

        // Suscripciones
        if (subsData.suscripciones && subsData.suscripciones.length > 0) {
            html += '<h2 class="section-title" style="margin-top:24px">🔄 Gastos fijos</h2>';
            html += '<div class="card"><ul class="mov-list">';
            for (const s of subsData.suscripciones) {
                html += `
                    <li class="mov-item">
                        <div class="mov-icon egreso">📺</div>
                        <div class="mov-info">
                            <div class="mov-desc">${s.nombre}</div>
                            <div class="mov-cat">Día ${s.dia_cobro} · ${s.categoria}</div>
                        </div>
                        <div class="mov-amount egreso">-${fmt(s.monto)}</div>
                    </li>
                `;
            }
            html += '</ul></div>';
        }

        html += '</div>';
        $('#main-content').innerHTML = html;

    } catch (e) {
        $('#main-content').innerHTML = errorState(e.message);
    }
}

window.modalNuevoPresupuesto = async function() {
    const categoria = await promptAsync("Ingresá la categoría exacta (ej: Comida, Transporte):", "Comida");
    if (!categoria) return;
    const maximoStr = await promptAsync("Ingresá el límite mensual numérico (ej: 50000):", "");
    if (!maximoStr) return;
    const maximo = parseFloat(maximoStr);
    if (isNaN(maximo) || maximo <= 0) return showToast("Monto inválido", "error");
    
    try {
        await apiPost('presupuestos', { categoria: categoria.trim(), maximo_mensual: maximo });
        showToast("Presupuesto creado con éxito ✅");
        renderMetas();
    } catch(e) { showToast("Error: " + e.message, "error"); }
};

window.modalNuevaMeta = async function() {
    const nombre = await promptAsync("Ingresá el nombre de tu meta (ej: Viaje a Salta) (min. 3 carácteres):", "");
    if (!nombre || nombre.length < 3) return;
    const objetivoStr = await promptAsync("Ingresá el monto objetivo numérico (ej: 500000):", "");
    if (!objetivoStr) return;
    const objetivo = parseFloat(objetivoStr);
    if (isNaN(objetivo) || objetivo <= 0) return showToast("Monto inválido", "error");
    
    try {
        await apiPost('metas', { nombre: nombre.trim(), objetivo: objetivo });
        showToast("Meta creada con éxito ✅");
        renderMetas();
    } catch(e) { showToast("Error: " + e.message, "error"); }
};

// ── PAGE: DOLAR ─────────────────────────────────────

async function renderDolar() {
    try {
        const data = await api('dolar');

        let html = `
            <div class="page-enter">
                <h2 class="section-title">💵 Cotización del dólar</h2>
                <div class="dolar-grid">
        `;

        const order = ['blue', 'oficial', 'bolsa', 'contadoconliqui', 'tarjeta', 'mayorista', 'cripto'];
        const names = {
            blue: '💰 Blue', oficial: '🏛️ Oficial', bolsa: '📈 MEP/Bolsa',
            contadoconliqui: '📊 CCL', tarjeta: '💳 Tarjeta',
            mayorista: '🏭 Mayorista', cripto: '🪙 Cripto',
        };

        for (const casa of order) {
            if (data[casa]) {
                const d = data[casa];
                html += `
                    <div class="dolar-card">
                        <div class="dolar-name">${names[casa] || casa}</div>
                        <div class="dolar-value">${fmt(d.venta)}</div>
                        <div class="dolar-sub">Compra: ${fmt(d.compra)}</div>
                    </div>
                `;
            }
        }

        html += '</div></div>';
        $('#main-content').innerHTML = html;

    } catch (e) {
        $('#main-content').innerHTML = errorState(e.message);
    }
}

// Utility function for API calls with custom methods
async function apiFetch(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`/api/${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
    }
    return result;
}

// ── PAGE: CATEGORÍAS ────────────────────────────────

async function renderCategorias() {
    const EMOJIS = ['🍔', '🚌', '🛒', '🎮', '📡', '🏥', '🎓', '👕', '🔄', '📦', '💼', '💻', '📈', '🛍️', '🎁', '🏠', '💰', '✈️', '🐾', '🎵', '🏋️', '📚', '🍺', '☕', '🎬', '💊', '🚿', '⚡'];

    let catsE = [], catsI = [];
    try {
        const [dE, dI] = await Promise.all([api('categorias?tipo=egreso'), api('categorias?tipo=ingreso')]);
        catsE = dE.categorias || [];
        catsI = dI.categorias || [];
    } catch (e) { }

    const renderList = (cats, tipo) => cats.length === 0
        ? `<p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0;">Sin categorías personalizadas aún.</p>`
        : cats.map(c => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:0.9rem;">${c}</span>
                <button onclick="deleteCat('${c}','${tipo}')" style="background:rgba(239,68,68,0.15);border:none;color:#ef4444;border-radius:8px;padding:4px 10px;font-size:0.8rem;cursor:pointer;">✕</button>
            </div>
        `).join('');

    const html = `
        <div class="page-enter">
            <h2 class="section-title">⚙️ Categorías</h2>

            <div class="card" style="margin-bottom:16px;">
                <h3 style="font-size:1rem;margin-bottom:12px;color:var(--accent);">🔴 Gastos</h3>
                <div id="list-egreso">${renderList(catsE, 'egreso')}</div>
                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                    <input type="text" id="new-cat-egreso" class="form-input" placeholder="Nueva categoría..." style="flex:1;margin:0;min-width:120px;">
                    <button class="btn-primary" onclick="addCat('egreso')" style="padding:0 16px;">+ Agregar</button>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:1rem;margin-bottom:12px;color:var(--green);">🟢 Ingresos</h3>
                <div id="list-ingreso">${renderList(catsI, 'ingreso')}</div>
                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                    <input type="text" id="new-cat-ingreso" class="form-input" placeholder="Nueva categoría..." style="flex:1;margin:0;min-width:120px;">
                    <button class="btn-primary" onclick="addCat('ingreso')" style="padding:0 16px;">+ Agregar</button>
                </div>
            </div>
        </div>
    `;
    $('#main-content').innerHTML = html;
}

window.addCat = async function (tipo) {
    const input = document.getElementById(`new-cat-${tipo}`);
    const nombre = input?.value.trim();
    if (!nombre || nombre.length < 2) return showToast('Nombre muy corto', 'error');
    try {
        await apiPost('categorias', { nombre, tipo });
        showToast(`✅ Categoría "${nombre}" agregada`);
        input.value = '';
        renderCategorias();
    } catch (e) { showToast('Error al agregar', 'error'); }
};

window.deleteCat = async function (nombre, tipo) {
    try {
        await apiFetch(`categorias/${encodeURIComponent(nombre)}?tipo=${tipo}`, 'DELETE');
        showToast(`🗑️ "${nombre}" eliminada`);
        renderCategorias();
    } catch (e) { showToast('Error al eliminar', 'error'); }
};

window.vincularTelegram = async function () {
    const codigo = document.getElementById('input-vincular')?.value.trim();
    if (!codigo) return;
    try {
        await apiPost('auth/vincular-telegram', { codigo });
        document.getElementById('vincular-msg').style.color = 'var(--green)';
        document.getElementById('vincular-msg').textContent = '✅ ¡Cuenta vinculada con Telegram!';
        document.getElementById('input-vincular').value = '';
    } catch (e) {
        document.getElementById('vincular-msg').style.color = 'var(--red)';
        document.getElementById('vincular-msg').textContent = e.message || 'Código inválido';
    }
};

// ── PAGE: APRENDER ──────────────────────────────────

const TIPS_FINANCIEROS = [
    { title: "🎯 Metas: el poder de lo concreto", desc: "<b style='color:var(--text-primary)'>'Quiero ahorrar más'</b> no es una meta. <b style='color:var(--text-primary)'>'Quiero ahorrar $500,000 en 4 meses'</b> sí lo es. Las metas concretas tienen 3 veces más probabilidad de cumplirse." },
    { title: "🧾 Cuotas sin interés", desc: "En Argentina, pagar en <b style='color:var(--text-primary)'>cuotas sin interés</b> es ahorrar: mientras pagás mes a mes licuando la deuda, el dinero que no gastaste rinde en un FCI." },
    { title: "🛡️ Fondo de emergencia", desc: "El primer paso para la tranquilidad es tener entre 3 y 6 meses de tus gastos fijos ahorrados en un instrumento de alta liquidez." },
    { title: "📈 Invertí en vos", desc: "La mejor inversión siempre será tu educación. Aprender una nueva habilidad te puede dar retornos infinitamente más altos que cualquier activo." },
    { title: "🚨 Inflación de estilo de vida", desc: "Si tus ingresos aumentan, no aumentes tus gastos en la misma proporción. Destiná esa diferencia a ahorro e inversión directamente." },
    { title: "🧠 Interés compuesto", desc: "Invertir un poco de dinero de forma consistente durante muchos años crea fortunas gracias a que los intereses generan nuevos intereses." },
    { title: "📊 Diversificá", desc: "No dependas de un solo sueldo. Buscá formas de generar pequeñas fuentes de ingreso pasivo o trabajos freelance para estar más seguro." },
    { title: "📝 Anotá todo", desc: "El simple hecho de ser consciente de a dónde va tu dinero hace que gastes menos naturalmente. Anotá cada café en Manguito." },
    { title: "🛒 Regla de las 48 horas", desc: "Antes de comprar algo no esencial por impulso, esperá 48 horas. La mayoría de las veces te darás cuenta de que ni lo necesitabas." }
];

const IG_PROFILES = [
    { user: "@joveninversor", url: "https://instagram.com/joveninversor", cat: "Mercado de Capitales" },
    { user: "@finanzas.con.sol", url: "https://instagram.com/finanzas.con.sol", cat: "Billeteras y Tarjetas" },
    { user: "@mujer_financiera", url: "https://instagram.com/mujer_financiera", cat: "Ahorro e Inversión" },
    { user: "@ramiromarra", url: "https://instagram.com/ramiromarra", cat: "Economía y Mercados" }
];

const YT_CHANNELS = [
    { name: "Inverarg", url: "https://youtube.com/@inverarg", cat: "Inversiones y Finanzas" },
    { name: "VisualEconomik", url: "https://youtube.com/@VisualEconomik", cat: "Economía General" },
    { name: "Healthy Pockets", url: "https://youtube.com/@HealthyPockets", cat: "Criptomonedas y Macro" },
    { name: "Juan Rallo", url: "https://youtube.com/@juanrallo", cat: "Análisis Económico" },
    { name: "Un Poco Mejor", url: "https://youtube.com/@Unpocomejor1", cat: "Mentalidad / Libros" },
    { name: "Aprendiz Financiero", url: "https://youtube.com/@AprendizFinanciero", cat: "Mentalidad / Libros" },
    { name: "Moris Dieck", url: "https://youtube.com/@MorisDieck", cat: "Finanzas Personales" },
    { name: "El Lago de los Business", url: "https://youtube.com/@EllagodelosBusiness", cat: "Finanzas Personales" },
    { name: "Latino Sueco", url: "https://youtube.com/@LatinoSueco", cat: "Inversión en Bolsa" },
    { name: "Omar Educación Financiera", url: "https://youtube.com/@omareducacionfinanciera", cat: "Finanzas Personales" },
    { name: "BAI JAVIER", url: "https://youtube.com/@BAIJAVIER", cat: "Inversión en Bolsa" },
    { name: "César Dabián", url: "https://youtube.com/@CésarDabiánFinanzas", cat: "Emprendimiento" },
    { name: "El Arte de Invertir", url: "https://youtube.com/@Artedeinvertir", cat: "Inversión en Bolsa" },
    { name: "Trabajar Desde Casa", url: "https://youtube.com/@trabajardesdecasasi", cat: "Emprendimiento" },
    { name: "Eduardo Rosas", url: "https://youtube.com/@EduardoRosas", cat: "Finanzas Personales" },
    { name: "Negocios TV", url: "https://youtube.com/@NegociosTV", cat: "Actualidad y Geopolítica" },
    { name: "Andrés Garza", url: "https://youtube.com/@andresgarzam", cat: "Finanzas Personales e Inversión" }
];

function getDailyItems(array, count, daySeed) {
    let result = [];
    for(let i = 0; i < count; i++) {
        let index = (daySeed + i) % array.length;
        result.push(array[index]);
    }
    return result;
}

function renderAprender() {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const daySeed = Math.floor((Date.now() - tzOffsetMs) / 86400000);
    
    const dailyTips = getDailyItems(TIPS_FINANCIEROS, 3, daySeed);
    const dailyIG = getDailyItems(IG_PROFILES, 1, daySeed);
    const dailyYT = getDailyItems(YT_CHANNELS, 1, daySeed);

    let tipsHtml = dailyTips.map(t => `
        <div class="card" style="margin-bottom: 16px;">
            <h3 style="margin-bottom: 5px; color: var(--accent); font-size: 1rem;">${t.title}</h3>
            <p style="color: var(--text-secondary); line-height: 1.5; font-size: 0.9rem;">${t.desc}</p>
        </div>
    `).join('');

    let igHtml = dailyIG.map(ig => `
        <a href="${ig.url}" target="_blank" class="btn-secondary" style="display:block; margin-bottom: 12px; padding: 20px;">
            <div style="font-weight:bold; color:var(--text-primary); font-size: 18px; margin-bottom: 4px;">${ig.user}</div>
            <div style="font-size: 13px; color:var(--text-muted);">${ig.cat}</div>
        </a>
    `).join('');

    let ytHtml = dailyYT.map(yt => `
        <a href="${yt.url}" target="_blank" class="btn-secondary" style="display:block; margin-bottom: 12px; padding: 20px;">
            <div style="font-weight:bold; color:var(--text-primary); font-size: 18px; margin-bottom: 4px;">${yt.name}</div>
            <div style="font-size: 13px; color:var(--text-muted);">${yt.cat}</div>
        </a>
    `).join('');

    let html = `
        <div class="page-enter">
            <h2 class="section-title" style="margin-bottom: 20px;">📚 Aprender</h2>
            
            <div class="tabs-container" style="display: flex; gap: 10px; overflow-x: auto; margin-bottom: 20px; padding-bottom: 5px;">
                <button class="btn-tab active" onclick="switchAprenderTab('ia')" id="tab-ia">🤖 IA</button>
                <button class="btn-tab" onclick="switchAprenderTab('tips')" id="tab-tips">💡 Tips</button>
                <button class="btn-tab" onclick="switchAprenderTab('ig')" id="tab-ig">📸 Instagram</button>
                <button class="btn-tab" onclick="switchAprenderTab('yt')" id="tab-yt">▶️ YouTube</button>
            </div>

            <div id="aprender-content-ia" class="aprender-tab-content">
                <div class="card" style="padding: 0; display: flex; flex-direction: column; height: 60vh; max-height: 500px; overflow: hidden; border: 1px solid var(--accent); box-shadow: 0 8px 32px rgba(217,119,6,0.15);">
                    <div style="background: linear-gradient(135deg, var(--accent) 0%, #b45309 100%); padding: 16px; color: white;">
                        <h3 style="margin: 0; font-size: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <span>🤖 Mango IA</span>
                            <span id="chat-limits" style="font-size: 12px; opacity: 0.9; font-weight: normal; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 12px;">Cargando...</span>
                        </h3>
                    </div>
                    <div id="chat-history" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: var(--bg-primary);">
                        <div class="chat-bubble bot">¡Hola! Soy Mango IA. Hacé una pregunta sobre tus finanzas, presupuestos o inversiones.</div>
                    </div>
                    <div style="padding: 12px; background: var(--bg-card); border-top: 1px solid var(--border-glass); display: flex; gap: 8px;">
                        <input type="text" id="chat-input" class="form-input" placeholder="Preguntale a Mango..." style="margin: 0; flex: 1;">
                        <button id="btn-chat-send" class="btn-primary" style="padding: 0 16px;">➤</button>
                    </div>
                </div>
            </div>

            <div id="aprender-content-tips" class="aprender-tab-content" style="display: none;">
                <p style="font-size:13px; color:var(--text-secondary); margin-bottom: 20px; font-weight:500;">💡 Tips rotados automáticamente hoy:</p>
                ${tipsHtml}
            </div>

            <div id="aprender-content-ig" class="aprender-tab-content" style="display: none;">
                <div class="card" style="text-align: center; padding: 25px 15px;">
                    <span style="font-size: 40px; display: block; margin-bottom: 15px;">📸</span>
                    <h3 style="color: var(--text-primary); margin-bottom: 5px;">Recomendación Diaria</h3>
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 24px;">Exponente rotativo cada 24hs para dominar áreas distintas de tus finanzas.</p>
                    ${igHtml}
                </div>
            </div>

            <div id="aprender-content-yt" class="aprender-tab-content" style="display: none;">
                <div class="card" style="text-align: center; padding: 25px 15px;">
                    <span style="font-size: 40px; display: block; margin-bottom: 15px;">▶️</span>
                    <h3 style="color: var(--text-primary); margin-bottom: 5px;">Canal en Alta</h3>
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 24px;">Video y contenido extenso rotativo sobre tácticas de inversión por día.</p>
                    ${ytHtml}
                </div>
            </div>
        </div>
    `;
    $('#main-content').innerHTML = html;
    setupChatIA();
}

window.switchAprenderTab = function(tabId) {
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.aprender-tab-content').forEach(c => c.style.display = 'none');
    
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('aprender-content-' + tabId).style.display = 'block';
};

async function setupChatIA() {
    const input = $('#chat-input');
    const sendBtn = $('#btn-chat-send');
    const history = $('#chat-history');
    const limitsLabel = $('#chat-limits');

    // Cargar límites actuales
    try {
        const usageData = await api('ia/limits');
        const proTag = usageData.es_pro ? ' <span style="background:#9d4edd;color:white;padding:2px 6px;border-radius:6px;font-size:10px;">PRO</span>' : '';
        const limitText = usageData.usos >= usageData.limite
            ? '<span style="color:var(--red)">Límite alcanzado</span>'
            : `${usageData.usos}/${usageData.limite} consultas hoy${proTag}`;
        limitsLabel.innerHTML = limitText;

        if (usageData.usos >= usageData.limite) {
            input.disabled = true;
            sendBtn.disabled = true;
            input.placeholder = usageData.es_pro 
                ? "Límite PRO alcanzado. Volvé mañana." 
                : "Límite Free alcanzado. Pasate a PRO para más consultas.";
        }
    } catch (e) {
        limitsLabel.textContent = "Error al cargar límite";
    }

    const appendMessage = (text, isUser) => {
        // Eliminar mensaje temporal vacío si existe
        if (history.children.length === 1 && history.children[0].innerText.includes('Hacé una pregunta')) {
            history.innerHTML = '';
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = isUser ? 'chat-bubble user' : 'chat-bubble bot';

        if (!isUser) {
            // Format bold text
            text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        }

        msgDiv.innerHTML = text;
        history.appendChild(msgDiv);
        history.scrollTop = history.scrollHeight;
    };

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;

        appendMessage(text, true);

        // Placeholder thinking message
        const thinkingId = 'think-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = thinkingId;
        msgDiv.className = 'chat-bubble bot';
        msgDiv.innerHTML = '<span class="dots">Pensando...</span>';
        history.appendChild(msgDiv);
        history.scrollTop = history.scrollHeight;

        try {
            const res = await apiPost('ia/chat', { mensaje: text });
            document.getElementById(thinkingId).remove();
            appendMessage(res.respuesta, false);

            // Update limit counter
            limitsLabel.innerHTML = `${res.usos}/${res.limite} consultas hoy`;

            if (res.usos >= res.limite) {
                input.placeholder = "Límite diario alcanzado.";
                limitsLabel.innerHTML = '<span style="color:var(--red)">Límite alcanzado</span>';
            } else {
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            }

        } catch (e) {
            document.getElementById(thinkingId).remove();
            appendMessage(`Error: ${e.message}`, false);
            input.disabled = false;
            sendBtn.disabled = false;
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
}

// ── PAGE: MÁS (CONFIG) ──────────────────────────────

async function renderMas() {
    try {
        const perfil = CACHE.perfil || await api('perfil');
        CACHE.perfil = perfil;

        let html = `
            <div class="page-enter">
                <h2 class="section-title">⚙️ Más</h2>
                
                <div class="card" style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">👤</div>
                    <h3 style="margin-bottom: 5px;">${perfil.apodo ? perfil.apodo : `ID: ${perfil.id}`}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${perfil.apodo ? `ID: ${perfil.id}` : '(Aún no configuraste tu apodo)'}</p>
                    <button class="btn-primary" id="btn-config-perfil" style="margin-top: 15px; width: 100%;">Configurar Perfil</button>
                </div>

                <h3 class="section-title" style="font-size: 1rem;">Finanzas</h3>
                <div class="card" style="padding: 0;">
                    <div id="btn-moneda" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        <span>💰 Moneda Principal</span>
                        <span style="color: var(--text-secondary);">${perfil.moneda || 'ARS'} ></span>
                    </div>
                    <div id="btn-notif" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        <span>🔔 Recordatorio nocturno</span>
                        <span id="notif-status" style="color: var(--text-secondary);">${perfil.notificaciones_activas !== 0 ? 'Activo >' : 'Inactivo >'}</span>
                    </div>
                    <div id="btn-metas" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; width: 100%; border-radius: 0; background: none; color: var(--text-primary); cursor: pointer;">
                        <span>🎯 Presupuestos y Metas</span>
                        <span style="color: var(--text-secondary);">></span>
                    </div>
                    <div id="btn-categorias" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; width: 100%; border-radius: 0; background: none; color: var(--text-primary); cursor: pointer;">
                        <span>⚙️ Gestionar Categorías</span>
                        <span style="color: var(--text-secondary);">></span>
                    </div>
                    <div id="btn-bancos" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; width: 100%; border-radius: 0; background: none; color: var(--text-primary); cursor: pointer;">
                        <span>🏦 Conexión Bancaria</span>
                        <span style="color: var(--text-secondary);">></span>
                    </div>
                    <div id="btn-dolar" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; width: 100%; border-radius: 0; background: none; color: var(--text-primary); cursor: pointer;">
                        <span>💵 Cotizaciones (Dólar)</span>
                        <span style="color: var(--text-secondary);">></span>
                    </div>
                    <div id="btn-exportar" style="padding: 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; width: 100%; border-radius: 0; background: none; color: ${perfil.es_pro ? 'var(--text-primary)' : 'var(--text-muted)'}; cursor: pointer;">
                        <span>📊 Exportar a Excel ${perfil.es_pro ? '' : '🔒'}</span>
                        <span style="color: var(--text-secondary);">${perfil.es_pro ? '>' : 'PRO'}</span>
                    </div>
                    <div id="btn-modo-pareja" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; width: 100%; border-radius: 0; background: none; color: ${perfil.es_pro ? 'var(--text-primary)' : 'var(--text-muted)'}; cursor: pointer;">
                        <span>👫 Modo Pareja ${perfil.es_pro ? '' : '🔒'}</span>
                        <span style="color: var(--text-secondary);">${perfil.es_pro ? '>' : 'PRO'}</span>
                    </div>
                </div>

                <div class="card" style="margin-top:16px;">
                    <h3 style="font-size:0.95rem;margin-bottom:8px;">🤖 Vincular con Telegram</h3>
                    <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:10px;line-height:1.4;">
                        Mandá <code style="color:var(--accent);">/web</code> en el bot y pegá el código acá para unir tu cuenta.
                    </p>
                    <div style="display:flex;gap:8px;">
                        <input type="text" id="input-vincular" class="form-input" placeholder="Código de Telegram..." style="flex:1;margin:0;font-size:0.85rem;">
                        <button class="btn-primary" onclick="vincularTelegram()" style="padding:0 14px;font-size:0.85rem;">Vincular</button>
                    </div>
                    <p id="vincular-msg" style="font-size:0.82rem;margin-top:8px;min-height:16px;"></p>
                </div>

                <div class="card" style="margin-top:25px;background:linear-gradient(135deg,#1a1025 0%,#301f42 100%);text-align:center;border:1px solid #9d4edd;">
                    <div style="font-size:2rem;margin-bottom:8px;">⭐</div>
                    <h3 style="color:#c77dff;margin-bottom:4px;">Manguito PRO</h3>
                    <p style="color:rgba(199,125,255,0.7);font-size:12px;margin-bottom:16px;">Desbloqueá todo el poder de Manguito</p>
                    
                    <div style="display:flex;gap:10px;margin-bottom:16px;">
                        <button id="plan-mensual" onclick="switchPlan('mensual')" class="btn-tab active" style="flex:1;background:#9d4edd;color:white;border-color:#9d4edd;">Mensual</button>
                        <button id="plan-anual" onclick="switchPlan('anual')" class="btn-tab" style="flex:1;">Anual <span style='font-size:10px;background:#22c55e;color:white;padding:2px 6px;border-radius:8px;margin-left:4px;'>-29%</span></button>
                    </div>

                    <div id="precio-mensual">
                        <div style="background:rgba(157,78,221,0.15);border-radius:12px;padding:12px;margin-bottom:16px;">
                            <div style="font-size:1.8rem;font-weight:800;color:#c77dff;">$6.999 <span style="font-size:0.85rem;font-weight:400;color:rgba(199,125,255,0.6);">ARS/mes</span></div>
                        </div>
                    </div>
                    <div id="precio-anual" style="display:none;">
                        <div style="background:rgba(34,197,94,0.1);border-radius:12px;padding:12px;margin-bottom:16px;">
                            <div style="font-size:1.8rem;font-weight:800;color:#22c55e;">$59.999 <span style="font-size:0.85rem;font-weight:400;color:rgba(34,197,94,0.6);">ARS/año</span></div>
                            <div style="font-size:12px;color:#22c55e;margin-top:4px;">= $5.000/mes · Ahorrás $23.989 al año</div>
                        </div>
                    </div>

                    <div style="text-align:left;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                        ${['🤖 IA: 20 consultas/día (Free: 5)', '📊 Reportes y exportación PDF', '👫 Modo pareja / convivencia', '♾️ Sin límite de movimientos', '🚫 Sin publicidad', '✨ Nuevas funciones primero'].map(b =>
            `<div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:rgba(255,255,255,0.85);">${b}</div>`
        ).join('')}
                    </div>
                    <button id="btn-pro" class="btn-primary" style="background:#9d4edd;width:100%;font-size:1rem;padding:14px;">Quiero ser PRO 🚀</button>
                </div>

                <div class="card" style="margin-top:25px;border:1px solid rgba(239,68,68,0.3);">
                    <h3 style="color:var(--red);font-size:1rem;margin-bottom:8px;">Zona de Peligro</h3>
                    <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">
                        Al borrar tu cuenta perderás todos tus movimientos, presupuestos y datos guardados de forma permanente.
                    </p>
                    <button id="btn-eliminar-cuenta" class="btn-primary" style="background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.3);width:100%;">
                        🗑️ Eliminar cuenta
                    </button>
                </div>
            </div>
        `;
        $('#main-content').innerHTML = html;

        // Configurar Perfil Logic
        let selectedPlan = 'mensual';
        window.switchPlan = function(plan) {
            selectedPlan = plan;
            document.getElementById('plan-mensual').classList.toggle('active', plan === 'mensual');
            document.getElementById('plan-anual').classList.toggle('active', plan === 'anual');
            document.getElementById('plan-mensual').style.background = plan === 'mensual' ? '#9d4edd' : '';
            document.getElementById('plan-mensual').style.color = plan === 'mensual' ? 'white' : '';
            document.getElementById('plan-mensual').style.borderColor = plan === 'mensual' ? '#9d4edd' : '';
            document.getElementById('plan-anual').style.background = plan === 'anual' ? '#22c55e' : '';
            document.getElementById('plan-anual').style.color = plan === 'anual' ? 'white' : '';
            document.getElementById('plan-anual').style.borderColor = plan === 'anual' ? '#22c55e' : '';
            document.getElementById('precio-mensual').style.display = plan === 'mensual' ? 'block' : 'none';
            document.getElementById('precio-anual').style.display = plan === 'anual' ? 'block' : 'none';
        };

        $('#btn-config-perfil').onclick = async () => {
            const currentApodo = perfil.apodo || "";
            let nuevoApodo = await promptAsync("Ingresá tu nuevo apodo (máx 15 caracteres):", currentApodo);
            if (nuevoApodo !== null && nuevoApodo.trim() !== "") {
                const cleanApodo = nuevoApodo.trim().substring(0, 15);
                try {
                    await apiPost('perfil/apodo', { apodo: cleanApodo });
                    CACHE.perfil = null; // force reload
                    showToast("Apodo actualizado con éxito ✅");
                    renderMas();
                } catch (e) {
                    showToast("Error al guardar: " + e.message, "error");
                }
            }
        };

        $('#btn-moneda').onclick = () => {
            const currentMoneda = perfil.moneda || "ARS";
            const monedas = [
                { codigo: 'ARS', nombre: 'Peso Argentino', emoji: '🇦🇷' },
                { codigo: 'USD', nombre: 'Dólar', emoji: '🇺🇸' },
                { codigo: 'EUR', nombre: 'Euro', emoji: '🇪🇺' },
                { codigo: 'BRL', nombre: 'Real', emoji: '🇧🇷' },
                { codigo: 'CLP', nombre: 'Peso Chileno', emoji: '🇨🇱' },
                { codigo: 'UYU', nombre: 'Peso Uruguayo', emoji: '🇺🇾' },
            ];

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">💰 Moneda Principal</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;">
                Seleccioná la moneda con la que vas a registrar tus gastos.
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                ${monedas.map(m => `
                    <button class="btn-moneda-opcion ${m.codigo === currentMoneda ? 'selected' : ''}"
                            data-codigo="${m.codigo}"
                            style="
                                display: flex; align-items: center; gap: 12px;
                                padding: 12px 16px; border-radius: 10px; border: none; cursor: pointer;
                                background: ${m.codigo === currentMoneda ? 'rgba(255,165,0,0.15)' : 'rgba(255,255,255,0.05)'};
                                border: 1px solid ${m.codigo === currentMoneda ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};
                                color: var(--text-primary); font-size: 0.95rem; text-align: left; width: 100%;
                            ">
                        <span style="font-size: 1.3rem;">${m.emoji}</span>
                        <span style="flex: 1;">${m.nombre}</span>
                        <span style="color: var(--text-secondary); font-weight: 600; font-size: 0.85rem;">${m.codigo}</span>
                        ${m.codigo === currentMoneda ? '<span style="color: var(--accent);">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
            <div class="modal-actions">
                <button class="btn-secondary modal-close" style="width: 100%;">Cancelar</button>
            </div>
        </div>
    `;
            document.body.appendChild(overlay);

            overlay.querySelectorAll('.btn-moneda-opcion').forEach(btn => {
                btn.onclick = async () => {
                    const nuevaMoneda = btn.dataset.codigo;
                    overlay.classList.add('fade-out');
                    setTimeout(() => overlay.remove(), 200);
                    if (nuevaMoneda !== currentMoneda) {
                        try {
                            await apiPost('perfil/moneda', { moneda: nuevaMoneda });
                            CACHE.perfil = null;
                            showToast(`Moneda cambiada a ${nuevaMoneda} ✅`);
                            renderMas();
                        } catch (e) {
                            showToast("Error al guardar: " + e.message, "error");
                        }
                    }
                };
            });

            overlay.querySelector('.modal-close').onclick = () => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 200);
            };
        };

        $('#btn-notif').onclick = async () => {
            const activas = perfil.notificaciones_activas !== 0;
            try {
                await apiPost('perfil/notificaciones', { activas: !activas });
                CACHE.perfil = null;
                showToast(activas ? '🔕 Notificaciones desactivadas' : '🔔 Notificaciones activadas');
                renderMas();
            } catch (e) {
                showToast('Error: ' + e.message, 'error');
            }
        };

        $('#btn-metas').onclick = () => {
            navigate('metas');
        };

        $('#btn-bancos').onclick = () => {
            navigate('bancos');
        };

        $('#btn-categorias').onclick = () => {
            navigate('categorias');
        };

        $('#btn-dolar').onclick = () => {
            navigate('dolar');
        };

        $('#btn-exportar').onclick = async () => {
            if (!perfil.es_pro) {
                showToast('🔒 Función exclusiva para PRO. ¡Pasate a PRO para exportar a Excel!', 'error');
                return;
            }
            try {
                showToast('📊 Generando Excel...');
                const response = await fetch('/api/exportar/excel', {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                if (!response.ok) throw new Error('Error al exportar');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'manguito_movimientos.xlsx';
                a.click();
                URL.revokeObjectURL(url);
                showToast('✅ Excel descargado', 'success');
            } catch (e) {
                showToast('Error: ' + e.message, 'error');
            }
        };

        $('#btn-modo-pareja').onclick = () => {
            if (!perfil.es_pro) {
                showToast('🔒 Función exclusiva para PRO. ¡Pasate a PRO para usar el Modo Pareja!', 'error');
                return;
            }
            showToast('👫 Modo Pareja: próximamente disponible desde la web. Usá /pareja en Telegram por ahora.', 'success');
        };

        $('#btn-pro').onclick = async () => {
            try {
                showToast('Generando link de pago...');
                const data = await apiPost('pago/crear-preferencia', { plan: selectedPlan });
                window.open(data.url, '_blank');
            } catch (e) {
                showToast('Error al generar el pago: ' + e.message, 'error');
            }
        };

        $('#btn-eliminar-cuenta').onclick = () => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content" style="text-align: center;">
                    <h3 class="modal-title" style="color:var(--red);">🗑️ Borrar cuenta</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        <b>¿Estás cien por ciento seguro?</b><br><br>
                        Esta acción borrará tus datos y movimientos permanentemente. No se puede deshacer.
                    </p>
                    <div class="modal-actions">
                        <button class="btn-secondary modal-cancel" style="flex:1">Cancelar</button>
                        <button class="btn-primary modal-confirm" style="flex:1; background:#e74c3c;">Sí, borrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('.modal-cancel').onclick = () => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 200);
            };

            overlay.querySelector('.modal-confirm').onclick = async () => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 200);
                try {
                    await apiDelete('perfil/cuenta');
                    showToast('Cuenta eliminada con éxito.', 'success');
                    setTimeout(() => {
                        logout();
                    }, 1500);
                } catch (e) {
                    showToast('Error al borrar la cuenta: ' + e.message, 'error');
                }
            };
        };

    } catch (e) {
        $('#main-content').innerHTML = errorState(e.message);
    }
}

// ── PAGE: BANCOS ────────────────────────────────────

function renderBancos() {
    const guias = {
        mp: {
            nombre: 'MercadoPago',
            emoji: '💙',
            pasos: [
                'Abrí la app de <b>Mercado Pago</b> en tu celular',
                'En la pantalla de inicio, tocá <b>"Ir a movimientos"</b>',
                'Arriba tocá <b>"Consultar todo"</b> para ver todos los movimientos',
                'Tocá los <b>3 puntos ⋯</b> (arriba a la derecha)',
                'Seleccioná <b>"Generar Resumen de Cuenta"</b>',
                'Elegí el <b>rango de fechas</b> y descargá el archivo',
                'Se descarga un <b>CSV</b> → subilo acá abajo 👇'
            ],
            alt: '💻 <b>Desde la web:</b> Ingresá a <a href="https://www.mercadopago.com.ar/activities" target="_blank" style="color:var(--accent);">mercadopago.com.ar/activities</a> → Movimientos → ⋯ → Generar Resumen'
        },
        uala: {
            nombre: 'Ualá',
            emoji: '💜',
            pasos: [
                'Abrí la app de <b>Ualá</b>',
                'Al lado de "Caja de Ahorro", tocá <b>"Ver cuenta"</b>',
                'Entrá en <b>"Documentos de la cuenta"</b>',
                'Seleccioná <b>"Resúmenes"</b>',
                'Elegí el <b>mes</b> que querés exportar (se descargan por mes)',
                'Se descarga un archivo → subilo acá abajo 👇'
            ],
            alt: '💻 <b>Desde la web:</b> Ingresá a <a href="https://app.uala.com.ar" target="_blank" style="color:var(--accent);">app.uala.com.ar</a> → Cuenta → Documentos → Resúmenes'
        },
        naranja: {
            nombre: 'Naranja X',
            emoji: '🧡',
            pasos: [
                'Abrí la app de <b>Naranja X</b>',
                'Andá a <b>"Resumen"</b> o <b>"Movimientos"</b>',
                'Tocá <b>"Descargar resumen"</b> arriba a la derecha',
                'Elegí formato <b>CSV</b> y el <b>periodo</b>',
                'Se descarga el archivo → subilo acá 👇'
            ],
            alt: '💻 <b>Desde la web:</b> Ingresá a <a href="https://www.naranjax.com" target="_blank" style="color:var(--accent);">naranjax.com</a> → Resumen → Descargar'
        },
        generico: {
            nombre: 'Formato Genérico',
            emoji: '📋',
            pasos: [
                'Tu CSV debe tener columnas: <b>Fecha, Descripción, Monto</b> (mínimo)',
                'Los montos <b>negativos</b> se importan como gastos',
                'Los montos <b>positivos</b> se importan como ingresos',
                'El formato de fecha puede ser <b>DD/MM/YYYY</b> o <b>YYYY-MM-DD</b>',
                'Subí el archivo CSV acá abajo 👇'
            ],
            alt: ''
        }
    };

    const html = `
        <div class="page-enter">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
                <button class="icon-btn" onclick="navigate('mas')" style="background:var(--bg-glass);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                </button>
                <h2 class="section-title" style="margin:0;">Importar Movimientos</h2>
            </div>

            <div class="card" style="background: rgba(5, 150, 105, 0.05); border: 1px solid rgba(5, 150, 105, 0.2); padding: 16px;">
                <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">
                    <b style="color: var(--green);">🛡️ 100% Seguro:</b> Manguito <b>nunca</b> te pide contraseñas. Solo subís el archivo CSV/Excel que descargás de tu banco y nosotros lo procesamos.
                </p>
            </div>
            
            <div class="card" style="padding: 24px 20px;">
                <h3 style="margin-bottom: 12px; font-size: 15px; color: var(--text-primary);">1. Seleccioná tu entidad</h3>
                <select id="entidad-banco" class="form-input" style="margin-bottom: 16px; appearance: auto; background: var(--bg-primary);">
                    <option value="mp">💙 MercadoPago</option>
                    <option value="uala">💜 Ualá</option>
                    <option value="naranja">🧡 Naranja X</option>
                    <option value="generico">📋 Formato Genérico (CSV)</option>
                </select>

                <div id="guia-pasos" style="background:var(--bg-primary);border-radius:12px;padding:16px;margin-bottom:20px;">
                </div>

                <h3 style="margin-bottom: 12px; font-size: 15px; color: var(--text-primary);">3. Subí tu archivo</h3>
                <input type="file" id="file-banco" accept=".csv, .xlsx, .xls" style="display:none;" onchange="procesarArchivoBanco(event)">
                <button class="btn-primary" style="width:100%; display:flex; justify-content:center; align-items:center; gap:8px;" onclick="document.getElementById('file-banco').click()">
                    <span style="font-size:18px;">📄</span> Seleccionar archivo CSV / Excel
                </button>
                <div id="import-result" style="margin-top:16px;"></div>
            </div>
        </div>
    `;
    $('#main-content').innerHTML = html;

    function mostrarGuia(banco) {
        const g = guias[banco];
        const container = document.getElementById('guia-pasos');
        container.innerHTML = `
            <h4 style="font-size:14px;color:var(--text-primary);margin-bottom:12px;">${g.emoji} Cómo exportar de ${g.nombre}:</h4>
            <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;">
                ${g.pasos.map(p => `<li style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${p}</li>`).join('')}
            </ol>
            ${g.alt ? `<div style="margin-top:12px;padding:10px;background:rgba(255,165,0,0.08);border-radius:8px;font-size:12px;color:var(--text-secondary);line-height:1.5;">${g.alt}</div>` : ''}
        `;
    }

    mostrarGuia('mp');
    document.getElementById('entidad-banco').onchange = (e) => mostrarGuia(e.target.value);
}

window.procesarArchivoBanco = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const resultDiv = document.getElementById('import-result');
    resultDiv.innerHTML = '<p style="color:var(--accent);font-size:13px;">⏳ Analizando archivo...</p>';
    
    try {
        const text = await file.text();
        let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length < 2) {
            resultDiv.innerHTML = '<p style="color:var(--red);font-size:13px;">❌ El archivo está vacío o no tiene datos válidos.</p>';
            return;
        }

        // MercadoPago CSV: first lines are summary (INITIAL_BALANCE,...)
        // Find the real header row that contains column names
        let headerIdx = 0;
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const lower = lines[i].toLowerCase();
            if (lower.includes('release_date') || lower.includes('transaction_') || 
                lower.includes('fecha') || lower.includes('monto') || lower.includes('importe')) {
                headerIdx = i;
                break;
            }
        }

        const sep = lines[headerIdx].includes(';') ? ';' : ',';
        
        // Smart CSV split that respects quoted fields (MP uses quotes with commas inside like "100.000,00")
        function splitCSV(line, separator) {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let ch of line) {
                if (ch === '"') { inQuotes = !inQuotes; continue; }
                if (ch === separator && !inQuotes) { result.push(current.trim()); current = ''; continue; }
                current += ch;
            }
            result.push(current.trim());
            return result;
        }

        const headers = splitCSV(lines[headerIdx], sep).map(h => h.toLowerCase());
        
        // Detect columns with broader matching (includes MercadoPago english names)
        const colFecha = headers.findIndex(h => h.includes('fecha') || h.includes('release_date') || h.includes('date'));
        const colDesc = headers.findIndex(h => h.includes('transaction_type') || h.includes('descri') || h.includes('detalle') || h.includes('concepto'));
        const colMonto = headers.findIndex(h => h.includes('transaction_net_amount') || h.includes('net_amount') || h.includes('monto') || h.includes('importe') || h.includes('amount') || h.includes('valor'));
        
        if (colMonto === -1) {
            resultDiv.innerHTML = '<p style="color:var(--red);font-size:13px;">❌ No se encontró la columna de monto. Columnas detectadas: ' + headers.join(', ') + '</p>';
            return;
        }

        let importados = 0;
        let errores = 0;
        const entidad = document.getElementById('entidad-banco').options[document.getElementById('entidad-banco').selectedIndex].text;

        // Progress indicator
        const total = lines.length - headerIdx - 1;
        resultDiv.innerHTML = `<p style="color:var(--accent);font-size:13px;">⏳ Importando 0/${total} movimientos...</p>`;

        for (let i = headerIdx + 1; i < lines.length; i++) {
            const cols = splitCSV(lines[i], sep);
            if (cols.length <= colMonto) continue;

            // Parse amount: handle "100.000,00" format (dot=thousands, comma=decimal)
            let montoRaw = cols[colMonto];
            // If format is like "100.000,00" (AR locale), convert to 100000.00
            if (montoRaw.includes('.') && montoRaw.includes(',')) {
                montoRaw = montoRaw.replace(/\./g, '').replace(',', '.');
            } else if (montoRaw.includes(',') && !montoRaw.includes('.')) {
                montoRaw = montoRaw.replace(',', '.');
            }
            montoRaw = montoRaw.replace(/[$ ]/g, '').trim();
            const monto = parseFloat(montoRaw);
            if (isNaN(monto) || monto === 0) continue;

            const desc = colDesc >= 0 && cols[colDesc] ? cols[colDesc].substring(0, 60) : entidad;
            const tipo = monto > 0 ? 'ingreso' : 'egreso';
            
            try {
                await apiPost('movimientos', {
                    tipo: tipo,
                    monto: Math.abs(monto),
                    categoria: 'Importado',
                    descripcion: desc
                });
                importados++;
                // Update progress every 5 items
                if (importados % 5 === 0) {
                    resultDiv.innerHTML = `<p style="color:var(--accent);font-size:13px;">⏳ Importando ${importados}/${total} movimientos...</p>`;
                }
            } catch {
                errores++;
            }
        }

        CACHE = {};
        resultDiv.innerHTML = `
            <div class="card" style="background:rgba(5,150,105,0.08);border:1px solid rgba(5,150,105,0.3);padding:16px;text-align:center;">
                <div style="font-size:2rem;margin-bottom:8px;">✅</div>
                <h4 style="color:var(--green);margin-bottom:4px;">¡Importación completa!</h4>
                <p style="font-size:13px;color:var(--text-secondary);">${importados} movimiento${importados !== 1 ? 's' : ''} importado${importados !== 1 ? 's' : ''} exitosamente${errores > 0 ? ` (${errores} con error)` : ''}</p>
                <button class="btn-primary" onclick="navigate('movimientos')" style="margin-top:12px;width:100%;">Ver movimientos →</button>
            </div>
        `;
        showToast(`✅ ${importados} movimientos importados`, 'success');

    } catch (e) {
        resultDiv.innerHTML = `<p style="color:var(--red);font-size:13px;">❌ Error al procesar: ${e.message}</p>`;
    }
}

// ── ERROR STATE ─────────────────────────────────────

function errorState(msg) {
    return `
        <div class="empty-state page-enter">
            <span class="empty-emoji">😵</span>
            <h3 class="empty-title">Algo salió mal</h3>
            <p class="empty-desc">${msg}</p>
        </div>
    `;
}

// ── EVENT LISTENERS ─────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Enter key on login
    $('#input-token').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('#btn-login').click();
    });

    // Nav buttons
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigate(btn.dataset.page));
    });

    // Top bar buttons
    $('#btn-refresh').addEventListener('click', () => {
        CACHE = {};
        const page = currentPage;
        currentPage = '';
        navigate(page);
        showToast('Datos actualizados');
    });

    $('#btn-logout').addEventListener('click', logout);

    // Check auth
    checkAuth();

    // Check for forced updates
    checkForUpdates();
});

// Remove trailing function/brace if added prematurely
window.navigate = navigate;

// ── SERVICE WORKER ──────────────────────────────────

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) return;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New update available
                        showToast("Nueva versión disponible. Recargando...", "success");
                        setTimeout(() => window.location.reload(), 1500);
                    }
                };
            };
        }).catch(() => { });
    });
}
