-- Primeiro removemos a restrição UNIQUE, pois múltiplos clientes de mesma empresa poderão compartilhar o mesmo código (ex: CLI-0001)
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_codigo_key;

-- Atualizamos a função setter do trigger
CREATE OR REPLACE FUNCTION set_cliente_codigo()
RETURNS TRIGGER AS $$
DECLARE
  existing_codigo TEXT;
BEGIN
  -- Se o cliente tiver uma empresa preenchida, verificamos se já existe um código associado a ela
  IF NEW.empresa IS NOT NULL AND TRIM(NEW.empresa) != '' THEN
    SELECT codigo INTO existing_codigo
    FROM public.clientes
    WHERE LOWER(TRIM(empresa)) = LOWER(TRIM(NEW.empresa))
      AND id != NEW.id
    ORDER BY created_at ASC
    LIMIT 1;

    IF existing_codigo IS NOT NULL THEN
      -- Se encontrou, usa o mesmo código
      NEW.codigo := existing_codigo;
      RETURN NEW;
    END IF;
  END IF;

  -- Se código não foi fornecido (ou empresa não tem registro ainda), gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_cliente_codigo();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
