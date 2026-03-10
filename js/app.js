/**
 * app.js — Orquestrador principal v5.1 (UX/UI Industrial Edition)
 * Novidades: cadastros base, filtros na consulta, campos v5 nas fichas
 */
'use strict';

const App = {

  editId: null,
  _fichasFilter:       '',
  _filterEspulaId:     '',
  _filterTipoFioId:    '',

  async init() {
    // v5.1 — inicializar melhorias de UX
    if (typeof UX !== 'undefined') UX.init();

    Theme.init();
    DbFichas.init();

    DB_STATE.on((status, err) => {
      UI.dbStatus.set(status, err);
      // v5.1 — banner de conexão visual
      if (typeof UX !== 'undefined') UX.updateSyncBadge(status);
      if (status !== 'online') return;
      const fresh = Storage.load();
      const sameIds = fresh.length === Fichas.data.length &&
                      fresh.every((f, i) => f.id === Fichas.data[i]?.id);
      if (!sameIds) {
        Fichas.data = fresh;
        this._renderFichasTable();
        FichaSelect.update(Fichas.data);
        UI.setBadge('badge-fichas', Fichas.data.length);
      }
    });

    await Fichas.load();

    // Cadastros Base — carrega antes de popular selects
    await DbBase.TiposFio.load();
    await DbBase.Espulas.load();

    UI.fusos.build('fusos-grid');
    FichaSelect.init('ficha-sel-wrap');
    FichaSelect.update(Fichas.data);
    FichaSelect.onChange = () => this._updatePreview();

    this._populateFichaSelects();
    this._populateFilterSelects();

    this._renderFichasTable();
    UI.setBadge('badge-fichas', Fichas.data.length);
    History.render();
    await Users.init();
    Users.renderTabela();
    UI.setBadge('badge-users', Users.getAtivos().length);
    await Cadastros.init();
    this._bindEvents();
    this._bindFormPreview();

    UI.switchTab('consulta');
  },

  // Popula selects de tipo_fio e espula_id no formulário de fichas
  _populateFichaSelects() {
    const selTF = document.getElementById('f-tipo-fio');
    const selEsp = document.getElementById('f-espula-id');
    if (selTF) {
      const cur = selTF.value;
      selTF.innerHTML = '<option value="">— nenhum —</option>' +
        DbBase.TiposFio.getAtivos().map(t =>
          `<option value="${UI.esc(t.id)}">${UI.esc(t.nome)} ${t.titulo ? '('+UI.esc(t.titulo)+')' : ''}</option>`
        ).join('');
      if (cur) selTF.value = cur;
    }
    if (selEsp) {
      const cur = selEsp.value;
      selEsp.innerHTML = '<option value="">— nenhum —</option>' +
        DbBase.Espulas.getAtivos().map(e =>
          `<option value="${UI.esc(e.id)}">${UI.esc(e.nome)}</option>`
        ).join('');
      if (cur) selEsp.value = cur;
    }
  },

  // Popula selects de filtro na aba Consulta
  _populateFilterSelects() {
    const selFiltEsp = document.getElementById('filtro-espula');
    const selFiltTF  = document.getElementById('filtro-tipo-fio');
    if (selFiltEsp) {
      selFiltEsp.innerHTML = '<option value="">Todas as espulas</option>' +
        DbBase.Espulas.getAtivos().map(e =>
          `<option value="${UI.esc(e.id)}">${UI.esc(e.nome)}</option>`
        ).join('');
    }
    if (selFiltTF) {
      selFiltTF.innerHTML = '<option value="">Todos os fios</option>' +
        DbBase.TiposFio.getAtivos().map(t =>
          `<option value="${UI.esc(t.id)}">${UI.esc(t.nome)}${t.titulo ? ' ('+UI.esc(t.titulo)+')' : ''}</option>`
        ).join('');
    }
  },

  _renderFichasTable() {
    Fichas.renderTable('fichas-table', this._fichasFilter, this._filterEspulaId, this._filterTipoFioId);
  },

  _bindEvents() {
    // Login
    document.getElementById('btn-login').addEventListener('click', () => this.doLogin());
    document.getElementById('inp-pass').addEventListener('keydown', e => { if (e.key === 'Enter') this.doLogin(); });
    document.getElementById('inp-user').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('inp-pass').focus(); });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => this.doLogout());

    // Tabs
    document.querySelectorAll('.nav-tab').forEach(btn =>
      btn.addEventListener('click', () => {
        UI.switchTab(btn.dataset.tab);
        if (btn.dataset.tab === 'fichas' && Auth.isAdmin()) Backup.atualizarContagem();
        if (btn.dataset.tab === 'usuarios')  { Users.renderTabela(); UI.setBadge('badge-users', Users.getAtivos().length); }
        if (btn.dataset.tab === 'cadastros') Cadastros._updateBadges();
      })
    );

    // Filtros da aba Consulta
    const filtEsp = document.getElementById('filtro-espula');
    const filtTF  = document.getElementById('filtro-tipo-fio');
    if (filtEsp) filtEsp.addEventListener('change', () => this._applyConsultaFilters());
    if (filtTF)  filtTF.addEventListener('change',  () => this._applyConsultaFilters());

    // Consulta
    document.getElementById('btn-calcular').addEventListener('click', () => this.doCalc());
    document.getElementById('btn-resetar').addEventListener('click',  () => UI.resetConsulta());
    document.getElementById('inp-metros').addEventListener('input',   () => this._updatePreview());
    document.getElementById('inp-metros').addEventListener('keydown', e => { if (e.key === 'Enter') this.doCalc(); });
    document.getElementById('inp-quebra').addEventListener('input',   () => this._updatePreview());

    // Fichas
    document.getElementById('btn-salvar').addEventListener('click', () => this.saveFicha());
    document.getElementById('btn-cancelar').addEventListener('click', () => this.cancelEdit());
    ['f-nome','f-material','f-fios','f-d0','f-dmax','f-pmax','f-mmax','f-espula','f-comp','f-peso-cheia'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.saveFicha(); } });
    });

    // Busca de fichas
    document.getElementById('fichas-search').addEventListener('input', e => {
      this._fichasFilter = e.target.value;
      this._renderFichasTable();
    });

    // Remover toast
    document.getElementById('toasts').addEventListener('click', e => {
      if (e.target.classList.contains('toast')) e.target.remove();
    });

    // Tema
    document.getElementById('btn-theme').addEventListener('click', () => Theme.toggle());

    // ── Exportações — Fichas Técnicas ─────────────────────────
    const _bindExport = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };
    _bindExport('btn-export-fichas-csv', () => Export.fichasCsv());
    _bindExport('btn-export-fichas-pdf', () => Export.fichasPdf());

    // ── Exportações — Cadastros Base ──────────────────────────
    // Botões contextuais: CSV/PDF muda conforme sub-aba ativa
    _bindExport('btn-cad-export-csv', () => {
      if (Cadastros._abaAtiva === 'fio') Export.tiposFioCsv();
      else Export.espulasCsv();
    });
    _bindExport('btn-cad-export-pdf', () => {
      if (Cadastros._abaAtiva === 'fio') Export.tiposFioPdf();
      else Export.espulasPdf();
    });
  },

  _applyConsultaFilters() {
    this._filterEspulaId  = document.getElementById('filtro-espula')?.value  || '';
    this._filterTipoFioId = document.getElementById('filtro-tipo-fio')?.value || '';
    FichaSelect.setFilters(this._filterEspulaId, this._filterTipoFioId);
    this._updatePreview();
    const total    = Fichas.data.length;
    const filtradas = Fichas.filtered(this._filterEspulaId, this._filterTipoFioId).length;
    const badge    = document.getElementById('badge-fichas');
    if (badge) badge.textContent = (this._filterEspulaId || this._filterTipoFioId)
      ? `${filtradas}/${total}` : total;
    // v5.1 — contador de filtros ativos
    const countEl = document.getElementById('filtros-active-count');
    const ativos  = (this._filterEspulaId ? 1 : 0) + (this._filterTipoFioId ? 1 : 0);
    if (countEl) {
      if (ativos > 0) {
        countEl.textContent = `${filtradas} de ${total} fichas`;
        countEl.classList.remove('hidden');
        countEl.classList.add('visible');
      } else {
        countEl.textContent = '';
        countEl.classList.add('hidden');
        countEl.classList.remove('visible');
      }
    }
    // Feedback visual nos selects ativos
    const filtEsp = document.getElementById('filtro-espula');
    const filtTF  = document.getElementById('filtro-tipo-fio');
    if (filtEsp) filtEsp.style.borderColor = this._filterEspulaId  ? 'var(--teal)' : '';
    if (filtTF)  filtTF.style.borderColor  = this._filterTipoFioId ? 'var(--teal)' : '';
  },

  _bindFormPreview() {
    ['f-d0','f-dmax','f-pmax','f-mmax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => Fichas._updateFichaPreview());
    });
    // v5.0 — peso cheia e espula_id afetam o cálculo de massa do fio
    ['f-peso-cheia','f-espula-id'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => Fichas._updateMassaFio());
      if (el) el.addEventListener('input',  () => Fichas._updateMassaFio());
    });
  },

  _updatePreview() {
    const fichaId = FichaSelect.getValue();
    const mTotal  = parseFloat(document.getElementById('inp-metros').value);
    const nFusos  = UI.fusos.selected;
    const strip   = document.getElementById('preview-strip');
    if (!strip) return;

    if (fichaId && mTotal > 0 && nFusos) {
      const f = Fichas.find(fichaId);
      if (f) {
        const quebraPC   = parseFloat(document.getElementById('inp-quebra').value) || 0;
        const mCalc      = mTotal * (1 + quebraPC / 100);
        const cheias     = Math.floor(mCalc / f.mmax);
        const sobra      = mCalc % f.mmax;
        const tc         = cheias * nFusos;
        const tp         = sobra > 0 ? nFusos : 0;
        const pp         = sobra > 0 ? Calc.calcPulsos(sobra, f) : 0;
        const totalEsp   = tc + tp;
        const qTxt       = quebraPC > 0 ? ` · quebra ${quebraPC}% → ${UI.fmt(mCalc, 1)}m` : '';
        let txt = `${totalEsp} espulas · ${tc} cheias (${f.pmax}p)`;
        if (tp > 0) txt += ` + ${tp} parciais (${pp}p · ${UI.fmt(sobra, 1)}m)`;
        txt += ` · ${nFusos} fusos${qTxt}`;
        strip.textContent = txt;
        strip.className   = 'preview-strip active';
        return;
      }
    }
    strip.className   = 'preview-strip';
    strip.textContent = 'Informe os parâmetros acima para ver o resumo';
  },

  doLogin() {
    const u    = document.getElementById('inp-user').value;
    const p    = document.getElementById('inp-pass').value;
    const user = Auth.login(u, p);
    const errEl = document.getElementById('login-err');
    if (!user) {
      errEl.classList.remove('hidden');
      setTimeout(() => errEl.classList.add('hidden'), 3500);
      return;
    }
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('app').classList.add('on');
    Auth.applyUI();
    const an = document.getElementById('backup-admin-nome');
    if (an) an.textContent = 'Admin: ' + (Auth.current?.nome || '');
    UI.switchTab('consulta');
    UI.toast(`Bem-vindo, ${user.nome}! [${user.perfil}] — Sistema v5.0`, 'ok', 4000);
  },

  doLogout() {
    Auth.logout();
    document.getElementById('app').classList.remove('on');
    document.getElementById('screen-login').classList.remove('hidden');
    document.getElementById('inp-user').value = '';
    document.getElementById('inp-pass').value = '';
    UI.resetConsulta();
  },

  doCalc() {
    const fichaId  = FichaSelect.getValue();
    const mPedido  = parseFloat(document.getElementById('inp-metros').value);
    const quebraPC = parseFloat(document.getElementById('inp-quebra').value) || 0;
    const nFusos   = UI.fusos.selected;
    const { ok, erros, f } = Calc.validate(mPedido, nFusos, fichaId, Fichas.data);
    if (!ok) { UI.toast(erros[0], 'err'); return; }
    const mComQuebra = parseFloat((mPedido * (1 + quebraPC / 100)).toFixed(4));
    const r = { ...Calc.setup(mComQuebra, nFusos, f), mPedido, quebraPC, mComQuebra };
    Report.render(r);
    History.push(r);
    const qTxt = quebraPC > 0 ? ` (+${quebraPC}% quebra)` : '';
    UI.toast(`✓ Setup calculado com sucesso!${qTxt}`, 'ok');
    setTimeout(() => {
      const rpt = document.getElementById('rpt');
      if (rpt) rpt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },

  async saveFicha() {
    const btn = document.getElementById('btn-salvar');
    btn.disabled = true; btn.textContent = '⏳ Salvando…';
    const res = await Fichas.upsert(this.editId);
    btn.disabled = false; btn.textContent = '💾 Salvar Ficha';
    if (!res.ok) { UI.toast(res.msg, 'err'); return; }
    const msg = this.editId
      ? (res.offline ? '⚠ Ficha atualizada (offline)' : '✓ Ficha atualizada!')
      : (res.offline ? '⚠ Ficha salva (offline)'      : '✓ Ficha salva!');
    UI.toast(msg, res.offline ? 'warn' : 'ok');
    this.cancelEdit();
    this._renderFichasTable();
    FichaSelect.update(Fichas.data);
    UI.setBadge('badge-fichas', Fichas.data.length);
  },

  editFicha(id) {
    const f = Fichas.find(id);
    if (!f) { UI.toast('Ficha não encontrada.', 'err'); return; }
    this.editId = id;
    Fichas.fillForm(f);
    document.getElementById('form-title').textContent = 'Editar Ficha';
    document.getElementById('btn-cancelar').classList.remove('hidden');
    UI.switchTab('fichas');
    setTimeout(() => {
      document.getElementById('fichas-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },

  async deleteFicha(id) {
    const f = Fichas.find(id);
    if (!f) return;
    if (!confirm(`Excluir a ficha "${f.nome}"?`)) return;
    const ok = await Fichas.delete(id);
    if (!ok) { UI.toast('Erro ao excluir ficha.', 'err'); return; }
    this._renderFichasTable();
    FichaSelect.update(Fichas.data);
    UI.setBadge('badge-fichas', Fichas.data.length);
    UI.toast('Ficha excluída.', 'inf');
  },

  cancelEdit() {
    this.editId = null;
    Fichas.clearForm();
    document.getElementById('form-title').textContent = 'Nova Ficha Técnica';
    document.getElementById('btn-cancelar').classList.add('hidden');
  },

  reuseHistory(fichaId, nFusos, mTotal) {
    UI.switchTab('consulta');
    FichaSelect.select(fichaId);
    const pill = document.querySelector(`.fpill[data-fusos="${nFusos}"]`);
    if (pill) {
      document.querySelectorAll('.fpill').forEach(p => p.classList.remove('on'));
      pill.classList.add('on');
      UI.fusos.selected = nFusos;
    }
    document.getElementById('inp-metros').value = mTotal;
    this._updatePreview();
    setTimeout(() => document.getElementById('btn-calcular').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
    UI.toast('Parâmetros anteriores carregados — clique em Calcular', 'inf');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
