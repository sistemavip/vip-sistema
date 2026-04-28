import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, Trash2, X, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { DEFAULT_POLITICA_CORREIOS, DEFAULT_NORMAS } from "./orcamentos/constants"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"

interface EscopoItem {
  titulo: string
  itens: string[]
  materialVip?: string
  materialCliente?: string
}

interface ValorItem {
  descricao: string
  valor: number
}

interface EditOrcamentoDialogProps {
  orcamento: any
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function EditOrcamentoDialog({ orcamento, trigger, onSuccess }: EditOrcamentoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Seções colapsáveis
  const [basicOpen, setBasicOpen] = useState(true)
  const [escopoOpen, setEscopoOpen] = useState(false)
  const [materiaisOpen, setMateriaisOpen] = useState(false)
  const [valoresOpen, setValoresOpen] = useState(true)
  const [condicoesOpen, setCondicoesOpen] = useState(false)
  const [normasOpen, setNormasOpen] = useState(false)
  const [correiosOpen, setCorreiosOpen] = useState(false)
  const [includeCorreios, setIncludeCorreios] = useState(false)
  const [openScopes, setOpenScopes] = useState<number[]>([0])

  const [formData, setFormData] = useState({
    contato_nome: "",
    contato_telefone: "",
    contato_email: "",
    local_servico: "",
    status: "pendente",
    endereco_entrega: "",
    horario_recebimento: "",
    condicoes_frete: "",
    forma_pagamento: "",
    normas_gerais: "",
    prazo_execucao: "",
    validade_orcamento: 3,
    observacoes: "",
    politica_correios: "",
    quantidade_envios: ""
  })

  const [escopoServico, setEscopoServico] = useState<EscopoItem[]>([{ titulo: "", itens: [""] }])
  const [valoresDetalhados, setValoresDetalhados] = useState<ValorItem[]>([{ descricao: "", valor: 0 }])

  useEffect(() => {
    if (open && orcamento) {
      setIncludeCorreios(!!(orcamento.politica_correios ?? DEFAULT_POLITICA_CORREIOS))

      setFormData({
        contato_nome: orcamento.contato_nome || "",
        contato_telefone: orcamento.contato_telefone || "",
        contato_email: orcamento.contato_email || "",
        local_servico: orcamento.local_servico || "",
        status: orcamento.status || "pendente",
        endereco_entrega: orcamento.endereco_entrega || "",
        horario_recebimento: orcamento.horario_recebimento || "",
        condicoes_frete: orcamento.condicoes_frete || "",
        forma_pagamento: orcamento.forma_pagamento || "",
        normas_gerais: orcamento.normas_gerais || DEFAULT_NORMAS,
        prazo_execucao: orcamento.prazo_execucao || "",
        validade_orcamento: orcamento.validade_orcamento || 3,
        observacoes: orcamento.observacoes || "",
        politica_correios: orcamento.politica_correios ?? DEFAULT_POLITICA_CORREIOS,
        quantidade_envios: (orcamento as any).quantidade_envios || ""
      })

      let escopo = (orcamento.escopo_servico as EscopoItem[]) || []
      if (escopo.length === 0) {
        escopo = [{ titulo: "", itens: [""] }]
      }

      // Migração: Se existirem materiais globais mas não por escopo, move para o primeiro escopo
      const matVipGlobal = orcamento.material_vip as string[] | null
      const matClienteGlobal = orcamento.material_cliente

      // Verifica se o primeiro escopo já tem materiais definidos (se já foi migrado antes ou criado novo)
      escopo = escopo.map((e, index) => {
        let mVip = e.materialVip
        let mCli = e.materialCliente || ""

        // Normalização de materialVip (pode vir como array ou string)
        let mVipString = ""
        if (Array.isArray(mVip)) {
          mVipString = mVip.join('\n')
        } else if (typeof mVip === 'string') {
          mVipString = mVip
        }

        if (index === 0) {
          // Migração de material VIP global
          if (matVipGlobal && matVipGlobal.length > 0 && !mVipString) {
            mVipString = matVipGlobal.filter(m => m).join('\n')
          }

          // Migração de material Cliente global
          if (!mCli && matClienteGlobal) {
            if (Array.isArray(matClienteGlobal)) {
              mCli = matClienteGlobal.filter(m => m).join('\n')
            } else if (typeof matClienteGlobal === 'string') {
              mCli = matClienteGlobal
            }
          }
        }

        return { ...e, materialVip: mVipString, materialCliente: mCli }
      })

      setEscopoServico(escopo)

      const valores = orcamento.valores_detalhados as ValorItem[] | null
      setValoresDetalhados(valores && valores.length > 0 ? valores : [{ descricao: "", valor: 0 }])
    }
  }, [open, orcamento])

  // Escopo handlers
  const addEscopo = () => setEscopoServico([...escopoServico, {
    titulo: "",
    itens: [""],
    materialVip: "",
    materialCliente: ""
  }])

  const removeEscopo = (index: number) => setEscopoServico(escopoServico.filter((_, i) => i !== index))

  const updateEscopoTitulo = (index: number, titulo: string) => {
    const updated = [...escopoServico]
    updated[index].titulo = titulo
    setEscopoServico(updated)
  }

  const addEscopoItem = (escopoIndex: number) => {
    const updated = [...escopoServico]
    updated[escopoIndex].itens.push("")
    setEscopoServico(updated)
  }

  const removeEscopoItem = (escopoIndex: number, itemIndex: number) => {
    const updated = [...escopoServico]
    updated[escopoIndex].itens = updated[escopoIndex].itens.filter((_, i) => i !== itemIndex)
    setEscopoServico(updated)
  }

  const updateEscopoItem = (escopoIndex: number, itemIndex: number, value: string) => {
    const updated = [...escopoServico]
    updated[escopoIndex].itens[itemIndex] = value
    setEscopoServico(updated)
  }

  // Material Scope Handlers
  const updateMaterialVip = (escopoIndex: number, value: string) => {
    const updated = [...escopoServico]
    updated[escopoIndex].materialVip = value
    setEscopoServico(updated)
  }

  const updateMaterialCliente = (escopoIndex: number, value: string) => {
    const updated = [...escopoServico]
    updated[escopoIndex].materialCliente = value
    setEscopoServico(updated)
  }

  // Valores handlers
  const addValor = () => setValoresDetalhados([...valoresDetalhados, { descricao: "", valor: 0 }])
  const removeValor = (index: number) => setValoresDetalhados(valoresDetalhados.filter((_, i) => i !== index))
  const updateValor = (index: number, field: keyof ValorItem, value: string | number) => {
    const updated = [...valoresDetalhados]
    if (field === 'valor') {
      updated[index][field] = Number(value) || 0
    } else {
      updated[index][field] = value as string
    }
    setValoresDetalhados(updated)
  }

  const valorTotal = valoresDetalhados.reduce((sum, v) => sum + (v.valor || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const filteredEscopo = escopoServico
        .filter(e => e.titulo.trim())
        .map(e => ({
          ...e,
          itens: e.itens.filter(i => i.trim()),
          material_vip: e.materialVip || "", // Persist as string
          material_cliente: e.materialCliente || ""
        }))

      const filteredValores = valoresDetalhados.filter(v => v.descricao.trim())

      const { error } = await supabase
        .from('orcamentos')
        .update({
          contato_nome: formData.contato_nome || null,
          contato_telefone: formData.contato_telefone || null,
          contato_email: formData.contato_email || null,
          local_servico: formData.local_servico || null,
          escopo_servico: filteredEscopo as any,
          material_vip: null, // Migrated
          material_cliente: null, // Migrated
          valores_detalhados: filteredValores as any,
          valor_total: valorTotal,
          endereco_entrega: formData.endereco_entrega || null,
          horario_recebimento: formData.horario_recebimento || null,
          condicoes_frete: formData.condicoes_frete || null,
          forma_pagamento: formData.forma_pagamento || null,
          normas_gerais: formData.normas_gerais || null,
          prazo_execucao: formData.prazo_execucao || null,
          validade_orcamento: formData.validade_orcamento,
          status: formData.status,
          observacoes: formData.observacoes || null,
          politica_correios: includeCorreios ? formData.politica_correios : "",
          quantidade_envios: formData.quantidade_envios || null
        })
        .eq('id', orcamento.id)

      if (error) throw error

      toast.success("OS atualizada com sucesso!")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao atualizar OS:', error)
      toast.error("Erro ao atualizar OS")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', orcamento.id)

      if (error) throw error

      toast.success("OS apagada com sucesso!")
      setDeleteDialogOpen(false)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao apagar OS:', error)
      toast.error("Erro ao apagar OS")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar OS#{String(orcamento.numero_sequencial).padStart(3, '0')}</DialogTitle>
            <DialogDescription>Atualize os dados da Ordem de Serviço</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Seção 1 - Informações Básicas */}
            <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">1. Informações do Contato</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${basicOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Cliente: <span className="font-medium text-foreground">{orcamento.clientes?.nome || 'N/A'}</span></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="contato_nome">Contato (A/C)</Label>
                    <Input
                      id="contato_nome"
                      placeholder="Nome do contato"
                      value={formData.contato_nome}
                      onChange={(e) => setFormData({ ...formData, contato_nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contato_telefone">Telefone</Label>
                    <Input
                      id="contato_telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.contato_telefone}
                      onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato_email">Email</Label>
                  <Input
                    id="contato_email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.contato_email}
                    onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local_servico">Local do Serviço</Label>
                  <Input
                    id="local_servico"
                    placeholder="Ex: Galpão VIP, Cliente, etc."
                    value={formData.local_servico}
                    onChange={(e) => setFormData({ ...formData, local_servico: e.target.value })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Seção 2 - Escopo do Serviço */}
            <Collapsible open={escopoOpen} onOpenChange={setEscopoOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">2. Escopo do Serviço</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${escopoOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {escopoServico.map((escopo, escopoIndex) => (
                  <div key={escopoIndex} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer"
                      onClick={() => setOpenScopes(prev => prev.includes(escopoIndex) ? prev.filter(i => i !== escopoIndex) : [...prev, escopoIndex])}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${openScopes.includes(escopoIndex) ? 'rotate-180' : ''}`} />
                      <span className="font-medium text-sm">{escopoIndex + 1}.</span>
                      <span className="flex-1 text-sm truncate">{escopo.titulo || 'Novo Escopo'}</span>
                      {escopoServico.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeEscopo(escopoIndex); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {openScopes.includes(escopoIndex) && (
                      <div className="p-3 space-y-2">
                        <Input
                          placeholder="Título do escopo"
                          value={escopo.titulo}
                          onChange={(e) => updateEscopoTitulo(escopoIndex, e.target.value)}
                        />

                        <div className="pl-6 space-y-2">
                          {escopo.itens.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2">
                              <span className="text-muted-foreground">•</span>
                              <Textarea
                                placeholder="Sub-item"
                                value={item}
                                onChange={(e) => updateEscopoItem(escopoIndex, itemIndex, e.target.value)}
                                className="flex-1 min-h-[40px] resize-y"
                                rows={1}
                              />
                              {escopo.itens.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeEscopoItem(escopoIndex, itemIndex)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addEscopoItem(escopoIndex)}>
                            <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                          </Button>
                        </div>

                        {/* Materiais do Escopo */}
                        <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Material VIP (Deste escopo)</Label>
                            <Textarea
                              placeholder="Material fornecido pela VIP"
                              value={escopo.materialVip || ""}
                              onChange={(e) => updateMaterialVip(escopoIndex, e.target.value)}
                              rows={5}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Material Cliente (Deste escopo)</Label>
                            <Textarea
                              placeholder="Liste os materiais fornecidos pelo cliente para este escopo..."
                              value={escopo.materialCliente || ""}
                              onChange={(e) => updateMaterialCliente(escopoIndex, e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addEscopo}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Escopo
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Seção 4 - Valores */}
            <Collapsible open={valoresOpen} onOpenChange={setValoresOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">4. Valores</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${valoresOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {valoresDetalhados.map((valor, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Descrição"
                      value={valor.descricao}
                      onChange={(e) => updateValor(index, 'descricao', e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={valor.valor || ""}
                        onChange={(e) => updateValor(index, 'valor', e.target.value)}
                        className="w-28"
                      />
                    </div>
                    {valoresDetalhados.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeValor(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addValor}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Valor
                </Button>

                <div className="flex justify-end p-3 bg-muted/50 rounded-lg">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Valor Total:</span>
                    <p className="text-xl font-bold text-vip-primary">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Seção 5 - Condições */}
            <Collapsible open={condicoesOpen} onOpenChange={setCondicoesOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">5. Condições</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${condicoesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="endereco_entrega">Endereço para Entrega/Recebimento</Label>
                  <Textarea
                    id="endereco_entrega"
                    placeholder="Endereço completo..."
                    value={formData.endereco_entrega}
                    onChange={(e) => setFormData({ ...formData, endereco_entrega: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario_recebimento">Horário de Recebimento</Label>
                  <Input
                    id="horario_recebimento"
                    placeholder="Ex: Segunda a Sexta, das 8h às 17h"
                    value={formData.horario_recebimento}
                    onChange={(e) => setFormData({ ...formData, horario_recebimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade_envios">Quantidade de Envios</Label>
                  <Input
                    id="quantidade_envios"
                    placeholder="Ex: 500 envios, 1.000 kits, etc."
                    value={formData.quantidade_envios}
                    onChange={(e) => setFormData({ ...formData, quantidade_envios: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condicoes_frete">Condições de Frete e Operação</Label>
                  <Textarea
                    id="condicoes_frete"
                    placeholder="Condições numeradas..."
                    value={formData.condicoes_frete}
                    onChange={(e) => setFormData({ ...formData, condicoes_frete: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Textarea
                    id="forma_pagamento"
                    placeholder="Condições de pagamento..."
                    value={formData.forma_pagamento}
                    onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="prazo_execucao">Prazo para Execução</Label>
                    <Textarea
                      id="prazo_execucao"
                      placeholder="Ex: 5 dias úteis"
                      value={formData.prazo_execucao}
                      onChange={(e) => setFormData({ ...formData, prazo_execucao: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validade_orcamento">Validade (dias)</Label>
                    <Input
                      id="validade_orcamento"
                      type="number"
                      min="1"
                      value={formData.validade_orcamento}
                      onChange={(e) => setFormData({ ...formData, validade_orcamento: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Seção 6 - Normas/Observações */}
            <Collapsible open={normasOpen} onOpenChange={setNormasOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">6. Normas e Observações</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${normasOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="normas_gerais">Normas Gerais</Label>
                  <Textarea
                    id="normas_gerais"
                    placeholder="Normas e condições gerais..."
                    value={formData.normas_gerais}
                    onChange={(e) => setFormData({ ...formData, normas_gerais: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Adicionais</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações adicionais..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Seção 7 - Política dos Correios */}
            <Collapsible open={correiosOpen} onOpenChange={setCorreiosOpen}>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="p-0 h-auto hover:bg-transparent">
                    <span className="font-semibold mr-2">7. Política dos Correios</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${correiosOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <Label htmlFor="include-correios" className="text-sm text-muted-foreground cursor-pointer">Incluir na OS</Label>
                  <Switch
                    id="include-correios"
                    checked={includeCorreios}
                    onCheckedChange={(checked) => {
                      setIncludeCorreios(checked)
                      if (checked && !formData.politica_correios) {
                        setFormData(prev => ({ ...prev, politica_correios: DEFAULT_POLITICA_CORREIOS }))
                      }
                      if (checked) {
                        setCorreiosOpen(true)
                      }
                    }}
                  />
                </div>
              </div>

              <CollapsibleContent className="space-y-3 pt-3">
                {includeCorreios && (
                  <div className="space-y-2">
                    <Label htmlFor="politica_correios">Política dos Correios</Label>
                    <Textarea
                      id="politica_correios"
                      placeholder="Política de postagem e envio..."
                      value={formData.politica_correios}
                      onChange={(e) => setFormData({ ...formData, politica_correios: e.target.value })}
                      rows={4}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Apagar OS
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-vip-primary hover:bg-vip-secondary text-black">
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent >
      </Dialog >

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Apagar OS"
        description="Tem certeza que deseja apagar esta Ordem de Serviço? Esta ação não pode ser desfeita."
      />
    </>
  )
}
