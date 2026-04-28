import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  ClipboardList, 
  Package, 
  Box, 
  FileStack,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Operacoes = () => {
  const [activeTab, setActiveTab] = useState("ordens");

  // Data fetching
  const { data: ordensServico, isLoading: loadingOS } = useQuery({
    queryKey: ["ordens-servico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(`*, clientes (nome, email, telefone)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: envios, isLoading: loadingEnvios } = useQuery({
    queryKey: ["envios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("envios")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: materiais, isLoading: loadingMateriais } = useQuery({
    queryKey: ["materiais-recebidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiais_recebidos")
        .select(`*, ordens_servico (numero_os, clientes (nome))`)
        .order("data_recebimento", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: modelos, isLoading: loadingModelos } = useQuery({
    queryKey: ["modelos-orcamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modelos_orcamento")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Status configuration
  const statusConfig = {
    orcamento: { color: "bg-primary/20 text-primary border-primary/30", icon: Clock },
    aprovado: { color: "bg-secondary/20 text-secondary border-secondary/30", icon: CheckCircle2 },
    em_andamento: { color: "bg-primary/20 text-primary border-primary/30", icon: Clock },
    concluido: { color: "bg-secondary/20 text-secondary border-secondary/30", icon: CheckCircle2 },
    cancelado: { color: "bg-destructive/20 text-destructive border-destructive/30", icon: AlertCircle },
    coletado: { color: "bg-secondary/20 text-secondary border-secondary/30", icon: Package },
    pendente: { color: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30", icon: Clock },
    enviado: { color: "bg-primary/20 text-primary border-primary/30", icon: Package },
    entregue: { color: "bg-secondary/20 text-secondary border-secondary/30", icon: CheckCircle2 },
  };

  const getStatusInfo = (status: string) => statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const statsVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  // Calculate stats
  const stats = {
    totalOS: ordensServico?.length || 0,
    osAtivas: ordensServico?.filter(os => os.status === 'em_andamento').length || 0,
    enviosPendentes: envios?.filter(e => e.status === 'pendente').length || 0,
    materiaisRecebidos: materiais?.length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 p-8"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                Central de <span className="text-primary">Operações</span>
              </h1>
              <p className="text-muted-foreground">Gestão inteligente de ordens de serviço, envios e materiais</p>
            </motion.div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <motion.div variants={statsVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total OS</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalOS}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-primary/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={statsVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-secondary/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">OS Ativas</p>
                  <p className="text-3xl font-bold text-secondary">{stats.osAtivas}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={statsVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Envios Pendentes</p>
                  <p className="text-3xl font-bold text-primary">{stats.enviosPendentes}</p>
                </div>
                <Package className="h-8 w-8 text-primary/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={statsVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-secondary/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Materiais</p>
                  <p className="text-3xl font-bold text-secondary">{stats.materiaisRecebidos}</p>
                </div>
                <Box className="h-8 w-8 text-secondary/50" />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50 p-1 h-auto">
            {[
              { value: "ordens", icon: ClipboardList, label: "Ordens de Serviço" },
              { value: "envios", icon: Package, label: "Envios" },
              { value: "materiais", icon: Box, label: "Materiais" },
              { value: "modelos", icon: FileStack, label: "Modelos" },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-background flex items-center gap-2 py-3"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Ordens de Serviço */}
          <TabsContent value="ordens">
            <AnimatePresence mode="wait">
              <motion.div
                key="ordens"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Ordens de Serviço
                  </h3>
                  
                  {loadingOS ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ordensServico?.map((os, index) => {
                        const statusInfo = getStatusInfo(os.status);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <motion.div
                            key={os.id}
                            variants={itemVariants}
                            custom={index}
                            className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 hover:border-primary/50 transition-all duration-300"
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-mono text-sm font-bold text-primary">
                                    OS #{os.numero_os}
                                  </span>
                                  <Badge className={`${statusInfo.color} border`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {os.status}
                                  </Badge>
                                  <Badge variant="outline" className="border-muted-foreground/30">
                                    {os.tipo_servico}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {os.clientes?.nome || 'Cliente não definido'}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(os.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                  {os.local_servico && (
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {os.local_servico}
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-foreground/80">{os.descricao_servico}</p>
                                
                                {os.observacoes && (
                                  <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                                    {os.observacoes}
                                  </p>
                                )}
                              </div>
                              
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                  <DollarSign className="h-5 w-5" />
                                  {os.valor_servico?.toFixed(2)}
                                </div>
                                {os.quantidade && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {os.quantidade} unidades
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Envios */}
          <TabsContent value="envios">
            <AnimatePresence mode="wait">
              <motion.div
                key="envios"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Controle de Envios
                  </h3>
                  
                  {loadingEnvios ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {envios?.map((envio, index) => {
                        const statusInfo = getStatusInfo(envio.status || 'pendente');
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <motion.div
                            key={envio.id}
                            variants={itemVariants}
                            custom={index}
                            className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 hover:border-primary/50 transition-all duration-300"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-semibold text-foreground">{envio.destinatario_nome}</span>
                                  <Badge className={`${statusInfo.color} border`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {envio.status || 'pendente'}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {envio.destinatario_cidade}/{envio.destinatario_estado}
                                  </span>
                                  <span className="font-mono">CEP: {envio.cep_destino}</span>
                                  {envio.codigo_rastreio && (
                                    <span className="font-mono text-primary">{envio.codigo_rastreio}</span>
                                  )}
                                </div>
                                
                                {envio.destinatario_endereco && (
                                  <p className="text-sm text-foreground/80">
                                    {envio.destinatario_endereco}, {envio.destinatario_numero}
                                    {envio.destinatario_complemento && ` - ${envio.destinatario_complemento}`}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{envio.forma_envio}</span>
                                  {envio.prazo_entrega && <span>• Prazo: {envio.prazo_entrega} dias</span>}
                                </div>
                              </div>
                              
                              {envio.valor_frete && (
                                <div className="text-right shrink-0">
                                  <div className="flex items-center gap-1 text-lg font-bold text-primary">
                                    <DollarSign className="h-4 w-4" />
                                    {envio.valor_frete.toFixed(2)}
                                  </div>
                                  {envio.peso && (
                                    <p className="text-xs text-muted-foreground mt-1">{envio.peso}kg</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Materiais */}
          <TabsContent value="materiais">
            <AnimatePresence mode="wait">
              <motion.div
                key="materiais"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    Materiais Recebidos
                  </h3>
                  
                  {loadingMateriais ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {materiais?.map((material, index) => (
                        <motion.div
                          key={material.id}
                          variants={itemVariants}
                          custom={index}
                          className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 hover:border-primary/50 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold text-foreground">{material.item_descricao}</span>
                              {material.conferido && (
                                <Badge className="bg-secondary/20 text-secondary border-secondary/30 border">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Conferido
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span>Fornecedor: {material.fornecedor}</span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(material.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            
                            {material.ordens_servico && (
                              <p className="text-xs text-muted-foreground">
                                OS #{material.ordens_servico.numero_os} - {material.ordens_servico.clientes?.nome}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-4 gap-3 pt-2">
                              <div className="text-center p-2 rounded-lg bg-muted/30">
                                <p className="text-xs text-muted-foreground">Tipo</p>
                                <p className="text-sm font-semibold">{material.tipo_embalagem}</p>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-muted/30">
                                <p className="text-xs text-muted-foreground">Recebido</p>
                                <p className="text-sm font-semibold">{material.quantidade_recebida}</p>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-muted/30">
                                <p className="text-xs text-muted-foreground">Utilizado</p>
                                <p className="text-sm font-semibold">{material.quantidade_utilizada}</p>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/30">
                                <p className="text-xs text-muted-foreground">Saldo</p>
                                <p className="text-sm font-bold text-primary">
                                  {material.quantidade_recebida - material.quantidade_utilizada}
                                </p>
                              </div>
                            </div>
                            
                            {material.observacoes && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                                {material.observacoes}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Modelos */}
          <TabsContent value="modelos">
            <AnimatePresence mode="wait">
              <motion.div
                key="modelos"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <FileStack className="h-5 w-5 text-primary" />
                    Modelos de Orçamento
                  </h3>
                  
                  {loadingModelos ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modelos?.map((modelo, index) => (
                        <motion.div
                          key={modelo.id}
                          variants={itemVariants}
                          custom={index}
                          className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 hover:border-primary/50 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-2">{modelo.nome}</h4>
                                <Badge variant="outline" className="border-muted-foreground/30">
                                  {modelo.tipo_servico}
                                </Badge>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-xl font-bold text-primary">
                                  <DollarSign className="h-4 w-4" />
                                  {modelo.valor_base?.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">Valor base</p>
                              </div>
                            </div>
                            
                            {modelo.descricao && (
                              <p className="text-sm text-muted-foreground">{modelo.descricao}</p>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
                              <Calendar className="h-3 w-3" />
                              Criado em {format(new Date(modelo.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Operacoes;
