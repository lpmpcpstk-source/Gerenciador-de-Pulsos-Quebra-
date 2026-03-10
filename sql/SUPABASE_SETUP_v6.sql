-- ================================================================
--  SUPABASE_SETUP_v6.sql
--  Gerenciador de Pulso — Espuladeira v5.0
--  Stickfran Indústria e Comércio de Componentes
--
--  NOVIDADES v5.0:
--    - Novas tabelas: tipos_fio e espulas (cadastros base)
--    - fichas_tecnicas: novos campos tipo_fio_id, espula_id, peso_espula_cheia_g
--    - FKs entre fichas_tecnicas e cadastros base
--    - Seeds completos para todos os tipos base
--
--  ▶ COMO USAR:
--  1. Acesse o painel do Supabase → SQL Editor → New query
--  2. Cole TODO o conteúdo deste arquivo
--  3. Clique em Run (▶)
--  4. Deve aparecer "Success. No rows returned."
--
--  ⚠ DROP completo: limpa tudo e recria do zero (seguro para re-executar).
-- ================================================================


-- ================================================================
-- 0. LIMPEZA COMPLETA (seguro para re-executar)
-- ================================================================
DROP TABLE IF EXISTS setups_log       CASCADE;
DROP TABLE IF EXISTS fichas_tecnicas  CASCADE;
DROP TABLE IF EXISTS espulas          CASCADE;
DROP TABLE IF EXISTS tipos_fio        CASCADE;
DROP TABLE IF EXISTS usuarios         CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;


-- ================================================================
-- 1. EXTENSÃO UUID
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ================================================================
-- 2. FUNÇÃO: updated_at automático
-- ================================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- 3. TABELA: usuarios
-- ================================================================
CREATE TABLE usuarios (
  id         TEXT        PRIMARY KEY,
  login      TEXT        NOT NULL UNIQUE,
  hash       TEXT        NOT NULL,
  nome       TEXT        NOT NULL,
  perfil     TEXT        NOT NULL DEFAULT 'Operador'
               CHECK (perfil IN ('PCP', 'Operador', 'Admin')),
  ativo      BOOLEAN     NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_login ON usuarios (login);
CREATE INDEX idx_usuarios_ativo ON usuarios (ativo);

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_anon_all" ON usuarios FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 4. TABELA: tipos_fio (Cadastro Base — novo v5.0)
-- ================================================================
CREATE TABLE tipos_fio (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL UNIQUE,
  material    TEXT        NOT NULL DEFAULT 'Poliéster'
                CHECK (material IN ('Poliéster','Nylon','Polipropileno','Algodão','Elástico','Outro')),
  titulo      TEXT        NOT NULL DEFAULT '',      -- ex: "150d/48f", "210d", "0,8mm"
  g_por_metro NUMERIC(8,4),                         -- peso por metro (g/m) — opcional
  obs         TEXT        NOT NULL DEFAULT '',
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tipos_fio_ativo    ON tipos_fio (ativo);
CREATE INDEX idx_tipos_fio_material ON tipos_fio (material);

CREATE TRIGGER trg_tipos_fio_updated_at
  BEFORE UPDATE ON tipos_fio
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE tipos_fio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_fio_anon_all" ON tipos_fio FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 5. TABELA: espulas (Cadastro Base — novo v5.0)
-- ================================================================
CREATE TABLE espulas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL UNIQUE,
  cor           TEXT        NOT NULL DEFAULT 'Branca'
                  CHECK (cor IN ('Branca','Vermelha','Verde','Azul','Amarela','Outra')),
  peso_vazio_g  NUMERIC(8,2),                       -- peso da espula vazia (g)
  material      TEXT        NOT NULL DEFAULT 'Plástico',
  obs           TEXT        NOT NULL DEFAULT '',
  ativo         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_espulas_ativo ON espulas (ativo);
CREATE INDEX idx_espulas_cor   ON espulas (cor);

CREATE TRIGGER trg_espulas_updated_at
  BEFORE UPDATE ON espulas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE espulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "espulas_anon_all" ON espulas FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 6. TABELA: fichas_tecnicas (atualizada v5.0)
--    + tipo_fio_id, espula_id, peso_espula_cheia_g
-- ================================================================
CREATE TABLE fichas_tecnicas (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT        NOT NULL,
  -- Relacionamentos com cadastros base (v5.0)
  tipo_fio_id         UUID        REFERENCES tipos_fio(id) ON DELETE SET NULL,
  espula_id           UUID        REFERENCES espulas(id)   ON DELETE SET NULL,
  -- Campos legados (mantidos para compatibilidade)
  material            TEXT        NOT NULL DEFAULT 'Poliéster',
  fios                INTEGER     NOT NULL DEFAULT 3  CHECK (fios BETWEEN 1 AND 20),
  espula              TEXT        NOT NULL DEFAULT 'Branca'
                        CHECK (espula IN ('Branca','Vermelha','Verde','Outra')),
  -- Parâmetros físicos
  d0                  NUMERIC(6,2) NOT NULL           CHECK (d0 > 0),
  diam                NUMERIC(6,2) NOT NULL           CHECK (diam > 0),
  comp                NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (comp >= 0),
  pmax                INTEGER     NOT NULL            CHECK (pmax BETWEEN 1 AND 999),
  mmax                NUMERIC(10,2) NOT NULL          CHECK (mmax >= 1),
  -- Peso da espula cheia (novo v5.0)
  peso_espula_cheia_g NUMERIC(8,2)                   CHECK (peso_espula_cheia_g IS NULL OR peso_espula_cheia_g > 0),
  -- Outros
  obs                 TEXT        NOT NULL DEFAULT '',
  ativo               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT diam_gt_d0       CHECK (diam > d0),
  CONSTRAINT nome_ativo_unico UNIQUE (nome, ativo)
);

CREATE INDEX idx_fichas_ativo      ON fichas_tecnicas (ativo);
CREATE INDEX idx_fichas_nome       ON fichas_tecnicas (nome);
CREATE INDEX idx_fichas_espula     ON fichas_tecnicas (espula);
CREATE INDEX idx_fichas_tipo_fio   ON fichas_tecnicas (tipo_fio_id);
CREATE INDEX idx_fichas_espula_id  ON fichas_tecnicas (espula_id);
CREATE INDEX idx_fichas_created    ON fichas_tecnicas (created_at DESC);

CREATE TRIGGER trg_fichas_updated_at
  BEFORE UPDATE ON fichas_tecnicas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fichas_anon_all" ON fichas_tecnicas FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 7. TABELA: setups_log (rastreabilidade — inalterada)
-- ================================================================
CREATE TABLE setups_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id       UUID        REFERENCES fichas_tecnicas(id) ON DELETE SET NULL,
  ficha_nome     TEXT        NOT NULL,
  n_fusos        INTEGER     NOT NULL CHECK (n_fusos >= 1),
  m_total        NUMERIC(10,2) NOT NULL CHECK (m_total > 0),
  pulsos_lote1   INTEGER     NOT NULL,
  espulas_lote1  INTEGER     NOT NULL DEFAULT 0,
  pulsos_lote2   INTEGER,
  espulas_lote2  INTEGER,
  m_sobra        NUMERIC(10,2),
  rounding_err   NUMERIC(10,6),
  operador_nome  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_setups_ficha   ON setups_log (ficha_id);
CREATE INDEX idx_setups_created ON setups_log (created_at DESC);

ALTER TABLE setups_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setups_anon_all" ON setups_log FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- 8. VIEW: fichas_ativas (atualizada v5.0 — inclui joins)
-- ================================================================
CREATE OR REPLACE VIEW fichas_ativas AS
  SELECT
    f.id, f.nome, f.material, f.fios, f.d0, f.diam, f.comp,
    f.pmax, f.mmax, f.espula, f.obs,
    f.tipo_fio_id, f.espula_id, f.peso_espula_cheia_g,
    f.created_by, f.created_at, f.updated_at,
    -- Campos calculados
    ROUND((f.d0   / 100.0 * PI())::NUMERIC, 6) AS c0_m,
    ROUND((f.diam / 100.0 * PI())::NUMERIC, 6) AS cmax_m,
    ROUND((f.mmax / f.pmax)::NUMERIC,        4) AS m_por_pulso,
    -- Join com cadastros base
    tf.nome  AS tipo_fio_nome,
    tf.material AS tipo_fio_material,
    tf.titulo   AS tipo_fio_titulo,
    e.nome   AS espula_base_nome,
    e.cor    AS espula_cor,
    e.peso_vazio_g AS espula_peso_vazio_g
  FROM fichas_tecnicas f
  LEFT JOIN tipos_fio tf ON tf.id = f.tipo_fio_id
  LEFT JOIN espulas   e  ON e.id  = f.espula_id
  WHERE f.ativo = TRUE
  ORDER BY f.nome;


-- ================================================================
-- 9. SEED: Usuários iniciais
-- ================================================================
INSERT INTO usuarios (id, login, hash, nome, perfil, ativo) VALUES
  ('u_leonardo', 'leonardo', 'pcp2026', 'Leonardo', 'Admin',    TRUE),
  ('u_operador', 'operador', 'op1234',  'Operador', 'Operador', TRUE)
ON CONFLICT (login) DO NOTHING;


-- ================================================================
-- 10. SEED: Tipos de Fio base
-- ================================================================
INSERT INTO tipos_fio (nome, material, titulo, g_por_metro, obs) VALUES
  ('POL-150d/48f',    'Poliéster',     '150d/48f',  0.01665, 'Poliéster texturizado 150 denier, 48 filamentos'),
  ('POL-210d/96f',    'Poliéster',     '210d/96f',  0.02331, 'Poliéster texturizado 210 denier, 96 filamentos'),
  ('POL-300d',        'Poliéster',     '300d',      0.03330, 'Poliéster multifilamento 300 denier'),
  ('NYL-0.8mm',       'Nylon',         '0,8mm',     NULL,    'Nylon monofilamento 0,8 mm'),
  ('PP-210d',         'Polipropileno', '210d',      0.02331, 'Polipropileno 210 denier'),
  ('ELA-5mm',         'Elástico',      '5mm',       NULL,    'Elástico plano 5 mm de largura')
ON CONFLICT (nome) DO NOTHING;


-- ================================================================
-- 11. SEED: Espulas base
-- ================================================================
INSERT INTO espulas (nome, cor, peso_vazio_g, material, obs) VALUES
  ('Espula Branca Padrão',    'Branca',    53.3,  'Plástico', 'Espula branca padrão — D₀ 6cm, Dmax 13cm, comp 14cm'),
  ('Espula Vermelha Padrão',  'Vermelha',  31.2,  'Plástico', 'Espula vermelha padrão — D₀ 6cm, Dmax 12,5cm, comp 11cm'),
  ('Espula Verde Padrão',     'Verde',     NULL,  'Plástico', 'Espula verde — parâmetros a calibrar')
ON CONFLICT (nome) DO NOTHING;


-- ================================================================
-- 12. SEED: Fichas Técnicas base (com FKs)
-- ================================================================
DO $$
DECLARE
  id_pol_150  UUID;
  id_branca   UUID;
  id_vermelha UUID;
BEGIN
  SELECT id INTO id_pol_150  FROM tipos_fio WHERE nome = 'POL-150d/48f';
  SELECT id INTO id_branca   FROM espulas   WHERE nome = 'Espula Branca Padrão';
  SELECT id INTO id_vermelha FROM espulas   WHERE nome = 'Espula Vermelha Padrão';

  INSERT INTO fichas_tecnicas
    (nome, material, fios, d0, diam, comp, pmax, mmax, espula, obs,
     tipo_fio_id, espula_id, peso_espula_cheia_g)
  VALUES
    (
      'POL-3F-720M-BRANCA', 'Poliéster', 3, 6.0, 13.0, 14.0, 60, 720, 'Branca',
      'Ficha base confirmada por pesagem (massa fio 96,7g) e medição. 12,00 m/pulso. K=40,21 v/p.',
      id_pol_150, id_branca, 150.0
    ),
    (
      'POL-3F-663M-VERMELHA', 'Poliéster', 3, 6.0, 12.5, 11.0, 58, 663, 'Vermelha',
      'Metragem estimada por método de massa (89,1g ÷ 0,13431 g/m ≈ 663m). Confirmar medindo na máquina.',
      id_pol_150, id_vermelha, 120.3
    )
  ON CONFLICT (nome, ativo) DO NOTHING;
END $$;


-- ================================================================
-- FIM DO SCRIPT v6
-- Verificar:
--   SELECT * FROM usuarios;
--   SELECT * FROM tipos_fio;
--   SELECT * FROM espulas;
--   SELECT * FROM fichas_tecnicas;
--   SELECT * FROM fichas_ativas;
-- ================================================================
