import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusCard } from "@/components/StatusCard"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToExcel } from "@/lib/export"
import { EnvioDetailsDialog } from "@/components/EnvioDetailsDialog"
import { EditEnvioDialog } from "@/components/EditEnvioDialog"
import { supabase } from "@/integrations/supabase/client"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import {
  Truck,
  Package,
  Clock,
  MapPin,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function FreightCalculator() {
  const [formData, setFormData] = useState({
    cepOrigem: "",
    cepDestino: "",
    peso: "",
    altura: "",
    largura: "",
    profundidade: "",
    valor: "",
    modalidade: "sem_contrato" as "com_contrato" | "sem_contrato"
  });
  const [resultado, setResultado] = useState<any>(null);
  const [calculando, setCalculando] = useState(false);

  const calcular = () => {
    if (!formData.cepOrigem || !formData.cepDestino || !formData.peso || !formData.valor ||
      !formData.altura || !formData.largura || !formData.profundidade) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCalculando(true);
    setTimeout(() => {
      const pesoNum = parseFloat(formData.peso);
      const valorNum = parseFloat(formData.valor);
      const volumeCubado = (parseFloat(formData.altura) * parseFloat(formData.largura) * parseFloat(formData.profundidade)) / 6000;
      const pesoFinal = Math.max(pesoNum, volumeCubado);
      const multiplicador = formData.modalidade === "com_contrato" ? 0.7 : 1.0;

      setResultado({
        correios: {
          nome: "Correios PAC",
          prazo: "8-10 dias úteis",
          valor: (pesoFinal * 8.5 * multiplicador + valorNum * 0.02).toFixed(2)
        },
        jadlog: {
          nome: "Jadlog Expresso",
          prazo: "5-7 dias úteis",
          valor: (pesoFinal * 12.3 * multiplicador + valorNum * 0.03).toFixed(2)
        },
        total: {
          nome: "Total Express",
          prazo: "4-6 dias úteis",
          valor: (pesoFinal * 15.8 * multiplicador + valorNum * 0.025).toFixed(2)
        }
      });
      setCalculando(false);
      toast.success("Frete calculado!");
    }, 800);
  };

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="text-lg">Calculadora de Frete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">CEP de Origem</label>
          <Input
            placeholder="00000-000"
            className="mt-1"
            value={formData.cepOrigem}
            onChange={(e) => setFormData({ ...formData, cepOrigem: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">CEP de Destino</label>
          <Input
            placeholder="00000-000"
            className="mt-1"
            value={formData.cepDestino}
            onChange={(e) => setFormData({ ...formData, cepDestino: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Peso (kg)</label>
          <Input
            placeholder="0.0"
            type="number"
            step="0.1"
            className="mt-1"
            value={formData.peso}
            onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-sm font-medium">Altura (cm)</label>
            <Input
              placeholder="0"
              type="number"
              className="mt-1"
              value={formData.altura}
              onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Largura (cm)</label>
            <Input
              placeholder="0"
              type="number"
              className="mt-1"
              value={formData.largura}
              onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Prof. (cm)</label>
            <Input
              placeholder="0"
              type="number"
              className="mt-1"
              value={formData.profundidade}
              onChange={(e) => setFormData({ ...formData, profundidade: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Valor (R$)</label>
          <Input
            placeholder="0.00"
            type="number"
            step="0.01"
            className="mt-1"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Modalidade</label>
          <select
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
            value={formData.modalidade}
            onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as "com_contrato" | "sem_contrato" })}
          >
            <option value="sem_contrato">Sem Contrato</option>
            <option value="com_contrato">Com Contrato (30% desc.)</option>
          </select>
        </div>

        <Button
          className="w-full"
          onClick={calcular}
          disabled={calculando}
        >
          {calculando ? "Calculando..." : "Calcular Frete"}
        </Button>

        {resultado && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Opções de Frete:</p>
            {Object.values(resultado).map((opcao: any, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                <div>
                  <p className="font-medium">{opcao.nome}</p>
                  <p className="text-xs text-muted-foreground">{opcao.prazo}</p>
                </div>
                <p className="font-semibold">R$ {opcao.valor}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Envios() {
  const { isAdmin: userIsAdmin } = useIsAdmin();
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadEnvios()
  }, [])

  const loadEnvios = async () => {
    try {
      const { data, error } = await supabase
        .from('envios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setShipments(data || [])
    } catch (error) {
      console.error('Erro ao carregar envios:', error)
      toast.error('Erro ao carregar envios')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: "Envios Pendentes",
      value: String(shipments.filter(s => s.status === 'pendente').length),
      description: "Aguardando postagem",
      icon: Clock,
      variant: "warning" as const
    },
    {
      title: "Em Trânsito",
      value: String(shipments.filter(s => s.status === 'em_transito').length),
      description: "Em rota de entrega",
      icon: Truck,
      variant: "default" as const
    },
    {
      title: "Entregues",
      value: String(shipments.filter(s => s.status === 'entregue').length),
      description: "Total entregue",
      icon: CheckCircle,
      variant: "success" as const
    },
    {
      title: "Valor em Trânsito",
      value: `R$ ${(shipments.filter(s => s.status === 'em_transito').reduce((sum, s) => sum + (s.valor_frete || 0), 0)).toFixed(2)}`,
      description: "Valor total",
      icon: Package,
      variant: "success" as const
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Pendente": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Em Trânsito": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Entregue": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Atrasado": "bg-destructive/20 text-destructive border-destructive/30"
    }
    return statusMap[status as keyof typeof statusMap] || "bg-muted/20 text-muted-foreground border-border/30"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pendente": return <Clock className="h-4 w-4" />
      case "Em Trânsito": return <Truck className="h-4 w-4" />
      case "Entregue": return <CheckCircle className="h-4 w-4" />
      case "Atrasado": return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const filteredShipments = shipments.filter(s => {
    if (!searchTerm.trim()) return (filterStatus === 'all' || s.status === filterStatus);
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = (s.destinatario_nome?.toLowerCase() || '').includes(search) ||
      (s.codigo_rastreio?.toLowerCase() || '').includes(search) ||
      (s.destinatario_cidade?.toLowerCase() || '').includes(search) ||
      (s.destinatario_estado?.toLowerCase() || '').includes(search) ||
      (s.forma_envio?.toLowerCase() || '').includes(search) ||
      (s.cep_destino || '').includes(search)
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus
    return matchesSearch && matchesFilter
  })

  function buildTrackUrl(codigo?: string, transportadora?: string) {
    if (!codigo) return `https://www.google.com/search?q=rastrear+${encodeURIComponent(transportadora || '')}`;
    const t = (transportadora || '').toLowerCase();
    if (t.includes('correios')) return `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(codigo)}`;
    if (t.includes('jadlog')) return `https://www.jadlog.com.br/tracking?cte=${encodeURIComponent(codigo)}`;
    if (t.includes('total')) return `https://portal.totalexpress.com.br/tracking?codigo=${encodeURIComponent(codigo)}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`rastrear ${transportadora} ${codigo}`)}`;
  }
  return (
    <div className="space-y-8 pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Gestão de Envios
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Controle completo da sua logística de entregas
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
          const exportData = shipments.map(s => ({
            destinatario_nome: s.destinatario_nome,
            destinatario_cidade: s.destinatario_cidade,
            destinatario_estado: s.destinatario_estado,
            forma_envio: s.forma_envio,
            codigo_rastreio: s.codigo_rastreio || '',
            status: s.status,
            peso: s.peso,
            valor_frete: s.valor_frete,
            data_postagem: s.data_postagem ? new Date(s.data_postagem).toLocaleDateString('pt-BR') : '',
            data_entrega: s.data_entrega ? new Date(s.data_entrega).toLocaleDateString('pt-BR') : '',
          }));
          exportToExcel('envios', exportData, [
            { key: 'destinatario_nome', header: 'Destinatário' },
            { key: 'destinatario_cidade', header: 'Cidade' },
            { key: 'destinatario_estado', header: 'Estado' },
            { key: 'forma_envio', header: 'Transportadora' },
            { key: 'codigo_rastreio', header: 'Código Rastreio' },
            { key: 'status', header: 'Status' },
            { key: 'peso', header: 'Peso (kg)' },
            { key: 'valor_frete', header: 'Valor Frete (R$)' },
            { key: 'data_postagem', header: 'Data Postagem' },
            { key: 'data_entrega', header: 'Data Entrega' },
          ])
        }}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatusCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg sm:text-xl">Controle de Envios</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar envios..."
                  className="pl-8 w-full sm:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_transito">Em Trânsito</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => navigate('/app/cronograma')}>
                <Calendar className="h-4 w-4" />
                <span>Cronograma</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Carregando envios...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhum envio cadastrado ainda.</p>
              <p className="text-xs text-muted-foreground">Use o assistente de IA para criar envios.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShipments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum envio encontrado com os filtros aplicados</p>
                </div>
              ) : (
                filteredShipments.map((shipment) => {
                  const statusMap: Record<string, string> = {
                    "pendente": "Pendente",
                    "em_transito": "Em Trânsito",
                    "entregue": "Entregue",
                    "cancelado": "Cancelado"
                  }
                  const displayStatus = statusMap[shipment.status] || shipment.status

                  return (
                    <div key={shipment.id} className="rounded-lg border border-border/50 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                        {/* Shipment Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs sm:text-sm font-medium text-primary truncate max-w-[200px]">{shipment.destinatario_nome}</span>
                            <Badge className={`${getStatusBadge(displayStatus)} text-xs`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(displayStatus)}
                                {displayStatus}
                              </span>
                            </Badge>
                            {shipment.forma_envio && (
                              <span className="text-xs text-muted-foreground capitalize">{shipment.forma_envio}</span>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Destinatário</p>
                              <p className="text-sm font-medium truncate">{shipment.destinatario_nome}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{shipment.destinatario_cidade}/{shipment.destinatario_estado}</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Rastreamento</p>
                              <p className="text-xs text-muted-foreground">{shipment.cep_destino || "—"}</p>
                              {shipment.codigo_rastreio && (
                                <p className="text-xs font-mono text-primary mt-1 truncate">{shipment.codigo_rastreio}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Peso</p>
                              <p className="text-sm font-medium">{shipment.peso ? `${shipment.peso} kg` : "—"}</p>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Postagem:</span>
                              <span className="font-medium">{shipment.data_postagem ? new Date(shipment.data_postagem).toLocaleDateString('pt-BR') : "Pendente"}</span>
                            </div>
                            {shipment.data_entrega && (
                              <>
                                <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block"></div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Entrega:</span>
                                  <span className="font-medium">{new Date(shipment.data_entrega).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Values and Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col items-start sm:items-center lg:items-end w-full lg:w-auto">
                          <div className="text-left sm:text-right">
                            <p className="text-base sm:text-lg font-bold text-primary">R$ {(shipment.valor_frete || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Valor do frete</p>
                          </div>
                          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                            {shipment.codigo_rastreio && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none"
                                onClick={() => window.open(buildTrackUrl(shipment.codigo_rastreio, shipment.forma_envio), '_blank')}
                              >
                                Rastrear
                              </Button>
                            )}
                            {userIsAdmin && (
                              <EditEnvioDialog
                                envio={shipment}
                                trigger={<Button variant="outline" size="sm" className="flex-1 sm:flex-none">Editar</Button>}
                                onSuccess={loadEnvios}
                              />
                            )}
                            <EnvioDetailsDialog
                              shipment={shipment}
                              trigger={
                                <Button
                                  size="sm"
                                  className="flex-1 sm:flex-none"
                                >
                                  Detalhes
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions and Map */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Freight Calculator */}
        <FreightCalculator />

        {/* Recent Deliveries */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Entregas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shipments
                .filter(s => s.status === 'entregue' && s.data_entrega)
                .sort((a, b) => new Date(b.data_entrega).getTime() - new Date(a.data_entrega).getTime())
                .slice(0, 5)
                .map((shipment) => (
                  <div key={shipment.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{shipment.destinatario_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {shipment.destinatario_cidade}/{shipment.destinatario_estado}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {(shipment.valor_frete || 0).toFixed(2)} • {new Date(shipment.data_entrega).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <EnvioDetailsDialog
                      shipment={shipment}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Package className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                ))}
              {shipments.filter(s => s.status === 'entregue').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma entrega recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Alerts */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Alertas de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const pendingShipments = shipments.filter(s => s.status === 'pendente' && !s.data_postagem);
                const inTransitShipments = shipments.filter(s => s.status === 'em_transito');
                const delayedShipments = shipments.filter(s => {
                  if (s.status !== 'em_transito' || !s.data_postagem || !s.prazo_entrega) return false;
                  const dataPostagem = new Date(s.data_postagem);
                  const prazoEntrega = new Date(dataPostagem);
                  prazoEntrega.setDate(prazoEntrega.getDate() + s.prazo_entrega);
                  return prazoEntrega < today;
                });

                return (
                  <>
                    {pendingShipments.length > 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{pendingShipments.length} {pendingShipments.length === 1 ? 'envio pendente' : 'envios pendentes'}</p>
                          <p className="text-xs text-muted-foreground">Aguardando postagem</p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-primary"
                            onClick={() => setFilterStatus('pendente')}
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </div>
                    )}

                    {delayedShipments.length > 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <Clock className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{delayedShipments.length} {delayedShipments.length === 1 ? 'envio atrasado' : 'envios atrasados'}</p>
                          <p className="text-xs text-muted-foreground">Prazo de entrega ultrapassado</p>
                          <div className="flex gap-2 mt-1">
                            {delayedShipments.slice(0, 2).map((s) => (
                              <EnvioDetailsDialog
                                key={s.id}
                                shipment={s}
                                trigger={
                                  <Button variant="link" className="h-auto p-0 text-xs text-primary">
                                    {s.destinatario_nome.split(' ')[0]}
                                  </Button>
                                }
                              />
                            ))}
                            {delayedShipments.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{delayedShipments.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {inTransitShipments.length > 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <Truck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{inTransitShipments.length} {inTransitShipments.length === 1 ? 'pacote' : 'pacotes'} em trânsito</p>
                          <p className="text-xs text-muted-foreground">Monitoramento ativo</p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-primary"
                            onClick={() => {
                              inTransitShipments.forEach(s => {
                                if (s.codigo_rastreio && s.forma_envio) {
                                  window.open(buildTrackUrl(s.codigo_rastreio, s.forma_envio), '_blank');
                                }
                              });
                              toast.success(`Abrindo rastreamento de ${inTransitShipments.filter(s => s.codigo_rastreio).length} envios`);
                            }}
                          >
                            Rastrear todos
                          </Button>
                        </div>
                      </div>
                    )}

                    {pendingShipments.length === 0 && delayedShipments.length === 0 && inTransitShipments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum alerta no momento
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}