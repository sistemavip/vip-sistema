import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, 
  Search, 
  Download, 
  Eye,
  Calendar,
  User,
  Database,
  RefreshCw,
  ArrowRight
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { exportToExcel } from "@/lib/export"

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: string
  user_id: string | null
  user_email: string | null
  old_data: unknown
  new_data: unknown
  created_at: string
}

const TABLE_LABELS: Record<string, string> = {
  clientes: "Clientes",
  ordens_servico: "Ordens de Serviço",
  orcamentos: "Orçamentos",
  envios: "Envios",
  custos: "Custos"
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  INSERT: { label: "Criação", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  UPDATE: { label: "Atualização", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  DELETE: { label: "Exclusão", color: "bg-destructive/20 text-destructive border-destructive/30" }
}

export function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTable, setFilterTable] = useState<string>("all")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [filterPeriod, setFilterPeriod] = useState<string>("7d")

  const loadLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

      // Filtro de período
      const now = new Date()
      let startDate: Date | null = null
      switch (filterPeriod) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString())
      }

      // Filtro de tabela
      if (filterTable !== "all") {
        query = query.eq("table_name", filterTable)
      }

      // Filtro de ação
      if (filterAction !== "all") {
        query = query.eq("action", filterAction)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error("Erro ao carregar logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filterTable, filterAction, filterPeriod])

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      log.user_email?.toLowerCase().includes(search) ||
      log.record_id.toLowerCase().includes(search) ||
      log.table_name.toLowerCase().includes(search)
    )
  })

  const handleExport = () => {
    const rows = filteredLogs.map(log => ({
      data_hora: format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss"),
      usuario: log.user_email || "Sistema",
      tabela: TABLE_LABELS[log.table_name] || log.table_name,
      acao: ACTION_LABELS[log.action]?.label || log.action,
      id_registro: log.record_id
    }))

    exportToExcel(`audit_logs_${format(new Date(), "yyyy-MM-dd")}`, rows, [
      { key: 'data_hora', header: 'Data/Hora' },
      { key: 'usuario', header: 'Usuário' },
      { key: 'tabela', header: 'Tabela' },
      { key: 'acao', header: 'Ação' },
      { key: 'id_registro', header: 'ID Registro' },
    ]);
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR })
  }

  const getChangedFields = (oldData: unknown, newData: unknown) => {
    if (!oldData || !newData || typeof oldData !== 'object' || typeof newData !== 'object') return []
    const oldObj = oldData as Record<string, unknown>
    const newObj = newData as Record<string, unknown>
    const changes: { field: string; old: unknown; new: unknown }[] = []
    
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
    allKeys.forEach(key => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes.push({ field: key, old: oldObj[key], new: newObj[key] })
      }
    })
    
    return changes
  }

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-vip-primary" />
          Logs de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger>
              <Database className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tabela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tabelas</SelectItem>
              <SelectItem value="clientes">Clientes</SelectItem>
              <SelectItem value="ordens_servico">Ordens de Serviço</SelectItem>
              <SelectItem value="orcamentos">Orçamentos</SelectItem>
              <SelectItem value="envios">Envios</SelectItem>
              <SelectItem value="custos">Custos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" className="gap-2 flex-1" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground">Total de Logs</p>
            <p className="text-xl font-bold">{filteredLogs.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-emerald-500/10">
            <p className="text-xs text-muted-foreground">Criações</p>
            <p className="text-xl font-bold text-emerald-400">
              {filteredLogs.filter(l => l.action === "INSERT").length}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-blue-500/10">
            <p className="text-xs text-muted-foreground">Atualizações</p>
            <p className="text-xl font-bold text-blue-400">
              {filteredLogs.filter(l => l.action === "UPDATE").length}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-destructive/10">
            <p className="text-xs text-muted-foreground">Exclusões</p>
            <p className="text-xl font-bold text-destructive">
              {filteredLogs.filter(l => l.action === "DELETE").length}
            </p>
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[140px]">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                  <TableHead className="w-[80px]">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Carregando logs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">Nenhum log encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs font-mono">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">
                            {log.user_email || "Sistema"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_LABELS[log.action]?.color || ""}>
                          {ACTION_LABELS[log.action]?.label || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Detalhes do Log
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Informações básicas */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Data/Hora</p>
                                  <p className="font-medium">{formatDateTime(log.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Usuário</p>
                                  <p className="font-medium">{log.user_email || "Sistema"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Tabela</p>
                                  <p className="font-medium">{TABLE_LABELS[log.table_name] || log.table_name}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Ação</p>
                                  <Badge className={ACTION_LABELS[log.action]?.color || ""}>
                                    {ACTION_LABELS[log.action]?.label || log.action}
                                  </Badge>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">ID do Registro</p>
                                  <p className="font-mono text-xs">{log.record_id}</p>
                                </div>
                              </div>

                              {/* Comparação de dados */}
                              {log.action === "UPDATE" && log.old_data && log.new_data && (
                                <div className="space-y-2">
                                  <p className="font-medium text-sm">Campos Alterados</p>
                                  <div className="rounded-lg border border-border/50 overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/30">
                                          <TableHead className="text-xs">Campo</TableHead>
                                          <TableHead className="text-xs">Valor Anterior</TableHead>
                                          <TableHead className="text-xs w-8"></TableHead>
                                          <TableHead className="text-xs">Valor Novo</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getChangedFields(log.old_data, log.new_data).map((change, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell className="font-mono text-xs">{change.field}</TableCell>
                                            <TableCell className="text-xs text-destructive max-w-[150px] truncate">
                                              {JSON.stringify(change.old)}
                                            </TableCell>
                                            <TableCell>
                                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            </TableCell>
                                            <TableCell className="text-xs text-emerald-400 max-w-[150px] truncate">
                                              {JSON.stringify(change.new)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}

                              {/* Dados completos para INSERT */}
                              {log.action === "INSERT" && log.new_data && (
                                <div className="space-y-2">
                                  <p className="font-medium text-sm">Dados Criados</p>
                                  <pre className="p-3 rounded-lg bg-muted/30 text-xs overflow-x-auto">
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Dados completos para DELETE */}
                              {log.action === "DELETE" && log.old_data && (
                                <div className="space-y-2">
                                  <p className="font-medium text-sm">Dados Excluídos</p>
                                  <pre className="p-3 rounded-lg bg-destructive/10 text-xs overflow-x-auto">
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Exibindo {filteredLogs.length} registros • Os logs são armazenados automaticamente para todas as operações em tabelas sensíveis
        </p>
      </CardContent>
    </Card>
  )
}
