import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  FileText, 
  Check,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const PRODUCTION_STAGES = [
  { id: 0, name: 'Aguardando Início', description: 'O pedido está na fila de produção' },
  { id: 1, name: 'Corte', description: 'Materiais sendo cortados conforme especificações' },
  { id: 2, name: 'Costura', description: 'Peças em processo de costura' },
  { id: 3, name: 'Acabamento', description: 'Finalização e detalhes das peças' },
  { id: 4, name: 'Controle de Qualidade', description: 'Verificação de qualidade e padrões' },
  { id: 5, name: 'Embalagem', description: 'Preparação para envio' },
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

export function DetalhePedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id, user]);

  const fetchOrder = async () => {
    if (!id || !user?.email) return;

    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('id', id)
        .eq('cliente_email_vinculo', user.email)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      toast.error('Pedido não encontrado ou sem permissão');
      navigate('/portal/pedidos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const currentStage = order.etapa_producao || 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/portal/pedidos')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar aos Pedidos
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{order.numero_os}</h1>
          <p className="text-muted-foreground">Detalhes completos do pedido</p>
        </div>
        <Badge className={`${getStatusBadge(order.status)} text-sm px-3 py-1`}>
          {formatStatus(order.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                <p className="font-medium capitalize">{order.tipo_servico?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade</p>
                <p className="font-medium">{order.quantidade || 0} unidades</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor do Serviço</p>
                <p className="font-medium">
                  {order.valor_servico
                    ? `R$ ${order.valor_servico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'A definir'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Local do Serviço</p>
                <p className="font-medium">{order.local_servico || '—'}</p>
              </div>
              {order.descricao_servico && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-medium">{order.descricao_servico}</p>
                </div>
              )}
              {order.observacoes && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{order.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Production Timeline */}
          {(order.status === 'em_andamento' || order.status === 'aprovado' || order.status === 'concluido') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Linha do Tempo da Produção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {PRODUCTION_STAGES.map((stage, index) => {
                    const isCompleted = currentStage > stage.id || order.status === 'concluido';
                    const isCurrent = currentStage === stage.id && order.status !== 'concluido';
                    
                    return (
                      <div key={stage.id} className="flex gap-4">
                        {/* Stage Indicator */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? <Check className="h-4 w-4" /> : stage.id}
                          </div>
                          {index < PRODUCTION_STAGES.length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 pb-8">
                          <p
                            className={`font-medium ${
                              isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {stage.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Solicitação</p>
                <p className="font-medium">
                  {order.data_solicitacao
                    ? new Date(order.data_solicitacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Previsão de Execução</p>
                <p className="font-medium">
                  {order.data_execucao
                    ? new Date(order.data_execucao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Última Atualização</p>
                <p className="font-medium">
                  {order.updated_at
                    ? new Date(order.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Material Fornecido */}
          {order.material_fornecido && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Material Fornecido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                  {JSON.stringify(order.material_fornecido, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">Precisa de ajuda?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Entre em contato conosco para dúvidas sobre seu pedido.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  Falar pelo WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
