import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Package, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClienteHistoricoDialogProps {
  client: any;
  trigger: React.ReactNode;
}

export function ClienteHistoricoDialog({ client, trigger }: ClienteHistoricoDialogProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tempoPlataforma: "",
    totalPedidos: 0,
    totalOrcamentos: 0,
    totalEnvios: 0,
    valorTotal: 0
  });
  const [historico, setHistorigo] = useState<any[]>([]);

  useEffect(() => {
    if (client.id) {
      loadClientHistory();
    }
  }, [client.id]);

  const loadClientHistory = async () => {
    try {
      setLoading(true);
      
      // Buscar ordens de serviço
      const { data: ordensServico, error: osError } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });

      if (osError) throw osError;

      // Buscar orçamentos
      const { data: orcamentos, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });

      if (orcError) throw orcError;

      // Buscar envios
      const { data: envios, error: envError } = await supabase
        .from('envios')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });

      if (envError) throw envError;

      // Calcular estatísticas
      const valorTotalOS = ordensServico?.reduce((acc, os) => acc + (Number(os.valor_servico) || 0), 0) || 0;
      const valorTotalOrc = orcamentos?.reduce((acc, orc) => acc + (Number(orc.valor_total) || 0), 0) || 0;
      
      const tempoPlataforma = client.created_at 
        ? formatDistanceToNow(new Date(client.created_at), { addSuffix: true, locale: ptBR })
        : "—";

      setStats({
        tempoPlataforma,
        totalPedidos: ordensServico?.length || 0,
        totalOrcamentos: orcamentos?.length || 0,
        totalEnvios: envios?.length || 0,
        valorTotal: valorTotalOS + valorTotalOrc
      });

      // Montar histórico combinado
      const historicoCompleto = [
        ...(ordensServico?.map(os => ({
          tipo: 'Ordem de Serviço',
          descricao: `OS ${os.numero_os} - ${os.tipo_servico}`,
          data: new Date(os.created_at),
          valor: os.valor_servico,
          status: os.status,
          icon: Package
        })) || []),
        ...(orcamentos?.map(orc => ({
          tipo: 'Orçamento',
          descricao: `Orçamento #${orc.numero_sequencial}`,
          data: new Date(orc.created_at),
          valor: orc.valor_total,
          status: orc.status,
          icon: DollarSign
        })) || []),
        ...(envios?.map(env => ({
          tipo: 'Envio',
          descricao: `Envio para ${env.destinatario_cidade || env.destinatario_nome}`,
          data: new Date(env.created_at),
          valor: env.valor_frete,
          status: env.status,
          icon: TrendingUp
        })) || [])
      ].sort((a, b) => b.data.getTime() - a.data.getTime());

      setHistorigo(historicoCompleto);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      "pendente": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "aprovado": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "em_producao": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "concluido": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "cancelado": "bg-destructive/20 text-destructive border-destructive/30",
      "entregue": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "em_transito": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return statusMap[status] || "bg-muted/20 text-muted-foreground border-border/30";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico Completo — {client.nome}</DialogTitle>
          <DialogDescription>Visualize todo o histórico de interações e transações com este cliente</DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  Na plataforma
                </div>
                <p className="font-semibold text-sm">{stats.tempoPlataforma}</p>
              </div>
              
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Package className="h-3 w-3" />
                  Pedidos
                </div>
                <p className="font-semibold text-lg">{stats.totalPedidos}</p>
              </div>
              
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="h-3 w-3" />
                  Orçamentos
                </div>
                <p className="font-semibold text-lg">{stats.totalOrcamentos}</p>
              </div>
              
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Valor Total
                </div>
                <p className="font-semibold text-sm">
                  R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Timeline de Histórico */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Atividades Recentes</h4>
              <div className="space-y-2">
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma atividade registrada ainda
                  </div>
                ) : (
                  historico.map((h, i) => {
                    const Icon = h.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{h.tipo}</p>
                            <Badge className={`${getStatusBadge(h.status)} text-xs`}>
                              {h.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{h.descricao}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {h.data.toLocaleDateString('pt-BR')}
                            </span>
                            {h.valor && (
                              <span className="font-medium text-primary">
                                R$ {Number(h.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
