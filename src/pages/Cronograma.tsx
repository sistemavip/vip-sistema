import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Send, Sparkles, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/contexts/AuthContext"

export function Cronograma() {
  const [ordensServico, setOrdensServico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiInput, setAiInput] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const { session } = useAuth()

  useEffect(() => {
    loadOrdens()
  }, [])

  const loadOrdens = async () => {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .order('data_execucao', { ascending: true })

      if (error) throw error
      setOrdensServico(data || [])
    } catch (error) {
      console.error('Erro ao carregar ordens:', error)
      toast.error('Erro ao carregar cronograma')
    } finally {
      setLoading(false)
    }
  }

  const updateOrdem = async (id: string, updates: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      toast.success('Cronograma atualizado')
      loadOrdens()
    } catch (e) {
      console.error('Erro ao atualizar ordem:', e)
      toast.error('Não foi possível atualizar. Verifique permissões.')
    }
  }

  const handleAiRequest = async () => {
    if (!aiInput.trim()) return

    setIsAiLoading(true)
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession()

      const { data, error } = await supabase.functions.invoke('rag-chat', {
        headers: {
          Authorization: `Bearer ${freshSession?.access_token}`
        },
        body: {
          messages: [{
            role: 'user',
            content: `Analisando cronograma de confecção. Pedidos atuais: ${JSON.stringify(ordensServico.map(o => ({
              numero: o.numero_os,
              tipo: o.tipo_servico,
              quantidade: o.quantidade,
              data_execucao: o.data_execucao,
              status: o.status
            })))}. Pergunta do usuário: ${aiInput}`
          }]
        }
      })

      if (error) throw error
      setAiResponse(data.message || 'Sem resposta da IA')
      setAiInput("")
    } catch (error: any) {
      console.error('Erro na IA:', error)
      toast.error('Erro ao consultar IA: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsAiLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'em_andamento': return <Clock className="h-4 w-4 text-blue-500" />
      default: return <AlertCircle className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      "orcamento": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "aprovado": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "em_andamento": "bg-primary/20 text-primary border-primary/30",
      "concluido": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
    return statusMap[status] || "bg-muted text-muted-foreground"
  }

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      "orcamento": "Orçamento",
      "aprovado": "Aprovado",
      "em_andamento": "Em Andamento",
      "concluido": "Concluído"
    }
    return statusLabels[status] || status
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem data'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            Cronograma de Produção
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie prazos e organize a produção com IA
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : ordensServico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem de serviço cadastrada
                </div>
              ) : (
                <div className="space-y-3">
                  {ordensServico.map((ordem, index) => (
                    <motion.div
                      key={ordem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(ordem.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-sm font-medium">
                            {ordem.numero_os}
                          </span>
                          <Badge className={`${getStatusBadge(ordem.status)} text-xs`}>
                            {formatStatus(ordem.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {ordem.tipo_servico} - {ordem.quantidade} unidades
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ordem.descricao_servico || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {/* Data de execução */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-[140px] justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {ordem.data_execucao ? new Date(ordem.data_execucao).toLocaleDateString('pt-BR') : 'Definir data'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={ordem.data_execucao ? new Date(ordem.data_execucao) : undefined}
                              onSelect={(d) => d && updateOrdem(ordem.id, { data_execucao: d.toISOString().slice(0, 10) })}
                              initialFocus
                              className="p-3"
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Status */}
                        <Select value={ordem.status} onValueChange={(val) => updateOrdem(ordem.id, { status: val })}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orcamento">Orçamento</SelectItem>
                            <SelectItem value="aprovado">Aprovado</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* IA Assistant */}
        <div className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-vip-accent" />
                Assistente IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Pergunte sobre o cronograma, prazos ou otimização da produção..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={handleAiRequest}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="w-full gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isAiLoading ? 'Analisando...' : 'Consultar IA'}
                </Button>
              </div>

              <AnimatePresence>
                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiResponse}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">
                  Sugestões de perguntas:
                </p>
                <div className="space-y-1">
                  {[
                    "Como otimizar o cronograma?",
                    "Quais pedidos estão atrasados?",
                    "Qual a melhor ordem de produção?"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs justify-start"
                      onClick={() => setAiInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
