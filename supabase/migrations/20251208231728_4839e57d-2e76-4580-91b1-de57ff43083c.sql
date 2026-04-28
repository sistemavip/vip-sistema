-- Remover políticas duplicadas/antigas da tabela clientes
DROP POLICY IF EXISTS "Admins can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem criar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem deletar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios podem ver seu proprio cliente" ON public.clientes;

-- Garantir que RLS está habilitado (força deny por padrão para não autenticados)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Garantir que a tabela não permite acesso público (força autenticação)
ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;

-- Política SELECT: Admins veem todos, usuários veem apenas seu próprio registro
CREATE POLICY "clientes_select_policy" ON public.clientes
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- Política INSERT: Apenas admins podem criar clientes
CREATE POLICY "clientes_insert_policy" ON public.clientes
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política UPDATE: Admins podem atualizar qualquer cliente
CREATE POLICY "clientes_update_policy" ON public.clientes
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política DELETE: Apenas admins podem deletar clientes
CREATE POLICY "clientes_delete_policy" ON public.clientes
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));