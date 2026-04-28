-- ==========================================
-- FASE 3: Custos, Envios e Estoque por Cliente
-- ==========================================

-- 1. REFORMULAR TABELA CUSTOS
-- Adicionar vinculação com orçamentos e campos de cálculo automático
ALTER TABLE public.custos 
ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS insumo TEXT NOT NULL DEFAULT 'Insumo não especificado',
ADD COLUMN IF NOT EXISTS quantidade NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_com_imposto NUMERIC GENERATED ALWAYS AS (valor_unitario * 1.15) STORED,
ADD COLUMN IF NOT EXISTS valor_com_lucro NUMERIC GENERATED ALWAYS AS (valor_unitario * 1.15 * 1.40) STORED,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC GENERATED ALWAYS AS (valor_unitario * 1.15 * 1.40 * quantidade) STORED;

-- Remover colunas antigas que não são mais necessárias
ALTER TABLE public.custos 
DROP COLUMN IF EXISTS categoria,
DROP COLUMN IF EXISTS data;

-- Renomear coluna 'valor' para 'valor_unitario' se ainda existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custos' AND column_name = 'valor'
  ) THEN
    ALTER TABLE public.custos RENAME COLUMN valor TO valor_real;
  END IF;
END $$;

-- 2. MELHORIAS NA TABELA ENVIOS
-- Adicionar campos para calculadora de frete avançada
ALTER TABLE public.envios
ADD COLUMN IF NOT EXISTS altura NUMERIC,
ADD COLUMN IF NOT EXISTS largura NUMERIC,
ADD COLUMN IF NOT EXISTS profundidade NUMERIC,
ADD COLUMN IF NOT EXISTS modalidade_envio TEXT CHECK (modalidade_envio IN ('com_contrato', 'sem_contrato')),
ADD COLUMN IF NOT EXISTS numero_orcamento TEXT;

-- Criar índice para busca por número de orçamento
CREATE INDEX IF NOT EXISTS idx_envios_numero_orcamento ON public.envios(numero_orcamento);
CREATE INDEX IF NOT EXISTS idx_envios_codigo_rastreio ON public.envios(codigo_rastreio);

-- 3. CRIAR TABELA DE ESTOQUE POR CLIENTE
CREATE TABLE IF NOT EXISTS public.estoque_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  item_descricao TEXT NOT NULL,
  foto_url TEXT,
  quantidade_entrada NUMERIC DEFAULT 0,
  quantidade_saida NUMERIC DEFAULT 0,
  saldo NUMERIC GENERATED ALWAYS AS (quantidade_entrada - quantidade_saida) STORED,
  data_entrada DATE,
  data_saida DATE,
  destino_saida TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para estoque_cliente
ALTER TABLE public.estoque_cliente ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para estoque_cliente
CREATE POLICY "Admins podem gerenciar estoque cliente"
ON public.estoque_cliente
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at em estoque_cliente
CREATE TRIGGER update_estoque_cliente_updated_at
BEFORE UPDATE ON public.estoque_cliente
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_estoque_cliente_cliente_id ON public.estoque_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estoque_cliente_orcamento_id ON public.estoque_cliente(orcamento_id);

-- 4. ATUALIZAR RLS POLICIES PARA CUSTOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver custos" ON public.custos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar custos" ON public.custos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar custos" ON public.custos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar custos" ON public.custos;

CREATE POLICY "Admins podem gerenciar custos"
ON public.custos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));