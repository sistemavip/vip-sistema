-- Criar enum para tipos de serviço
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

-- Tabela de modelos de orçamento (templates)
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

-- Tabela de ordens de serviço
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

-- Tabela de seções/categorias
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

-- RLS Policies - Leitura pública, escrita apenas para admins
CREATE POLICY "Leitura pública de modelos"
  ON public.modelos_orcamento FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar modelos"
  ON public.modelos_orcamento FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pública de OS"
  ON public.ordens_servico FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar OS"
  ON public.ordens_servico FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pública de envios"
  ON public.envios FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar envios"
  ON public.envios FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pública de materiais"
  ON public.materiais_recebidos FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar materiais"
  ON public.materiais_recebidos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leitura pública de seções"
  ON public.secoes FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar seções"
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