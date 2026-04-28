-- Adicionar campos de versionamento para ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS versao_anterior_id UUID REFERENCES ordens_servico(id),
ADD COLUMN IF NOT EXISTS motivo_revisao TEXT,
ADD COLUMN IF NOT EXISTS data_revisao TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de consultas de versões
CREATE INDEX IF NOT EXISTS idx_ordens_servico_versao_anterior ON ordens_servico(versao_anterior_id);

-- Adicionar comentários para documentação
COMMENT ON COLUMN ordens_servico.versao IS 'Número da versão da OS (1, 2, 3...)';
COMMENT ON COLUMN ordens_servico.versao_anterior_id IS 'Referência para a versão anterior desta OS';
COMMENT ON COLUMN ordens_servico.motivo_revisao IS 'Motivo da criação de nova versão';
COMMENT ON COLUMN ordens_servico.data_revisao IS 'Data em que a revisão foi criada';