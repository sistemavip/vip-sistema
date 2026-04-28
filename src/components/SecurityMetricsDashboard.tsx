import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  Database, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  Clock,
  RefreshCw,
  Shield,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface SecurityRule {
  id: string;
  rule_type: string;
  rule_name: string;
  threshold_value: number | null;
  time_start: string | null;
  time_end: string | null;
  is_active: boolean;
  severity: string;
}

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  user_id: string | null;
  user_email: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string | null;
}

interface Stats {
  totalLogs: number;
  uniqueUsers: number;
  tablesAffected: number;
  deleteCount: number;
}

interface ActivityByDay {
  date: string;
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface UserActivity {
  email: string;
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface TableDistribution {
  table_name: string;
  total: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const TABLE_NAMES: Record<string, string> = {
  clientes: "Clientes",
  ordens_servico: "Ordens de Serviço",
  orcamentos: "Orçamentos",
  envios: "Envios",
  custos: "Custos"
};

export function SecurityMetricsDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalLogs: 0, uniqueUsers: 0, tablesAffected: 0, deleteCount: 0 });
  const [activityByDay, setActivityByDay] = useState<ActivityByDay[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [tableDistribution, setTableDistribution] = useState<TableDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<{ type: 'warning' | 'danger'; message: string }[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);

  const getPeriodDays = () => {
    switch (period) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), getPeriodDays()).toISOString();
      
      // Fetch logs and rules in parallel
      const [logsRes, rulesRes] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false }),
        supabase.from('security_rules').select('*').eq('is_active', true)
      ]);

      if (logsRes.error) throw logsRes.error;
      if (rulesRes.error) throw rulesRes.error;

      const auditLogs = (logsRes.data || []) as AuditLog[];
      const activeRules = (rulesRes.data || []) as SecurityRule[];
      setRules(activeRules);

      // Calculate stats
      const uniqueEmails = new Set(auditLogs.map(l => l.user_email).filter(Boolean));
      const uniqueTables = new Set(auditLogs.map(l => l.table_name));
      const deleteCount = auditLogs.filter(l => l.action === 'DELETE').length;

      setStats({
        totalLogs: auditLogs.length,
        uniqueUsers: uniqueEmails.size,
        tablesAffected: uniqueTables.size,
        deleteCount
      });

      // Activity by day
      const activityMap = new Map<string, ActivityByDay>();
      auditLogs.forEach(log => {
        if (!log.created_at) return;
        const date = format(parseISO(log.created_at), 'dd/MM');
        const existing = activityMap.get(date) || { date, total: 0, inserts: 0, updates: 0, deletes: 0 };
        existing.total++;
        if (log.action === 'INSERT') existing.inserts++;
        if (log.action === 'UPDATE') existing.updates++;
        if (log.action === 'DELETE') existing.deletes++;
        activityMap.set(date, existing);
      });
      setActivityByDay(Array.from(activityMap.values()).reverse());

      // Top users
      const userMap = new Map<string, UserActivity>();
      auditLogs.forEach(log => {
        const email = log.user_email || 'Desconhecido';
        const existing = userMap.get(email) || { email, total: 0, inserts: 0, updates: 0, deletes: 0 };
        existing.total++;
        if (log.action === 'INSERT') existing.inserts++;
        if (log.action === 'UPDATE') existing.updates++;
        if (log.action === 'DELETE') existing.deletes++;
        userMap.set(email, existing);
      });
      setTopUsers(Array.from(userMap.values()).sort((a, b) => b.total - a.total).slice(0, 5));

      // Table distribution
      const tableMap = new Map<string, number>();
      auditLogs.forEach(log => {
        tableMap.set(log.table_name, (tableMap.get(log.table_name) || 0) + 1);
      });
      setTableDistribution(
        Array.from(tableMap.entries())
          .map(([table_name, total]) => ({ table_name, total }))
          .sort((a, b) => b.total - a.total)
      );

      // Recent activity
      setRecentActivity(auditLogs.slice(0, 10));

      // Security alerts based on dynamic rules
      const newAlerts: { type: 'warning' | 'danger'; message: string }[] = [];
      
      // Delete threshold rule
      const deleteRule = activeRules.find(r => r.rule_type === 'delete_threshold');
      if (deleteRule && deleteCount > (deleteRule.threshold_value || 10)) {
        newAlerts.push({ 
          type: deleteRule.severity === 'danger' ? 'danger' : 'warning', 
          message: `Alto volume de exclusões: ${deleteCount} registros excluídos` 
        });
      }

      // Business hours and off-hours rules
      const businessHoursRule = activeRules.find(r => r.rule_type === 'business_hours');
      const offHoursRule = activeRules.find(r => r.rule_type === 'off_hours_threshold');
      
      if (businessHoursRule && offHoursRule) {
        const startHour = parseInt(businessHoursRule.time_start?.split(':')[0] || '7');
        const endHour = parseInt(businessHoursRule.time_end?.split(':')[0] || '22');
        
        const outOfHoursCount = auditLogs.filter(log => {
          if (!log.created_at) return false;
          const hour = new Date(log.created_at).getHours();
          return hour < startHour || hour > endHour;
        }).length;
        
        if (outOfHoursCount > (offHoursRule.threshold_value || 5)) {
          newAlerts.push({ 
            type: offHoursRule.severity === 'danger' ? 'danger' : 'warning', 
            message: `${outOfHoursCount} ações fora do horário comercial` 
          });
        }
      }

      // High activity rule
      const highActivityRule = activeRules.find(r => r.rule_type === 'high_activity_threshold');
      if (highActivityRule) {
        const threshold = highActivityRule.threshold_value || 50;
        const highActivityUsers = Array.from(userMap.values()).filter(u => u.total > threshold);
        if (highActivityUsers.length > 0) {
          newAlerts.push({ 
            type: highActivityRule.severity === 'danger' ? 'danger' : 'warning', 
            message: `Usuário com alta atividade: ${highActivityUsers[0].email}` 
          });
        }
      }

      setAlerts(newAlerts);

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'UPDATE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT': return 'Criação';
      case 'UPDATE': return 'Alteração';
      case 'DELETE': return 'Exclusão';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Métricas de Segurança</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setPeriod(p)}
              >
                {p === '24h' ? '24h' : p === '7d' ? '7 dias' : '30 dias'}
              </Button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/app/configuracoes', { state: { section: 'security-rules' } })}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Regras</span>
          </Button>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
                <p className="text-xs text-muted-foreground">Total de Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Database className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.tablesAffected}</p>
                <p className="text-xs text-muted-foreground">Tabelas Afetadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deleteCount}</p>
                <p className="text-xs text-muted-foreground">Exclusões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Alertas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                    alert.type === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Over Time */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Atividade por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={activityByDay}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    name="Total"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma atividade no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution by Table */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Distribuição por Tabela
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tableDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tableDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="table_name"
                    label={({ table_name, percent }) => 
                      `${TABLE_NAMES[table_name] || table_name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {tableDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [value, TABLE_NAMES[name] || name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma atividade no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Users */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Usuários Mais Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUsers.length > 0 ? (
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div key={user.email} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-emerald-400">{user.inserts} criações</span>
                        <span className="text-xs text-blue-400">{user.updates} alterações</span>
                        <span className="text-xs text-red-400">{user.deletes} exclusões</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{user.total}</p>
                      <p className="text-xs text-muted-foreground">ações</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma atividade de usuário no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="text-xs text-muted-foreground w-12 shrink-0">
                      {log.created_at ? format(parseISO(log.created_at), 'HH:mm') : '--:--'}
                    </div>
                    <Badge className={getActionColor(log.action)} variant="outline">
                      {getActionLabel(log.action)}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {TABLE_NAMES[log.table_name] || log.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.user_email || 'Usuário desconhecido'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma atividade recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
