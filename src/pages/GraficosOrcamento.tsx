import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Calendar,
  ArrowLeft,
  Download
} from "lucide-react"
import { useNavigate } from "react-router-dom"
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

export function GraficosOrcamento() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [custos, setCustos] = useState<any[]>([])
  const [ordensServico, setOrdensServico] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

  // Processar dados para gráficos mensais
  const processMonthlyData = () => {
    const currentYear = new Date().getFullYear()
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    const monthlyData = months.map((month, index) => {
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

    return monthlyData
  }

  // Processar status dos orçamentos
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
      value: count,
      status: status
    }))
  }

  // Processar categorias de custos
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
  }

  const monthlyData = processMonthlyData()
  const statusData = processStatusData()
  const costCategories = processCostCategories()

  const COLORS = ['#E5FF00', '#FFB800', '#00D1FF', '#FF4D4D', '#4DFF88', '#C77DFF']
  
  const totalReceita = monthlyData.reduce((sum, m) => sum + m.receita, 0)
  const totalCustos = monthlyData.reduce((sum, m) => sum + m.custos, 0)
  const margemTotal = totalReceita - totalCustos
  const percentualLucro = totalReceita > 0 ? ((margemTotal / totalReceita) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando gráficos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="pointer-events-auto"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
              Análise Financeira
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualização completa de receitas, custos e margens
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.info('Exportação de gráficos em desenvolvimento')}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar Relatório</span>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="card-gradient">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <Badge className="bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                {percentualLucro}%
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">R$ {(totalReceita / 1000).toFixed(1)}k</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Receita Total (Ano)</p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">R$ {(totalCustos / 1000).toFixed(1)}k</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Custos Totais (Ano)</p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
              <Badge className={margemTotal >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}>
                {margemTotal >= 0 ? '+' : ''}{percentualLucro}%
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">R$ {(margemTotal / 1000).toFixed(1)}k</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Margem Líquida (Ano)</p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{orcamentos.length + ordensServico.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total de Operações</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal - Receita vs Custos */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Movimentação Financeira Anual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
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
              <XAxis dataKey="mes" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Legend />
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

      {/* Gráficos Secundários */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Margem Líquida */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Margem Líquida Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mes" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="margem" fill="#4DFF88" name="Margem Líquida" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status dos Orçamentos */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição de Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categorias de Custos */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-destructive" />
              Custos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="value" fill="#FF4D4D" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Percentual de Lucro Mensal */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Percentual de Lucro Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mes" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value: any) => `${value}%`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="#E5FF00" 
                  strokeWidth={3}
                  dot={{ fill: '#E5FF00', r: 5 }}
                  name="% Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
