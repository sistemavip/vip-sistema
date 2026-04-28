import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GitBranch, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OSVersionDialogProps {
  ordemServico: any;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function OSVersionDialog({ ordemServico, trigger, onSuccess }: OSVersionDialogProps) {
  const [open, setOpen] = useState(false);
  const [versoes, setVersoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaVersao, setNovaVersao] = useState(false);
  const [motivoRevisao, setMotivoRevisao] = useState("");

  useEffect(() => {
    if (open) {
      loadVersoes();
    }
  }, [open]);

  const loadVersoes = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as versões desta OS (incluindo a atual)
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .or(`id.eq.${ordemServico.id},versao_anterior_id.eq.${ordemServico.id}`)
        .order('versao', { ascending: false });

      if (error) throw error;

      // Se não encontrar a atual, buscar o histórico completo
      if (!data || data.length === 0) {
        const { data: allVersions, error: allError } = await supabase
          .from('ordens_servico')
          .select('*')
          .eq('numero_os', ordemServico.numero_os)
          .order('versao', { ascending: false });

        if (allError) throw allError;
        setVersoes(allVersions || []);
      } else {
        setVersoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
      toast.error("Erro ao carregar histórico de versões");
    } finally {
      setLoading(false);
    }
  };

  const handleCriarNovaVersao = async () => {
    if (!motivoRevisao.trim()) {
      toast.error("Informe o motivo da revisão");
      return;
    }

    try {
      setLoading(true);

      // Criar nova versão baseada na atual
      const { data: novaOS, error } = await supabase
        .from('ordens_servico')
        .insert({
          ...ordemServico,
          id: undefined, // Gerar novo ID
          versao: (ordemServico.versao || 1) + 1,
          versao_anterior_id: ordemServico.id,
          motivo_revisao: motivoRevisao,
          data_revisao: new Date().toISOString(),
          status: 'orcamento' // Nova versão começa como orçamento
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Nova versão criada: v${novaOS.versao}`);
      setNovaVersao(false);
      setMotivoRevisao("");
      loadVersoes();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar nova versão:', error);
      toast.error("Erro ao criar nova versão");
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      "orcamento": "Orçamento",
      "aprovado": "Aprovado",
      "em_andamento": "Em Andamento",
      "concluido": "Concluído"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "orcamento": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "aprovado": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "em_andamento": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "concluido": "bg-purple-500/20 text-purple-400 border-purple-500/30"
    };
    return colors[status] || "bg-muted text-muted-foreground border-border";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Versões
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Histórico de Versões - OS {ordemServico.numero_os}
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie as versões desta ordem de serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão criar nova versão */}
          {!novaVersao && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setNovaVersao(true)}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Criar Nova Versão
            </Button>
          )}

          {/* Form nova versão */}
          {novaVersao && (
            <div className="p-4 border border-border rounded-lg space-y-3 bg-muted/30">
              <Label>Motivo da Revisão</Label>
              <Textarea
                placeholder="Descreva o motivo da criação da nova versão..."
                value={motivoRevisao}
                onChange={(e) => setMotivoRevisao(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleCriarNovaVersao} disabled={loading}>
                  Confirmar
                </Button>
                <Button variant="outline" onClick={() => {
                  setNovaVersao(false);
                  setMotivoRevisao("");
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de versões */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : versoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma versão encontrada</p>
            ) : (
              versoes.map((versao, index) => (
                <div
                  key={versao.id}
                  className={`p-4 border rounded-lg ${
                    versao.id === ordemServico.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        v{versao.versao || 1}
                      </Badge>
                      {versao.id === ordemServico.id && (
                        <Badge className="bg-primary text-primary-foreground">
                          Atual
                        </Badge>
                      )}
                      <Badge className={getStatusColor(versao.status || 'orcamento')}>
                        {formatStatus(versao.status || 'orcamento')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {versao.data_revisao 
                        ? new Date(versao.data_revisao).toLocaleDateString('pt-BR')
                        : new Date(versao.created_at).toLocaleDateString('pt-BR')
                      }
                    </div>
                  </div>

                  {versao.motivo_revisao && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">
                        Motivo da revisão:
                      </p>
                      <p>{versao.motivo_revisao}</p>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="ml-2 font-medium">
                        R$ {(versao.valor_servico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {versao.data_execucao && (
                      <div>
                        <span className="text-muted-foreground">Execução:</span>
                        <span className="ml-2 font-medium">
                          {new Date(versao.data_execucao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
