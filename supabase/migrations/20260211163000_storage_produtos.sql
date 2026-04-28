-- Adiciona coluna de foto na tabela de produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS foto_url text;

-- Cria o bucket de armazenamento 'produtos' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Segurança (RLS) para o Storage

-- 1. Permitir visualização pública das fotos
CREATE POLICY "Fotos de produtos são públicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'produtos' );

-- 2. Permitir upload de fotos para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de produtos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'produtos' 
  AND auth.role() = 'authenticated'
);

-- 3. Permitir atualização/deleção de fotos para usuários autenticados (ou adicione lógica de admin se preferir)
CREATE POLICY "Usuários autenticados podem atualizar fotos de produtos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );

CREATE POLICY "Usuários autenticados podem deletar fotos de produtos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );
