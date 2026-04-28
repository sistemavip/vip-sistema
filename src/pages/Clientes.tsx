import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusCard } from "@/components/StatusCard"
import { Input } from "@/components/ui/input"
import { AddClientDialog } from "@/components/AddClientDialog"
import { AddPedidoDialog } from "@/components/AddPedidoDialog"
import { ClienteHistoricoDialog } from "@/components/ClienteHistoricoDialog"
import { EditClientDialog } from "@/components/EditClientDialog"
import { exportToExcel } from "@/lib/export"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { 
  Users, 
  TrendingUp, 
  ShoppingCart,
  Star,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  MapPin
} from "lucide-react"
import { toast } from "sonner"

export function Clientes() {
  const { isAdmin: userIsAdmin } = useIsAdmin();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    return (
      (c.nome?.toLowerCase() || '').includes(search) ||
      (c.empresa?.toLowerCase() || '').includes(search) ||
      (c.email?.toLowerCase() || '').includes(search) ||
      (c.codigo?.toLowerCase() || '').includes(search) ||
      (c.telefone || '').includes(search) ||
      (c.cpf_cnpj || '').includes(search) ||
      (c.cidade?.toLowerCase() || '').includes(search) ||
      (c.estado?.toLowerCase() || '').includes(search)
    );
  });

  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [ordensServico, setOrdensServico] = useState<any[]>([]);

  useEffect(() => {
    loadAdditionalData();
  }, []);

  const loadAdditionalData = async () => {
    try {
      const [orcamentosRes, osRes] = await Promise.all([
        supabase.from('orcamentos').select('*'),
        supabase.from('ordens_servico').select('*')
      ]);
      
      if (!orcamentosRes.error) setOrcamentos(orcamentosRes.data || []);
      if (!osRes.error) setOrdensServico(osRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados adicionais:', error);
    }
  };

  const stats = [
    {
      title: "Total de Clientes",
      value: String(clients.length),
      description: "Cadastrados",
      icon: Users,
      variant: "default" as const
    },
    {
      title: "Com Pedidos",
      value: String(clients.filter(c => ordensServico.some(os => os.cliente_id === c.id)).length),
      description: "Clientes ativos",
      icon: TrendingUp,
      variant: "success" as const
    },
    {
      title: "Total Orçamentos",
      value: String(orcamentos.length),
      description: "Cadastrados",
      icon: ShoppingCart,
      variant: "success" as const
    },
    {
      title: "Total Pedidos",
      value: String(ordensServico.length),
      description: "Ordens de serviço",
      icon: Star,
      variant: "success" as const
    }
  ]

  const getClientePedidos = (clienteId: string) => {
    return ordensServico.filter(os => os.cliente_id === clienteId).length;
  };

  const getClienteValorTotal = (clienteId: string) => {
    const osValor = ordensServico
      .filter(os => os.cliente_id === clienteId)
      .reduce((acc, os) => acc + (Number(os.valor_servico) || 0), 0);
    
    const orcValor = orcamentos
      .filter(orc => orc.cliente_id === clienteId)
      .reduce((acc, orc) => acc + (Number(orc.valor_total) || 0), 0);
    
    return osValor + orcValor;
  };

  const topClients = clients
    .map(c => ({
      ...c,
      pedidos: getClientePedidos(c.id),
      valorTotal: getClienteValorTotal(c.id)
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 5);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="space-y-8 pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Gestão de Clientes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie relacionamentos e histórico de pedidos
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            const exportData = clients.map(c => ({
              codigo: c.codigo,
              nome: c.nome,
              email: c.email || '',
              telefone: c.telefone || '',
              cpf_cnpj: c.cpf_cnpj || '',
              endereco: c.endereco || '',
              cidade: c.cidade || '',
              estado: c.estado || '',
              pedidos: getClientePedidos(c.id),
              valor_total: getClienteValorTotal(c.id).toFixed(2)
            }));
            exportToExcel('clientes', exportData, [
              { key: 'codigo', header: 'Código' },
              { key: 'nome', header: 'Nome' },
              { key: 'email', header: 'Email' },
              { key: 'telefone', header: 'Telefone' },
              { key: 'cpf_cnpj', header: 'CPF/CNPJ' },
              { key: 'endereco', header: 'Endereço' },
              { key: 'cidade', header: 'Cidade' },
              { key: 'estado', header: 'Estado' },
              { key: 'pedidos', header: 'Pedidos' },
              { key: 'valor_total', header: 'Valor Total (R$)' },
            ]);
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
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Base de Clientes</CardTitle>
              {userIsAdmin && <AddClientDialog onSuccess={loadClients} />}
            </div>
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => {
                const pedidos = getClientePedidos(client.id);
                const valorTotal = getClienteValorTotal(client.id);
                
                return (
                  <div key={client.id} className="rounded-lg border border-border/50 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      
                      {/* Client Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{client.nome}</h3>
                            {client.empresa && (
                              <p className="text-sm text-muted-foreground truncate mt-1">{client.empresa}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Ativo</Badge>
                            {pedidos > 0 && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                {pedidos} {pedidos === 1 ? 'pedido' : 'pedidos'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{client.email || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>{client.telefone || "—"}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{client.cidade && client.estado ? `${client.cidade}, ${client.estado}` : client.endereco || "—"}</span>
                            </div>
                            <div className="text-xs sm:text-sm">
                              <span className="text-muted-foreground">CPF/CNPJ: </span>
                              <span className="font-medium truncate">{client.cpf_cnpj || "—"}</span>
                            </div>
                            <div className="text-xs sm:text-sm">
                              <span className="text-muted-foreground">Código: </span>
                              <span className="font-mono font-medium">{client.codigo}</span>
                            </div>
                          </div>
                          
                          {valorTotal > 0 && (
                            <div className="sm:col-span-2 lg:col-span-1">
                              <div className="text-xs text-muted-foreground">Valor Total</div>
                              <div className="text-base sm:text-lg font-bold text-primary">
                                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap sm:flex-col lg:flex-col w-full sm:w-auto">
                        {client.email && (
                          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" asChild>
                            <a href={`mailto:${client.email}`}>
                              <Mail className="h-4 w-4" />
                              <span className="hidden sm:inline">Contatar</span>
                            </a>
                          </Button>
                        )}
                        {userIsAdmin && (
                          <EditClientDialog 
                            client={client}
                            trigger={<Button variant="outline" size="sm" className="flex-1 sm:flex-none">Editar</Button>}
                            onSuccess={loadClients}
                          />
                        )}
                        <ClienteHistoricoDialog 
                          client={client} 
                          trigger={<Button size="sm" className="flex-1 sm:w-full">Histórico</Button>}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Top Clients */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Clientes VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum cliente com pedidos ainda
                </p>
              ) : (
                topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-muted text-muted-foreground' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.nome}</p>
                      <p className="text-xs text-muted-foreground">{client.pedidos} pedidos • R$ {client.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <ClienteHistoricoDialog 
                      client={client} 
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordensServico.slice(0, 3).map((os) => {
                const cliente = clients.find(c => c.id === os.cliente_id);
                return (
                  <div key={os.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cliente?.nome || 'Cliente'} - OS {os.numero_os}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(os.created_at).toLocaleDateString('pt-BR')} • R$ {(os.valor_servico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {ordensServico.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userIsAdmin && (
                <AddClientDialog 
                  trigger={
                    <Button className="w-full justify-start gap-3">
                      <Users className="h-4 w-4" />
                      Cadastrar Novo Cliente
                    </Button>
                  }
                  onSuccess={loadClients}
                />
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3" 
                onClick={() => {
                  const emailList = clients.filter(c => c.email).map(c => c.email).join(',');
                  if (emailList) {
                    window.location.href = `mailto:${emailList}?subject=Newsletter`;
                  } else {
                    toast.info("Nenhum cliente com email cadastrado");
                  }
                }}
              >
                <Mail className="h-4 w-4" />
                Enviar Newsletter
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => {
                  const exportData = clients.map(c => ({
                    codigo: c.codigo,
                    nome: c.nome,
                    email: c.email || '',
                    telefone: c.telefone || '',
                    cpf_cnpj: c.cpf_cnpj || '',
                    endereco: c.endereco || '',
                    cidade: c.cidade || '',
                    estado: c.estado || '',
                  }));
                  exportToExcel('base_clientes', exportData, [
                    { key: 'codigo', header: 'Código' },
                    { key: 'nome', header: 'Nome' },
                    { key: 'email', header: 'Email' },
                    { key: 'telefone', header: 'Telefone' },
                    { key: 'cpf_cnpj', header: 'CPF/CNPJ' },
                    { key: 'endereco', header: 'Endereço' },
                    { key: 'cidade', header: 'Cidade' },
                    { key: 'estado', header: 'Estado' },
                  ]);
                  toast.success("Base de dados exportada!");
                }}
              >
                <Download className="h-4 w-4" />
                Exportar Base de Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}