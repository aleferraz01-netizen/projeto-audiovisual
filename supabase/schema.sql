-- ============================================
-- SCHEMA: Sistema de Orcamento Audiovisual
-- ============================================

-- Tabela de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT,
  cpf_cnpj TEXT,
  tipo_documento TEXT CHECK (tipo_documento IN ('cpf', 'cnpj')),
  contato TEXT,
  telefone TEXT,
  email TEXT,
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de equipamentos
CREATE TABLE equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de eventos
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome_evento TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  data_fim DATE NOT NULL,
  hora_fim TIME NOT NULL,
  local TEXT,
  participantes INTEGER,
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'realizado', 'cancelado')),
  observacoes TEXT,
  equipe_escala TEXT,
  equipamentos_reservados TEXT,
  horario_montagem TEXT,
  horario_desmontagem TEXT,
  responsavel_tecnico TEXT,
  observacoes_operacionais TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de orcamentos
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL,
  numero_orcamento TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'em_negociacao', 'aprovado', 'cancelado')),
  nome_evento TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  data_fim DATE NOT NULL,
  hora_fim TIME NOT NULL,
  local TEXT,
  participantes INTEGER,
  observacoes TEXT,
  subtotal_traducao NUMERIC(10,2) DEFAULT 0,
  subtotal_sonorizacao NUMERIC(10,2) DEFAULT 0,
  subtotal_filmagem NUMERIC(10,2) DEFAULT 0,
  subtotal_recursos_humanos NUMERIC(10,2) DEFAULT 0,
  subtotal_projetores NUMERIC(10,2) DEFAULT 0,
  subtotal_geral NUMERIC(10,2) DEFAULT 0,
  transporte NUMERIC(10,2) DEFAULT 0,
  desconto NUMERIC(10,2) DEFAULT 0,
  impostos NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  validade_dias INTEGER DEFAULT 30,
  modo_pdf TEXT DEFAULT 'simplificado' CHECK (modo_pdf IN ('simplificado', 'detalhado')),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de itens do orcamento
CREATE TABLE orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  equipamento_id UUID REFERENCES equipamentos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  dias INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ordem INTEGER DEFAULT 0
);

-- Tabela de kits prontos
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de itens do kit
CREATE TABLE kit_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  equipamento_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
  quantidade_padrao INTEGER NOT NULL DEFAULT 1
);

-- Tabela de execucao do evento
CREATE TABLE execucao_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE UNIQUE,
  equipe_real TEXT,
  equipamentos_reais TEXT,
  ocorrencias TEXT,
  custo_extra NUMERIC(10,2) DEFAULT 0,
  observacoes_finais TEXT,
  encerrado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de fornecedores do evento
CREATE TABLE fornecedores_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id UUID REFERENCES execucao_evento(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de despesas mensais
CREATE TABLE despesas_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('salario', 'prolabore', 'luz', 'aluguel', 'equipamento', 'transporte', 'alimentacao', 'outros')),
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de transacoes financeiras
CREATE TABLE transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  categoria TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_orcamentos_numero ON orcamentos(numero_orcamento);
CREATE INDEX idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);
CREATE INDEX idx_eventos_cliente ON eventos(cliente_id);
CREATE INDEX idx_eventos_data ON eventos(data_inicio);
CREATE INDEX idx_eventos_status ON eventos(status);
CREATE INDEX idx_transacoes_data ON transacoes_financeiras(data);
CREATE INDEX idx_transacoes_tipo ON transacoes_financeiras(tipo);
CREATE INDEX idx_despesas_data ON despesas_mensais(data);

-- ============================================
-- RLS (Row Level Security) - Habilitar conforme necessario
-- ============================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucao_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Politicas para usuarios autenticados (ajuste conforme necessario)
CREATE POLICY "Allow all for authenticated users" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON equipamentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON eventos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON orcamentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON orcamento_itens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON kits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON kit_itens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON execucao_evento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON fornecedores_evento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON despesas_mensais FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON transacoes_financeiras FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCAO: Gerar numero do orcamento
-- ============================================
CREATE OR REPLACE FUNCTION gerar_numero_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  proximo_numero INTEGER;
  novo_numero TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orcamento FROM 5 FOR 4) AS INTEGER)), 0) + 1
  INTO proximo_numero
  FROM orcamentos
  WHERE numero_orcamento LIKE 'ORC-' || TO_CHAR(NOW(), 'YYYY') || '%';

  novo_numero := 'ORC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(proximo_numero::TEXT, 4, '0');
  NEW.numero_orcamento := novo_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_numero_orcamento
  BEFORE INSERT ON orcamentos
  FOR EACH ROW
  WHEN (NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '')
  EXECUTE FUNCTION gerar_numero_orcamento();

-- ============================================
-- FUNCAO: Atualizar updated_em
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orcamentos
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
