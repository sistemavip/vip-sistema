import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusCard } from "@/components/StatusCard"
import { Input } from "@/components/ui/input"
import { AddEstoqueClienteDialog } from "@/components/AddEstoqueClienteDialog"
import { AddClientDialog } from "@/components/AddClientDialog"
import { EstoqueSaidaDialog } from "@/components/EstoqueSaidaDialog"
import { exportToExcel } from "@/lib/export"
import { supabase } from "@/integrations/supabase/client"
import { 
  Package, 
  Search,
  Download,
  Trash2,
  ArrowLeft,
  Users,
  Image as ImageIcon
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useIsAdmin } from "@/hooks/useIsAdmin"

export function EstoqueCliente() {
  const { isAdmin } = useIsAdmin();
  const [estoqueItens, setEstoqueItens] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [estoqueRes, clientesRes] = await Promise.all([
        supabase
          .from('estoque_cliente')
          .select('*, clientes(codigo, nome), orcamentos(numero_sequencial)')
          .order('created_at', { ascending: false }),
        supabase.from('clientes').select('id, codigo, nome').order('nome')
      ])
      
      if (estoqueRes.error) throw estoqueRes.error
      if (clientesRes.error) throw clientesRes.error
      
      setEstoqueItens(estoqueRes.data || [])
      setClientes(clientesRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar estoque')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); }
    try {
      const { error } = await supabase.from('estoque_cliente').delete().eq('id', id)
      if (error) throw error
      toast.success('Item removido com sucesso')
      loadData()
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast.error('Erro ao remover item')
    }
  }

  // Clientes com ao menos 1 item OU todos, mas podemos buscar...
  const filteredClientes = clientes.filter(c => {
    const search = searchTerm.toLowerCase()
    return c.nome.toLowerCase().includes(search) || c.codigo.toLowerCase().includes(search)
  })

  // Exportar dados (Todo o estoque)
  const handleExport = () => {
    const exportData = estoqueItens.map(item => ({
      cliente: item.clientes?.nome || 'N/A',
      item: item.item_descricao || 'Sem descrição',
      entrada: item.quantidade_entrada || 0,
      saida: item.quantidade_saida || 0,
      saldo: item.saldo || 0,
      data_entrada: item.data_entrada ? new Date(item.data_entrada).toLocaleDateString('pt-BR') : '-',
      data_saida: item.data_saida ? new Date(item.data_saida).toLocaleDateString('pt-BR') : '-',
      destino: item.destino_saida || '-',
      observacoes: item.observacoes || '-'
    }))

    exportToExcel('estoque-clientes-geral', exportData, [
      { key: 'cliente', header: 'Cliente' },
      { key: 'item', header: 'Item' },
      { key: 'entrada', header: 'Entrada' },
      { key: 'saida', header: 'Saída' },
      { key: 'saldo', header: 'Saldo' },
      { key: 'data_entrada', header: 'Data Entrada' },
      { key: 'data_saida', header: 'Data Saída' },
      { key: 'destino', header: 'Destino' },
      { key: 'observacoes', header: 'Observações' },
    ])
  }

  // Exportar dados de um cliente específico
  const handleExportSelectedClient = () => {
    if (!selectedClienteId) return
    const cliente = clientes.find(c => c.id === selectedClienteId)
    const exportData = itensFiltrados.map(item => ({
      item: item.item_descricao || 'Sem descrição',
      entrada: item.quantidade_entrada || 0,
      saida: item.quantidade_saida || 0,
      saldo: item.saldo || 0,
      data_entrada: item.data_entrada ? new Date(item.data_entrada).toLocaleDateString('pt-BR') : '-',
      data_saida: item.data_saida ? new Date(item.data_saida).toLocaleDateString('pt-BR') : '-',
      destino: item.destino_saida || '-',
      observacoes: item.observacoes || '-'
    }))

    exportToExcel(`estoque-${cliente?.nome || 'cliente'}`, exportData, [
      { key: 'item', header: 'Item' },
      { key: 'entrada', header: 'Entrada' },
      { key: 'saida', header: 'Saída' },
      { key: 'saldo', header: 'Saldo' },
      { key: 'data_entrada', header: 'Data Entrada' },
      { key: 'data_saida', header: 'Data Saída' },
      { key: 'destino', header: 'Destino' },
      { key: 'observacoes', header: 'Observações' },
    ])
  }

  // ------------ VISAO 1: LISTA DE CLIENTES ------------
  if (!selectedClienteId) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
              Estoque por Cliente
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione um cliente para visualizar seu inventário
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar Geral</span>
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome ou código..."
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10"><p>Carregando clientes...</p></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            
            {/* Card ADD NOVO CLIENTE */}
            {isAdmin && (
              <AddClientDialog 
                trigger={
                  <div className="rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col items-center justify-center p-6 h-[160px] cursor-pointer group">
                    <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Adicionar Novo Cliente</span>
                  </div>
                }
                onSuccess={loadData}
              />
            )}

            {/* Cards dos Clientes */}
            {filteredClientes.map(cliente => {
              const itensDoCliente = estoqueItens.filter(i => i.cliente_id === cliente.id)
              const totalItens = itensDoCliente.length
              const saldoTotal = itensDoCliente.reduce((acc, curr) => acc + curr.saldo, 0)
              
              return (
                <div 
                  key={cliente.id} 
                  onClick={() => {
                    setSelectedClienteId(cliente.id);
                    setSearchTerm(''); // Reset search when entering a client
                  }}
                  className="rounded-xl border border-border/50 bg-card p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer flex flex-col h-[160px]"
                >
                  <div className="flex justify-between items-start mb-auto">
                    <div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1" title={cliente.nome}>{cliente.nome}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Cód: {cliente.codigo}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Itens Cadastrados</p>
                      <p className="font-semibold text-lg">{totalItens}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{saldoTotal}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ------------ VISAO 2: DETALHES DO CLIENTE ------------
  const clienteSelecionado = clientes.find(c => c.id === selectedClienteId)
  
  if (selectedClienteId && !clienteSelecionado && !loading) {
    console.error("Cliente selecionado não encontrado:", selectedClienteId);
    return (
      <div className="p-8 text-center">
        <p>Erro: Cliente não encontrado ou dados ainda carregando.</p>
        <Button onClick={() => setSelectedClienteId(null)} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const itensFiltrados = estoqueItens.filter(item => 
    item.cliente_id === selectedClienteId && 
    ((item.item_descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  )
  
  return (
    <div className="space-y-6">
      {/* Header Detail */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => { setSelectedClienteId(null); setSearchTerm(''); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{clienteSelecionado?.nome}</h1>
            <p className="text-sm text-muted-foreground">Cód: {clienteSelecionado?.codigo}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="gap-2" onClick={handleExportSelectedClient}>
             <Download className="h-4 w-4" />
             <span className="hidden sm:inline">Exportar Planilha</span>
           </Button>
           <AddEstoqueClienteDialog defaultClienteId={selectedClienteId} onSuccess={loadData} />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos itens deste cliente..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {itensFiltrados.length === 0 ? (
           <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
             <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
             <p className="text-muted-foreground font-medium">Nenhum item encontrado no estoque deste cliente.</p>
             <p className="text-sm text-muted-foreground mt-1">Use o botão acima para adicionar um novo item.</p>
           </div>
        ) : (
          itensFiltrados.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row shadow-sm hover:bg-muted/10 transition-colors h-full">
                {/* Imagem do Produto */}
                <div className="w-full sm:w-32 h-32 sm:h-auto bg-muted/30 flex-shrink-0 flex items-center justify-center border-r border-border">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.item_descricao} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-[10px] uppercase">Sem foto</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{item.item_descricao}</h3>
                      {item.orcamentos && (
                        <Badge variant="outline" className="text-xs mt-1 bg-primary/10 shrink-0">
                          OS-{String(item.orcamentos.numero_sequencial).padStart(3, '0')}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 sm:p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Entrada</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{item.quantidade_entrada}</p>
                     </div>
                     <div className="bg-amber-50 dark:bg-amber-950/20 p-2 sm:p-3 rounded-lg border border-amber-100 dark:border-amber-900">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Saída</p>
                        <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{item.quantidade_saida}</p>
                     </div>
                     <div className="bg-primary/5 p-2 sm:p-3 rounded-lg border border-primary/20">
                        <p className="text-xs text-primary font-medium mb-1">Saldo Atual</p>
                        <p className="text-xl font-bold">{item.saldo}</p>
                     </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                    {item.observacoes && (
                        <p className="text-xs text-muted-foreground max-w-md line-clamp-2"><strong>Obs:</strong> {item.observacoes}</p>
                    )}
                    <div className="ml-auto">
                      {item.saldo > 0 && <EstoqueSaidaDialog item={item} onSuccess={loadData} />}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
