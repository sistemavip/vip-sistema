-- Create security_rules table for custom anomaly detection
CREATE TABLE public.security_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL,
  rule_name text NOT NULL,
  threshold_value integer,
  time_start time,
  time_end time,
  is_active boolean DEFAULT true,
  severity text DEFAULT 'warning',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security rules
CREATE POLICY "Admins podem gerenciar regras de segurança"
  ON public.security_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default rules
INSERT INTO public.security_rules (rule_type, rule_name, threshold_value, time_start, time_end, severity, description) VALUES
  ('delete_threshold', 'Limite de Exclusões', 10, NULL, NULL, 'danger', 'Alerta quando houver mais de X exclusões em 24h'),
  ('off_hours_threshold', 'Ações Fora do Horário', 5, NULL, NULL, 'warning', 'Alerta quando houver ações fora do horário comercial'),
  ('high_activity_threshold', 'Alta Atividade de Usuário', 50, NULL, NULL, 'warning', 'Alerta quando um usuário tiver mais de X ações em 24h'),
  ('business_hours', 'Horário Comercial', NULL, '07:00:00', '22:00:00', 'info', 'Define o horário comercial para detecção de anomalias');

-- Trigger for updated_at
CREATE TRIGGER update_security_rules_updated_at
  BEFORE UPDATE ON public.security_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();