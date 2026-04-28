import { z } from "zod";

// Schema de validação para clientes
export const clientSchema = z.object({
  codigo: z.string().trim().max(20, "Código deve ter no máximo 20 caracteres").optional().or(z.literal('')),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  empresa: z.string().trim().max(150, "Nome da empresa deve ter no máximo 150 caracteres").optional().or(z.literal('')),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres").optional().or(z.literal('')),
  telefone: z.string().trim().max(20, "Telefone deve ter no máximo 20 caracteres").optional().or(z.literal('')),
  cpf_cnpj: z.string().trim().max(18, "CPF/CNPJ deve ter no máximo 18 caracteres").optional().or(z.literal('')),
  endereco: z.string().trim().max(200, "Endereço deve ter no máximo 200 caracteres").optional().or(z.literal('')),
  cidade: z.string().trim().max(100, "Cidade deve ter no máximo 100 caracteres").optional().or(z.literal('')),
  estado: z.string().trim().max(2, "Estado deve ter 2 caracteres (UF)").optional().or(z.literal('')),
});

// Schema de validação para produtos
export const productSchema = z.object({
  codigo: z.string().trim().min(1, "Código é obrigatório").max(20, "Código deve ter no máximo 20 caracteres"),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  categoria: z.string().trim().min(1, "Categoria é obrigatória").max(50, "Categoria deve ter no máximo 50 caracteres"),
  descricao: z.string().trim().max(500, "Descrição deve ter no máximo 500 caracteres").optional().or(z.literal('')),
  preco: z.number().positive("Preço deve ser maior que zero").max(999999.99, "Preço muito alto"),
  estoque: z.number().int("Estoque deve ser um número inteiro").min(0, "Estoque não pode ser negativo"),
  estoque_min: z.number().int("Estoque mínimo deve ser um número inteiro").min(0, "Estoque mínimo não pode ser negativo").max(9999, "Estoque mínimo muito alto"),
  imagem: z.string().trim().max(10, "Emoji deve ter no máximo 10 caracteres").optional().or(z.literal('')),
});

// Schema de validação para reposição de estoque
export const reporEstoqueSchema = z.object({
  quantidade: z.number().int("Quantidade deve ser um número inteiro").positive("Quantidade deve ser maior que zero").max(9999, "Quantidade muito alta"),
});

// Schema de validação para envios
export const envioSchema = z.object({
  destinatario_nome: z.string().trim().min(1, "Nome do destinatário é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  destinatario_endereco: z.string().trim().max(200, "Endereço deve ter no máximo 200 caracteres").optional().or(z.literal('')),
  destinatario_cidade: z.string().trim().max(100, "Cidade deve ter no máximo 100 caracteres").optional().or(z.literal('')),
  destinatario_estado: z.string().trim().max(2, "Estado deve ter 2 caracteres (UF)").optional().or(z.literal('')),
  destinatario_telefone: z.string().trim().max(20, "Telefone deve ter no máximo 20 caracteres").optional().or(z.literal('')),
  cep_destino: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().or(z.literal('')),
  peso: z.number().positive("Peso deve ser maior que zero").max(9999.99, "Peso muito alto").optional(),
  valor_frete: z.number().min(0, "Valor do frete não pode ser negativo").max(9999.99, "Valor muito alto").optional(),
});

// Schema de validação para orçamentos
export const orcamentoSchema = z.object({
  codigo_cliente: z.string().trim().max(20, "Código do cliente deve ter no máximo 20 caracteres").optional().or(z.literal('')),
  observacoes: z.string().trim().max(1000, "Observações devem ter no máximo 1000 caracteres").optional().or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type ReporEstoqueFormData = z.infer<typeof reporEstoqueSchema>;
export type EnvioFormData = z.infer<typeof envioSchema>;
export type OrcamentoFormData = z.infer<typeof orcamentoSchema>;
