/**
 * config.js — Configurações globais do sistema GPE v5.0
 */
'use strict';

const CFG = {
  PI: Math.PI,
  FUSOS: [8, 12, 16, 17, 24, 32],
  STORAGE_KEY:  'gpe_fichas_v3',
  HISTORY_KEY:  'gpe_history_v3',
  THEME_KEY:    'gpe_theme',
  USERS: [
    { login: 'leonardo', hash: 'pcp2026', perfil: 'Admin',    nome: 'Leonardo' },
    { login: 'operador', hash: 'op1234',  perfil: 'Operador', nome: 'Operador' }
  ],
  FICHAS_SEED: [
    {
      id: 'seed-branca-01', nome: 'POL-3F-720M-BRANCA', material: 'Poliéster',
      fios: 3, d0: 6.0, diam: 13.0, comp: 14.0, pmax: 60, mmax: 720, espula: 'Branca',
      peso_espula_cheia_g: 150.0,
      obs: 'Ficha base. Confirmado por pesagem (massa fio 96,7g) e medição. 12 m/pulso.'
    },
    {
      id: 'seed-vermelha-02', nome: 'POL-3F-663M-VERMELHA', material: 'Poliéster',
      fios: 3, d0: 6.0, diam: 12.5, comp: 11.0, pmax: 58, mmax: 663, espula: 'Vermelha',
      peso_espula_cheia_g: 120.3,
      obs: 'Metragem estimada por método de massa (89,1g ÷ 0,13431 g/m = 663m). Confirmar.'
    }
  ],
  // Seeds offline para cadastros base
  TIPOS_FIO_SEED: [
    { id: 'tf-pol150', nome: 'POL-150d/48f', material: 'Poliéster', titulo: '150d/48f', g_por_metro: 0.01665, obs: '', ativo: true },
    { id: 'tf-pol210', nome: 'POL-210d/96f', material: 'Poliéster', titulo: '210d/96f', g_por_metro: 0.02331, obs: '', ativo: true },
    { id: 'tf-nyl08',  nome: 'NYL-0.8mm',   material: 'Nylon',      titulo: '0,8mm',    g_por_metro: null,     obs: '', ativo: true }
  ],
  ESPULAS_SEED: [
    { id: 'esp-branca',   nome: 'Espula Branca Padrão',   cor: 'Branca',   peso_vazio_g: 53.3, material: 'Plástico', obs: '', ativo: true },
    { id: 'esp-vermelha', nome: 'Espula Vermelha Padrão', cor: 'Vermelha', peso_vazio_g: 31.2, material: 'Plástico', obs: '', ativo: true }
  ]
};
