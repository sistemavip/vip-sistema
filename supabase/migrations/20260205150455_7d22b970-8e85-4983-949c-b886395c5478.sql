-- Adicionar novos campos à tabela orcamentos para suportar o formato completo do template
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS contato_nome text,
ADD COLUMN IF NOT EXISTS contato_telefone text,
ADD COLUMN IF NOT EXISTS contato_email text,
ADD COLUMN IF NOT EXISTS local_servico text,
ADD COLUMN IF NOT EXISTS escopo_servico jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS material_vip jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS material_cliente jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS valores_detalhados jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS endereco_entrega text,
ADD COLUMN IF NOT EXISTS horario_recebimento text,
ADD COLUMN IF NOT EXISTS condicoes_frete text,
ADD COLUMN IF NOT EXISTS forma_pagamento text,
ADD COLUMN IF NOT EXISTS normas_gerais text,
ADD COLUMN IF NOT EXISTS prazo_execucao text,
ADD COLUMN IF NOT EXISTS validade_orcamento integer DEFAULT 3;

-- Adicionar policy para permitir delete de orçamentos (estava faltando)
CREATE POLICY "Admins podem deletar orçamentos" 
ON public.orcamentos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));