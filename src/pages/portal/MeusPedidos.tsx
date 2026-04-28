import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Search, Eye, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PRODUCTION_STAGES = [
  { id: 0, name: 'Aguardando Início' },
  { id: 1, name: 'Corte' },
  { id: 2, name: 'Costura' },
  { id: 3, name: 'Acabamento' },
  { id: 4, name: 'Controle de Qualidade' },
  { id: 5, name: 'Embalagem' },
];

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, string> = {
    orcamento: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    aprovado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    em_andamento: 'bg-primary/20 text-primary border-primary/30',
    concluido: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
    coletado: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return statusMap[status] || 'bg-muted text-muted-foreground border-border';
};

const formatStatus = (status: string) => {
  const statusLabels: Record<string, string> = {
    orcamento: 'Orçamento',
    aprovado: 'Aprovado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    coletado: 'Coletado',
  };
  return statusLabels[status] || status;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'concluido':
    case 'coletado':
      return <CheckCircle className="h-4 w-4" />;
    case 'em_andamento':
      return <Clock className="h-4 w-4" />;
    case 'cancelado':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export function MeusPedidos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('cliente_email_vinculo', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.numero_os?.toLowerCase().includes(search) ||
      order.tipo_servico?.toLowerCase().includes(search) ||
      order.descricao_servico?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meus Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe o status dos seus pedidos em tempo real</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou descrição..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Você ainda não possui pedidos vinculados à sua conta. Entre em contato com a VIP Manuseios para mais informações.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {order.numero_os}
                      </span>
                      <Badge className={getStatusBadge(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{formatStatus(order.status)}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Tipo</p>
                        <p className="font-medium capitalize">{order.tipo_servico?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Quantidade</p>
                        <p className="font-medium">{order.quantidade || 0} un</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Solicitação</p>
                        <p className="font-medium">
                          {order.data_solicitacao
                            ? new Date(order.data_solicitacao).toLocaleDateString('pt-BR')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Previsão</p>
                        <p className="font-medium">
                          {order.data_execucao
                            ? new Date(order.data_execucao).toLocaleDateString('pt-BR')
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Production Stage Progress */}
                    {(order.status === 'em_andamento' || order.status === 'aprovado') && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">
                          Etapa de Produção: {PRODUCTION_STAGES[order.etapa_producao || 0]?.name}
                        </p>
                        <div className="flex gap-1">
                          {PRODUCTION_STAGES.slice(1).map((stage) => (
                            <div
                              key={stage.id}
                              className={`h-2 flex-1 rounded-full ${
                                (order.etapa_producao || 0) >= stage.id
                                  ? 'bg-primary'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/portal/pedido/${order.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredOrders.length === 0 && orders.length > 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum pedido encontrado com o termo "{searchTerm}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
