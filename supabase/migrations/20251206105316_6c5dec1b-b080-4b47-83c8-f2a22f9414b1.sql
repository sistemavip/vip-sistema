-- Remover policy problemática que causa erro de permissão
DROP POLICY IF EXISTS "Usuarios podem ver pedidos direcionados a eles" ON ordens_servico;

-- Criar policy corrigida usando auth.email() em vez de subquery em auth.users
CREATE POLICY "Usuarios podem ver pedidos direcionados a eles" 
ON ordens_servico FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    cliente_email_vinculo IS NOT NULL 
    AND cliente_email_vinculo = auth.email()
  )
);