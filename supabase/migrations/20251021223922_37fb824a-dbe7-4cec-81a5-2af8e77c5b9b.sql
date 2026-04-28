-- Remover políticas antigas de custos que podem estar causando problemas
DROP POLICY IF EXISTS "Admins podem criar custos" ON public.custos;
DROP POLICY IF EXISTS "Admins podem atualizar custos" ON public.custos;
DROP POLICY IF EXISTS "Admins podem deletar custos" ON public.custos;
DROP POLICY IF EXISTS "Admins podem ver custos" ON public.custos;

-- Criar novas políticas mais permissivas para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver custos" 
ON public.custos 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar custos" 
ON public.custos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar custos" 
ON public.custos 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar custos" 
ON public.custos 
FOR DELETE 
USING (auth.role() = 'authenticated');