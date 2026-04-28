import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Clock, Activity, Shield, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SecurityRule {
  id: string;
  rule_type: string;
  rule_name: string;
  threshold_value: number | null;
  time_start: string | null;
  time_end: string | null;
  is_active: boolean;
  severity: string;
  description: string | null;
}

const RULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  delete_threshold: Trash2,
  off_hours_threshold: Clock,
  high_activity_threshold: Activity,
  business_hours: Clock,
};

const SEVERITY_COLORS: Record<string, string> = {
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function SecurityRulesConfig() {
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("security_rules")
        .select("*")
        .order("created_at");

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Erro ao carregar regras:", error);
      toast.error("Erro ao carregar regras de segurança");
    } finally {
      setLoading(false);
    }
  };

  const updateRule = (id: string, field: keyof SecurityRule, value: any) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule))
    );
    setHasChanges(true);
  };

  const saveRules = async () => {
    setSaving(true);
    try {
      for (const rule of rules) {
        const { error } = await supabase
          .from("security_rules")
          .update({
            threshold_value: rule.threshold_value,
            time_start: rule.time_start,
            time_end: rule.time_end,
            is_active: rule.is_active,
            severity: rule.severity,
          })
          .eq("id", rule.id);

        if (error) throw error;
      }
      toast.success("Regras salvas com sucesso");
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao salvar regras:", error);
      toast.error("Erro ao salvar regras");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Regras de Segurança</h2>
        </div>
        <Button onClick={saveRules} disabled={!hasChanges || saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => {
          const Icon = RULE_ICONS[rule.rule_type] || Shield;
          const isBusinessHours = rule.rule_type === "business_hours";

          return (
            <Card key={rule.id} className="card-gradient">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rule.rule_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={SEVERITY_COLORS[rule.severity]}
                    >
                      {rule.severity === "danger"
                        ? "Perigo"
                        : rule.severity === "warning"
                        ? "Aviso"
                        : "Info"}
                    </Badge>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) =>
                        updateRule(rule.id, "is_active", checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {isBusinessHours ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Início do Expediente</Label>
                        <Input
                          type="time"
                          value={rule.time_start || "07:00"}
                          onChange={(e) =>
                            updateRule(rule.id, "time_start", e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Fim do Expediente</Label>
                        <Input
                          type="time"
                          value={rule.time_end || "22:00"}
                          onChange={(e) =>
                            updateRule(rule.id, "time_end", e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">Limite</Label>
                      <Input
                        type="number"
                        min="1"
                        value={rule.threshold_value || 0}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "threshold_value",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-9"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">Severidade</Label>
                    <Select
                      value={rule.severity}
                      onValueChange={(value) =>
                        updateRule(rule.id, "severity", value)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Informativo</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="danger">Perigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
