import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, DollarSign, MapPin, User, Phone, Mail, Package } from "lucide-react"

interface EscopoItem {
  titulo: string
  itens: string[]
}

interface ValorItem {
  descricao: string
  valor: number
}

interface Orcamento {
  id: string
  numero_sequencial: number
  codigo_cliente: string | null
  valor_total: number | null
  status: string | null
  created_at: string | null
  observacoes: string | null
  contato_nome?: string | null
  contato_telefone?: string | null
  contato_email?: string | null
  local_servico?: string | null
  escopo_servico?: EscopoItem[] | null
  material_vip?: string[] | null
  material_cliente?: string[] | null
  valores_detalhados?: ValorItem[] | null
  endereco_entrega?: string | null
  horario_recebimento?: string | null
  condicoes_frete?: string | null
  forma_pagamento?: string | null
  normas_gerais?: string | null
  prazo_execucao?: string | null
  validade_orcamento?: number | null
  clientes?: {
    nome: string
    email: string | null
    telefone: string | null
    empresa?: string | null
  } | null
}

interface OrcamentoDetailsDialogProps {
  orcamento: Orcamento | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrcamentoDetailsDialog({ orcamento, open, onOpenChange }: OrcamentoDetailsDialogProps) {
  if (!orcamento) return null

  const getStatusColor = (status: string) => {
    const colors = {
      "aprovado": "bg-vip-primary text-black",
      "pendente": "bg-amber-500 text-white",
      "em_analise": "bg-blue-500 text-white",
      "rejeitado": "bg-red-500 text-white"
    }
    return colors[status.toLowerCase() as keyof typeof colors] || "bg-muted text-foreground"
  }

  const formatStatus = (status: string) => {
    const statusMap = {
      "aprovado": "Aprovado",
      "pendente": "Pendente",
      "em_analise": "Em Análise",
      "rejeitado": "Rejeitado"
    }
    return statusMap[status.toLowerCase() as keyof typeof statusMap] || status
  }

  const escopoServico = orcamento.escopo_servico as EscopoItem[] | null
  const materialVip = orcamento.material_vip as string[] | null
  const materialCliente = orcamento.material_cliente as string[] | null
  const valoresDetalhados = orcamento.valores_detalhados as ValorItem[] | null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-vip-primary" />
            Detalhes da OS
          </DialogTitle>
          <DialogDescription>Visualize todas as informações da Ordem de Serviço</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Número da OS</p>
              <p className="text-2xl font-bold">OS#{String(orcamento.numero_sequencial).padStart(3, '0')}</p>
            </div>
            <Badge className={getStatusColor(orcamento.status || "pendente")}>
              {formatStatus(orcamento.status || "pendente")}
            </Badge>
          </div>

          {/* Cliente Info */}
          <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{orcamento.clientes?.nome || "N/A"}</p>
                {orcamento.clientes?.empresa && (
                  <p className="text-sm text-muted-foreground">{orcamento.clientes.empresa}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-medium">{orcamento.codigo_cliente || "N/A"}</p>
              </div>
              {(orcamento.contato_nome || orcamento.clientes?.nome) && (
                <div>
                  <p className="text-sm text-muted-foreground">Contato (A/C)</p>
                  <p className="font-medium">{orcamento.contato_nome || orcamento.clientes?.nome}</p>
                </div>
              )}
              {(orcamento.contato_telefone || orcamento.clientes?.telefone) && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium">{orcamento.contato_telefone || orcamento.clientes?.telefone}</p>
                </div>
              )}
              {(orcamento.contato_email || orcamento.clientes?.email) && (
                <div className="flex items-center gap-2 col-span-full">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium">{orcamento.contato_email || orcamento.clientes?.email}</p>
                </div>
              )}
              {orcamento.local_servico && (
                <div className="flex items-center gap-2 col-span-full">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium">{orcamento.local_servico}</p>
                </div>
              )}
            </div>
          </div>

          {/* Escopo do Serviço */}
          {escopoServico && escopoServico.length > 0 && escopoServico.some(e => e.titulo) && (
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="font-semibold">Escopo do Serviço</h3>
              <div className="space-y-3">
                {escopoServico.filter(e => e.titulo).map((escopo, index) => (
                  <div key={index}>
                    <p className="font-medium">{index + 1}. {escopo.titulo}</p>
                    {escopo.itens && escopo.itens.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {escopo.itens.filter(i => i).map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materiais */}
          {((materialVip && materialVip.some(m => m)) || (materialCliente && materialCliente.some(m => m))) && (
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materialVip && materialVip.some(m => m) && (
                  <div>
                    <p className="text-sm font-medium text-vip-primary mb-1">Fornecido pela VIP:</p>
                    <ul className="space-y-1">
                      {materialVip.filter(m => m).map((item, i) => (
                        <li key={i} className="text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {materialCliente && materialCliente.some(m => m) && (
                  <div>
                    <p className="text-sm font-medium mb-1">Fornecido pelo Cliente:</p>
                    <ul className="space-y-1">
                      {materialCliente.filter(m => m).map((item, i) => (
                        <li key={i} className="text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Valores */}
          <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h3>
            {valoresDetalhados && valoresDetalhados.some(v => v.descricao) ? (
              <div className="space-y-2">
                {valoresDetalhados.filter(v => v.descricao).map((valor, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                    <span className="text-sm">{valor.descricao}</span>
                    <span className="font-medium">
                      R$ {valor.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Valor Total:</span>
                <span className="text-2xl font-bold text-vip-primary">
                  R$ {orcamento.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </span>
              </div>
            </div>
          </div>

          {/* Condições */}
          {(orcamento.endereco_entrega || orcamento.horario_recebimento || orcamento.condicoes_frete || orcamento.forma_pagamento) && (
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="font-semibold">Condições</h3>
              <div className="space-y-2 text-sm">
                {orcamento.endereco_entrega && (
                  <div>
                    <p className="text-muted-foreground">Endereço:</p>
                    <p>{orcamento.endereco_entrega}</p>
                  </div>
                )}
                {orcamento.horario_recebimento && (
                  <div>
                    <p className="text-muted-foreground">Horário:</p>
                    <p>{orcamento.horario_recebimento}</p>
                  </div>
                )}
                {orcamento.condicoes_frete && (
                  <div>
                    <p className="text-muted-foreground">Frete e Operação:</p>
                    <p className="whitespace-pre-line">{orcamento.condicoes_frete}</p>
                  </div>
                )}
                {orcamento.forma_pagamento && (
                  <div>
                    <p className="text-muted-foreground">Forma de Pagamento:</p>
                    <p className="whitespace-pre-line">{orcamento.forma_pagamento}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Normas e Observações */}
          {(orcamento.normas_gerais || orcamento.observacoes) && (
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="font-semibold">Normas e Observações</h3>
              {orcamento.normas_gerais && (
                <div>
                  <p className="text-sm text-muted-foreground">Normas Gerais:</p>
                  <p className="text-sm whitespace-pre-line">{orcamento.normas_gerais}</p>
                </div>
              )}
              {orcamento.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações:</p>
                  <p className="text-sm whitespace-pre-line">{orcamento.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Criado em: {orcamento.created_at ? new Date(orcamento.created_at).toLocaleDateString('pt-BR') : 'N/A'}</span>
            </div>
            {orcamento.prazo_execucao && (
              <span>Prazo: {orcamento.prazo_execucao}</span>
            )}
            {orcamento.validade_orcamento && (
              <span>Validade: {orcamento.validade_orcamento} dias</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
