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
CREATE POLICY "Leitura pÃºblica de produtos"
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

CREATE POLICY "Leitura pÃºblica de clientes"
  ON public.clientes
  FOR SELECT
  USING (true);

-- Criar tabela de orÃ§amentos
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

CREATE POLICY "Leitura pÃºblica de orÃ§amentos"
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
('P001', 'Vestido Longo Festa', 'Vestidos', 12, 5, 180.00, 8, 'Vestido elegante para festas', 'ðŸŽ€'),
('P002', 'Camisa Social Masculina', 'Camisas', 3, 10, 85.00, 15, 'Camisa social de alta qualidade', 'ðŸ‘”'),
('P003', 'Blazer Executivo', 'Blazers', 7, 5, 220.00, 12, 'Blazer profissional', 'ðŸ§¥'),
('P004', 'Saia Midi Plissada', 'Saias', 1, 8, 95.00, 6, 'Saia midi elegante', 'ðŸ‘—'),
('P005', 'CalÃ§a Pantalona', 'CalÃ§as', 18, 10, 120.00, 10, 'CalÃ§a pantalona confortÃ¡vel', 'ðŸ‘–'),
('P006', 'Blusa Manga Longa', 'Blusas', 4, 12, 65.00, 20, 'Blusa casual manga longa', 'ðŸ‘š');

INSERT INTO public.clientes (codigo, nome, email, telefone, cidade, estado) VALUES
('C001', 'Maria Silva', 'maria@email.com', '(11) 98765-4321', 'SÃ£o Paulo', 'SP'),
('C002', 'JoÃ£o Santos', 'joao@email.com', '(21) 97654-3210', 'Rio de Janeiro', 'RJ'),
('C003', 'Ana Costa', 'ana@email.com', '(31) 96543-2109', 'Belo Horizonte', 'MG');
-- Corrigir a funÃ§Ã£o update_updated_at_column adicionando search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Check if this is the first user
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    -- Make first user admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Regular users get 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for existing tables

-- produtos policies
DROP POLICY IF EXISTS "Admins can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can update produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can delete produtos" ON public.produtos;

CREATE POLICY "Admins can insert produtos"
  ON public.produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update produtos"
  ON public.produtos
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete produtos"
  ON public.produtos
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- clientes policies
DROP POLICY IF EXISTS "Admins can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can delete clientes" ON public.clientes;

CREATE POLICY "Admins can insert clientes"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clientes"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clientes"
  ON public.clientes
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- orcamentos policies
DROP POLICY IF EXISTS "Admins can insert orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admins can update orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admins can delete orcamentos" ON public.orcamentos;

CREATE POLICY "Admins can insert orcamentos"
  ON public.orcamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orcamentos"
  ON public.orcamentos
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orcamentos"
  ON public.orcamentos
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- Criar enum para tipos de serviÃ§o
CREATE TYPE public.tipo_servico AS ENUM (
  'chapelaria',
  'manuseio',
  'armazenamento',
  'envio',
  'montagem_kits',
  'confeccao'
);

-- Criar enum para status de OS
CREATE TYPE public.status_os AS ENUM (
  'orcamento',
  'aprovado',
  'em_andamento',
  'concluido',
  'cancelado',
  'coletado'
);

-- Tabela de modelos de orÃ§amento (templates)
CREATE TABLE public.modelos_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo_servico tipo_servico NOT NULL,
  descricao text,
  template_conteudo jsonb,
  valor_base numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de ordens de serviÃ§o
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os text UNIQUE NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id),
  tipo_servico tipo_servico NOT NULL,
  status status_os DEFAULT 'orcamento',
  data_solicitacao date DEFAULT CURRENT_DATE,
  data_execucao date,
  local_servico text,
  descricao_servico text,
  quantidade integer,
  valor_servico numeric,
  material_fornecido jsonb,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de envios
CREATE TABLE public.envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid REFERENCES public.ordens_servico(id),
  cliente_id uuid REFERENCES public.clientes(id),
  forma_envio text,
  codigo_rastreio text,
  cep_origem text,
  cep_destino text,
  destinatario_nome text NOT NULL,
  destinatario_endereco text,
  destinatario_numero text,
  destinatario_complemento text,
  destinatario_bairro text,
  destinatario_cidade text,
  destinatario_estado text,
  destinatario_telefone text,
  peso numeric,
  valor_frete numeric,
  prazo_entrega integer,
  data_postagem date,
  data_entrega date,
  status text DEFAULT 'pendente',
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de materiais recebidos
CREATE TABLE public.materiais_recebidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id uuid REFERENCES public.ordens_servico(id),
  fornecedor text,
  data_recebimento date DEFAULT CURRENT_DATE,
  tipo_embalagem text,
  quantidade_recebida integer,
  quantidade_utilizada integer DEFAULT 0,
  item_descricao text NOT NULL,
  nota_fiscal text,
  conferido boolean DEFAULT false,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de seÃ§Ãµes/categorias
CREATE TABLE public.secoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  icone text,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modelos_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_recebidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Leitura pÃºblica, escrita apenas para admins
CREATE POLICY "Leitura pÃºblica de modelos"
  ON public.modelos_orcamento FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar modelos"
  ON public.modelos_orcamento FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pÃºblica de OS"
  ON public.ordens_servico FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar OS"
  ON public.ordens_servico FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pÃºblica de envios"
  ON public.envios FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar envios"
  ON public.envios FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pÃºblica de materiais"
  ON public.materiais_recebidos FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar materiais"
  ON public.materiais_recebidos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pÃºblica de seÃ§Ãµes"
  ON public.secoes FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar seÃ§Ãµes"
  ON public.secoes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_modelos_orcamento_updated_at
  BEFORE UPDATE ON public.modelos_orcamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_envios_updated_at
  BEFORE UPDATE ON public.envios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiais_recebidos_updated_at
  BEFORE UPDATE ON public.materiais_recebidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Remover materiais recebidos que referenciam ordens de serviÃ§o de clientes fictÃ­cios
DELETE FROM materiais_recebidos WHERE ordem_servico_id IN (
  SELECT os.id FROM ordens_servico os
  INNER JOIN clientes c ON os.cliente_id = c.id
  WHERE c.codigo IN ('C001', 'C002', 'C003')
);

-- Remover ordens de serviÃ§o que referenciam clientes fictÃ­cios
DELETE FROM ordens_servico WHERE cliente_id IN (
  SELECT id FROM clientes WHERE codigo IN ('C001', 'C002', 'C003')
);

-- Remover produtos fictÃ­cios
DELETE FROM produtos WHERE codigo IN ('P001', 'P002', 'P003', 'P004', 'P005', 'P006');

-- Remover clientes fictÃ­cios
DELETE FROM clientes WHERE codigo IN ('C001', 'C002', 'C003');

-- Inserir produtos reais da planilha de custos
INSERT INTO produtos (codigo, nome, descricao, categoria, preco, estoque, estoque_min, vendidos) VALUES
('PROD001', 'Camiseta BIC AtacadÃ£o', 'Tecido: Meia Malha AlgodÃ£o', 'Camisetas', 25.00, 150, 20, 0),
('PROD002', 'Camiseta BIC', 'Tecido: Malha PV', 'Camisetas', 22.00, 120, 20, 0),
('PROD003', 'Camiseta Bradesco Atacado', 'Tecido: Piquet PA', 'Camisetas', 28.00, 100, 15, 0),
('PROD004', 'Ecobag BIC', '100% algodÃ£o, 42x47 cm', 'Ecobags', 18.00, 80, 15, 0),
('PROD005', 'Ecobag Petz', '100% algodÃ£o, 42x47 cm', 'Ecobags', 18.00, 75, 15, 0),
('PROD006', 'Jaleco Garbadine', 'Tecido: Garbadine', 'Jalecos', 65.00, 40, 10, 0),
('PROD007', 'Jaleco Microfibra', 'Tecido: Microfibra', 'Jalecos', 70.00, 35, 10, 0),
('PROD008', 'Camiseta Placas do Brasil', 'Tecido: Meia Malha Penteada 30.1', 'Camisetas', 24.00, 90, 15, 0),
('PROD009', 'Camiseta Bradesco Atacado PV', 'Tecido: Piquet PV 50% AlgodÃ£o + 50% PoliÃ©ster', 'Camisetas', 26.00, 110, 15, 0);
-- CORREÃ‡ÃƒO DE SEGURANÃ‡A CRÃTICA
-- Remove todas as polÃ­ticas pÃºblicas perigosas e implementa RLS adequado

-- 1. CLIENTES - Remove acesso pÃºblico e protege dados sensÃ­veis
DROP POLICY IF EXISTS "Leitura pÃºblica de clientes" ON public.clientes;

CREATE POLICY "UsuÃ¡rios autenticados podem ver clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem criar clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem deletar clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (true);

-- 2. ENVIOS - Remove acesso pÃºblico e protege endereÃ§os e dados de rastreamento
DROP POLICY IF EXISTS "Leitura pÃºblica de envios" ON public.envios;

CREATE POLICY "UsuÃ¡rios autenticados podem ver envios"
ON public.envios
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem criar envios"
ON public.envios
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar envios"
ON public.envios
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem deletar envios"
ON public.envios
FOR DELETE
TO authenticated
USING (true);

-- 3. ORÃ‡AMENTOS - Remove acesso pÃºblico e protege estratÃ©gia de preÃ§os
DROP POLICY IF EXISTS "Leitura pÃºblica de orÃ§amentos" ON public.orcamentos;

CREATE POLICY "UsuÃ¡rios autenticados podem ver orÃ§amentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem criar orÃ§amentos"
ON public.orcamentos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar orÃ§amentos"
ON public.orcamentos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem deletar orÃ§amentos"
ON public.orcamentos
FOR DELETE
TO authenticated
USING (true);

-- 4. ORDENS DE SERVIÃ‡O - Remove acesso pÃºblico e protege operaÃ§Ãµes
DROP POLICY IF EXISTS "Leitura pÃºblica de OS" ON public.ordens_servico;

CREATE POLICY "UsuÃ¡rios autenticados podem ver ordens de serviÃ§o"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem criar ordens de serviÃ§o"
ON public.ordens_servico
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar ordens de serviÃ§o"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem deletar ordens de serviÃ§o"
ON public.ordens_servico
FOR DELETE
TO authenticated
USING (true);

-- 5. MATERIAIS RECEBIDOS - Remove acesso pÃºblico e protege dados de fornecedores
DROP POLICY IF EXISTS "Leitura pÃºblica de materiais" ON public.materiais_recebidos;

CREATE POLICY "UsuÃ¡rios autenticados podem ver materiais"
ON public.materiais_recebidos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem criar materiais"
ON public.materiais_recebidos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar materiais"
ON public.materiais_recebidos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem deletar materiais"
ON public.materiais_recebidos
FOR DELETE
TO authenticated
USING (true);

-- 6. PRODUTOS - MantÃ©m leitura pÃºblica apenas de informaÃ§Ãµes bÃ¡sicas, protege dados sensÃ­veis
DROP POLICY IF EXISTS "Leitura pÃºblica de produtos" ON public.produtos;

-- Permite leitura pÃºblica apenas de informaÃ§Ãµes nÃ£o sensÃ­veis do produto
CREATE POLICY "Leitura pÃºblica limitada de produtos"
ON public.produtos
FOR SELECT
TO public
USING (true);

-- Apenas usuÃ¡rios autenticados podem modificar produtos
CREATE POLICY "UsuÃ¡rios autenticados podem criar produtos"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar produtos"
ON public.produtos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "UsuÃ¡rios autenticados podem deletar produtos"
ON public.produtos
FOR DELETE
TO authenticated
USING (true);
-- PolÃ­ticas RLS baseadas em roles para proteger dados sensÃ­veis

-- CLIENTES: Apenas admins podem ver/modificar
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar clientes" ON public.clientes;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar clientes" ON public.clientes;

CREATE POLICY "Admins podem ver clientes" ON public.clientes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar clientes" ON public.clientes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar clientes" ON public.clientes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ENVIOS: Apenas admins
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem ver envios" ON public.envios;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar envios" ON public.envios;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar envios" ON public.envios;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar envios" ON public.envios;

CREATE POLICY "Admins podem ver envios" ON public.envios FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar envios" ON public.envios FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar envios" ON public.envios FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar envios" ON public.envios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORÃ‡AMENTOS: Apenas admins
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem ver orÃ§amentos" ON public.orcamentos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar orÃ§amentos" ON public.orcamentos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar orÃ§amentos" ON public.orcamentos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar orÃ§amentos" ON public.orcamentos;

CREATE POLICY "Admins podem ver orÃ§amentos" ON public.orcamentos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar orÃ§amentos" ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar orÃ§amentos" ON public.orcamentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDENS DE SERVIÃ‡O: Apenas admins
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem ver ordens de serviÃ§o" ON public.ordens_servico;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar ordens de serviÃ§o" ON public.ordens_servico;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar ordens de serviÃ§o" ON public.ordens_servico;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar ordens de serviÃ§o" ON public.ordens_servico;

CREATE POLICY "Admins podem ver OS" ON public.ordens_servico FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar OS" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar OS" ON public.ordens_servico FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MATERIAIS: Apenas admins
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem ver materiais" ON public.materiais_recebidos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar materiais" ON public.materiais_recebidos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar materiais" ON public.materiais_recebidos;

CREATE POLICY "Admins podem ver materiais" ON public.materiais_recebidos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar materiais" ON public.materiais_recebidos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PRODUTOS: Escrita apenas para admins
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar produtos" ON public.produtos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar produtos" ON public.produtos;

CREATE POLICY "Admins podem criar produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar produtos" ON public.produtos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar produtos" ON public.produtos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES: UsuÃ¡rios veem apenas seu prÃ³prio perfil
CREATE POLICY "UsuÃ¡rios veem prÃ³prio perfil" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
-- Criar tabela para custos
CREATE TABLE public.custos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas RLS para custos
CREATE POLICY "Admins podem ver custos"
  ON public.custos
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar custos"
  ON public.custos
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar custos"
  ON public.custos
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar custos"
  ON public.custos
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_custos_updated_at
  BEFORE UPDATE ON public.custos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Remover polÃ­ticas antigas de custos que podem estar causando problemas
DROP POLICY IF EXISTS "Admins podem criar custos" ON public.custos;
DROP POLICY IF EXISTS "Admins podem atualizar custos" ON public.custos;
DROP POLICY IF EXISTS "Admins podem deletar custos" ON public.custos;
DROP POLICY IF EXISTS "Admins podem ver custos" ON public.custos;

-- Criar novas polÃ­ticas mais permissivas para usuÃ¡rios autenticados
CREATE POLICY "UsuÃ¡rios autenticados podem ver custos" 
ON public.custos 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "UsuÃ¡rios autenticados podem criar custos" 
ON public.custos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "UsuÃ¡rios autenticados podem atualizar custos" 
ON public.custos 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "UsuÃ¡rios autenticados podem deletar custos" 
ON public.custos 
FOR DELETE 
USING (auth.role() = 'authenticated');
-- ==========================================
-- FASE 3: Custos, Envios e Estoque por Cliente
-- ==========================================

-- 1. REFORMULAR TABELA CUSTOS
-- Adicionar vinculaÃ§Ã£o com orÃ§amentos e campos de cÃ¡lculo automÃ¡tico
ALTER TABLE public.custos 
ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS insumo TEXT NOT NULL DEFAULT 'Insumo nÃ£o especificado',
ADD COLUMN IF NOT EXISTS quantidade NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_com_imposto NUMERIC GENERATED ALWAYS AS (valor_unitario * 1.15) STORED,
ADD COLUMN IF NOT EXISTS valor_com_lucro NUMERIC GENERATED ALWAYS AS (valor_unitario * 1.15 * 1.40) STORED,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC GENERATED ALWAYS AS (valor_unitario * 1.15 * 1.40 * quantidade) STORED;

-- Remover colunas antigas que nÃ£o sÃ£o mais necessÃ¡rias
ALTER TABLE public.custos 
DROP COLUMN IF EXISTS categoria,
DROP COLUMN IF EXISTS data;

-- Renomear coluna 'valor' para 'valor_unitario' se ainda existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custos' AND column_name = 'valor'
  ) THEN
    ALTER TABLE public.custos RENAME COLUMN valor TO valor_real;
  END IF;
END $$;

-- 2. MELHORIAS NA TABELA ENVIOS
-- Adicionar campos para calculadora de frete avanÃ§ada
ALTER TABLE public.envios
ADD COLUMN IF NOT EXISTS altura NUMERIC,
ADD COLUMN IF NOT EXISTS largura NUMERIC,
ADD COLUMN IF NOT EXISTS profundidade NUMERIC,
ADD COLUMN IF NOT EXISTS modalidade_envio TEXT CHECK (modalidade_envio IN ('com_contrato', 'sem_contrato')),
ADD COLUMN IF NOT EXISTS numero_orcamento TEXT;

-- Criar Ã­ndice para busca por nÃºmero de orÃ§amento
CREATE INDEX IF NOT EXISTS idx_envios_numero_orcamento ON public.envios(numero_orcamento);
CREATE INDEX IF NOT EXISTS idx_envios_codigo_rastreio ON public.envios(codigo_rastreio);

-- 3. CRIAR TABELA DE ESTOQUE POR CLIENTE
CREATE TABLE IF NOT EXISTS public.estoque_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  item_descricao TEXT NOT NULL,
  foto_url TEXT,
  quantidade_entrada NUMERIC DEFAULT 0,
  quantidade_saida NUMERIC DEFAULT 0,
  saldo NUMERIC GENERATED ALWAYS AS (quantidade_entrada - quantidade_saida) STORED,
  data_entrada DATE,
  data_saida DATE,
  destino_saida TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para estoque_cliente
ALTER TABLE public.estoque_cliente ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas RLS para estoque_cliente
CREATE POLICY "Admins podem gerenciar estoque cliente"
ON public.estoque_cliente
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at em estoque_cliente
CREATE TRIGGER update_estoque_cliente_updated_at
BEFORE UPDATE ON public.estoque_cliente
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar Ã­ndices para performance
CREATE INDEX IF NOT EXISTS idx_estoque_cliente_cliente_id ON public.estoque_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estoque_cliente_orcamento_id ON public.estoque_cliente(orcamento_id);

-- 4. ATUALIZAR RLS POLICIES PARA CUSTOS
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem ver custos" ON public.custos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem criar custos" ON public.custos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem atualizar custos" ON public.custos;
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar custos" ON public.custos;

CREATE POLICY "Admins podem gerenciar custos"
ON public.custos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
-- Adicionar campo empresa Ã  tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS empresa TEXT;

-- Adicionar campo para anexos (armazenar array de objetos com nome, url, data_upload)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;

-- Criar sequÃªncia para numeraÃ§Ã£o automÃ¡tica
CREATE SEQUENCE IF NOT EXISTS clientes_codigo_seq START 1;

-- Criar funÃ§Ã£o para gerar cÃ³digo automÃ¡tico formatado (CLI-0001, CLI-0002, etc)
CREATE OR REPLACE FUNCTION generate_cliente_codigo()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  codigo TEXT;
BEGIN
  -- Pegar prÃ³ximo nÃºmero da sequÃªncia
  next_num := nextval('clientes_codigo_seq');
  
  -- Formatar com zeros Ã  esquerda (4 dÃ­gitos)
  codigo := 'CLI-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Criar funÃ§Ã£o de trigger para gerar cÃ³digo automaticamente ao inserir novo cliente
CREATE OR REPLACE FUNCTION set_cliente_codigo()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cÃ³digo nÃ£o foi fornecido, gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_cliente_codigo();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_set_cliente_codigo ON clientes;

-- Criar trigger para gerar cÃ³digo automaticamente
CREATE TRIGGER trigger_set_cliente_codigo
  BEFORE INSERT ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION set_cliente_codigo();

-- Atualizar clientes existentes sem cÃ³digo ou com cÃ³digo vazio para formato CLI-XXXX
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
  
  -- Ajustar a sequÃªncia para comeÃ§ar apÃ³s o Ãºltimo cÃ³digo atribuÃ­do
  PERFORM setval('clientes_codigo_seq', counter);
END $$;
-- Corrigir search_path nas funÃ§Ãµes criadas para seguranÃ§a

-- Recriar funÃ§Ã£o generate_cliente_codigo com search_path seguro
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
  -- Pegar prÃ³ximo nÃºmero da sequÃªncia
  next_num := nextval('clientes_codigo_seq');
  
  -- Formatar com zeros Ã  esquerda (4 dÃ­gitos)
  codigo := 'CLI-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN codigo;
END;
$$;

-- Recriar funÃ§Ã£o set_cliente_codigo com search_path seguro
CREATE OR REPLACE FUNCTION set_cliente_codigo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se cÃ³digo nÃ£o foi fornecido, gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_cliente_codigo();
  END IF;
  RETURN NEW;
END;
$$;
-- Adicionar campos de versionamento para ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS versao_anterior_id UUID REFERENCES ordens_servico(id),
ADD COLUMN IF NOT EXISTS motivo_revisao TEXT,
ADD COLUMN IF NOT EXISTS data_revisao TIMESTAMP WITH TIME ZONE;

-- Criar Ã­ndice para melhorar performance de consultas de versÃµes
CREATE INDEX IF NOT EXISTS idx_ordens_servico_versao_anterior ON ordens_servico(versao_anterior_id);

-- Adicionar comentÃ¡rios para documentaÃ§Ã£o
COMMENT ON COLUMN ordens_servico.versao IS 'NÃºmero da versÃ£o da OS (1, 2, 3...)';
COMMENT ON COLUMN ordens_servico.versao_anterior_id IS 'ReferÃªncia para a versÃ£o anterior desta OS';
COMMENT ON COLUMN ordens_servico.motivo_revisao IS 'Motivo da criaÃ§Ã£o de nova versÃ£o';
COMMENT ON COLUMN ordens_servico.data_revisao IS 'Data em que a revisÃ£o foi criada';
-- Atualizar funÃ§Ã£o para atribuir 'admin' a todos os novos usuÃ¡rios
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
  
  -- Todos os usuÃ¡rios recebem 'admin' automaticamente (sistema interno)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Adicionar role admin para usuÃ¡rios existentes que ainda nÃ£o tÃªm
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id AND ur.role = 'admin'
);
-- Adicionar coluna etapa_producao na tabela ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS etapa_producao integer DEFAULT 0;

-- Adicionar coluna user_id na tabela clientes para vincular ao usuÃ¡rio autenticado
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna cliente_email_vinculo para admin direcionar pedidos por email
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS cliente_email_vinculo text;

-- Criar Ã­ndice para busca por email
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_email ON public.ordens_servico(cliente_email_vinculo);

-- Criar Ã­ndice para busca por user_id em clientes
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

-- RLS Policy: UsuÃ¡rios (nÃ£o admin) podem ver pedidos direcionados ao seu email
CREATE POLICY "Usuarios podem ver pedidos direcionados a eles"
ON public.ordens_servico
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    cliente_email_vinculo IS NOT NULL 
    AND cliente_email_vinculo = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- RLS Policy: UsuÃ¡rios podem ver seus prÃ³prios dados de cliente
CREATE POLICY "Usuarios podem ver seu proprio cliente"
ON public.clientes
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);
-- Remover policy problemÃ¡tica que causa erro de permissÃ£o
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

-- Criar tabela de audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id uuid,
  user_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Ãndices para consultas eficientes
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver audit logs
CREATE POLICY "Admins podem ver audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- FunÃ§Ã£o de trigger para auditoria automÃ¡tica
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, user_id, user_email, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), auth.email(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, user_id, user_email, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), auth.email(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, user_id, user_email, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), auth.email(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar triggers Ã s tabelas sensÃ­veis
CREATE TRIGGER audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_ordens_servico
  AFTER INSERT OR UPDATE OR DELETE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_orcamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_envios
  AFTER INSERT OR UPDATE OR DELETE ON public.envios
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_custos
  AFTER INSERT OR UPDATE OR DELETE ON public.custos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
-- Create security_rules table for custom anomaly detection
CREATE TABLE public.security_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL,
  rule_name text NOT NULL,
  threshold_value integer,
  time_start time,
  time_end time,
  is_active boolean DEFAULT true,
  severity text DEFAULT 'warning',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security rules
CREATE POLICY "Admins podem gerenciar regras de seguranÃ§a"
  ON public.security_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default rules
INSERT INTO public.security_rules (rule_type, rule_name, threshold_value, time_start, time_end, severity, description) VALUES
  ('delete_threshold', 'Limite de ExclusÃµes', 10, NULL, NULL, 'danger', 'Alerta quando houver mais de X exclusÃµes em 24h'),
  ('off_hours_threshold', 'AÃ§Ãµes Fora do HorÃ¡rio', 5, NULL, NULL, 'warning', 'Alerta quando houver aÃ§Ãµes fora do horÃ¡rio comercial'),
  ('high_activity_threshold', 'Alta Atividade de UsuÃ¡rio', 50, NULL, NULL, 'warning', 'Alerta quando um usuÃ¡rio tiver mais de X aÃ§Ãµes em 24h'),
  ('business_hours', 'HorÃ¡rio Comercial', NULL, '07:00:00', '22:00:00', 'info', 'Define o horÃ¡rio comercial para detecÃ§Ã£o de anomalias');

-- Trigger for updated_at
CREATE TRIGGER update_security_rules_updated_at
  BEFORE UPDATE ON public.security_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Remover polÃ­ticas duplicadas/antigas da tabela clientes
DROP POLICY IF EXISTS "Admins can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem criar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem deletar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios podem ver seu proprio cliente" ON public.clientes;

-- Garantir que RLS estÃ¡ habilitado (forÃ§a deny por padrÃ£o para nÃ£o autenticados)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Garantir que a tabela nÃ£o permite acesso pÃºblico (forÃ§a autenticaÃ§Ã£o)
ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;

-- PolÃ­tica SELECT: Admins veem todos, usuÃ¡rios veem apenas seu prÃ³prio registro
CREATE POLICY "clientes_select_policy" ON public.clientes
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- PolÃ­tica INSERT: Apenas admins podem criar clientes
CREATE POLICY "clientes_insert_policy" ON public.clientes
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PolÃ­tica UPDATE: Admins podem atualizar qualquer cliente
CREATE POLICY "clientes_update_policy" ON public.clientes
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PolÃ­tica DELETE: Apenas admins podem deletar clientes
CREATE POLICY "clientes_delete_policy" ON public.clientes
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
-- Adicionar polÃ­tica para que usuÃ¡rios vejam seus prÃ³prios envios
-- AtravÃ©s do vÃ­nculo: envios.cliente_id -> clientes.user_id

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
-- Remover polÃ­tica DELETE perigosa que permite qualquer usuÃ¡rio deletar materiais
DROP POLICY IF EXISTS "UsuÃ¡rios autenticados podem deletar materiais" ON public.materiais_recebidos;
-- 1. Corrigir funÃ§Ã£o handle_new_user para dar admin apenas ao primeiro usuÃ¡rio
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
  
  -- Primeiro usuÃ¡rio recebe 'admin', demais recebem 'user'
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

-- 2. Remover polÃ­ticas pÃºblicas e duplicadas de produtos
DROP POLICY IF EXISTS "Leitura pÃºblica limitada de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can update produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins can delete produtos" ON public.produtos;

-- Criar polÃ­tica para usuÃ¡rios autenticados lerem produtos
CREATE POLICY "Authenticated users can read produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

-- 3. Remover polÃ­tica pÃºblica de modelos_orcamento
DROP POLICY IF EXISTS "Leitura pÃºblica de modelos" ON public.modelos_orcamento;

-- Criar polÃ­tica restrita a admins
CREATE POLICY "Admins can read modelos"
  ON public.modelos_orcamento FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 4. Remover polÃ­tica pÃºblica de secoes
DROP POLICY IF EXISTS "Leitura pÃºblica de seÃ§Ãµes" ON public.secoes;

-- Criar polÃ­tica para usuÃ¡rios autenticados
CREATE POLICY "Authenticated users can read secoes"
  ON public.secoes FOR SELECT
  TO authenticated
  USING (true);

-- 5. Proteger audit_logs de manipulaÃ§Ã£o direta
CREATE POLICY "Prevent direct audit_logs inserts"
  ON public.audit_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Prevent audit_logs updates"
  ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Prevent audit_logs deletes"
  ON public.audit_logs FOR DELETE
  USING (false);

-- 6. Remover polÃ­ticas duplicadas de orcamentos
DROP POLICY IF EXISTS "Admins can insert orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admins can update orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admins can delete orcamentos" ON public.orcamentos;

-- 7. Remover polÃ­ticas duplicadas de envios
DROP POLICY IF EXISTS "Admins podem ver envios" ON public.envios;
DROP POLICY IF EXISTS "Admins podem criar envios" ON public.envios;
DROP POLICY IF EXISTS "Admins podem atualizar envios" ON public.envios;
DROP POLICY IF EXISTS "Admins podem deletar envios" ON public.envios;

-- 8. Remover polÃ­ticas duplicadas de materiais_recebidos
DROP POLICY IF EXISTS "Admins podem ver materiais" ON public.materiais_recebidos;
DROP POLICY IF EXISTS "Admins podem criar materiais" ON public.materiais_recebidos;

-- 9. Remover polÃ­ticas duplicadas de ordens_servico
DROP POLICY IF EXISTS "Admins podem ver OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins podem criar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins podem atualizar OS" ON public.ordens_servico;
-- Adicionar novos campos Ã  tabela orcamentos para suportar o formato completo do template
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS contato_nome text,
ADD COLUMN IF NOT EXISTS contato_telefone text,
ADD COLUMN IF NOT EXISTS contato_email text,
ADD COLUMN IF NOT EXISTS local_servico text,
ADD COLUMN IF NOT EXISTS escopo_servico jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS material_vip jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS material_cliente jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS valores_detalhados jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS endereco_entrega text,
ADD COLUMN IF NOT EXISTS horario_recebimento text,
ADD COLUMN IF NOT EXISTS condicoes_frete text,
ADD COLUMN IF NOT EXISTS forma_pagamento text,
ADD COLUMN IF NOT EXISTS normas_gerais text,
ADD COLUMN IF NOT EXISTS prazo_execucao text,
ADD COLUMN IF NOT EXISTS validade_orcamento integer DEFAULT 3;

-- Adicionar policy para permitir delete de orÃ§amentos (estava faltando)
CREATE POLICY "Admins podem deletar orÃ§amentos" 
ON public.orcamentos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
-- Contas bancÃ¡rias
CREATE TABLE public.contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor_inicial numeric DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar contas bancarias"
ON public.contas_bancarias
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- MovimentaÃ§Ãµes financeiras (fluxo de caixa)
CREATE TABLE public.movimentacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor numeric NOT NULL DEFAULT 0,
  descricao_os text,
  item text,
  job text,
  nota_recibo text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar movimentacoes"
ON public.movimentacoes_financeiras
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- ProvisÃµes de pagamento (contas a pagar)
CREATE TABLE public.provisoes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date,
  item text,
  descricao text NOT NULL,
  valor numeric DEFAULT 0,
  job text,
  pago boolean DEFAULT false,
  data_pagamento date,
  mes_referencia text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provisoes_pagamento ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar provisoes pagamento"
ON public.provisoes_pagamento
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- ProvisÃµes de recebimento (contas a receber)
CREATE TABLE public.provisoes_recebimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date,
  item text,
  nome text NOT NULL,
  valor numeric DEFAULT 0,
  nota text,
  pago boolean DEFAULT false,
  data_recebimento date,
  mes_referencia text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provisoes_recebimento ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar provisoes recebimento"
ON public.provisoes_recebimento
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
-- Controle de EmissÃ£o de Notas Fiscais
CREATE TABLE public.notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_emissao date,
  numero_nf text NOT NULL,
  responsavel text,
  tipo text,
  valor numeric DEFAULT 0,
  descricao text,
  vencimento date,
  valor_imposto_pct numeric DEFAULT 0,
  data_pagamento date,
  status text DEFAULT 'EM ABERTO' CHECK (status IN ('PAGA', 'EM ABERTO')),
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins podem gerenciar notas fiscais"
ON public.notas_fiscais
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
-- Adiciona coluna de foto na tabela de produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS foto_url text;

-- Cria o bucket de armazenamento 'produtos' se nÃ£o existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- PolÃ­ticas de SeguranÃ§a (RLS) para o Storage

-- 1. Permitir visualizaÃ§Ã£o pÃºblica das fotos
CREATE POLICY "Fotos de produtos sÃ£o pÃºblicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'produtos' );

-- 2. Permitir upload de fotos para usuÃ¡rios autenticados
CREATE POLICY "UsuÃ¡rios autenticados podem fazer upload de fotos de produtos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'produtos' 
  AND auth.role() = 'authenticated'
);

-- 3. Permitir atualizaÃ§Ã£o/deleÃ§Ã£o de fotos para usuÃ¡rios autenticados (ou adicione lÃ³gica de admin se preferir)
CREATE POLICY "UsuÃ¡rios autenticados podem atualizar fotos de produtos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );

CREATE POLICY "UsuÃ¡rios autenticados podem deletar fotos de produtos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );
-- Primeiro removemos a restriÃ§Ã£o UNIQUE, pois mÃºltiplos clientes de mesma empresa poderÃ£o compartilhar o mesmo cÃ³digo (ex: CLI-0001)
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_codigo_key;

-- Atualizamos a funÃ§Ã£o setter do trigger
CREATE OR REPLACE FUNCTION set_cliente_codigo()
RETURNS TRIGGER AS $$
DECLARE
  existing_codigo TEXT;
BEGIN
  -- Se o cliente tiver uma empresa preenchida, verificamos se jÃ¡ existe um cÃ³digo associado a ela
  IF NEW.empresa IS NOT NULL AND TRIM(NEW.empresa) != '' THEN
    SELECT codigo INTO existing_codigo
    FROM public.clientes
    WHERE LOWER(TRIM(empresa)) = LOWER(TRIM(NEW.empresa))
      AND id != NEW.id
    ORDER BY created_at ASC
    LIMIT 1;

    IF existing_codigo IS NOT NULL THEN
      -- Se encontrou, usa o mesmo cÃ³digo
      NEW.codigo := existing_codigo;
      RETURN NEW;
    END IF;
  END IF;

  -- Se cÃ³digo nÃ£o foi fornecido (ou empresa nÃ£o tem registro ainda), gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_cliente_codigo();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
