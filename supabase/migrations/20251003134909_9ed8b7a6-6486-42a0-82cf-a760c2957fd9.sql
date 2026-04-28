-- Criar tabela de produtos para o RAG Agent
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  estoque_min INTEGER NOT NULL DEFAULT 5,
  preco DECIMAL(10,2) NOT NULL,
  vendidos INTEGER DEFAULT 0,
  descricao TEXT,
  imagem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler (para o RAG Agent funcionar)
CREATE POLICY "Leitura pública de produtos"
  ON public.produtos
  FOR SELECT
  USING (true);

-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cpf_cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de clientes"
  ON public.clientes
  FOR SELECT
  USING (true);

-- Criar tabela de orçamentos
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_sequencial SERIAL,
  cliente_id UUID REFERENCES public.clientes(id),
  codigo_cliente TEXT,
  status TEXT DEFAULT 'pendente',
  itens JSONB,
  valor_total DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de orçamentos"
  ON public.orcamentos
  FOR SELECT
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.produtos (codigo, nome, categoria, estoque, estoque_min, preco, vendidos, descricao, imagem) VALUES
('P001', 'Vestido Longo Festa', 'Vestidos', 12, 5, 180.00, 8, 'Vestido elegante para festas', '🎀'),
('P002', 'Camisa Social Masculina', 'Camisas', 3, 10, 85.00, 15, 'Camisa social de alta qualidade', '👔'),
('P003', 'Blazer Executivo', 'Blazers', 7, 5, 220.00, 12, 'Blazer profissional', '🧥'),
('P004', 'Saia Midi Plissada', 'Saias', 1, 8, 95.00, 6, 'Saia midi elegante', '👗'),
('P005', 'Calça Pantalona', 'Calças', 18, 10, 120.00, 10, 'Calça pantalona confortável', '👖'),
('P006', 'Blusa Manga Longa', 'Blusas', 4, 12, 65.00, 20, 'Blusa casual manga longa', '👚');

INSERT INTO public.clientes (codigo, nome, email, telefone, cidade, estado) VALUES
('C001', 'Maria Silva', 'maria@email.com', '(11) 98765-4321', 'São Paulo', 'SP'),
('C002', 'João Santos', 'joao@email.com', '(21) 97654-3210', 'Rio de Janeiro', 'RJ'),
('C003', 'Ana Costa', 'ana@email.com', '(31) 96543-2109', 'Belo Horizonte', 'MG');