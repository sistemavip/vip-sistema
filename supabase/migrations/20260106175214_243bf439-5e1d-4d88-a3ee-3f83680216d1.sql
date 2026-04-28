-- 1. Corrigir função handle_new_user para dar admin apenas ao primeiro usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Primeiro usuário recebe 'admin', demais recebem 'user'
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Remover políticas públicas e duplicadas de produtos
DROP POLICY IF EXISTS "Leitura pública limitada de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can update produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can delete produtos" ON public.produtos;

-- Criar política para usuários autenticados lerem produtos
CREATE POLICY "Authenticated users can read produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

-- 3. Remover política pública de modelos_orcamento
DROP POLICY IF EXISTS "Leitura pública de modelos" ON public.modelos_orcamento;

-- Criar política restrita a admins
CREATE POLICY "Admins can read modelos"
  ON public.modelos_orcamento FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 4. Remover política pública de secoes
DROP POLICY IF EXISTS "Leitura pública de seções" ON public.secoes;

-- Criar política para usuários autenticados
CREATE POLICY "Authenticated users can read secoes"
  ON public.secoes FOR SELECT
  TO authenticated
  USING (true);

-- 5. Proteger audit_logs de manipulação direta
CREATE POLICY "Prevent direct audit_logs inserts"
  ON public.audit_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Prevent audit_logs updates"
  ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Prevent audit_logs deletes"
  ON public.audit_logs FOR DELETE
  USING (false);

-- 6. Remover políticas duplicadas de orcamentos
DROP POLICY IF EXISTS "Admins can insert orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admins can update orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admins can delete orcamentos" ON public.orcamentos;

-- 7. Remover políticas duplicadas de envios
DROP POLICY IF EXISTS "Admins podem ver envios" ON public.envios;
DROP POLICY IF EXISTS "Admins podem criar envios" ON public.envios;
DROP POLICY IF EXISTS "Admins podem atualizar envios" ON public.envios;
DROP POLICY IF EXISTS "Admins podem deletar envios" ON public.envios;

-- 8. Remover políticas duplicadas de materiais_recebidos
DROP POLICY IF EXISTS "Admins podem ver materiais" ON public.materiais_recebidos;
DROP POLICY IF EXISTS "Admins podem criar materiais" ON public.materiais_recebidos;

-- 9. Remover políticas duplicadas de ordens_servico
DROP POLICY IF EXISTS "Admins podem ver OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins podem criar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins podem atualizar OS" ON public.ordens_servico;