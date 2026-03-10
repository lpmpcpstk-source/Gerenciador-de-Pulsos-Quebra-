/* ═══════════════════════════════════════════════════════════════
   EXPORT.JS — Exportação CSV e PDF dos Cadastros Base
   Stickfran — v5.1
═══════════════════════════════════════════════════════════════ */
'use strict';

const Export = (() => {

  /* ── helpers ──────────────────────────────────────────────── */
  const _ts = () => {
    const d = new Date(), p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  };

  const _download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const _esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const _escCsv = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const _buildCsv = (headers, rows) => {
    const bom = '\uFEFF';
    const lines = [headers.map(_escCsv).join(',')];
    rows.forEach(r => lines.push(r.map(_escCsv).join(',')));
    return bom + lines.join('\r\n');
  };

  /* ── PDF via janela de impressão ──────────────────────────── */
  const _pdfViaHtml = (title, subtitle, headers, rows, accent) => {
    accent = accent || '#E8192C';
    const ts = new Date().toLocaleString('pt-BR');
    const isLandscape = headers.length > 6;

    const tableRows = rows.map((r,i) => `
      <tr class="${i%2===0?'even':''}">
        ${r.map((c,ci)=>`<td class="${ci===0?'td-nome':''}">${_esc(String(c??'—'))}</td>`).join('')}
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>${_esc(title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Barlow:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Barlow',Arial,sans-serif;color:#1A2A3A;background:#fff;font-size:11px}
.doc-header{background:#0A1520;color:#fff;padding:16px 30px 12px;border-bottom:3px solid ${accent}}
.doc-header-inner{display:flex;justify-content:space-between;align-items:center}
.brand{font-family:'Barlow Condensed',Arial,sans-serif;font-weight:900;font-size:20px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px}
.brand span{color:${accent}}
.doc-title{font-family:'Barlow Condensed',Arial,sans-serif;font-size:15px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#fff}
.doc-meta{text-align:right;font-size:9px;color:rgba(255,255,255,.55);line-height:1.9;font-family:'Barlow Condensed',Arial,sans-serif;letter-spacing:.5px}
.doc-meta strong{color:rgba(255,255,255,.85)}
.accent-bar{height:1px;background:${accent};opacity:.3;margin:0 30px}
.tbl-wrap{padding:18px 30px}
.sub-lbl{font-family:'Barlow Condensed',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7A9AB8;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E0E8F0;display:flex;justify-content:space-between}
.sub-lbl span{color:${accent}}
table{width:100%;border-collapse:collapse}
thead tr{background:#0F1D2E}
thead th{padding:8px 10px;font-family:'Barlow Condensed',Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#00AAFF;text-align:left;white-space:nowrap}
tbody tr{border-bottom:1px solid #EBF2F9}
tbody tr.even{background:#F6F9FC}
tbody td{padding:7px 10px;font-size:10px;color:#2A4060;vertical-align:middle;line-height:1.4}
tbody td.td-nome{font-family:'Barlow Condensed',Arial,sans-serif;font-size:11px;font-weight:700;color:#0A1520}
.doc-footer{padding:10px 30px;border-top:1px solid #E0E8F0;display:flex;justify-content:space-between;font-size:9px;color:#8AAABB;font-family:'Barlow Condensed',Arial,sans-serif;letter-spacing:.5px;margin-top:8px}
.doc-footer strong{color:${accent}}
.no-print{display:block;text-align:center;padding:14px;background:#f8f9fa;font-family:sans-serif;font-size:13px}
@media print{
  @page{size:A4 ${isLandscape?'landscape':'portrait'};margin:10mm}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .no-print{display:none}
}
</style></head><body>
<div class="no-print">
  <button onclick="window.print()" style="background:${accent};color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;font-weight:700;letter-spacing:1px">🖨️ IMPRIMIR / SALVAR PDF</button>
  &nbsp;&nbsp;
  <button onclick="window.close()" style="background:#555;color:#fff;border:none;padding:10px 18px;border-radius:6px;font-size:13px;cursor:pointer">✕ Fechar</button>
  <p style="margin-top:8px;font-size:11px;color:#888">Use Ctrl+P → Salvar como PDF para baixar o arquivo.</p>
</div>
<div class="doc-header">
  <div class="doc-header-inner">
    <div>
      <div class="brand">STICK<span>FRAN</span> &nbsp;<span style="font-size:11px;color:rgba(255,255,255,.35);letter-spacing:1px">INDÚSTRIA E COMÉRCIO</span></div>
      <div class="doc-title">${_esc(title)}</div>
    </div>
    <div class="doc-meta">
      <div><strong>SISTEMA PCP v5.1</strong></div>
      <div>Gerado: <strong>${ts}</strong></div>
      <div>Registros: <strong>${rows.length}</strong></div>
    </div>
  </div>
</div>
<div class="accent-bar"></div>
<div class="tbl-wrap">
  <div class="sub-lbl"><span>${_esc(subtitle)}</span><span>${rows.length} registros ativos</span></div>
  <table>
    <thead><tr>${headers.map(h=>`<th>${_esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>
<div class="doc-footer">
  <div><strong>STICKFRAN</strong> Indústria e Comércio de Componentes</div>
  <div>Sistema PCP — Gerenciador de Pulso v5.1</div>
  <div>Impresso em ${ts}</div>
</div>
</body></html>`;

    const win = window.open('','_blank','width=1000,height=750,scrollbars=yes');
    if (!win) { UI.toast('⚠️ Habilite pop-ups para exportar PDF','warn',4000); return; }
    win.document.write(html);
    win.document.close();
  };

  /* ═══════════════════════════════════════════════════════════
     API PÚBLICA — Tipos de Fio
  ═══════════════════════════════════════════════════════════ */
  const tiposFioCsv = () => {
    const dados = DbBase.TiposFio.getAtivos();
    if (!dados.length) { UI.toast('Nenhum tipo de fio cadastrado','warn'); return; }
    const headers = ['Nome / Código','Material','Espessura/Título','g/metro','Observações','Ativo','Criado em'];
    const rows = dados.map(d => [
      d.nome, d.material||'—', d.titulo||'—',
      d.g_por_metro!=null ? Number(d.g_por_metro).toFixed(5) : '—',
      d.obs||'', d.ativo?'Sim':'Não',
      d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—',
    ]);
    _download(new Blob([_buildCsv(headers,rows)],{type:'text/csv;charset=utf-8'}), `STK_TiposFio_${_ts()}.csv`);
    UI.toast('📊 CSV tipos de fio exportado','ok',2500);
  };

  const tiposFioPdf = () => {
    const dados = DbBase.TiposFio.getAtivos();
    if (!dados.length) { UI.toast('Nenhum tipo de fio cadastrado','warn'); return; }
    const headers = ['Nome / Código','Material','Espessura','g/metro','Observações','Status'];
    const rows = dados.map(d => [
      d.nome, d.material||'—', d.titulo||'—',
      d.g_por_metro!=null ? Number(d.g_por_metro).toFixed(5) : '—',
      d.obs||'', d.ativo?'✓ Ativo':'Inativo',
    ]);
    _pdfViaHtml('Cadastro de Tipos de Fio','Gerenciador de Pulso — Espuladeiras',headers,rows,'#00CC99');
  };

  /* ═══════════════════════════════════════════════════════════
     API PÚBLICA — Espulas
  ═══════════════════════════════════════════════════════════ */
  const espulasCsv = () => {
    const dados = DbBase.Espulas.getAtivos();
    if (!dados.length) { UI.toast('Nenhuma espula cadastrada','warn'); return; }
    const headers = ['Nome / Código','Cor','Peso Vazio (g)','Material','Observações','Ativo','Criado em'];
    const rows = dados.map(d => [
      d.nome, d.cor||'—',
      d.peso_vazio_g!=null ? Number(d.peso_vazio_g).toFixed(2) : '—',
      d.material||'—', d.obs||'', d.ativo?'Sim':'Não',
      d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—',
    ]);
    _download(new Blob([_buildCsv(headers,rows)],{type:'text/csv;charset=utf-8'}), `STK_Espulas_${_ts()}.csv`);
    UI.toast('📊 CSV espulas exportado','ok',2500);
  };

  const espulasPdf = () => {
    const dados = DbBase.Espulas.getAtivos();
    if (!dados.length) { UI.toast('Nenhuma espula cadastrada','warn'); return; }
    const headers = ['Nome / Código','Cor','Peso Vazio (g)','Material','Observações','Status'];
    const rows = dados.map(d => [
      d.nome, d.cor||'—',
      d.peso_vazio_g!=null ? Number(d.peso_vazio_g).toFixed(2) : '—',
      d.material||'—', d.obs||'', d.ativo?'✓ Ativo':'Inativo',
    ]);
    _pdfViaHtml('Cadastro de Modelos de Espula','Gerenciador de Pulso — Espuladeiras',headers,rows,'#E8192C');
  };

  /* ═══════════════════════════════════════════════════════════
     API PÚBLICA — Fichas Técnicas
  ═══════════════════════════════════════════════════════════ */
  const fichasCsv = () => {
    const dados = Fichas.data;
    if (!dados?.length) { UI.toast('Nenhuma ficha para exportar','warn'); return; }
    const headers = [
      'ID','Nome','Material','Fios','D0 (mm)','Diâm Esp (mm)',
      'Comp (m)','Pmax','Mmax (g)','Esp. Referência',
      'Tipo de Fio','Espula Base','Peso Cheia (g)','Observações','Ativo','Criado em',
    ];
    const rows = dados.map(d => [
      d.id?.slice(0,8)||'', d.nome, d.material||'—', d.fios||'—',
      d.d0!=null    ? Number(d.d0).toFixed(2)   : '—',
      d.diam!=null  ? Number(d.diam).toFixed(2) : '—',
      d.comp!=null  ? Number(d.comp).toFixed(1) : '—',
      d.pmax||'—',
      d.mmax!=null  ? Number(d.mmax).toFixed(1) : '—',
      d.espula||'—',
      d.tipo_fio_id ? (DbBase.TiposFio.find(d.tipo_fio_id)?.nome||d.tipo_fio_id.slice(0,8)) : '—',
      d.espula_id   ? (DbBase.Espulas.find(d.espula_id)?.nome   ||d.espula_id.slice(0,8))   : '—',
      d.peso_espula_cheia_g!=null ? Number(d.peso_espula_cheia_g).toFixed(2) : '—',
      d.obs||'', d.ativo?'Sim':'Não',
      d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—',
    ]);
    _download(new Blob([_buildCsv(headers,rows)],{type:'text/csv;charset=utf-8'}), `STK_FichasTecnicas_${_ts()}.csv`);
    UI.toast('📊 CSV fichas técnicas exportado','ok',2500);
  };

  const fichasPdf = () => {
    const dados = Fichas.data;
    if (!dados?.length) { UI.toast('Nenhuma ficha para exportar','warn'); return; }
    const headers = ['Nome','Material','Fios','Comp (m)','Pmax','Mmax (g)','Tipo Fio','Espula Base','Peso Cheia (g)'];
    const rows = dados.map(d => [
      d.nome, d.material||'—', d.fios||'—',
      d.comp!=null ? Number(d.comp).toFixed(1) : '—',
      d.pmax||'—',
      d.mmax!=null ? Number(d.mmax).toFixed(1) : '—',
      d.tipo_fio_id ? (DbBase.TiposFio.find(d.tipo_fio_id)?.nome||'—') : '—',
      d.espula_id   ? (DbBase.Espulas.find(d.espula_id)?.nome   ||d.espula||'—') : (d.espula||'—'),
      d.peso_espula_cheia_g!=null ? Number(d.peso_espula_cheia_g).toFixed(2)+'g' : '—',
    ]);
    _pdfViaHtml('Fichas Técnicas — Espuladeiras','Gerenciador de Pulso Stickfran',headers,rows,'#00AAFF');
  };

  return { tiposFioCsv, tiposFioPdf, espulasCsv, espulasPdf, fichasCsv, fichasPdf };
})();
