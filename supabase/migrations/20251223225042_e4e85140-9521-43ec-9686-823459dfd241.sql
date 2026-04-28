-- Remover política DELETE perigosa que permite qualquer usuário deletar materiais
DROP POLICY IF EXISTS "Usuários autenticados podem deletar materiais" ON public.materiais_recebidos;