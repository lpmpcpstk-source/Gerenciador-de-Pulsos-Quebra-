/* ═══════════════════════════════════════════════════════════════
   UX.JS — Melhorias de experiência do usuário — v5.1
   Stickfran — chão de fábrica: confirmações, loading, feedback
═══════════════════════════════════════════════════════════════ */
'use strict';

const UX = (() => {

  /* ── Modal de Confirmação ─────────────────────────────────── */
  let _confirmResolve = null;

  const _injectModal = () => {
    if (document.getElementById('ux-modal')) return;
    const el = document.createElement('div');
    el.innerHTML = `
      <div id="ux-modal" style="display:none;position:fixed;inset:0;z-index:8000;align-items:center;justify-content:center;padding:16px">
        <div id="ux-modal-bd" style="position:absolute;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px)"></div>
        <div id="ux-modal-box" style="position:relative;z-index:1;background:var(--bg2);border:1px solid var(--bd-md);border-radius:var(--r2);max-width:360px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.7);overflow:hidden;animation:popIn .25s cubic-bezier(.34,1.56,.64,1)">
          <div id="ux-modal-head" style="padding:14px 20px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:10px">
            <span id="ux-modal-icon" style="font-size:20px"></span>
            <span id="ux-modal-title" style="font-family:var(--f-cond);font-size:13px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:var(--t-hi)"></span>
          </div>
          <div id="ux-modal-body" style="padding:18px 20px;font-size:13px;color:var(--t-md);line-height:1.6"></div>
          <div style="padding:14px 20px;border-top:1px solid var(--bd);display:flex;gap:10px;justify-content:flex-end">
            <button id="ux-modal-cancel" class="btn btn-sec" type="button" style="padding:9px 18px;font-size:12px">Cancelar</button>
            <button id="ux-modal-ok"     class="btn btn-prim" type="button" style="padding:9px 18px;font-size:12px">Confirmar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el.firstElementChild);

    document.getElementById('ux-modal-bd').addEventListener('click', () => _close(false));
    document.getElementById('ux-modal-cancel').addEventListener('click', () => _close(false));
    document.getElementById('ux-modal-ok').addEventListener('click',     () => _close(true));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') _close(false);
      if (e.key === 'Enter' && document.getElementById('ux-modal').style.display !== 'none') {
        e.preventDefault(); _close(true);
      }
    });
  };

  const _close = (result) => {
    const modal = document.getElementById('ux-modal');
    if (modal) modal.style.display = 'none';
    if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
  };

  /**
   * Exibe diálogo de confirmação.
   * @param {object} opts - {title, message, icon, confirmLabel, danger}
   * @returns {Promise<boolean>}
   */
  const confirm = (opts = {}) => {
    _injectModal();
    const modal = document.getElementById('ux-modal');
    document.getElementById('ux-modal-icon').textContent  = opts.icon    || '⚠️';
    document.getElementById('ux-modal-title').textContent = opts.title   || 'Confirmar Ação';
    document.getElementById('ux-modal-body').innerHTML    = opts.message || 'Tem certeza?';
    const okBtn = document.getElementById('ux-modal-ok');
    okBtn.textContent = opts.confirmLabel || 'Confirmar';
    okBtn.className   = 'btn ' + (opts.danger ? 'btn-prim' : 'btn-teal');
    if (opts.danger) okBtn.style.background = 'var(--red)';
    else okBtn.style.background = '';
    modal.style.display = 'flex';
    // Foca o botão cancelar por padrão (segurança industrial)
    setTimeout(() => document.getElementById('ux-modal-cancel').focus(), 50);
    return new Promise(res => { _confirmResolve = res; });
  };

  /* ── Loading Overlay em botão ─────────────────────────────── */
  /**
   * Coloca botão em estado loading e retorna função para restaurar.
   */
  const btnLoading = (btn, loadingText = '...') => {
    if (!btn) return () => {};
    const orig = { html: btn.innerHTML, disabled: btn.disabled };
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> ${loadingText}`;
    return () => {
      btn.innerHTML  = orig.html;
      btn.disabled   = orig.disabled;
    };
  };

  /* ── Skeleton loading para tabelas ───────────────────────── */
  const showSkeleton = (containerId, cols = 4, rows = 5) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cells = Array(cols).fill('<td><div style="height:12px;background:var(--bg4);border-radius:4px;animation:pulse 1.2s ease infinite"></div></td>').join('');
    const trs   = Array(rows).fill(`<tr>${cells}</tr>`).join('');
    el.innerHTML = `<div class="tbl-wrap"><table class="tbl"><tbody>${trs}</tbody></table></div>`;
  };

  /* ── Inicialização de atalhos de teclado ─────────────────── */
  const initKeyboard = () => {
    document.addEventListener('keydown', e => {
      // Ctrl+1..5 → navegar abas
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 5) {
          const tabs = document.querySelectorAll('.nav-tab:not([data-admin])');
          if (tabs[n - 1]) { e.preventDefault(); tabs[n - 1].click(); }
        }
        // Ctrl+F → foca busca de fichas
        if (e.key === 'f' || e.key === 'F') {
          const s = document.getElementById('fichas-search');
          if (s) { e.preventDefault(); s.focus(); s.select(); }
        }
      }
    });
  };

  /* ── Touch feedback (ripple) em botões ───────────────────── */
  const initRipple = () => {
    document.addEventListener('pointerdown', e => {
      const btn = e.target.closest('.btn,.fpill,.nav-tab,.hist-item');
      if (!btn) return;
      const rect   = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const size   = Math.max(rect.width, rect.height);
      circle.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        border-radius:50%;background:rgba(255,255,255,.15);
        top:${e.clientY - rect.top - size/2}px;
        left:${e.clientX - rect.left - size/2}px;
        transform:scale(0);pointer-events:none;
        animation:rippleAnim .5s ease-out forwards;
        z-index:0;
      `;
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });

    // Injeta keyframes se não existir
    if (!document.getElementById('ux-ripple-style')) {
      const s = document.createElement('style');
      s.id = 'ux-ripple-style';
      s.textContent = '@keyframes rippleAnim{to{transform:scale(3);opacity:0}}';
      document.head.appendChild(s);
    }
  };

  /* ── Toast com ícone automático ──────────────────────────── */
  const ICONS = { ok:'✅', err:'❌', warn:'⚠️', inf:'ℹ️' };

  /**
   * Substitui UI.toast para adicionar ícone automático.
   * Chama internamente UI.toast.
   */
  const toast = (msg, type = 'inf', duration = 3000) => {
    const icon = ICONS[type] || ICONS.inf;
    // Verifica se msg já tem ícone
    const text = /^[✅❌⚠️ℹ️📊🔄💾🗑️➕✕🔍📋]/.test(msg) ? msg : `${icon} ${msg}`;
    UI.toast(text, type, duration);
  };

  /* ── Status bar: info de última sincronização ────────────── */
  const updateSyncBadge = (status) => {
    const el = document.getElementById('db-indicator');
    if (!el) return;
    el.className = 'db-indicator dbi-' + status;
    const labels = { online:'ONLINE', offline:'OFFLINE', checking:'SINCRONIZANDO', error:'ERRO DB' };
    const dots   = { online:'●', offline:'○', checking:'◌', error:'●' };
    el.innerHTML = `<span class="db-dot">${dots[status]||'○'}</span><span class="db-lbl">${labels[status]||status.toUpperCase()}</span>`;
  };

  /* ── Auto-focus em campos de formulário ──────────────────── */
  const focusFirstField = (formCardId) => {
    const card  = document.getElementById(formCardId);
    if (!card) return;
    const input = card.querySelector('input:not([type=hidden]):not([disabled])');
    if (input) setTimeout(() => { input.focus(); }, 80);
  };

  /* ── Scroll suave até elemento ───────────────────────────── */
  const scrollTo = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Highlight de linha de tabela ao salvar ──────────────── */
  const flashRow = (rowEl, type = 'ok') => {
    if (!rowEl) return;
    const colors = {
      ok  : 'rgba(0,212,106,.15)',
      err : 'rgba(232,25,44,.15)',
      info: 'rgba(0,170,255,.1)',
    };
    const orig = rowEl.style.background;
    rowEl.style.transition = 'background .4s ease';
    rowEl.style.background = colors[type] || colors.ok;
    setTimeout(() => {
      rowEl.style.background = orig;
      setTimeout(() => rowEl.style.transition = '', 400);
    }, 1200);
  };

  /* ── Inicialização geral ─────────────────────────────────── */
  const init = () => {
    _injectModal();
    initKeyboard();
    initRipple();
  };

  /* ── Aliases e funções extras usadas no cadastros.js ──────── */

  /** Alias de showSkeleton (compatibilidade) */
  const skeleton = (containerId, cols = 4, rows = 5) =>
    showSkeleton(containerId, cols, rows);

  /** Feedback visual em botão de exportação */
  const exportFeedback = (btn) => {
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ OK';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1800);
  };

  /** Destaca o card com um pulso de cor */
  const pulse = (el) => {
    if (!el) return;
    el.style.transition = 'box-shadow .3s ease';
    el.style.boxShadow  = '0 0 0 3px rgba(0,204,153,.5)';
    setTimeout(() => { el.style.boxShadow = ''; }, 600);
  };

  /** Scroll suave até o primeiro campo com erro */
  const scrollToFirstError = (formEl) => {
    if (!formEl) return;
    const errField = formEl.querySelector('.has-err input, .has-err select');
    if (errField) errField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /**
   * Restaura botão após loading (guarda estado internamente via WeakMap).
   * Compatível com btnLoading — pode ser chamado após o restore retornado.
   */
  const _btnStateMap = new WeakMap();
  const btnDone = (btn) => {
    if (!btn) return;
    const state = _btnStateMap.get(btn);
    if (state) { btn.innerHTML = state.html; btn.disabled = state.disabled; _btnStateMap.delete(btn); }
  };

  /** Substitui btnLoading para salvar estado e permitir btnDone */
  const btnLoadingEx = (btn, loadingText = '...') => {
    if (!btn) return () => {};
    _btnStateMap.set(btn, { html: btn.innerHTML, disabled: btn.disabled });
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> ${loadingText}`;
    return () => btnDone(btn);
  };

  /** Destaca visualmente a última linha inserida numa tabela */
  const highlightNewRow = (containerId) => {
    const el  = document.getElementById(containerId);
    if (!el) return;
    const tbl = el.querySelector('table');
    if (!tbl) return;
    const rows = tbl.querySelectorAll('tbody tr');
    if (!rows.length) return;
    const row = rows[0]; // nova linha vai ao topo
    row.style.transition  = 'background .4s ease';
    row.style.background  = 'rgba(0,204,153,.15)';
    setTimeout(() => { row.style.background = ''; setTimeout(() => row.style.transition = '', 400); }, 1400);
  };

  return {
    confirm, btnLoading: btnLoadingEx, btnDone, showSkeleton, skeleton,
    initKeyboard, initRipple, toast, updateSyncBadge, focusFirstField,
    scrollTo, flashRow, exportFeedback, pulse, scrollToFirstError, highlightNewRow, init,
  };
})();
