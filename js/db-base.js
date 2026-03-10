/**
 * db-base.js — Módulo REST para Cadastros Base (tipos_fio e espulas)
 * v5.0 — Gerenciador de Pulso · Stickfran
 */
'use strict';

const DbBase = {

  // ── helpers comuns ────────────────────────────────────────────
  _url(table, qs = '') { return `${SUPABASE_URL}/rest/v1/${table}${qs}`; },
  _h(extra = {}) {
    return {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      ...extra
    };
  },

  async _fetchAll(table, filter = '') {
    const qs = `?select=*${filter}&order=nome.asc`;
    const r  = await fetch(this._url(table, qs),
      { headers: this._h(), signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },

  async _insert(table, payload) {
    const r = await fetch(this._url(table), {
      method: 'POST',
      headers: this._h({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${r.status}`);
    }
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },

  async _update(table, id, payload) {
    const r = await fetch(this._url(table, `?id=eq.${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: this._h({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${r.status}`);
    }
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },

  async _delete(table, id) {
    const r = await fetch(this._url(table, `?id=eq.${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: this._h({ 'Prefer': 'return=minimal' }),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok && r.status !== 204)
      throw new Error(`HTTP ${r.status}`);
    return true;
  },

  // ── TIPOS DE FIO ──────────────────────────────────────────────
  TiposFio: {
    _local: [],
    LOCAL_KEY: 'gpe_tipos_fio_v5',

    _save(list) { try { localStorage.setItem(this.LOCAL_KEY, JSON.stringify(list)); } catch {} },
    _load()     {
      try {
        const r = localStorage.getItem(this.LOCAL_KEY);
        if (r) { const l = JSON.parse(r); if (Array.isArray(l) && l.length) return l; }
      } catch {}
      return CFG.TIPOS_FIO_SEED || [];
    },

    async load() {
      const local = this._load();
      this._local = local;
      try {
        const rows = await DbBase._fetchAll('tipos_fio', '&ativo=eq.true');
        if (rows.length) {
          this._local = rows;
          this._save(rows);
        }
      } catch {}
      return this._local;
    },

    async loadAll() {
      try {
        const rows = await DbBase._fetchAll('tipos_fio');
        this._local = rows;
        this._save(rows);
        return rows;
      } catch {
        return this._load();
      }
    },

    getAll()    { return this._local; },
    getAtivos() { return this._local.filter(t => t.ativo !== false); },
    find(id)    { return this._local.find(t => t.id === id) || null; },

    async create(dados) {
      const payload = this._toRow(dados);
      const dup = this._local.find(t => t.nome.toLowerCase() === payload.nome.toLowerCase());
      if (dup) return { ok: false, msg: `Já existe um tipo de fio com o nome "${payload.nome}".` };
      try {
        const saved = await DbBase._insert('tipos_fio', payload);
        this._local.push(saved);
        this._save(this._local);
        return { ok: true, item: saved };
      } catch (err) {
        if (err.message.includes('unique') || err.message.includes('23505'))
          return { ok: false, msg: 'Nome já existe no banco de dados.' };
        return { ok: false, msg: err.message };
      }
    },

    async update(id, dados) {
      const payload = this._toRow(dados);
      try {
        const saved = await DbBase._update('tipos_fio', id, payload);
        const idx = this._local.findIndex(t => t.id === id);
        if (idx >= 0) this._local[idx] = { ...this._local[idx], ...saved };
        this._save(this._local);
        return { ok: true, item: saved };
      } catch (err) { return { ok: false, msg: err.message }; }
    },

    async excluir(id) {
      try {
        await DbBase._delete('tipos_fio', id);
        this._local = this._local.filter(t => t.id !== id);
        this._save(this._local);
        return { ok: true };
      } catch (err) { return { ok: false, msg: err.message }; }
    },

    async toggleAtivo(id) {
      const item = this._local.find(t => t.id === id);
      if (!item) return { ok: false, msg: 'Não encontrado.' };
      return this.update(id, { ...item, ativo: !item.ativo });
    },

    _toRow(d) {
      return {
        nome:        String(d.nome        || '').trim(),
        material:    String(d.material    || 'Poliéster'),
        titulo:      String(d.titulo      || '').trim(),
        g_por_metro: d.g_por_metro ? Number(d.g_por_metro) : null,
        obs:         String(d.obs         || '').trim(),
        ativo:       d.ativo !== false
      };
    }
  },

  // ── ESPULAS BASE ──────────────────────────────────────────────
  Espulas: {
    _local: [],
    LOCAL_KEY: 'gpe_espulas_base_v5',

    _save(list) { try { localStorage.setItem(this.LOCAL_KEY, JSON.stringify(list)); } catch {} },
    _load()     {
      try {
        const r = localStorage.getItem(this.LOCAL_KEY);
        if (r) { const l = JSON.parse(r); if (Array.isArray(l) && l.length) return l; }
      } catch {}
      return CFG.ESPULAS_SEED || [];
    },

    async load() {
      const local = this._load();
      this._local = local;
      try {
        const rows = await DbBase._fetchAll('espulas', '&ativo=eq.true');
        if (rows.length) {
          this._local = rows;
          this._save(rows);
        }
      } catch {}
      return this._local;
    },

    async loadAll() {
      try {
        const rows = await DbBase._fetchAll('espulas');
        this._local = rows;
        this._save(rows);
        return rows;
      } catch {
        return this._load();
      }
    },

    getAll()    { return this._local; },
    getAtivos() { return this._local.filter(e => e.ativo !== false); },
    find(id)    { return this._local.find(e => e.id === id) || null; },

    async create(dados) {
      const payload = this._toRow(dados);
      const dup = this._local.find(e => e.nome.toLowerCase() === payload.nome.toLowerCase());
      if (dup) return { ok: false, msg: `Já existe uma espula com o nome "${payload.nome}".` };
      try {
        const saved = await DbBase._insert('espulas', payload);
        this._local.push(saved);
        this._save(this._local);
        return { ok: true, item: saved };
      } catch (err) { return { ok: false, msg: err.message }; }
    },

    async update(id, dados) {
      const payload = this._toRow(dados);
      try {
        const saved = await DbBase._update('espulas', id, payload);
        const idx = this._local.findIndex(e => e.id === id);
        if (idx >= 0) this._local[idx] = { ...this._local[idx], ...saved };
        this._save(this._local);
        return { ok: true, item: saved };
      } catch (err) { return { ok: false, msg: err.message }; }
    },

    async excluir(id) {
      try {
        await DbBase._delete('espulas', id);
        this._local = this._local.filter(e => e.id !== id);
        this._save(this._local);
        return { ok: true };
      } catch (err) { return { ok: false, msg: err.message }; }
    },

    async toggleAtivo(id) {
      const item = this._local.find(e => e.id === id);
      if (!item) return { ok: false, msg: 'Não encontrado.' };
      return this.update(id, { ...item, ativo: !item.ativo });
    },

    _toRow(d) {
      return {
        nome:         String(d.nome         || '').trim(),
        cor:          String(d.cor          || 'Branca'),
        peso_vazio_g: d.peso_vazio_g ? Number(d.peso_vazio_g) : null,
        material:     String(d.material     || 'Plástico').trim(),
        obs:          String(d.obs          || '').trim(),
        ativo:        d.ativo !== false
      };
    }
  }
};
