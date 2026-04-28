import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Circle, ChevronRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface ProductionStage {
  id: string
  name: string
  order: number
}

const PRODUCTION_STAGES: ProductionStage[] = [
  { id: 'corte', name: 'Corte', order: 1 },
  { id: 'costura', name: 'Costura', order: 2 },
  { id: 'acabamento', name: 'Acabamento', order: 3 },
  { id: 'qualidade', name: 'Controle de Qualidade', order: 4 },
  { id: 'embalagem', name: 'Embalagem', order: 5 },
]

interface ProductionTimelineProps {
  orders: any[]
  onUpdate: () => void
}

export function ProductionTimeline({ orders, onUpdate }: ProductionTimelineProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')

  // Filtra pedidos em produção (aprovado ou em_andamento)
  const productionOrders = orders.filter(o => 
    o.status === 'aprovado' || o.status === 'em_andamento'
  )

  // Pedido selecionado
  const selectedOrder = productionOrders.find(o => o.id === selectedOrderId)
  const currentStage = selectedOrder?.etapa_producao || 0

  const updateOrderStage = async (stageOrder: number) => {
    if (!selectedOrderId) {
      toast.error('Selecione um pedido primeiro')
      return
    }

    setUpdating(`stage-${stageOrder}`)
    try {
      const newStatus = stageOrder > 0 ? 'em_andamento' : 'aprovado'
      
      const { error } = await supabase
        .from('ordens_servico')
        .update({ 
          etapa_producao: stageOrder,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrderId)

      if (error) throw error

      toast.success(`Etapa atualizada para: ${PRODUCTION_STAGES[stageOrder - 1]?.name || 'Início'}`)
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error)
      toast.error('Erro ao atualizar etapa de produção')
    } finally {
      setUpdating(null)
    }
  }

  const getStageStatus = (stageOrder: number) => {
    if (stageOrder < currentStage) return 'completed'
    if (stageOrder === currentStage) return 'in-progress'
    return 'pending'
  }

  return (
    <Card className="card-gradient">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Linha do Tempo da Produção</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Selecione um pedido e clique nas etapas para atualizar o progresso
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Seletor de Pedido */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Pedido</label>
          <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um pedido em produção" />
            </SelectTrigger>
            <SelectContent>
              {productionOrders.length === 0 ? (
                <SelectItem value="none" disabled>Nenhum pedido em produção</SelectItem>
              ) : (
                productionOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{order.numero_os}</span>
                      <span className="text-muted-foreground">- {order.tipo_servico}</span>
                      <Badge variant="outline" className="text-xs">
                        Etapa {order.etapa_producao || 0}/5
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Info do pedido selecionado */}
        {selectedOrder && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{selectedOrder.numero_os}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.tipo_servico} • {selectedOrder.quantidade} unidades
                </p>
              </div>
              <Badge className={currentStage === 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'}>
                {currentStage === 0 ? 'Não iniciado' : currentStage === 5 ? 'Finalizado' : `Etapa ${currentStage}/5`}
              </Badge>
            </div>
          </div>
        )}

        {/* Timeline das Etapas */}
        <div className="space-y-3 sm:space-y-4">
          {PRODUCTION_STAGES.map((stage) => {
            const status = getStageStatus(stage.order)
            const isCompleted = status === 'completed'
            const isInProgress = status === 'in-progress'
            const isUpdating = updating === `stage-${stage.order}`
            const isDisabled = !selectedOrderId || isUpdating

            return (
              <Button
                key={stage.id}
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-muted/50 transition-all disabled:opacity-50"
                onClick={() => updateOrderStage(stage.order)}
                disabled={isDisabled}
              >
                <div className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg border w-full transition-all ${
                  isInProgress 
                    ? 'border-primary bg-primary/5' 
                    : isCompleted 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-border/50'
                }`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 transition-colors ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : isInProgress 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : stage.order}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{stage.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isCompleted ? 'Concluído' : isInProgress ? 'Em andamento' : 'Pendente'}
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : isInProgress ? (
                      <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Dica */}
        {!selectedOrderId && productionOrders.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Selecione um pedido acima para gerenciar as etapas de produção
          </p>
        )}
      </CardContent>
    </Card>
  )
}
