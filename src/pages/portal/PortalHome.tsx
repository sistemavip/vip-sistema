import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package, ArrowRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export function PortalHome() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: orders.length,
    emAndamento: orders.filter(o => o.status === 'em_andamento' || o.status === 'aprovado').length,
    concluidos: orders.filter(o => o.status === 'concluido' || o.status === 'coletado').length,
  };

  const recentOrders = orders.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Bem-vindo ao Portal do Cliente
        </h1>
        <p className="text-muted-foreground">
          Acompanhe o status dos seus pedidos em tempo real
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.emAndamento}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.concluidos}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal/pedidos" className="gap-2">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido vinculado à sua conta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/portal/pedido/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{order.numero_os}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {order.tipo_servico?.replace('_', ' ')} • {order.quantidade} un
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusBadge(order.status)}>
                    {formatStatus(order.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">Precisa de ajuda?</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco para dúvidas sobre seus pedidos
              </p>
            </div>
            <Button asChild>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
