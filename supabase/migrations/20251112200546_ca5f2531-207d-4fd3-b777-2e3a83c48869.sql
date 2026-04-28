-- Adicionar campo empresa à tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS empresa TEXT;

-- Adicionar campo para anexos (armazenar array de objetos com nome, url, data_upload)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;

-- Criar sequência para numeração automática
CREATE SEQUENCE IF NOT EXISTS clientes_codigo_seq START 1;

-- Criar função para gerar código automático formatado (CLI-0001, CLI-0002, etc)
CREATE OR REPLACE FUNCTION generate_cliente_codigo()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Criar função de trigger para gerar código automaticamente ao inserir novo cliente
CREATE OR REPLACE FUNCTION set_cliente_codigo()
RETURNS TRIGGER AS $$
BEGIN
  -- Se código não foi fornecido, gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_cliente_codigo();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_set_cliente_codigo ON clientes;

-- Criar trigger para gerar código automaticamente
CREATE TRIGGER trigger_set_cliente_codigo
  BEFORE INSERT ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION set_cliente_codigo();

-- Atualizar clientes existentes sem código ou com código vazio para formato CLI-XXXX
DO $$
DECLARE
  cliente_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR cliente_record IN 
    SELECT id FROM clientes 
    WHERE codigo IS NULL OR codigo = '' 
    ORDER BY created_at
  LOOP
    UPDATE clientes 
    SET codigo = 'CLI-' || LPAD(counter::TEXT, 4, '0')
    WHERE id = cliente_record.id;
    
    counter := counter + 1;
  END LOOP;
  
  -- Ajustar a sequência para começar após o último código atribuído
  PERFORM setval('clientes_codigo_seq', counter);
END $$;