import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MinimalCard } from "@/components/MinimalCard"
import { AddCustoDialog } from "@/components/AddCustoDialog"
import { 
  Calculator, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Trash2
} from "lucide-react"
import { exportToExcel } from "@/lib/export"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function PlanilhaCustos() {
  const [custos, setCustos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ordensServico, setOrdensServico] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [custosRes, osRes] = await Promise.all([
        supabase.from('custos').select('*, orcamentos(numero_sequencial, codigo_cliente)').order('created_at', { ascending: false }),
        supabase.from('ordens_servico').select('*')
      ])

      if (custosRes.error) throw custosRes.error
      if (osRes.error) throw osRes.error

      setCustos(custosRes.data || [])
      setOrdensServico(osRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCusto = async (id: string) => {
    try {
      const { error } = await supabase.from('custos').delete().eq('id', id)
      if (error) throw error
      toast.success('Custo removido com sucesso')
      loadData()
    } catch (error) {
      console.error('Erro ao remover custo:', error)
      toast.error('Erro ao remover custo')
    }
  }

  const totalCustos = custos.reduce((acc, c) => acc + Number(c.valor_total || 0), 0)
  
  const custosPorInsumo = custos.reduce((acc, c) => {
    const insumo = c.insumo || 'Outros'
    if (!acc[insumo]) acc[insumo] = 0
    acc[insumo] += Number(c.valor_total || 0)
    return acc
  }, {} as Record<string, number>)

  const custosAgrupados = Object.entries(custosPorInsumo).map(([insumo, valor]) => ({
    insumo,
    valor: Number(valor),
    percentual: totalCustos > 0 ? ((Number(valor) / totalCustos) * 100).toFixed(1) : '0'
  })).sort((a, b) => b.valor - a.valor).slice(0, 5)

  const maiorCusto = custosAgrupados.length > 0 ? custosAgrupados[0] : null
  
  const receitaTotal = ordensServico.reduce((acc, os) => acc + (Number(os.valor_servico) || 0), 0)
  const lucroLiquido = receitaTotal - totalCustos
  const margemLiquida = receitaTotal > 0 ? ((lucroLiquido / receitaTotal) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-8 pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Planilha de Custos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Controle financeiro e análise de despesas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            const exportData = custos.map(c => ({
              insumo: c.insumo,
              descricao: c.descricao,
              quantidade: c.quantidade,
              valor_unitario: Number(c.valor_real || 0).toFixed(2),
              valor_com_imposto: Number(c.valor_com_imposto || 0).toFixed(2),
              valor_com_lucro: Number(c.valor_com_lucro || 0).toFixed(2),
              valor_total: Number(c.valor_total || 0).toFixed(2),
              orcamento: c.orcamentos ? `OS-${String(c.orcamentos.numero_sequencial).padStart(3, '0')}` : ''
            }))
            exportToExcel('planilha-custos', exportData, [
              { key: 'insumo', header: 'Insumo' },
              { key: 'descricao', header: 'Descrição' },
              { key: 'quantidade', header: 'Quantidade' },
              { key: 'valor_unitario', header: 'Valor Unitário (R$)' },
              { key: 'valor_com_imposto', header: 'Com Impostos (R$)' },
              { key: 'valor_com_lucro', header: 'Com Lucro (R$)' },
              { key: 'valor_total', header: 'Total (R$)' },
              { key: 'orcamento', header: 'Orçamento' },
            ])
          }}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
        <MinimalCard
          icon={DollarSign}
          title="Custos Totais"
          value={totalCustos > 0 ? `R$ ${(totalCustos / 1000).toFixed(1)}k` : "R$ 0"}
          description="Total registrado"
        />
        <MinimalCard
          icon={TrendingUp}
          title="Maior Custo"
          value={maiorCusto?.insumo || "—"}
          description={maiorCusto ? `${maiorCusto.percentual}% do total` : "Nenhum custo"}
        />
        <MinimalCard
          icon={Calculator}
          title="Margem Líquida"
          value={`${margemLiquida}%`}
          description="Após custos"
        />
        <MinimalCard
          icon={DollarSign}
          title="Receita"
          value={receitaTotal > 0 ? `R$ ${(receitaTotal / 1000).toFixed(1)}k` : "R$ 0"}
          description="Total de vendas"
        />
      </div>

      {/* Custos por Categoria */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Distribuição de Custos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando custos...</p>
            </div>
          ) : custosAgrupados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum custo registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {custosAgrupados.map((custo, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{custo.insumo}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {custo.percentual}%
                      </span>
                      <span className="font-bold text-sm sm:text-base">
                        R$ {custo.valor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${custo.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Custos Detalhada */}
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Custos Detalhados</CardTitle>
            <AddCustoDialog onSuccess={loadData} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : custos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum custo registrado. Clique em "Novo Custo" para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {custos.map((custo) => (
                <div key={custo.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm sm:text-base">{custo.insumo}</span>
                      {custo.orcamentos && (
                        <span className="text-xs text-primary font-mono">
                          OS-{String(custo.orcamentos.numero_sequencial).padStart(3, '0')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{custo.descricao}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-muted-foreground">Qtd: {custo.quantidade}</span>
                      <span className="text-muted-foreground">Unit: R$ {Number(custo.valor_real || 0).toFixed(2)}</span>
                      <span className="font-bold text-primary text-sm">Total: R$ {Number(custo.valor_total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleDeleteCusto(custo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise Financeira */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Análise Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Receita Total</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold mb-1">
                R$ {receitaTotal.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {ordensServico.length} {ordensServico.length === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Custos Totais</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold mb-1">
                R$ {totalCustos.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {custos.length} {custos.length === 1 ? 'registro' : 'registros'}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-primary/10 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Lucro Líquido</h3>
              </div>
              <p className={`text-xl sm:text-2xl font-bold mb-1 ${lucroLiquido >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                R$ {lucroLiquido.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Margem: {margemLiquida}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}