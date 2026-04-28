import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Download
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { ScrollArea } from "@/components/ui/scroll-area"

export function GraficosDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [custos, setCustos] = useState<any[]>([])
  const [ordensServico, setOrdensServico] = useState<any[]>([])

  useEffect(() => {
    if (open && orcamentos.length === 0) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    try {
      const [orcRes, custosRes, osRes] = await Promise.all([
        supabase.from('orcamentos').select('*'),
        supabase.from('custos').select('*'),
        supabase.from('ordens_servico').select('*')
      ])

      if (orcRes.error) throw orcRes.error
      if (custosRes.error) throw custosRes.error
      if (osRes.error) throw osRes.error

      setOrcamentos(orcRes.data || [])
      setCustos(custosRes.data || [])
      setOrdensServico(osRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados dos gráficos')
    } finally {
      setLoading(false)
    }
  }

  const processMonthlyData = () => {
    const currentYear = new Date().getFullYear()
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    return months.map((month, index) => {
      const monthOrcamentos = orcamentos.filter(o => {
        const date = new Date(o.created_at)
        return date.getFullYear() === currentYear && date.getMonth() === index
      })

      const monthCustos = custos.filter(c => {
        const date = new Date(c.data)
        return date.getFullYear() === currentYear && date.getMonth() === index
      })

      const monthOS = ordensServico.filter(os => {
        const date = new Date(os.created_at)
        return date.getFullYear() === currentYear && date.getMonth() === index
      })

      const receita = monthOrcamentos.reduce((sum, o) => sum + (Number(o.valor_total) || 0), 0) +
                     monthOS.reduce((sum, os) => sum + (Number(os.valor_servico) || 0), 0)
      const custoTotal = monthCustos.reduce((sum, c) => sum + (Number(c.valor) || 0), 0)
      const margemLiquida = receita - custoTotal

      return {
        mes: month,
        receita: Number(receita.toFixed(2)),
        custos: Number(custoTotal.toFixed(2)),
        margem: Number(margemLiquida.toFixed(2)),
        lucro: Number(((margemLiquida / receita) * 100 || 0).toFixed(1))
      }
    })
  }

  const processStatusData = () => {
    const statusCount = orcamentos.reduce((acc: any, orc) => {
      const status = orc.status || 'pendente'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const statusMap: Record<string, string> = {
      'aprovado': 'Aprovados',
      'pendente': 'Pendentes',
      'em_analise': 'Em Análise',
      'rejeitado': 'Rejeitados'
    }

    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusMap[status] || status,
      value: count
    }))
  }

  const processCostCategories = () => {
    const categorySum = custos.reduce((acc: any, c) => {
      const cat = c.categoria || 'Outros'
      acc[cat] = (acc[cat] || 0) + Number(c.valor || 0)
      return acc
    }, {})

    return Object.entries(categorySum)
      .map(([name, value]) => ({
        name,
        value: Number((value as number).toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  const monthlyData = processMonthlyData()
  const statusData = processStatusData()
  const costCategories = processCostCategories()

  const COLORS = ['#E5FF00', '#FFB800', '#00D1FF', '#FF4D4D', '#4DFF88', '#C77DFF']
  
  const totalReceita = monthlyData.reduce((sum, m) => sum + m.receita, 0)
  const totalCustos = monthlyData.reduce((sum, m) => sum + m.custos, 0)
  const margemTotal = totalReceita - totalCustos
  const percentualLucro = totalReceita > 0 ? ((margemTotal / totalReceita) * 100).toFixed(1) : '0.0'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 pointer-events-auto"
        >
          <BarChart3 className="h-4 w-4" />
          Ver Gráficos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0">
        <ScrollArea className="h-[90vh] p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Análise Financeira
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando gráficos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-6 w-6 text-primary" />
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {percentualLucro}%
                      </Badge>
                    </div>
                    <p className="text-xl font-bold">R$ {(totalReceita / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-muted-foreground">Receita (Ano)</p>
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <BarChart3 className="h-6 w-6 text-destructive mb-2" />
                    <p className="text-xl font-bold">R$ {(totalCustos / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-muted-foreground">Custos (Ano)</p>
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-6 w-6 text-emerald-500" />
                      <Badge className={margemTotal >= 0 ? "bg-emerald-500/20 text-emerald-400 text-xs" : "bg-destructive/20 text-destructive text-xs"}>
                        {margemTotal >= 0 ? '+' : ''}{percentualLucro}%
                      </Badge>
                    </div>
                    <p className="text-xl font-bold">R$ {(margemTotal / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-muted-foreground">Margem Líquida</p>
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <Calendar className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xl font-bold">{orcamentos.length + ordensServico.length}</p>
                    <p className="text-xs text-muted-foreground">Total Operações</p>
                  </CardContent>
                </Card>
              </div>

              {/* Receita vs Custos */}
              <Card className="card-gradient">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Movimentação Financeira Anual
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E5FF00" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#E5FF00" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCustos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="mes" stroke="#888" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px' }}
                        formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#E5FF00" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorReceita)" 
                        name="Receita"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="custos" 
                        stroke="#FF4D4D" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCustos)" 
                        name="Custos"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráficos em Grid */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Margem Líquida */}
                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Margem Líquida Mensal
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="mes" stroke="#888" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#888" style={{ fontSize: '11px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '11px' }}
                          formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        />
                        <Bar dataKey="margem" fill="#4DFF88" name="Margem" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status dos Orçamentos */}
                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Status dos Orçamentos
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                          style={{ fontSize: '11px' }}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Custos por Categoria */}
                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-destructive" />
                      Top 5 Categorias de Custos
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={costCategories} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis type="number" stroke="#888" style={{ fontSize: '11px' }} />
                        <YAxis dataKey="name" type="category" stroke="#888" width={80} style={{ fontSize: '10px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '11px' }}
                          formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        />
                        <Bar dataKey="value" fill="#FF4D4D" name="Valor" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Percentual de Lucro */}
                <Card className="card-gradient">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      % Lucro Mensal
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="mes" stroke="#888" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#888" style={{ fontSize: '11px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '11px' }}
                          formatter={(value: any) => `${value}%`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="lucro" 
                          stroke="#E5FF00" 
                          strokeWidth={2}
                          dot={{ fill: '#E5FF00', r: 4 }}
                          name="% Lucro"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
