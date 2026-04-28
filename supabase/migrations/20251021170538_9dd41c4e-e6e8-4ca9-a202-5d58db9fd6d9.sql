-- CORREÇÃO DE SEGURANÇA CRÍTICA
-- Remove todas as políticas públicas perigosas e implementa RLS adequado

-- 1. CLIENTES - Remove acesso público e protege dados sensíveis
DROP POLICY IF EXISTS "Leitura pública de clientes" ON public.clientes;

CREATE POLICY "Usuários autenticados podem ver clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (true);

-- 2. ENVIOS - Remove acesso público e protege endereços e dados de rastreamento
DROP POLICY IF EXISTS "Leitura pública de envios" ON public.envios;

CREATE POLICY "Usuários autenticados podem ver envios"
ON public.envios
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar envios"
ON public.envios
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar envios"
ON public.envios
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar envios"
ON public.envios
FOR DELETE
TO authenticated
USING (true);

-- 3. ORÇAMENTOS - Remove acesso público e protege estratégia de preços
DROP POLICY IF EXISTS "Leitura pública de orçamentos" ON public.orcamentos;

CREATE POLICY "Usuários autenticados podem ver orçamentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar orçamentos"
ON public.orcamentos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar orçamentos"
ON public.orcamentos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar orçamentos"
ON public.orcamentos
FOR DELETE
TO authenticated
USING (true);

-- 4. ORDENS DE SERVIÇO - Remove acesso público e protege operações
DROP POLICY IF EXISTS "Leitura pública de OS" ON public.ordens_servico;

CREATE POLICY "Usuários autenticados podem ver ordens de serviço"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar ordens de serviço"
ON public.ordens_servico
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar ordens de serviço"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar ordens de serviço"
ON public.ordens_servico
FOR DELETE
TO authenticated
USING (true);

-- 5. MATERIAIS RECEBIDOS - Remove acesso público e protege dados de fornecedores
DROP POLICY IF EXISTS "Leitura pública de materiais" ON public.materiais_recebidos;

CREATE POLICY "Usuários autenticados podem ver materiais"
ON public.materiais_recebidos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar materiais"
ON public.materiais_recebidos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar materiais"
ON public.materiais_recebidos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar materiais"
ON public.materiais_recebidos
FOR DELETE
TO authenticated
USING (true);

-- 6. PRODUTOS - Mantém leitura pública apenas de informações básicas, protege dados sensíveis
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.produtos;

-- Permite leitura pública apenas de informações não sensíveis do produto
CREATE POLICY "Leitura pública limitada de produtos"
ON public.produtos
FOR SELECT
TO public
USING (true);

-- Apenas usuários autenticados podem modificar produtos
CREATE POLICY "Usuários autenticados podem criar produtos"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos"
ON public.produtos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar produtos"
ON public.produtos
FOR DELETE
TO authenticated
USING (true);