import { MinimalCard } from "@/components/MinimalCard"
import { GraficosDialog } from "@/components/GraficosDialog"
import { SecuritySummaryCard } from "@/components/SecuritySummaryCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import {
  Package,
  Shirt,
  Truck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3
} from "lucide-react"

export function Dashboard() {
  const navigate = useNavigate();
  const [ordensServico, setOrdensServico] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [envios, setEnvios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [osRes, prodRes, enviosRes] = await Promise.all([
        supabase.from('ordens_servico').select('*').order('created_at', { ascending: false }),
        supabase.from('produtos').select('*'),
        supabase.from('envios').select('*').order('created_at', { ascending: false })
      ])

      if (osRes.error) throw osRes.error
      if (prodRes.error) throw prodRes.error
      if (enviosRes.error) throw enviosRes.error

      setOrdensServico(osRes.data || [])
      setProdutos(prodRes.data || [])
      setEnvios(enviosRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas reais
  const emProducao = ordensServico.filter(o => o.status === 'em_andamento').length
  const estoqueTotal = produtos.reduce((sum, p) => sum + (p.estoque || 0), 0)
  const enviosPendentes = envios.filter(e => e.status === 'pendente' || e.status === 'em_transito').length
  const faturamentoTotal = ordensServico.reduce((sum, o) => sum + (Number(o.valor_servico) || 0), 0)

  const produtosEstoqueBaixo = produtos.filter(p => p.estoque <= p.estoque_min).length
  const prazosHoje = ordensServico.filter(o => {
    if (!o.data_execucao || o.status === 'concluido') return false
    const hoje = new Date().toISOString().split('T')[0]
    return o.data_execucao === hoje
  }).length

  const stats = [
    {
      title: "Produção",
      value: String(emProducao),
      icon: Shirt,
      trend: { value: `${ordensServico.length} total`, isPositive: emProducao > 0 }
    },
    {
      title: "Estoque",
      value: String(estoqueTotal),
      icon: Package,
      trend: { value: `${produtos.length} produtos`, isPositive: produtosEstoqueBaixo === 0 }
    },
    {
      title: "Envios",
      value: String(enviosPendentes),
      icon: Truck,
      trend: { value: `${envios.length} total`, isPositive: enviosPendentes < envios.length }
    },
    {
      title: "Faturamento",
      value: `R$ ${(faturamentoTotal / 1000).toFixed(1)}k`,
      icon: DollarSign,
      trend: { value: `${ordensServico.length} pedidos`, isPositive: faturamentoTotal > 0 }
    }
  ]

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      "orcamento": "Orçamento",
      "aprovado": "Aprovado",
      "em_andamento": "Produção",
      "concluido": "Finalizado"
    }
    return statusLabels[status] || status
  }

  const recentOrders = ordensServico.slice(0, 3).map(o => ({
    id: o.numero_os || o.id.slice(0, 8),
    cliente: o.local_servico || 'Cliente',
    status: formatStatus(o.status || 'orcamento'),
    valor: `R$ ${(Number(o.valor_servico) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }))

  const alerts = []
  if (produtosEstoqueBaixo > 0) {
    alerts.push({
      type: "warning",
      message: `${produtosEstoqueBaixo} produtos com estoque baixo`,
      action: "Revisar"
    })
  }
  if (prazosHoje > 0) {
    alerts.push({
      type: "info",
      message: `${prazosHoje} prazos hoje`,
      action: "Ver"
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Produção": "bg-blue-100 text-blue-800",
      "Finalizado": "bg-emerald-100 text-emerald-800",
      "Corte": "bg-amber-100 text-amber-800",
      "Pendente": "bg-red-100 text-red-800"
    }
    return statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6 md:space-y-12">
      {/* Minimal Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-primary">
          VIP MANUSEIOS
        </h1>
        <GraficosDialog />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.1 * index,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <MinimalCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Orders - Minimalist */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid gap-4 md:gap-8 lg:grid-cols-3"
      >

        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          <h2 className="text-base sm:text-lg font-black">Pedidos</h2>

          <div className="space-y-2">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 * index }}
                className="minimal-card p-3 md:p-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-primary">{order.id}</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs" variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-sm sm:text-base font-black text-primary">{order.valor}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{order.cliente}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-base sm:text-lg font-black">Alertas</h2>
          <div className="space-y-2">
            {alerts.map((alert, index) => {
              const Icon = alert.type === 'warning' ? AlertTriangle : TrendingUp

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.05 * index }}
                  className="minimal-card p-3 md:p-4"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-foreground truncate">{alert.message}</p>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs sm:text-sm text-primary flex-shrink-0 h-auto p-0"
                      onClick={() => {
                        if (alert.action === "Revisar") {
                          navigate("/app/estoque");
                        } else if (alert.action === "Ver") {
                          navigate("/app/confeccao");
                        }
                      }}
                    >
                      {alert.action}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Security Summary */}
          <SecuritySummaryCard />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4 relative z-50"
      >
        <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { icon: Shirt, label: "Pedido", path: "/app/confeccao" },
            { icon: Package, label: "Estoque", path: "/app/estoque" },
            { icon: Truck, label: "Envios", path: "/app/envios" },
            { icon: BarChart3, label: "Relatórios", path: "/app/relatorios" }
          ].map((action, index) => (
            <motion.div
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full h-10 sm:h-12 gap-1.5 sm:gap-2 bg-muted hover:bg-primary hover:text-background transition-all text-xs sm:text-sm"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">{action.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}