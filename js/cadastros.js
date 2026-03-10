/**
 * cadastros.js — Módulo de Cadastros Base (Tipos de Fio + Espulas)
 * v5.1 — Gerenciador de Pulso · Stickfran
 * UX/UI Industrial Edition
 */
'use strict';

const Cadastros = {

  _abaAtiva: 'fio',
  _editFioId:    null,
  _editEspulaId: null,

  // ── Inicialização ─────────────────────────────────────────────
  async init() {
    // Skeleton enquanto carrega
    UX.skeleton('cad-fio-table', 5, 5);
    UX.skeleton('cad-esp-table', 4, 5);

    await DbBase.TiposFio.load();
    await DbBase.Espulas.load();

    this._bindEvents();
    this._renderFios();
    this._renderEspulas();
    this._updateBadges();
  },

  _bindEvents() {
    // Sub-abas
    document.querySelectorAll('.cad-tab-btn').forEach(btn => {
      if (btn.dataset.aba) btn.addEventListener('click', () => this._switchAba(btn.dataset.aba));
    });

    // Botões de exportação
    const btnCsv = document.getElementById('btn-cad-export-csv');
    const btnPdf = document.getElementById('btn-cad-export-pdf');
    if (btnCsv) btnCsv.addEventListener('click', () => this._exportCsv());
    if (btnPdf) btnPdf.addEventListener('click', () => this._exportPdf());

    // Formulário Fio
    const btnSalvarFio   = document.getElementById('btn-fio-salvar');
    const btnCancelarFio = document.getElementById('btn-fio-cancelar');
    if (btnSalvarFio)   btnSalvarFio.addEventListener('click',   () => this.salvarFio());
    if (btnCancelarFio) btnCancelarFio.addEventListener('click', () => this.cancelarFio());
    ['cb-fio-nome','cb-fio-material','cb-fio-titulo','cb-fio-gpm','cb-fio-obs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.salvarFio(); }});
    });

    // Formulário Espula
    const btnSalvarEsp   = document.getElementById('btn-esp-salvar');
    const btnCancelarEsp = document.getElementById('btn-esp-cancelar');
    if (btnSalvarEsp)   btnSalvarEsp.addEventListener('click',   () => this.salvarEspula());
    if (btnCancelarEsp) btnCancelarEsp.addEventListener('click', () => this.cancelarEspula());
    ['cb-esp-nome','cb-esp-cor','cb-esp-peso','cb-esp-material','cb-esp-obs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.salvarEspula(); }});
    });
  },

  _switchAba(aba) {
    this._abaAtiva = aba;
    document.querySelectorAll('.cad-tab-btn[data-aba]').forEach(b =>
      b.classList.toggle('on', b.dataset.aba === aba));
    document.querySelectorAll('.cad-painel').forEach(p =>
      p.classList.toggle('on', p.dataset.aba === aba));
  },

  _updateBadges() {
    UI.setBadge('badge-cad-fio', DbBase.TiposFio.getAtivos().length);
    UI.setBadge('badge-cad-esp', DbBase.Espulas.getAtivos().length);
    UI.setBadge('badge-cadastros',
      DbBase.TiposFio.getAtivos().length + DbBase.Espulas.getAtivos().length);
  },

  // ── Exportação ────────────────────────────────────────────────
  _exportCsv() {
    const btn = document.getElementById('btn-cad-export-csv');
    UX.exportFeedback(btn);
    setTimeout(() => {
      if (this._abaAtiva === 'fio') Export.csvTiposFio();
      else Export.csvEspulas();
    }, 100);
  },

  _exportPdf() {
    const btn = document.getElementById('btn-cad-export-pdf');
    UX.exportFeedback(btn);
    setTimeout(() => {
      if (this._abaAtiva === 'fio') Export.pdfTiposFio();
      else Export.pdfEspulas();
    }, 100);
  },

  // ══════════════════════════════════════════════════════════════
  // TIPOS DE FIO
  // ══════════════════════════════════════════════════════════════
  _renderFios() {
    const wrap = document.getElementById('cad-fio-table');
    if (!wrap) return;
    const list = DbBase.TiposFio.getAll();
    if (!list.length) {
      wrap.innerHTML = `<div class="empty">
        <div class="empty-icon">🧵</div>
        <div class="empty-txt">Nenhum tipo de fio cadastrado<br>Use o formulário ao lado para adicionar</div>
      </div>`;
      return;
    }
    const rows = list.map(t => {
      const inativo = t.ativo === false;
      const gpm = t.g_por_metro ? `${Number(t.g_por_metro).toFixed(4)} g/m` : '—';
      return `<tr${inativo ? ' class="row-inativo"' : ''}>
        <td>
          <div class="td-nome">${UI.esc(t.nome)}</div>
          <div style="font-size:10px;color:var(--t-lo);font-family:var(--f-mono);margin-top:2px">${UI.esc(t.titulo || '')}</div>
        </td>
        <td>${UI.esc(t.material || '—')}</td>
        <td class="td-val">${gpm}</td>
        <td>${t.ativo !== false
          ? '<span class="tag tag-ativo">✔ Ativo</span>'
          : '<span class="tag tag-offline">✖ Inativo</span>'}</td>
        <td><div class="td-act">
          <button class="btn-edit" onclick="Cadastros.editarFio('${UI.esc(t.id)}')">✏ Editar</button>
          <button class="btn-del" onclick="Cadastros.confirmarExcluirFio('${UI.esc(t.id)}')" title="Excluir">🗑</button>
        </div></td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `<div class="tbl-wrap"><table class="tbl">
      <thead><tr>
        <th>Nome / Título</th><th>Material</th><th>g/metro</th><th>Status</th><th>Ações</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  editarFio(id) {
    const t = DbBase.TiposFio.find(id);
    if (!t) return;
    this._editFioId = id;
    document.getElementById('cb-fio-nome').value     = t.nome;
    document.getElementById('cb-fio-material').value = t.material;
    document.getElementById('cb-fio-titulo').value   = t.titulo || '';
    document.getElementById('cb-fio-gpm').value      = t.g_por_metro || '';
    document.getElementById('cb-fio-obs').value      = t.obs || '';
    document.getElementById('fio-form-title').textContent = '✏ Editar Tipo de Fio';
    document.getElementById('btn-fio-cancelar').classList.remove('hidden');
    // Scroll e feedback visual no card do formulário
    const card = document.getElementById('cad-fio-form-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    UX.pulse(card);
    UI.toast(`Editando: ${t.nome}`, 'inf', 2000);
  },

  cancelarFio() {
    this._editFioId = null;
    ['cb-fio-nome','cb-fio-titulo','cb-fio-gpm','cb-fio-obs'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const m = document.getElementById('cb-fio-material');
    if (m) m.value = 'Poliéster';
    document.getElementById('fio-form-title').textContent = '➕ Novo Tipo de Fio';
    document.getElementById('btn-fio-cancelar').classList.add('hidden');
    UI.clearFieldStates(['fi-fio-nome']);
  },

  async salvarFio() {
    const nome = document.getElementById('cb-fio-nome').value.trim();
    if (!nome) {
      UI.fieldErr('fi-fio-nome', 'err-fio-nome', 'Nome obrigatório');
      UX.scrollToFirstError(document.getElementById('cad-fio-form-card'));
      return;
    }
    UI.clearFieldStates(['fi-fio-nome']);

    const dados = {
      nome,
      material:    document.getElementById('cb-fio-material').value,
      titulo:      document.getElementById('cb-fio-titulo').value.trim(),
      g_por_metro: parseFloat(document.getElementById('cb-fio-gpm').value) || null,
      obs:         document.getElementById('cb-fio-obs').value.trim(),
      ativo:       true,
    };

    const btn = document.getElementById('btn-fio-salvar');
    UX.btnLoading(btn, 'Salvando…');

    const res = this._editFioId
      ? await DbBase.TiposFio.update(this._editFioId, dados)
      : await DbBase.TiposFio.create(dados);

    UX.btnDone(btn);
    if (!res.ok) { UI.toast(res.msg, 'err'); return; }

    UI.toast(this._editFioId ? '✓ Tipo de fio atualizado!' : '✓ Tipo de fio criado!', 'ok');
    this.cancelarFio();
    this._renderFios();
    this._updateBadges();
    UX.highlightNewRow('cad-fio-table');
    if (typeof App !== 'undefined') App._populateFichaSelects?.();
  },

  async confirmarExcluirFio(id) {
    const t = DbBase.TiposFio.find(id);
    if (!t) return;
    UX.confirm(
      `Excluir o tipo de fio <strong>"${UI.esc(t.nome)}"</strong>?<br><br>
       <small style="color:var(--t-lo)">Fichas técnicas que usam este tipo ficarão sem referência.</small>`,
      async () => {
        const res = await DbBase.TiposFio.excluir(id);
        if (!res.ok) { UI.toast(res.msg, 'err'); return; }
        UI.toast(`Tipo de fio "${t.nome}" excluído.`, 'inf');
        this._renderFios();
        this._updateBadges();
      }
    );
  },

  // ══════════════════════════════════════════════════════════════
  // ESPULAS BASE
  // ══════════════════════════════════════════════════════════════
  _renderEspulas() {
    const wrap = document.getElementById('cad-esp-table');
    if (!wrap) return;
    const list = DbBase.Espulas.getAll();
    if (!list.length) {
      wrap.innerHTML = `<div class="empty">
        <div class="empty-icon">🔘</div>
        <div class="empty-txt">Nenhuma espula cadastrada<br>Use o formulário ao lado para adicionar</div>
      </div>`;
      return;
    }
    const rows = list.map(e => {
      const inativo = e.ativo === false;
      const tagCls  = e.cor === 'Vermelha' ? 'tag-vermelha' : e.cor === 'Branca' ? 'tag-branca' : 'tag-outro';
      const peso    = e.peso_vazio_g ? `${Number(e.peso_vazio_g).toFixed(1)} g` : '—';
      return `<tr${inativo ? ' class="row-inativo"' : ''}>
        <td>
          <div class="td-nome">${UI.esc(e.nome)}</div>
          <div style="font-size:10px;color:var(--t-lo);margin-top:2px">${UI.esc(e.material || '')}</div>
        </td>
        <td><span class="tag ${tagCls}">${UI.esc(e.cor)}</span></td>
        <td class="td-val">${peso}</td>
        <td>${e.ativo !== false
          ? '<span class="tag tag-ativo">✔ Ativo</span>'
          : '<span class="tag tag-offline">✖ Inativo</span>'}</td>
        <td><div class="td-act">
          <button class="btn-edit" onclick="Cadastros.editarEspula('${UI.esc(e.id)}')">✏ Editar</button>
          <button class="btn-del" onclick="Cadastros.confirmarExcluirEspula('${UI.esc(e.id)}')" title="Excluir">🗑</button>
        </div></td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `<div class="tbl-wrap"><table class="tbl">
      <thead><tr>
        <th>Nome / Código</th><th>Cor</th><th>Peso Vazio</th><th>Status</th><th>Ações</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  editarEspula(id) {
    const e = DbBase.Espulas.find(id);
    if (!e) return;
    this._editEspulaId = id;
    document.getElementById('cb-esp-nome').value     = e.nome;
    document.getElementById('cb-esp-cor').value      = e.cor;
    document.getElementById('cb-esp-peso').value     = e.peso_vazio_g || '';
    document.getElementById('cb-esp-material').value = e.material || 'Plástico';
    document.getElementById('cb-esp-obs').value      = e.obs || '';
    document.getElementById('esp-form-title').textContent = '✏ Editar Espula';
    document.getElementById('btn-esp-cancelar').classList.remove('hidden');
    const card = document.getElementById('cad-esp-form-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    UX.pulse(card);
    UI.toast(`Editando: ${e.nome}`, 'inf', 2000);
  },

  cancelarEspula() {
    this._editEspulaId = null;
    ['cb-esp-nome','cb-esp-peso','cb-esp-obs'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const cor = document.getElementById('cb-esp-cor');
    const mat = document.getElementById('cb-esp-material');
    if (cor) cor.value = 'Branca';
    if (mat) mat.value = 'Plástico';
    document.getElementById('esp-form-title').textContent = '➕ Nova Espula';
    document.getElementById('btn-esp-cancelar').classList.add('hidden');
    UI.clearFieldStates(['fi-esp-nome']);
  },

  async salvarEspula() {
    const nome = document.getElementById('cb-esp-nome').value.trim();
    if (!nome) {
      UI.fieldErr('fi-esp-nome', 'err-esp-nome', 'Nome obrigatório');
      UX.scrollToFirstError(document.getElementById('cad-esp-form-card'));
      return;
    }
    UI.clearFieldStates(['fi-esp-nome']);

    const dados = {
      nome,
      cor:          document.getElementById('cb-esp-cor').value,
      peso_vazio_g: parseFloat(document.getElementById('cb-esp-peso').value) || null,
      material:     document.getElementById('cb-esp-material').value.trim() || 'Plástico',
      obs:          document.getElementById('cb-esp-obs').value.trim(),
      ativo:        true,
    };

    const btn = document.getElementById('btn-esp-salvar');
    UX.btnLoading(btn, 'Salvando…');

    const res = this._editEspulaId
      ? await DbBase.Espulas.update(this._editEspulaId, dados)
      : await DbBase.Espulas.create(dados);

    UX.btnDone(btn);
    if (!res.ok) { UI.toast(res.msg, 'err'); return; }

    UI.toast(this._editEspulaId ? '✓ Espula atualizada!' : '✓ Espula criada!', 'ok');
    this.cancelarEspula();
    this._renderEspulas();
    this._updateBadges();
    UX.highlightNewRow('cad-esp-table');
    if (typeof App !== 'undefined') App._populateFichaSelects?.();
  },

  async confirmarExcluirEspula(id) {
    const e = DbBase.Espulas.find(id);
    if (!e) return;
    UX.confirm(
      `Excluir a espula <strong>"${UI.esc(e.nome)}"</strong>?<br><br>
       <small style="color:var(--t-lo)">Fichas técnicas que usam este modelo ficarão sem referência.</small>`,
      async () => {
        const res = await DbBase.Espulas.excluir(id);
        if (!res.ok) { UI.toast(res.msg, 'err'); return; }
        UI.toast(`Espula "${e.nome}" excluída.`, 'inf');
        this._renderEspulas();
        this._updateBadges();
      }
    );
  },
};
