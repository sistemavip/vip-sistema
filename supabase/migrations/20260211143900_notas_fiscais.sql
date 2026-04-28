-- Controle de Emissão de Notas Fiscais
CREATE TABLE public.notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_emissao date,
  numero_nf text NOT NULL,
  responsavel text,
  tipo text,
  valor numeric DEFAULT 0,
  descricao text,
  vencimento date,
  valor_imposto_pct numeric DEFAULT 0,
  data_pagamento date,
  status text DEFAULT 'EM ABERTO' CHECK (status IN ('PAGA', 'EM ABERTO')),
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar notas fiscais"
ON public.notas_fiscais
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
