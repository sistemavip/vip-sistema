-- Corrigir search_path nas funções criadas para segurança

-- Recriar função generate_cliente_codigo com search_path seguro
CREATE OR REPLACE FUNCTION generate_cliente_codigo()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  codigo TEXT;
BEGIN
  -- Pegar próximo número da sequência
  next_num := nextval('clientes_codigo_seq');
  
  -- Formatar com zeros à esquerda (4 dígitos)
  codigo := 'CLI-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN codigo;
END;
$$;

-- Recriar função set_cliente_codigo com search_path seguro
CREATE OR REPLACE FUNCTION set_cliente_codigo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se código não foi fornecido, gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_cliente_codigo();
  END IF;
  RETURN NEW;
END;
$$;