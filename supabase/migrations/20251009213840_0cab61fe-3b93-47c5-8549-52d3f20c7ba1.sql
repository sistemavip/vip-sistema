-- Remover materiais recebidos que referenciam ordens de serviço de clientes fictícios
DELETE FROM materiais_recebidos WHERE ordem_servico_id IN (
  SELECT os.id FROM ordens_servico os
  INNER JOIN clientes c ON os.cliente_id = c.id
  WHERE c.codigo IN ('C001', 'C002', 'C003')
);

-- Remover ordens de serviço que referenciam clientes fictícios
DELETE FROM ordens_servico WHERE cliente_id IN (
  SELECT id FROM clientes WHERE codigo IN ('C001', 'C002', 'C003')
);

-- Remover produtos fictícios
DELETE FROM produtos WHERE codigo IN ('P001', 'P002', 'P003', 'P004', 'P005', 'P006');

-- Remover clientes fictícios
DELETE FROM clientes WHERE codigo IN ('C001', 'C002', 'C003');

-- Inserir produtos reais da planilha de custos
INSERT INTO produtos (codigo, nome, descricao, categoria, preco, estoque, estoque_min, vendidos) VALUES
('PROD001', 'Camiseta BIC Atacadão', 'Tecido: Meia Malha Algodão', 'Camisetas', 25.00, 150, 20, 0),
('PROD002', 'Camiseta BIC', 'Tecido: Malha PV', 'Camisetas', 22.00, 120, 20, 0),
('PROD003', 'Camiseta Bradesco Atacado', 'Tecido: Piquet PA', 'Camisetas', 28.00, 100, 15, 0),
('PROD004', 'Ecobag BIC', '100% algodão, 42x47 cm', 'Ecobags', 18.00, 80, 15, 0),
('PROD005', 'Ecobag Petz', '100% algodão, 42x47 cm', 'Ecobags', 18.00, 75, 15, 0),
('PROD006', 'Jaleco Garbadine', 'Tecido: Garbadine', 'Jalecos', 65.00, 40, 10, 0),
('PROD007', 'Jaleco Microfibra', 'Tecido: Microfibra', 'Jalecos', 70.00, 35, 10, 0),
('PROD008', 'Camiseta Placas do Brasil', 'Tecido: Meia Malha Penteada 30.1', 'Camisetas', 24.00, 90, 15, 0),
('PROD009', 'Camiseta Bradesco Atacado PV', 'Tecido: Piquet PV 50% Algodão + 50% Poliéster', 'Camisetas', 26.00, 110, 15, 0);