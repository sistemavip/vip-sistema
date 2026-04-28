import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Plus, ChevronDown, Trash2, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { generateOrcamentoPDF } from "@/lib/pdfGenerator"

interface Cliente {
  id: string
  codigo: string
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
}

interface EscopoItem {
  titulo: string
  itens: string[]
  materialVip: string
  materialCliente: string
}

interface ValorItem {
  descricao: string
  valor: number
}

import { DEFAULT_MATERIAL_VIP, DEFAULT_NORMAS, DEFAULT_VALORES, DEFAULT_POLITICA_CORREIOS, KITS } from "./orcamentos/constants"

export function AddOrcamentoDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [generatePdfOnSubmit, setGeneratePdfOnSubmit] = useState(false)

  // Seções colapsáveis
  const [basicOpen, setBasicOpen] = useState(true)
  const [escopoOpen, setEscopoOpen] = useState(true)
  const [materiaisOpen, setMateriaisOpen] = useState(false)
  const [valoresOpen, setValoresOpen] = useState(true)
  const [condicoesOpen, setCondicoesOpen] = useState(false)
  const [normasOpen, setNormasOpen] = useState(false)
  const [correiosOpen, setCorreiosOpen] = useState(false)
  const [includeCorreios, setIncludeCorreios] = useState(true)
  const [openScopes, setOpenScopes] = useState<number[]>([0])
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("")

  // Form data
  const [formData, setFormData] = useState({
    cliente_id: "",
    contato_nome: "",
    contato_telefone: "",
    contato_email: "",
    local_servico: "",
    status: "pendente",
    endereco_entrega: "",
    horario_recebimento: "",
    condicoes_frete: "",
    forma_pagamento: "",
    normas_gerais: DEFAULT_NORMAS,
    prazo_execucao: "",
    validade_orcamento: 3,
    observacoes: "",
    politica_correios: DEFAULT_POLITICA_CORREIOS,
    quantidade_envios: ""
  })

  // Arrays dinâmicos
  const [escopoServico, setEscopoServico] = useState<EscopoItem[]>([{
    titulo: "",
    itens: [""],
    materialVip: DEFAULT_MATERIAL_VIP,
    materialCliente: ""
  }])
  const [valoresDetalhados, setValoresDetalhados] = useState<ValorItem[]>(DEFAULT_VALORES)

  // Array de empresas únicas com seus códigos
  const empresasMap = new Map<string, string>()
  clientes.forEach(c => {
    const empName = c.empresa?.trim() || "Sem Empresa"
    if (!empresasMap.has(empName)) {
      empresasMap.set(empName, c.codigo)
    }
  })
  
  const empresas = Array.from(empresasMap.entries())
    .map(([nome, codigo]) => ({ nome, codigo }))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const clientesFiltrados = selectedEmpresa 
    ? clientes.filter(c => (c.empresa?.trim() || "Sem Empresa") === selectedEmpresa)
    : []

  useEffect(() => {
    if (open) {
      fetchClientes()
    }
  }, [open])

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, codigo, nome, email, telefone, empresa')
      .order('nome')

    if (error) {
      toast.error("Erro ao carregar clientes")
      return
    }

    setClientes(data || [])
  }

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    setFormData({
      ...formData,
      cliente_id: clienteId,
      contato_nome: cliente?.nome || "",
      contato_telefone: cliente?.telefone || "",
      contato_email: cliente?.email || ""
    })
  }

  // Escopo handlers
  const addEscopo = () => {
    setEscopoServico([...escopoServico, {
      titulo: "",
      itens: [""],
      materialVip: DEFAULT_MATERIAL_VIP,
      materialCliente: ""
    }])
  }

  const removeEscopo = (index: number) => {
    setEscopoServico(escopoServico.filter((_, i) => i !== index))
  }

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

    if (!formData.cliente_id) {
      toast.error("Por favor, selecione um Contato Responsável.")
      return
    }

    setLoading(true)

    try {
      const cliente = clientes.find(c => c.id === formData.cliente_id)

      // Filtrar arrays vazios
      // Filtrar arrays vazios e preparar estrutura completa do escopo com materiais
      const filteredEscopo = escopoServico
        .filter(e => e.titulo.trim())
        .map(e => ({
          ...e,
          itens: e.itens.filter(i => i.trim()),
          material_vip: e.materialVip,
          material_cliente: e.materialCliente
        }))
      // Remove as propriedades frontend-only antes de salvar, se necessário, ou mantém se o banco aceitar JSON livre.
      // Como o banco é JSON, podemos salvar a estrutura que quisermos, mas para manter compatibilidade com o tipo EscopoItem definido no arquivo, 
      // vamos garantir que ele tenha as propriedades esperadas pelo backend/PDF se mudarmos a estrutura lá também.
      // O Supabase type 'Json' é flexível. Vamos salvar tudo dentro de 'escopo_servico'.

      const filteredValores = valoresDetalhados.filter(v => v.descricao.trim())

      const { data, error } = await supabase
        .from('orcamentos')
        .insert([{
          cliente_id: formData.cliente_id,
          codigo_cliente: cliente?.codigo,
          contato_nome: formData.contato_nome || null,
          contato_telefone: formData.contato_telefone || null,
          contato_email: formData.contato_email || null,
          local_servico: formData.local_servico || null,
          escopo_servico: filteredEscopo as any,
          material_vip: null, // Deprecated/moved to scope
          material_cliente: null, // Deprecated/moved to scope
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
          politica_correios: formData.politica_correios || null,
          quantidade_envios: formData.quantidade_envios || null,
          itens: []
        }])
        .select(`
          *,
          clientes (
            nome, email, telefone, empresa
          )
        `)
        .single()

      if (error) throw error

      toast.success("Orçamento salvo com sucesso!")

      if (generatePdfOnSubmit && data) {
        toast.info("Gerando PDF...")
        try {
          const statusMap: Record<string, string> = {
            "aprovado": "Aprovado",
            "pendente": "Pendente",
            "em_analise": "Em Análise",
            "em_andamento": "Em Andamento",
            "rejeitado": "Rejeitado",
            "orcamento_enviado": "Orç. Enviado",
            "pago": "Pago",
            "realizado": "Realizado"
          }

          await generateOrcamentoPDF({
            numero_sequencial: data.numero_sequencial,
            cliente: {
              nome: data.clientes?.nome || 'Cliente não informado',
              email: data.clientes?.email || undefined,
              telefone: data.clientes?.telefone || undefined,
              empresa: data.clientes?.empresa || undefined,
            },
            contato_nome: data.contato_nome || undefined,
            contato_telefone: data.contato_telefone || undefined,
            contato_email: data.contato_email || undefined,
            local_servico: data.local_servico || undefined,
            escopo_servico: data.escopo_servico as any,
            material_vip: data.material_vip as any,
            material_cliente: data.material_cliente as any,
            valores_detalhados: data.valores_detalhados as any,
            valor_total: data.valor_total || 0,
            endereco_entrega: data.endereco_entrega || undefined,
            horario_recebimento: data.horario_recebimento || undefined,
            condicoes_frete: data.condicoes_frete || undefined,
            forma_pagamento: data.forma_pagamento || undefined,
            normas_gerais: data.normas_gerais || undefined,
            prazo_execucao: data.prazo_execucao || undefined,
            validade_orcamento: data.validade_orcamento || 3,
            status: statusMap[(data.status || 'pendente').toLowerCase()] || data.status || 'Pendente',
            observacoes: data.observacoes || undefined,
            created_at: data.created_at || new Date().toISOString(),
            politica_correios: (data as any).politica_correios || undefined
          })
          toast.success("PDF gerado com sucesso!")
        } catch (pdfError) {
          console.error("Erro ao gerar PDF", pdfError)
          toast.error("Orçamento salvo, mas houve erro ao gerar PDF.")
        }
      }

      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error)
      toast.error(`Erro ao criar orçamento: ${error.message || JSON.stringify(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cliente_id: "",
      contato_nome: "",
      contato_telefone: "",
      contato_email: "",
      local_servico: "",
      status: "pendente",
      endereco_entrega: "",
      horario_recebimento: "",
      condicoes_frete: "",
      forma_pagamento: "",
      normas_gerais: DEFAULT_NORMAS,
      prazo_execucao: "",
      validade_orcamento: 3,
      observacoes: "",
      politica_correios: DEFAULT_POLITICA_CORREIOS,
      quantidade_envios: ""
    })
    setEscopoServico([{
      titulo: "",
      itens: [""],
      materialVip: DEFAULT_MATERIAL_VIP,
      materialCliente: ""
    }])
    setValoresDetalhados(DEFAULT_VALORES)
    setSelectedEmpresa("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-vip-primary hover:bg-vip-secondary text-black">
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>Preencha os dados da OS seguindo o formato do template</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Seção 1 - Informações Básicas */}
          <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-semibold">1. Informações Básicas</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${basicOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Select
                    value={selectedEmpresa}
                    onValueChange={(val) => {
                      setSelectedEmpresa(val);
                      setFormData({ ...formData, cliente_id: "", contato_nome: "", contato_telefone: "", contato_email: "" });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.nome} value={emp.nome}>
                          {emp.nome !== "Sem Empresa" ? `${emp.nome} (${emp.codigo})` : "Sem Empresa"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente">Contato Responsável *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={handleClienteChange}
                    required
                    disabled={!selectedEmpresa}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesFiltrados.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Carregar Template de Kit (Opcional)
                  </Label>
                  <Select onValueChange={(value) => {
                    const kit = KITS.find(k => k.id === value)
                    if (kit) {
                      setEscopoServico(kit.items)
                      toast.success(`Template "${kit.name}" carregado!`)
                    }
                  }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione um modelo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {KITS.map(kit => (
                        <SelectItem key={kit.id} value={kit.id}>
                          <span className="font-medium">{kit.name}</span> - <span className="text-muted-foreground text-xs">{kit.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEscopoServico([{
                        titulo: "",
                        itens: [""],
                        materialVip: DEFAULT_MATERIAL_VIP,
                        materialCliente: ""
                      }])
                      toast.info("Escopo limpo")
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

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
                        placeholder="Título do escopo (ex: Recebimento e Conferência)"
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
                            placeholder="Liste os materiais fornecidos pela VIP..."
                            value={escopo.materialVip}
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
                    placeholder="Descrição (ex: Valor armazenagem mensal)"
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
                  placeholder="Normas e condições gerais do serviço..."
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

          <div className="flex justify-end gap-3 pt-4 border-t w-full">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={() => setGeneratePdfOnSubmit(false)}
              disabled={loading} 
              variant="secondary"
            >
              Apenas Salvar
            </Button>
            <Button 
              type="submit" 
              onClick={() => setGeneratePdfOnSubmit(true)}
              disabled={loading} 
              className="bg-vip-primary hover:bg-vip-secondary text-black"
            >
              {loading && generatePdfOnSubmit ? "Gerando..." : "Salvar e Gerar PDF"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
