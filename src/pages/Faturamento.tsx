import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MinimalCard } from "@/components/MinimalCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  FileText,
  Wallet
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export";

interface FaturamentoMensal {
  mes: string;
  faturamento: number;
  quantidade: number;
}

export function Faturamento() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [ordensServico, setOrdensServico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orcRes, osRes] = await Promise.all([
        supabase.from('orcamentos').select('*'),
        supabase.from('ordens_servico').select('*')
      ]);

      if (orcRes.error) throw orcRes.error;
      if (osRes.error) throw osRes.error;

      setOrcamentos(orcRes.data || []);
      setOrdensServico(osRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error("Erro ao carregar dados de faturamento");
    } finally {
      setLoading(false);
    }
  };

  // Anos disponíveis
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    [...orcamentos, ...ordensServico].forEach(item => {
      if (item.created_at) {
        const ano = new Date(item.created_at).getFullYear().toString();
        anos.add(ano);
      }
    });
    return Array.from(anos).sort().reverse();
  }, [orcamentos, ordensServico]);

  // Faturamento mensal
  const faturamentoMensal = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dados: FaturamentoMensal[] = meses.map(mes => ({
      mes,
      faturamento: 0,
      quantidade: 0
    }));

    // Somar orçamentos aprovados
    orcamentos
      .filter(orc => {
        if (!orc.created_at) return false;
        const data = new Date(orc.created_at);
        return data.getFullYear().toString() === anoSelecionado && 
               orc.status?.toLowerCase() === 'aprovado';
      })
      .forEach(orc => {
        const mesIndex = new Date(orc.created_at).getMonth();
        dados[mesIndex].faturamento += Number(orc.valor_total) || 0;
        dados[mesIndex].quantidade += 1;
      });

    // Somar ordens de serviço concluídas
    ordensServico
      .filter(os => {
        if (!os.created_at) return false;
        const data = new Date(os.created_at);
        return data.getFullYear().toString() === anoSelecionado && 
               os.status === 'concluido';
      })
      .forEach(os => {
        const mesIndex = new Date(os.created_at).getMonth();
        dados[mesIndex].faturamento += Number(os.valor_servico) || 0;
        dados[mesIndex].quantidade += 1;
      });

    return dados;
  }, [orcamentos, ordensServico, anoSelecionado]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalAno = faturamentoMensal.reduce((sum, m) => sum + m.faturamento, 0);
    const totalPedidos = faturamentoMensal.reduce((sum, m) => sum + m.quantidade, 0);
    const mediamensal = totalAno / 12;
    const melhorMes = faturamentoMensal.reduce((max, m) => m.faturamento > max.faturamento ? m : max);

    return {
      totalAno,
      totalPedidos,
      mediaMensal: mediamensal,
      melhorMes: melhorMes.mes,
      melhorMesValor: melhorMes.faturamento
    };
  }, [faturamentoMensal]);

  // Dados por status (orçamentos)
  const faturamentoPorStatus = useMemo(() => {
    const statusMap: Record<string, number> = {
      'Aprovado': 0,
      'Pendente': 0,
      'Em Análise': 0,
      'Rejeitado': 0
    };

    orcamentos
      .filter(orc => {
        if (!orc.created_at) return false;
        return new Date(orc.created_at).getFullYear().toString() === anoSelecionado;
      })
      .forEach(orc => {
        const status = orc.status || 'pendente';
        const statusLabel = 
          status.toLowerCase() === 'aprovado' ? 'Aprovado' :
          status.toLowerCase() === 'em_analise' ? 'Em Análise' :
          status.toLowerCase() === 'rejeitado' ? 'Rejeitado' : 'Pendente';
        
        statusMap[statusLabel] += Number(orc.valor_total) || 0;
      });

    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [orcamentos, anoSelecionado]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  const handleExport = () => {
    const dadosExport = faturamentoMensal.map(m => ({
      mes: m.mes,
      faturamento: m.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      quantidade: m.quantidade
    }));

    exportToExcel(
      `faturamento-${anoSelecionado}`,
      dadosExport,
      [
        { key: 'mes', header: 'Mês' },
        { key: 'faturamento', header: 'Faturamento' },
        { key: 'quantidade', header: 'Quantidade' }
      ]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Dashboard de Faturamento
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análise mensal de receitas e desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map(ano => (
                <SelectItem key={ano} value={ano}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate('/app/confeccao')}>
            <Wallet className="h-4 w-4" />
            Controle Financeiro
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <MinimalCard
          icon={DollarSign}
          title="Total do Ano"
          value={`R$ ${(stats.totalAno / 1000).toFixed(1)}k`}
          description={`${anoSelecionado}`}
        />
        <MinimalCard
          icon={TrendingUp}
          title="Média Mensal"
          value={`R$ ${(stats.mediaMensal / 1000).toFixed(1)}k`}
          description="Por mês"
        />
        <MinimalCard
          icon={Calendar}
          title="Melhor Mês"
          value={stats.melhorMes}
          description={`R$ ${(stats.melhorMesValor / 1000).toFixed(1)}k`}
        />
        <MinimalCard
          icon={FileText}
          title="Total Pedidos"
          value={String(stats.totalPedidos)}
          description={`em ${anoSelecionado}`}
        />
      </div>

      {/* Gráfico de Barras - Faturamento Mensal */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Faturamento Mensal - {anoSelecionado}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Legend />
              <Bar dataKey="faturamento" fill="hsl(var(--primary))" name="Faturamento" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grid com 2 gráficos */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Gráfico de Linha - Tendência */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Tendência de Crescimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={faturamentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="faturamento" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Por Status */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Faturamento por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={faturamentoPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {faturamentoPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
