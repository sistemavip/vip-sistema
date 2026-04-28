-- Políticas RLS baseadas em roles para proteger dados sensíveis

-- CLIENTES: Apenas admins podem ver/modificar
DROP POLICY IF EXISTS "Usuários autenticados podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem criar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar clientes" ON public.clientes;

CREATE POLICY "Admins podem ver clientes" ON public.clientes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar clientes" ON public.clientes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar clientes" ON public.clientes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ENVIOS: Apenas admins
DROP POLICY IF EXISTS "Usuários autenticados podem ver envios" ON public.envios;
DROP POLICY IF EXISTS "Usuários autenticados podem criar envios" ON public.envios;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar envios" ON public.envios;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar envios" ON public.envios;

CREATE POLICY "Admins podem ver envios" ON public.envios FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar envios" ON public.envios FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar envios" ON public.envios FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar envios" ON public.envios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORÇAMENTOS: Apenas admins
DROP POLICY IF EXISTS "Usuários autenticados podem ver orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar orçamentos" ON public.orcamentos;

CREATE POLICY "Admins podem ver orçamentos" ON public.orcamentos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar orçamentos" ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar orçamentos" ON public.orcamentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDENS DE SERVIÇO: Apenas admins
DROP POLICY IF EXISTS "Usuários autenticados podem ver ordens de serviço" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem criar ordens de serviço" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar ordens de serviço" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar ordens de serviço" ON public.ordens_servico;

CREATE POLICY "Admins podem ver OS" ON public.ordens_servico FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar OS" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar OS" ON public.ordens_servico FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MATERIAIS: Apenas admins
DROP POLICY IF EXISTS "Usuários autenticados podem ver materiais" ON public.materiais_recebidos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar materiais" ON public.materiais_recebidos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar materiais" ON public.materiais_recebidos;

CREATE POLICY "Admins podem ver materiais" ON public.materiais_recebidos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar materiais" ON public.materiais_recebidos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PRODUTOS: Escrita apenas para admins
DROP POLICY IF EXISTS "Usuários autenticados podem criar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar produtos" ON public.produtos;

CREATE POLICY "Admins podem criar produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar produtos" ON public.produtos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar produtos" ON public.produtos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES: Usuários veem apenas seu próprio perfil
CREATE POLICY "Usuários veem próprio perfil" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());