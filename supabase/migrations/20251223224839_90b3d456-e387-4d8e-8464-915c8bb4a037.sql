-- Adicionar política para que usuários vejam seus próprios envios
-- Através do vínculo: envios.cliente_id -> clientes.user_id

CREATE POLICY "Usuarios podem ver seus proprios envios"
ON public.envios
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = envios.cliente_id
    AND clientes.user_id = auth.uid()
  )
);