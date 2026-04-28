import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MinimalCard } from "@/components/MinimalCard"
import { AddOrcamentoDialog } from "@/components/AddOrcamentoDialog"
import { OrcamentoDetailsDialog } from "@/components/OrcamentoDetailsDialog"
import { EditOrcamentoDialog } from "@/components/EditOrcamentoDialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileText, 
  Download,
  Search,
  FileDown
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { exportToExcel } from "@/lib/export"
import { generateOrcamentoPDF } from "@/lib/pdfGenerator"

interface Orcamento {
  id: string
  numero_sequencial: number
  cliente_id: string | null
  codigo_cliente: string | null
  valor_total: number | null
  status: string | null
  created_at: string | null
  observacoes: string | null
  contato_nome?: string | null
  contato_telefone?: string | null
  contato_email?: string | null
  local_servico?: string | null
  escopo_servico?: any
  material_vip?: any
  material_cliente?: any
  valores_detalhados?: any
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

export function Orcamento() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    fetchOrcamentos()
  }, [])

  const fetchOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrcamentos(data || [])
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error)
      toast.error("Erro ao carregar orçamentos")
    } finally {
      setLoading(false)
    }
  }

  const filteredOrcamentos = orcamentos.filter(orc => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    return (
      (orc.clientes?.nome?.toLowerCase() || '').includes(search) ||
      (orc.codigo_cliente?.toLowerCase() || '').includes(search) ||
      String(orc.numero_sequencial || '').includes(search) ||
      (orc.observacoes?.toLowerCase() || '').includes(search)
    );
  });

  const totalOrcamentos = orcamentos.length
  const aprovados = orcamentos.filter(o => o.status?.toLowerCase() === 'aprovado').length
  const valorTotal = orcamentos.reduce((sum, o) => sum + (o.valor_total || 0), 0)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "aprovado": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "pendente": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "em_analise": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "em_andamento": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "rejeitado": "bg-destructive/20 text-destructive border-destructive/30",
      "orcamento_enviado": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "pago": "bg-green-500/20 text-green-400 border-green-500/30",
      "realizado": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    }
    return colors[status.toLowerCase()] || "bg-muted text-muted-foreground border-border"
  }

  const formatStatus = (status: string) => {
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
    return statusMap[status.toLowerCase()] || status
  }

  const getEscopoResumo = (escopo: any) => {
    if (!escopo || !Array.isArray(escopo) || escopo.length === 0) return '-';
    const firstEscopo = escopo[0];
    if (firstEscopo?.titulo) {
      return firstEscopo.titulo.length > 30 
        ? firstEscopo.titulo.substring(0, 30) + '...' 
        : firstEscopo.titulo;
    }
    return '-';
  }

  const handleViewDetails = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento)
    setDetailsOpen(true)
  }

  const handleGeneratePDF = async (orcamento: Orcamento) => {
    try {
      toast.info("Gerando PDF...");
      await generateOrcamentoPDF({
        numero_sequencial: orcamento.numero_sequencial,
        cliente: {
          nome: orcamento.clientes?.nome || 'Cliente não informado',
          email: orcamento.clientes?.email || undefined,
          telefone: orcamento.clientes?.telefone || undefined,
          empresa: orcamento.clientes?.empresa || undefined,
        },
        contato_nome: orcamento.contato_nome || undefined,
        contato_telefone: orcamento.contato_telefone || undefined,
        contato_email: orcamento.contato_email || undefined,
        local_servico: orcamento.local_servico || undefined,
        escopo_servico: orcamento.escopo_servico || undefined,
        material_vip: orcamento.material_vip || undefined,
        material_cliente: orcamento.material_cliente || undefined,
        valores_detalhados: orcamento.valores_detalhados || undefined,
        valor_total: orcamento.valor_total || 0,
        endereco_entrega: orcamento.endereco_entrega || undefined,
        horario_recebimento: orcamento.horario_recebimento || undefined,
        condicoes_frete: orcamento.condicoes_frete || undefined,
        forma_pagamento: orcamento.forma_pagamento || undefined,
        normas_gerais: orcamento.normas_gerais || undefined,
        prazo_execucao: orcamento.prazo_execucao || undefined,
        validade_orcamento: orcamento.validade_orcamento || 3,
        status: formatStatus(orcamento.status || 'pendente'),
        observacoes: orcamento.observacoes || undefined,
        created_at: orcamento.created_at || new Date().toISOString(),
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Orçamentos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie propostas e orçamentos para clientes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
        <MinimalCard
          icon={FileText}
          title="Total de Orçamentos"
          value={String(totalOrcamentos)}
          description="Total registrado"
        />
        <MinimalCard
          icon={FileText}
          title="Aprovados"
          value={String(aprovados)}
          description={`${totalOrcamentos > 0 ? Math.round((aprovados / totalOrcamentos) * 100) : 0}% de aprovação`}
        />
        <MinimalCard
          icon={FileText}
          title="Valor Total"
          value={`R$ ${(valorTotal / 1000).toFixed(1)}k`}
          description="Soma dos orçamentos"
        />
      </div>

      {/* Orçamentos List */}
      <Card className="card-gradient">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl">Orçamentos Recentes</CardTitle>
              <AddOrcamentoDialog onSuccess={fetchOrcamentos} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 w-full sm:w-[200px] text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => exportToExcel('orcamentos', filteredOrcamentos.map(orc => ({
                numero: `OS#${String(orc.numero_sequencial).padStart(3, '0')}`,
                cliente: orc.clientes?.nome || 'N/A',
                codigo_cliente: orc.codigo_cliente || 'N/A',
                valor_total: orc.valor_total || 0,
                status: formatStatus(orc.status || 'pendente'),
                data: orc.created_at ? new Date(orc.created_at).toLocaleDateString('pt-BR') : 'N/A',
                observacoes: orc.observacoes || ''
              })), [
                { key: 'numero', header: 'Número' },
                { key: 'cliente', header: 'Cliente' },
                { key: 'codigo_cliente', header: 'Código Cliente' },
                { key: 'valor_total', header: 'Valor Total' },
                { key: 'status', header: 'Status' },
                { key: 'data', header: 'Data' },
                { key: 'observacoes', header: 'Observações' }
              ])}>
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">Carregando...</div>
          ) : filteredOrcamentos.length === 0 ? (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              {searchTerm ? "Nenhum orçamento encontrado" : "Nenhum orçamento cadastrado. Clique em 'Novo Orçamento' para começar."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold text-xs">OS</TableHead>
                    <TableHead className="font-bold text-xs">DATA</TableHead>
                    <TableHead className="font-bold text-xs">EMPRESA</TableHead>
                    <TableHead className="font-bold text-xs">CONTATO</TableHead>
                    <TableHead className="font-bold text-xs">TELEFONE</TableHead>
                    <TableHead className="font-bold text-xs">E-MAIL</TableHead>
                    <TableHead className="font-bold text-xs">MANUSEIO</TableHead>
                    <TableHead className="font-bold text-xs text-right">VALOR</TableHead>
                    <TableHead className="font-bold text-xs">STATUS</TableHead>
                    <TableHead className="font-bold text-xs">OBSERVAÇÃO</TableHead>
                    <TableHead className="font-bold text-xs text-center">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrcamentos.map((orc) => (
                    <TableRow 
                      key={orc.id} 
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => handleViewDetails(orc)}
                    >
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        #{String(orc.numero_sequencial).padStart(3, '0')}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {orc.created_at ? new Date(orc.created_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">
                        {orc.clientes?.empresa || orc.clientes?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[100px] truncate">
                        {orc.contato_nome || orc.clientes?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {orc.contato_telefone || orc.clientes?.telefone || '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                        {orc.contato_email || orc.clientes?.email || '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                        {getEscopoResumo(orc.escopo_servico)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-right whitespace-nowrap">
                        R$ {orc.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge className={`${getStatusColor(orc.status || "pendente")} text-[10px] whitespace-nowrap`}>
                          {formatStatus(orc.status || "pendente")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[100px] truncate">
                        {orc.observacoes || '-'}
                      </TableCell>
                      <TableCell className="text-xs" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-[10px]"
                            onClick={() => handleGeneratePDF(orc)}
                          >
                            <FileDown className="h-3 w-3" />
                          </Button>
                          <EditOrcamentoDialog
                            orcamento={orc}
                            trigger={<Button variant="outline" size="sm" className="h-7 px-2 text-[10px]">Editar</Button>}
                            onSuccess={fetchOrcamentos}
                          />
                          <Button 
                            size="sm" 
                            className="bg-vip-primary hover:bg-vip-secondary text-black h-7 px-2 text-[10px]" 
                            onClick={() => handleViewDetails(orc)}
                          >
                            Ver
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OrcamentoDetailsDialog 
        orcamento={selectedOrcamento}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}