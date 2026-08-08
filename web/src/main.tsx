import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ── Global error overlay ──────────────────────────────────────────────────────
function showOverlay(title: string, detail: string) {
  const existing = document.getElementById('nexo-error-overlay');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'nexo-error-overlay';
  div.style.cssText = [
    'position:fixed','inset:0','z-index:9999',
    'background:#070B14','display:flex','align-items:center',
    'justify-content:center','padding:24px','font-family:sans-serif',
  ].join(';');

  // Static chrome only — never interpolate dynamic strings into innerHTML.
  // `title`/`detail` can contain attacker-influenced text (parsed email
  // content, server error bodies), so they are inserted via textContent.
  const card = document.createElement('div');
  card.style.cssText = 'background:#0F172A;border:1px solid #EF4444;border-radius:20px;padding:28px;max-width:420px;width:100%;text-align:center';

  const emoji = document.createElement('div');
  emoji.style.cssText = 'font-size:48px;margin-bottom:12px';
  emoji.textContent = '⚠️';

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'color:#F8FAFC;font-size:18px;font-weight:700;margin-bottom:8px';
  titleEl.textContent = title;

  const detailEl = document.createElement('div');
  detailEl.style.cssText = 'color:#94A3B8;font-size:12px;margin-bottom:20px;background:#070B14;padding:12px;border-radius:10px;text-align:left;word-break:break-all;white-space:pre-wrap;max-height:200px;overflow:auto';
  detailEl.textContent = detail;

  const btn = document.createElement('button');
  btn.style.cssText = 'padding:12px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#22C55E,#16A34A);color:#fff;font-size:14px;font-weight:700;cursor:pointer';
  btn.textContent = 'Recargar';
  btn.addEventListener('click', () => { div.remove(); location.reload(); });

  card.append(emoji, titleEl, detailEl, btn);
  div.appendChild(card);
  document.body.appendChild(div);
}

// Genuine stale-chunk / dynamic-import failure after a new deploy → reload.
// Deliberately NARROW: a bare "Script error." (cross-origin, e.g. a browser
// extension) or a generic "Failed to fetch" (any network blip) must NOT trigger
// a reload — that caused spurious reload loops.
function isChunkLoadError(_msg: unknown, err: Error | null | undefined): boolean {
  const m = err?.message ?? '';
  if (err?.name === 'ChunkLoadError') return true;
  if (/dynamically imported module/i.test(m)) return true;
  if (/importing a module script failed/i.test(m)) return true;
  if (/error loading dynamically imported module/i.test(m)) return true;
  return false;
}

// Benign errors that should never surface a blocking overlay.
function isBenignError(msg: unknown, err: Error | null | undefined): boolean {
  const s = `${String(msg)} ${err?.message ?? ''}`;
  if (/ResizeObserver loop/i.test(s)) return true;
  if (String(msg) === 'Script error.') return true; // cross-origin, no detail
  return false;
}

let autoReloading = false;
function safeReload() {
  if (autoReloading) return;
  // Prevent infinite reload loop: allow at most 2 auto-reloads per session
  const reloads = parseInt(sessionStorage.getItem('_chunk_reloads') ?? '0', 10);
  if (reloads >= 2) return; // give up and let the overlay show
  sessionStorage.setItem('_chunk_reloads', String(reloads + 1));
  autoReloading = true;
  window.location.reload();
}

window.onerror = (_msg, _src, _line, _col, error) => {
  if (isChunkLoadError(_msg, error)) { safeReload(); return true; }
  // Non-fatal window errors (extensions, ResizeObserver, stray rejections)
  // must not blank the app with a full-screen overlay — just log them.
  console.error('window.onerror:', _msg, error);
  return false;
};

window.addEventListener('unhandledrejection', (e) => {
  const err = e.reason;
  if (isChunkLoadError(err?.message, err instanceof Error ? err : null)) { safeReload(); return; }
  if (isBenignError(err?.message, err instanceof Error ? err : null)) return;
  // Log unhandled rejections but don't hijack the whole screen; the React
  // ErrorBoundary handles genuine render failures with a recoverable UI.
  console.error('unhandledrejection:', err);
});

// ── React error boundary ──────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidCatch(e: Error, info: React.ErrorInfo) {
    // Log for diagnostics; do NOT paint the global overlay — render a
    // recoverable fallback instead so one bad screen doesn't nuke the app.
    console.error('Render error:', e, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', background:'#0A0C0F', color:'#F7F9FC',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:24, gap:16, fontFamily:'system-ui,sans-serif', textAlign:'center' }}>
          <div style={{ fontSize:44 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700 }}>Algo salió mal</div>
          <div style={{ fontSize:13, color:'#94A3B8', maxWidth:320 }}>
            Ocurrió un error al mostrar esta pantalla. Puedes reintentar sin perder tu sesión.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => this.setState({ error: null })}
              style={{ padding:'12px 22px', borderRadius:12, border:'none',
                background:'linear-gradient(135deg,#31D67B,#22A85A)', color:'#062',
                fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding:'12px 22px', borderRadius:12, border:'1px solid #243650',
                background:'transparent', color:'#94A3B8', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Auto-update (definitive) ──────────────────────────────────────────────────
// Two independent mechanisms so updates work on ALL devices including iOS:
//
// 1. version.json polling (primary): each build writes /version.json with a
//    unique timestamp. This file is NEVER cached (NetworkOnly in SW). On every
//    app open and tab-focus we fetch it and compare against localStorage. If the
//    server version is newer → reload. This works even when the SW lifecycle
//    is stuck or the browser refuses to update the SW.
//
// 2. SW controllerchange (secondary): when the service worker does update
//    (skipWaiting + clientsClaim), we also trigger a reload here.

const ORIA_VERSION_KEY = 'oria_deployed_v';
let reloading = false;

// Expose so SettingsScreen can call it for the manual "check for updates" button
(window as Window & { __oriaCheckUpdate?: () => Promise<void> }).__oriaCheckUpdate = undefined;

function showUpdateBanner() {
  if (reloading) return;
  reloading = true;

  // Remove any existing banner
  document.getElementById('oria-update-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'oria-update-banner';
  banner.style.cssText = [
    'position:fixed','top:0','left:0','right:0','z-index:99999',
    'background:linear-gradient(90deg,#111419,#0A0C0F)',
    'border-bottom:2px solid rgba(0,229,160,0.5)',
    'padding:14px 20px',
    'padding-top:calc(14px + env(safe-area-inset-top))',
    'display:flex','align-items:center','gap:12px',
    'font-family:system-ui,sans-serif','box-shadow:0 4px 24px rgba(0,0,0,0.5)',
  ].join(';');
  banner.innerHTML = `
    <span style="font-size:20px">✨</span>
    <div style="flex:1">
      <div style="color:#00E5A0;font-size:13px;font-weight:700">Nueva versión disponible</div>
      <div style="color:#94A3B8;font-size:11px;margin-top:1px">Toca Actualizar para obtener las últimas mejoras</div>
    </div>
    <button id="oria-update-btn"
      style="background:linear-gradient(135deg,#00E5A0,#00B87A);border:none;border-radius:10px;
             padding:8px 16px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
      Actualizar
    </button>
  `;
  document.body.prepend(banner);

  document.getElementById('oria-update-btn')?.addEventListener('click', () => {
    banner.innerHTML = `<span style="color:#94A3B8;font-size:13px;margin:auto">Aplicando actualización…</span>`;
    setTimeout(() => window.location.reload(), 300);
  });

  // Auto-reload after 60s if user ignores the banner (app in background, etc.)
  setTimeout(() => {
    if (!document.getElementById('oria-update-banner')) return;
    window.location.reload();
  }, 60_000);
}

// Mechanism 1 — version.json (works on ALL platforms, no SW required)
async function checkVersionJson() {
  try {
    const res = await fetch('/version.json?_=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return;
    const { v } = await res.json() as { v: number };
    const stored = localStorage.getItem(ORIA_VERSION_KEY);
    if (stored && stored !== String(v)) {
      // A new build was deployed — update stored version and reload
      localStorage.setItem(ORIA_VERSION_KEY, String(v));
      showUpdateBanner();
    } else {
      localStorage.setItem(ORIA_VERSION_KEY, String(v));
    }
  } catch {
    // Offline or network error — skip silently
  }
}

// Expose for manual "check for updates" trigger in SettingsScreen
(window as Window & { __oriaCheckUpdate?: () => Promise<void> }).__oriaCheckUpdate = checkVersionJson;

checkVersionJson();                                        // on every app open
setInterval(checkVersionJson, 30_000);                    // every 30 s while open
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkVersionJson(); // on tab focus
});

// Mechanism 2 — SW controllerchange (belt-and-suspenders)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', showUpdateBanner);

  // Force SW to check for updates immediately (bypasses 24h browser rule)
  navigator.serviceWorker.ready
    .then(reg => reg.update())
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
