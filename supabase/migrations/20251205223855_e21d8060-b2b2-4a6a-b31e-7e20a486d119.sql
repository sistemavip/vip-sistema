-- Adicionar coluna etapa_producao na tabela ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS etapa_producao integer DEFAULT 0;

-- Adicionar coluna user_id na tabela clientes para vincular ao usuário autenticado
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna cliente_email_vinculo para admin direcionar pedidos por email
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS cliente_email_vinculo text;

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_email ON public.ordens_servico(cliente_email_vinculo);

-- Criar índice para busca por user_id em clientes
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

-- RLS Policy: Usuários (não admin) podem ver pedidos direcionados ao seu email
CREATE POLICY "Usuarios podem ver pedidos direcionados a eles"
ON public.ordens_servico
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    cliente_email_vinculo IS NOT NULL 
    AND cliente_email_vinculo = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- RLS Policy: Usuários podem ver seus próprios dados de cliente
CREATE POLICY "Usuarios podem ver seu proprio cliente"
ON public.clientes
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);