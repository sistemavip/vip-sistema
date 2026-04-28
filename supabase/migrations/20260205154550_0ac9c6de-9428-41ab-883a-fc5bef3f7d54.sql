-- Contas bancárias
CREATE TABLE public.contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor_inicial numeric DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar contas bancarias"
ON public.contas_bancarias
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Movimentações financeiras (fluxo de caixa)
CREATE TABLE public.movimentacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor numeric NOT NULL DEFAULT 0,
  descricao_os text,
  item text,
  job text,
  nota_recibo text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar movimentacoes"
ON public.movimentacoes_financeiras
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Provisões de pagamento (contas a pagar)
CREATE TABLE public.provisoes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date,
  item text,
  descricao text NOT NULL,
  valor numeric DEFAULT 0,
  job text,
  pago boolean DEFAULT false,
  data_pagamento date,
  mes_referencia text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provisoes_pagamento ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar provisoes pagamento"
ON public.provisoes_pagamento
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Provisões de recebimento (contas a receber)
CREATE TABLE public.provisoes_recebimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date,
  item text,
  nome text NOT NULL,
  valor numeric DEFAULT 0,
  nota text,
  pago boolean DEFAULT false,
  data_recebimento date,
  mes_referencia text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provisoes_recebimento ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar provisoes recebimento"
ON public.provisoes_recebimento
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));