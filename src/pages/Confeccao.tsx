import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Download, DollarSign, TrendingUp, TrendingDown, Wallet, FileText, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AddMovimentacaoDialog } from "@/components/AddMovimentacaoDialog";
import { AddProvisaoDialog } from "@/components/AddProvisaoDialog";
import { AddNotaFiscalDialog } from "@/components/AddNotaFiscalDialog";
import { StatusCard } from "@/components/StatusCard";
import { exportToExcel } from "@/lib/export";

interface ContaBancaria {
  id: string;
  nome: string;
  valor_inicial: number | null;
  ativo: boolean | null;
}

interface Movimentacao {
  id: string;
  conta_id: string | null;
  data: string;
  tipo: string;
  valor: number;
  descricao_os: string | null;
  item: string | null;
  job: string | null;
  nota_recibo: string | null;
  created_at?: string | null;
}

interface ProvisaoPagamento {
  id: string;
  data: string | null;
  item: string | null;
  descricao: string;
  valor: number | null;
  job: string | null;
  pago: boolean | null;
  mes_referencia: string | null;
  data_pagamento?: string | null;
  created_at?: string | null;
}

interface ProvisaoRecebimento {
  id: string;
  data: string | null;
  item: string | null;
  nome: string;
  valor: number | null;
  nota: string | null;
  pago: boolean | null;
  mes_referencia: string | null;
  data_recebimento?: string | null;
  created_at?: string | null;
}

interface NotaFiscal {
  id: string;
  data_emissao: string | null;
  numero_nf: string;
  responsavel: string | null;
  tipo: string | null;
  valor: number | null;
  descricao: string | null;
  vencimento: string | null;
  valor_imposto_pct: number | null;
  data_pagamento: string | null;
  status: string | null;
  created_at?: string | null;
  observacao: string | null;
}

const MESES = [
  { value: 'todos', label: 'Todos os Meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function Confeccao() {
  const [activeTab, setActiveTab] = useState("fluxo");
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'MM'));
  const [anoSelecionado, setAnoSelecionado] = useState(format(new Date(), 'yyyy'));

  // Data states
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<string>("");
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [provisoesPagamento, setProvisoesPagamento] = useState<ProvisaoPagamento[]>([]);
  const [provisoesRecebimento, setProvisoesRecebimento] = useState<ProvisaoRecebimento[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddMovimentacao, setShowAddMovimentacao] = useState(false);
  const [showAddProvisao, setShowAddProvisao] = useState<'pagamento' | 'recebimento' | null>(null);
  const [showAddNotaFiscal, setShowAddNotaFiscal] = useState(false);

  // New account input
  const [novaContaNome, setNovaContaNome] = useState("");
  const [novaContaValor, setNovaContaValor] = useState("");

  const isTodosMeses = mesSelecionado === 'todos';
  const mesReferencia = isTodosMeses ? '' : `${anoSelecionado}-${mesSelecionado}`;

  useEffect(() => {
    loadContas();
    loadProvisoesPagamento();
    loadProvisoesRecebimento();
    loadNotasFiscais();
  }, [mesReferencia]);

  useEffect(() => {
    if (contaSelecionada) {
      loadMovimentacoes();
    }
  }, [contaSelecionada, mesReferencia]);

  const loadContas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      toast.error("Erro ao carregar contas");
      setLoading(false);
      return;
    }

    setContas(data || []);
    if (data && data.length > 0 && !contaSelecionada) {
      setContaSelecionada(data[0].id);
    }
    setLoading(false);
  };

  const loadMovimentacoes = async () => {
    if (!contaSelecionada) return;

    try {
      let query = supabase
        .from('movimentacoes_financeiras')
        .select('*')
        .eq('conta_id', contaSelecionada);

      if (isTodosMeses) {
        query = query.gte('data', `${anoSelecionado}-01-01`).lte('data', `${anoSelecionado}-12-31`);
      } else {
        const startDate = `${anoSelecionado}-${mesSelecionado}-01`;
        const lastDay = new Date(Number(anoSelecionado), Number(mesSelecionado), 0).getDate();
        const endDate = `${anoSelecionado}-${mesSelecionado}-${lastDay}`;
        query = query.gte('data', startDate).lte('data', endDate);
      }

      const { data, error } = await query.order('data');

      if (error) {
        throw error;
      }

      setMovimentacoes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar movimentações:', error);
      toast.error(`Erro ao carregar movimentações: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const loadProvisoesPagamento = async () => {
    let query = supabase.from('provisoes_pagamento').select('*');

    if (isTodosMeses) {
      query = query.like('mes_referencia', `${anoSelecionado}-%`);
    } else {
      query = query.eq('mes_referencia', mesReferencia);
    }

    const { data, error } = await query.order('data');

    if (error) {
      toast.error("Erro ao carregar provisões de pagamento");
      return;
    }

    setProvisoesPagamento(data || []);
  };

  const loadProvisoesRecebimento = async () => {
    let query = supabase.from('provisoes_recebimento').select('*');

    if (isTodosMeses) {
      query = query.like('mes_referencia', `${anoSelecionado}-%`);
    } else {
      query = query.eq('mes_referencia', mesReferencia);
    }

    const { data, error } = await query.order('data');

    if (error) {
      toast.error("Erro ao carregar provisões de recebimento");
      return;
    }

    setProvisoesRecebimento(data || []);
  };

  const loadNotasFiscais = async () => {
    try {
      let startDate: string;
      let endDate: string;

      if (isTodosMeses) {
        startDate = `${anoSelecionado}-01-01`;
        endDate = `${anoSelecionado}-12-31`;
      } else {
        startDate = `${anoSelecionado}-${mesSelecionado}-01`;
        const lastDay = new Date(Number(anoSelecionado), Number(mesSelecionado), 0).getDate();
        endDate = `${anoSelecionado}-${mesSelecionado}-${lastDay}`;
      }

      // Execute queries in parallel for better performance
      const [rangeQuery, nullQuery] = await Promise.all([
        supabase
          .from('notas_fiscais')
          .select('*')
          .gte('vencimento', startDate)
          .lte('vencimento', endDate),
        supabase
          .from('notas_fiscais')
          .select('*')
          .is('vencimento', null)
      ]);

      if (rangeQuery.error) throw rangeQuery.error;
      if (nullQuery.error) throw nullQuery.error;

      const allNotes = [...(rangeQuery.data || []), ...(nullQuery.data || [])];
      allNotes.sort((a, b) => (a.numero_nf || '').localeCompare(b.numero_nf || ''));

      setNotasFiscais(allNotes);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      toast.error("Erro ao carregar notas fiscais");
    }
  };

  const handleToggleNfStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('notas_fiscais')
      .update({
        status: newStatus,
        data_pagamento: newStatus === 'PAGA' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao atualizar status da NF");
      return;
    }

    toast.success(`NF marcada como ${newStatus}`);
    loadNotasFiscais();
  };

  const handleDeleteNotaFiscal = async (id: string) => {
    const { error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir nota fiscal");
      return;
    }

    toast.success("Nota fiscal excluída");
    loadNotasFiscais();
  };

  const handleAddConta = async () => {
    if (!novaContaNome.trim()) {
      toast.error("Informe o nome da conta");
      return;
    }

    const { error } = await supabase
      .from('contas_bancarias')
      .insert({
        nome: novaContaNome.trim(),
        valor_inicial: parseFloat(novaContaValor) || 0,
        ativo: true,
      });

    if (error) {
      toast.error("Erro ao criar conta");
      return;
    }

    toast.success("Conta criada com sucesso");
    setNovaContaNome("");
    setNovaContaValor("");
    loadContas();
  };

  const handleUpdateSaldo = async (contaId: string, novoValor: string) => {
    if (!contaId) return;
    const valor = parseFloat(novoValor);
    if (isNaN(valor)) return;

    setContas(prev => prev.map(c => c.id === contaId ? { ...c, valor_inicial: valor } : c));

    const { error } = await supabase
      .from('contas_bancarias')
      .update({ valor_inicial: valor })
      .eq('id', contaId);

    if (error) {
      toast.error("Erro ao atualizar saldo inicial");
      loadContas();
    }
  };

  const handleTogglePago = async (tipo: 'pagamento' | 'recebimento', id: string, pago: boolean) => {
    const table = tipo === 'pagamento' ? 'provisoes_pagamento' : 'provisoes_recebimento';
    const dateField = tipo === 'pagamento' ? 'data_pagamento' : 'data_recebimento';

    const { error } = await supabase
      .from(table)
      .update({
        pago,
        [dateField]: pago ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    if (tipo === 'pagamento') {
      loadProvisoesPagamento();
    } else {
      loadProvisoesRecebimento();
    }
  };

  const handleDeleteMovimentacao = async (id: string) => {
    const { error } = await supabase
      .from('movimentacoes_financeiras')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir movimentação");
      return;
    }

    toast.success("Movimentação excluída");
    loadMovimentacoes();
  };

  const handleDeleteProvisao = async (tipo: 'pagamento' | 'recebimento', id: string) => {
    const table = tipo === 'pagamento' ? 'provisoes_pagamento' : 'provisoes_recebimento';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir provisão");
      return;
    }

    toast.success("Provisão excluída");
    if (tipo === 'pagamento') {
      loadProvisoesPagamento();
    } else {
      loadProvisoesRecebimento();
    }
  };

  // Calculate balances for fluxo de caixa
  const movimentacoesComSaldo = useMemo(() => {
    const conta = contas.find(c => c.id === contaSelecionada);
    let saldo = conta?.valor_inicial || 0;

    return movimentacoes.map(mov => {
      if (mov.tipo === 'entrada') {
        saldo += mov.valor;
      } else {
        saldo -= mov.valor;
      }
      return { ...mov, saldo };
    });
  }, [movimentacoes, contas, contaSelecionada]);

  const totaisFluxo = useMemo(() => {
    const entradas = movimentacoes
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0);
    const saidas = movimentacoes
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0);
    const conta = contas.find(c => c.id === contaSelecionada);
    const saldoFinal = (conta?.valor_inicial || 0) + entradas - saidas;

    return { entradas, saidas, saldoFinal };
  }, [movimentacoes, contas, contaSelecionada]);

  const totalProvisoesPagamento = provisoesPagamento.reduce((sum, p) => sum + (p.valor || 0), 0);
  const totalProvisoesRecebimento = provisoesRecebimento.reduce((sum, p) => sum + (p.valor || 0), 0);
  const totalNotasFiscais = notasFiscais.reduce((sum, nf) => sum + (nf.valor || 0), 0);
  const totalNfsPagas = notasFiscais.filter(nf => nf.status === 'PAGA').length;
  const totalNfsAbertas = notasFiscais.filter(nf => nf.status === 'EM ABERTO').length;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy');
  };

  const handleExport = () => {
    if (activeTab === 'fluxo') {
      exportToExcel('fluxo_caixa', movimentacoesComSaldo.map(m => ({
        data: formatDate(m.data),
        tipo: m.tipo,
        valor: m.valor,
        saldo: m.saldo,
        descricao: m.descricao_os || '',
        item: m.item || '',
        job: m.job || '',
        nota_recibo: m.nota_recibo || ''
      })), [
        { key: 'data', header: 'Data' },
        { key: 'tipo', header: 'Tipo' },
        { key: 'valor', header: 'Valor' },
        { key: 'saldo', header: 'Saldo' },
        { key: 'descricao', header: 'Descrição/OS' },
        { key: 'item', header: 'Item' },
        { key: 'job', header: 'Job' },
        { key: 'nota_recibo', header: 'Nota/Recibo' }
      ]);
    } else if (activeTab === 'pagamento') {
      exportToExcel('provisao_pagamento', provisoesPagamento.map(p => ({
        data: formatDate(p.data),
        item: p.item || '',
        descricao: p.descricao,
        valor: p.valor,
        job: p.job || '',
        pago: p.pago ? 'Sim' : 'Não'
      })), [
        { key: 'data', header: 'Data' },
        { key: 'item', header: 'Item' },
        { key: 'descricao', header: 'Descrição' },
        { key: 'valor', header: 'Valor' },
        { key: 'job', header: 'Job' },
        { key: 'pago', header: 'Pago' }
      ]);
    } else if (activeTab === 'recebimento') {
      exportToExcel('provisao_recebimento', provisoesRecebimento.map(p => ({
        data: formatDate(p.data),
        item: p.item || '',
        nome: p.nome,
        valor: p.valor,
        nota: p.nota || '',
        pago: p.pago ? 'Sim' : 'Não'
      })), [
        { key: 'data', header: 'Data' },
        { key: 'item', header: 'Item' },
        { key: 'nome', header: 'Nome' },
        { key: 'valor', header: 'Valor' },
        { key: 'nota', header: 'Nota' },
        { key: 'pago', header: 'Recebido' }
      ]);
    } else if (activeTab === 'nf') {
      exportToExcel('controle_nf', notasFiscais.map(nf => ({
        data_emissao: formatDate(nf.data_emissao),
        numero_nf: nf.numero_nf,
        responsavel: nf.responsavel || '',
        tipo: nf.tipo || '',
        valor: nf.valor || 0,
        descricao: nf.descricao || '',
        vencimento: formatDate(nf.vencimento),
        imposto_pct: nf.valor_imposto_pct || 0,
        data_pagamento: formatDate(nf.data_pagamento),
        status: nf.status || '',
      })), [
        { key: 'data_emissao', header: 'Data Emissão' },
        { key: 'numero_nf', header: 'Nº NF' },
        { key: 'responsavel', header: 'Responsável' },
        { key: 'tipo', header: 'Tipo' },
        { key: 'valor', header: 'Valor' },
        { key: 'descricao', header: 'Descrição' },
        { key: 'vencimento', header: 'Vencimento' },
        { key: 'imposto_pct', header: '% Imposto' },
        { key: 'data_pagamento', header: 'Data Pagamento' },
        { key: 'status', header: 'Status' },
      ]);
    }
  };

  const stats = [
    {
      title: "Saldo Atual",
      value: formatCurrency(totaisFluxo.saldoFinal),
      description: contas.find(c => c.id === contaSelecionada)?.nome || "Selecione uma conta",
      icon: Wallet,
      variant: "default" as const
    },
    {
      title: "Total Entradas",
      value: formatCurrency(totaisFluxo.entradas),
      description: `${MESES.find(m => m.value === mesSelecionado)?.label} ${anoSelecionado}`,
      icon: TrendingUp,
      trend: { value: `${movimentacoes.filter(m => m.tipo === 'entrada').length} lançamentos`, isPositive: true },
      variant: "default" as const
    },
    {
      title: "Total Saídas",
      value: formatCurrency(totaisFluxo.saidas),
      description: `${MESES.find(m => m.value === mesSelecionado)?.label} ${anoSelecionado}`,
      icon: TrendingDown,
      trend: { value: `${movimentacoes.filter(m => m.tipo === 'saida').length} lançamentos`, isPositive: false },
      variant: "default" as const
    },
    {
      title: "Balanço",
      value: formatCurrency(totalProvisoesRecebimento - totalProvisoesPagamento),
      description: "A receber - A pagar",
      icon: DollarSign,
      variant: (totalProvisoesRecebimento - totalProvisoesPagamento) >= 0 ? "default" as const : "warning" as const
    },
    {
      title: "Notas Fiscais",
      value: `${notasFiscais.length}`,
      description: `${totalNfsPagas} pagas · ${totalNfsAbertas} em aberto`,
      icon: Receipt,
      trend: { value: formatCurrency(totalNotasFiscais), isPositive: true },
      variant: "default" as const
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 isolate pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Controle Financeiro
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestão completa do fluxo de caixa e provisões
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map(mes => (
                <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="w-[90px]"
          />
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <StatusCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <Card className="card-gradient relative z-0 pointer-events-auto">
        <CardContent className="p-4 sm:p-6 pointer-events-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="pointer-events-auto">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1 h-auto pointer-events-auto">
              <TabsTrigger value="fluxo" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black font-medium text-[11px] sm:text-sm min-h-[44px]">
                <span className="sm:hidden">Fluxo</span>
                <span className="hidden sm:inline">Fluxo de Caixa</span>
              </TabsTrigger>
              <TabsTrigger value="pagamento" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-medium text-[11px] sm:text-sm min-h-[44px]">
                <span className="sm:hidden">Pagamento</span>
                <span className="hidden sm:inline">Prov. Pagamento</span>
              </TabsTrigger>
              <TabsTrigger value="recebimento" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-medium text-[11px] sm:text-sm min-h-[44px]">
                <span className="sm:hidden">Recebimento</span>
                <span className="hidden sm:inline">Prov. Recebimento</span>
              </TabsTrigger>
              <TabsTrigger value="nf" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium text-[11px] sm:text-sm min-h-[44px]">
                <span className="sm:hidden">NF</span>
                <span className="hidden sm:inline">Controle NF</span>
              </TabsTrigger>
            </TabsList>

            {/* FLUXO DE CAIXA */}
            <TabsContent value="fluxo" className="space-y-4 pointer-events-auto relative z-20">
              <div className="p-3 sm:p-4 rounded-lg shadow-md bg-gradient-to-r from-yellow-300 to-yellow-500 pointer-events-auto relative z-20">
                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center pointer-events-auto">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 pointer-events-auto">
                    <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                      <SelectTrigger className="w-full sm:w-[250px] bg-white border-0 shadow-sm text-black font-medium">
                        <SelectValue placeholder="Selecione o Banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {contas.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhuma conta cadastrada</SelectItem>
                        ) : (
                          contas.map(conta => (
                            <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {contaSelecionada && (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-black/70 font-bold uppercase tracking-wider">Banco Atual</span>
                        <span className="font-bold text-black text-lg sm:text-xl drop-shadow-sm">
                          {contas.find(c => c.id === contaSelecionada)?.nome}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 p-2 sm:px-4 sm:py-2 rounded-lg shadow-inner backdrop-blur-sm">
                    <span className="font-bold text-black text-sm sm:text-base">Saldo Inicial: R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-[120px] sm:w-[140px] bg-white text-black font-bold border-0 shadow-sm focus-visible:ring-1 focus-visible:ring-black"
                      value={contas.find(c => c.id === contaSelecionada)?.valor_inicial ?? 0}
                      onChange={(e) => handleUpdateSaldo(contaSelecionada, e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end p-4 border rounded-lg bg-card/50 pointer-events-auto relative z-30">
                <div className="w-full sm:w-auto pointer-events-auto">
                  <label className="text-sm font-medium">Adicionar Novo Banco</label>
                  <Input
                    placeholder="Nome do banco"
                    value={novaContaNome}
                    onChange={(e) => setNovaContaNome(e.target.value)}
                    className="w-full sm:w-[200px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo Inicial</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={novaContaValor}
                    onChange={(e) => setNovaContaValor(e.target.value)}
                    className="w-full sm:w-[120px]"
                  />
                </div>
                <Button onClick={handleAddConta} size="sm" className="w-full sm:w-auto pointer-events-auto">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Banco
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead className="w-[100px] text-right">Entrada</TableHead>
                        <TableHead className="w-[100px] text-right">Saída</TableHead>
                        <TableHead className="w-[110px] text-right font-bold">SALDO</TableHead>
                        <TableHead>Descrição/OS</TableHead>
                        <TableHead className="w-[80px]">Item</TableHead>
                        <TableHead className="w-[80px]">Job</TableHead>
                        <TableHead className="w-[100px]">Nt./recibo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : movimentacoesComSaldo.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                            Nenhuma movimentação neste período
                          </TableCell>
                        </TableRow>
                      ) : (
                        movimentacoesComSaldo.map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell>{formatDate(mov.data)}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {mov.tipo === 'entrada' ? formatCurrency(mov.valor) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {mov.tipo === 'saida' ? formatCurrency(mov.valor) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(mov.saldo)}
                            </TableCell>
                            <TableCell>{mov.descricao_os || '-'}</TableCell>
                            <TableCell>{mov.item || '-'}</TableCell>
                            <TableCell>{mov.job || '-'}</TableCell>
                            <TableCell>{mov.nota_recibo || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMovimentacao(mov.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-3 text-white font-bold flex flex-col sm:flex-row justify-between gap-2" style={{ backgroundColor: '#800080' }}>
                  <span>TOTAIS:</span>
                  <span className="text-green-300">Entradas: {formatCurrency(totaisFluxo.entradas)}</span>
                  <span className="text-red-300">Saídas: {formatCurrency(totaisFluxo.saidas)}</span>
                  <span>Saldo Final: {formatCurrency(totaisFluxo.saldoFinal)}</span>
                </div>
              </div>

              <Button onClick={() => setShowAddMovimentacao(true)}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Movimentação
              </Button>
            </TabsContent>

            {/* PROVISÃO DE PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-4">
              <div className="p-3 rounded-lg text-white font-bold" style={{ backgroundColor: '#FF6600' }}>
                PROVISÃO DE PAGAMENTO - {isTodosMeses ? `Ano ${anoSelecionado}` : `${MESES.find(m => m.value === mesSelecionado)?.label} ${anoSelecionado}`}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead className="w-[100px]">Item</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[120px] text-right">Valor</TableHead>
                        <TableHead className="w-[100px]">Job</TableHead>
                        <TableHead className="w-[80px] text-center">Pago</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provisoesPagamento.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhuma provisão de pagamento neste período
                          </TableCell>
                        </TableRow>
                      ) : (
                        provisoesPagamento.map((prov) => (
                          <TableRow key={prov.id} className={prov.pago ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                            <TableCell>{formatDate(prov.data)}</TableCell>
                            <TableCell>{prov.item || '-'}</TableCell>
                            <TableCell>{prov.descricao}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(prov.valor || 0)}
                            </TableCell>
                            <TableCell>{prov.job || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={prov.pago ?? false}
                                onCheckedChange={(checked) => handleTogglePago('pagamento', prov.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProvisao('pagamento', prov.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-3 text-white font-bold flex justify-between" style={{ backgroundColor: '#800080' }}>
                  <span>TOTAL A PAGAR:</span>
                  <span>{formatCurrency(totalProvisoesPagamento)}</span>
                </div>
              </div>

              <Button onClick={() => setShowAddProvisao('pagamento')}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Provisão
              </Button>
            </TabsContent>

            {/* PROVISÃO DE RECEBIMENTO */}
            <TabsContent value="recebimento" className="space-y-4">
              <div className="p-3 rounded-lg text-white font-bold" style={{ backgroundColor: '#0066FF' }}>
                PROVISÃO DE RECEBIMENTO - {isTodosMeses ? `Ano ${anoSelecionado}` : `${MESES.find(m => m.value === mesSelecionado)?.label} ${anoSelecionado}`}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead className="w-[100px]">Item</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[120px] text-right">Valor</TableHead>
                        <TableHead className="w-[100px]">Nota</TableHead>
                        <TableHead className="w-[80px] text-center">Pago</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provisoesRecebimento.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhuma provisão de recebimento neste período
                          </TableCell>
                        </TableRow>
                      ) : (
                        provisoesRecebimento.map((prov) => (
                          <TableRow key={prov.id} className={prov.pago ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                            <TableCell>{formatDate(prov.data)}</TableCell>
                            <TableCell>{prov.item || '-'}</TableCell>
                            <TableCell>{prov.nome}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(prov.valor || 0)}
                            </TableCell>
                            <TableCell>{prov.nota || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={prov.pago ?? false}
                                onCheckedChange={(checked) => handleTogglePago('recebimento', prov.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProvisao('recebimento', prov.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-3 text-white font-bold flex justify-between" style={{ backgroundColor: '#800080' }}>
                  <span>TOTAL A RECEBER:</span>
                  <span>{formatCurrency(totalProvisoesRecebimento)}</span>
                </div>
              </div>

              <Button onClick={() => setShowAddProvisao('recebimento')}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Provisão
              </Button>
            </TabsContent>

            {/* CONTROLE DE NOTAS FISCAIS */}
            <TabsContent value="nf" className="space-y-4">
              <div className="p-3 rounded-lg text-white font-bold" style={{ backgroundColor: '#059669' }}>
                CONTROLE DE EMISSÃO DE NOTAS FISCAIS - {isTodosMeses ? `Ano ${anoSelecionado}` : `${MESES.find(m => m.value === mesSelecionado)?.label} ${anoSelecionado}`}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-[100px]">Data Emissão</TableHead>
                        <TableHead className="w-[80px]">Nº NF</TableHead>
                        <TableHead className="w-[120px]">Responsável</TableHead>
                        <TableHead className="w-[90px]">Tipo</TableHead>
                        <TableHead className="w-[110px] text-right">Valor</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[100px]">Vencimento</TableHead>
                        <TableHead className="w-[80px] text-right">Imposto %</TableHead>
                        <TableHead className="w-[100px]">Data Pgto</TableHead>
                        <TableHead className="w-[100px] text-center">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notasFiscais.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                            Nenhuma nota fiscal neste período
                          </TableCell>
                        </TableRow>
                      ) : (
                        notasFiscais.map((nf) => (
                          <TableRow key={nf.id} className={nf.status === 'PAGA' ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                            <TableCell>{formatDate(nf.data_emissao)}</TableCell>
                            <TableCell className="font-mono font-medium">{nf.numero_nf}</TableCell>
                            <TableCell>{nf.responsavel || '-'}</TableCell>
                            <TableCell>{nf.tipo || '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(nf.valor || 0)}
                            </TableCell>
                            <TableCell>{nf.descricao || '-'}</TableCell>
                            <TableCell>{formatDate(nf.vencimento)}</TableCell>
                            <TableCell className="text-right">{nf.valor_imposto_pct || 0}%</TableCell>
                            <TableCell>{formatDate(nf.data_pagamento)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant={nf.status === 'PAGA' ? 'default' : 'outline'}
                                size="sm"
                                className={nf.status === 'PAGA'
                                  ? 'bg-green-600 hover:bg-green-700 text-white text-xs'
                                  : 'border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-xs'
                                }
                                onClick={() => handleToggleNfStatus(
                                  nf.id,
                                  nf.status === 'PAGA' ? 'EM ABERTO' : 'PAGA'
                                )}
                              >
                                {nf.status || 'EM ABERTO'}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteNotaFiscal(nf.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-3 text-white font-bold flex flex-col sm:flex-row justify-between gap-2" style={{ backgroundColor: '#800080' }}>
                  <span>TOTAIS:</span>
                  <span>{notasFiscais.length} NF(s) emitida(s)</span>
                  <span className="text-green-300">{totalNfsPagas} Pagas</span>
                  <span className="text-orange-300">{totalNfsAbertas} Em Aberto</span>
                  <span>Valor Total: {formatCurrency(totalNotasFiscais)}</span>
                </div>
              </div>

              <Button onClick={() => setShowAddNotaFiscal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Nota Fiscal
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddMovimentacaoDialog
        open={showAddMovimentacao}
        onOpenChange={setShowAddMovimentacao}
        contaId={contaSelecionada}
        onSuccess={loadMovimentacoes}
      />

      <AddProvisaoDialog
        open={showAddProvisao !== null}
        onOpenChange={(open) => !open && setShowAddProvisao(null)}
        tipo={showAddProvisao || 'pagamento'}
        mesReferencia={mesReferencia}
        onSuccess={() => {
          if (showAddProvisao === 'pagamento') {
            loadProvisoesPagamento();
          } else {
            loadProvisoesRecebimento();
          }
        }}
      />

      <AddNotaFiscalDialog
        open={showAddNotaFiscal}
        onOpenChange={setShowAddNotaFiscal}
        onSuccess={loadNotasFiscais}
      />
    </div>
  );
}
