import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { subDays } from "date-fns";
import { motion } from "framer-motion";

interface SecurityAlert {
  type: "warning" | "danger";
  message: string;
}

interface SecurityRule {
  id: string;
  rule_type: string;
  threshold_value: number | null;
  time_start: string | null;
  time_end: string | null;
  is_active: boolean;
  severity: string;
}

export function SecuritySummaryCard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecuritySummary();
  }, []);

  const fetchSecuritySummary = async () => {
    try {
      const startDate = subDays(new Date(), 1).toISOString();

      // Fetch logs and rules in parallel
      const [logsRes, rulesRes] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("*")
          .gte("created_at", startDate)
          .order("created_at", { ascending: false }),
        supabase.from("security_rules").select("*").eq("is_active", true),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (rulesRes.error) throw rulesRes.error;

      const logs = logsRes.data || [];
      const rules = (rulesRes.data || []) as SecurityRule[];

      // Calculate stats
      setActivityCount(logs.length);
      const uniqueUsers = new Set(logs.map((l) => l.user_email).filter(Boolean));
      setActiveUsers(uniqueUsers.size);

      // Generate alerts based on dynamic rules
      const newAlerts: SecurityAlert[] = [];

      // Delete threshold rule
      const deleteRule = rules.find((r) => r.rule_type === "delete_threshold");
      if (deleteRule) {
        const deleteCount = logs.filter((l) => l.action === "DELETE").length;
        if (deleteCount > (deleteRule.threshold_value || 10)) {
          newAlerts.push({
            type: deleteRule.severity === "danger" ? "danger" : "warning",
            message: `${deleteCount} exclusões nas últimas 24h`,
          });
        }
      }

      // Business hours rule
      const businessHoursRule = rules.find((r) => r.rule_type === "business_hours");
      const offHoursRule = rules.find((r) => r.rule_type === "off_hours_threshold");

      if (businessHoursRule && offHoursRule) {
        const startHour = parseInt(businessHoursRule.time_start?.split(":")[0] || "7");
        const endHour = parseInt(businessHoursRule.time_end?.split(":")[0] || "22");

        const outOfHoursCount = logs.filter((log) => {
          if (!log.created_at) return false;
          const hour = new Date(log.created_at).getHours();
          return hour < startHour || hour > endHour;
        }).length;

        if (outOfHoursCount > (offHoursRule.threshold_value || 5)) {
          newAlerts.push({
            type: offHoursRule.severity === "danger" ? "danger" : "warning",
            message: `${outOfHoursCount} ações fora do horário`,
          });
        }
      }

      // High activity rule
      const highActivityRule = rules.find((r) => r.rule_type === "high_activity_threshold");
      if (highActivityRule) {
        const userActivityMap = new Map<string, number>();
        logs.forEach((log) => {
          const email = log.user_email || "unknown";
          userActivityMap.set(email, (userActivityMap.get(email) || 0) + 1);
        });

        const threshold = highActivityRule.threshold_value || 50;
        const highActivityUsers = Array.from(userActivityMap.entries()).filter(
          ([_, count]) => count > threshold
        );

        if (highActivityUsers.length > 0) {
          newAlerts.push({
            type: highActivityRule.severity === "danger" ? "danger" : "warning",
            message: `Usuário com alta atividade detectado`,
          });
        }
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Erro ao carregar resumo de segurança:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Segurança
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => navigate("/app/relatorios")}
        >
          Ver Métricas
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <Card className="card-gradient">
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nenhum alerta ativo</p>
                <p className="text-xs text-muted-foreground">
                  {activityCount} atividades • {activeUsers} usuários ativos
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-400 border-amber-500/30"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
                </Badge>
              </div>
              <div className="space-y-2">
                {alerts.slice(0, 2).map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                      alert.type === "danger"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
