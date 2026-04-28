import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Mic, Paperclip, BarChart3, Package, Truck, DollarSign, TrendingUp, AlertTriangle, UserPlus, PackagePlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { AddProductDialog } from "@/components/AddProductDialog";
import { AddClientDialog } from "@/components/AddClientDialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
type Msg = {
  role: 'user' | 'assistant';
  content: string;
};
export function IAAssistant() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('');

  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Olá! Sou a MANU, assistente virtual da VIP Manuseios. Como posso ajudar você hoje?'
  }]);

  // Auto-scroll to bottom when messages change (contained within ScrollArea)
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const quickActions = [{
    icon: PackagePlus,
    label: "Adicionar Produto",
    type: "action" as const,
    action: "add-product"
  }, {
    icon: UserPlus,
    label: "Adicionar Cliente",
    type: "action" as const,
    action: "add-client"
  }, {
    icon: BarChart3,
    label: "Relatório Financeiro",
    type: "query" as const,
    query: "Me mostre o relatório financeiro completo"
  }, {
    icon: Package,
    label: "Status do Estoque",
    type: "query" as const,
    query: "Qual o status atual do estoque?"
  }, {
    icon: Truck,
    label: "Envios Pendentes",
    type: "query" as const,
    query: "Quais envios estão pendentes hoje?"
  }, {
    icon: DollarSign,
    label: "Análise de Custos",
    type: "query" as const,
    query: "Faça uma análise detalhada dos custos"
  }];

  const suggestions = ["Como está o desempenho da produção hoje?", "Me mostre o relatório financeiro mensal completo", "Quais produtos precisam ser repostos?", "Analise os clientes que mais gastaram", "Status de todos os envios pendentes", "Qual o faturamento anual?", "Otimize a agenda de produção", "Análise completa do estoque"];

  const handleSendMessage = async (input?: string) => {
    const text = (input ?? message).trim();
    if (!text || isLoading) return;
    if (!input) setMessage("");
    const userMsg: Msg = {
      role: 'user',
      content: text
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [...messages, userMsg]
        },
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
      });
      if (error) {
        console.error('Erro da Edge Function:', JSON.stringify(error, null, 2));
        toast.error('Erro ao processar mensagem: ' + (error.message || 'Erro desconhecido'));
        return;
      }
      // Tratar erro retornado no corpo da resposta (função retorna 200 mas com campo error)
      if (data?.error) {
        console.error('Erro retornado pela IA:', data.error, data.detail || '', data.stack || '');
        toast.error('Erro da IA: ' + data.error);
        return;
      }
      const assistantMsg: Msg = {
        role: 'assistant',
        content: data?.message || 'Desculpe, não consegui processar sua solicitação.'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    handleSendMessage(query);
  };

  const startRecording = async () => {
    try {
      console.log('Solicitando permissão de microfone...');
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Seu navegador não suporta captura de áudio. Tente Chrome/Edge/Firefox.');
        return;
      }
      if (typeof MediaRecorder === 'undefined') {
        toast.error('MediaRecorder indisponível neste navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log('Permissão concedida, criando MediaRecorder...');

      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mpeg',
      ];
      const selectedType = candidates.find((t) => {
        try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
      }) || '';
      console.log('Mime type selecionado:', selectedType || '(padrão do navegador)');

      const options: MediaRecorderOptions | undefined = selectedType
        ? { mimeType: selectedType }
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options as MediaRecorderOptions);
      mimeTypeRef.current = selectedType || mediaRecorder.mimeType || '';
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Dados de áudio recebidos, tamanho:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          console.log('Gravação parada, processando áudio...');
          const type = mimeTypeRef.current || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type });
          console.log('Blob criado, tamanho:', audioBlob.size, 'tipo:', type);
          await transcribeAudio(audioBlob);
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      console.log('Gravação iniciada com sucesso');
      toast.info('Gravando... Clique novamente para parar');
    } catch (error: any) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Erro ao acessar microfone: ' + (error?.message || String(error)));
    }
  };

  const stopRecording = () => {
    console.log('Tentando parar gravação...');
    if (mediaRecorderRef.current && isListening) {
      console.log('MediaRecorder encontrado, parando...');
      mediaRecorderRef.current.stop();
      setIsListening(false);
      toast.info('Processando áudio...');
    } else {
      console.log('MediaRecorder não encontrado ou não está gravando');
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log('Iniciando transcrição, tamanho do blob:', audioBlob.size, 'tipo:', audioBlob.type);
      setIsTranscribing(true);
      toast.info('Transcrevendo áudio...');

      const contentType = audioBlob.type || mimeTypeRef.current || 'audio/webm';

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        console.log('Áudio convertido para base64, tamanho:', base64Audio.length);

        console.log('Chamando edge function transcribe-audio...');
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio, mimeType: contentType }
        });

        if (error || data?.error) {
          const errMsg = error?.message || data?.error || 'Erro desconhecido';
          console.error('Erro na transcrição:', errMsg);
          toast.error('Erro ao transcrever áudio: ' + errMsg);
          setIsTranscribing(false);
          return;
        }

        console.log('Resposta da transcrição:', data);
        if (data?.text) {
          console.log('Texto transcrito:', data.text);
          toast.success('Áudio transcrito!');
          await handleSendMessage(data.text);
        } else {
          console.log('Nenhum texto na resposta');
          toast.error('Não foi possível transcrever o áudio');
          setIsTranscribing(false);
        }
      };

      reader.onerror = (error) => {
        console.error('Erro ao ler arquivo:', error);
        toast.error('Erro ao ler arquivo de áudio');
        setIsTranscribing(false);
      };
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast.error('Erro ao processar áudio: ' + (error?.message || String(error)));
      setIsTranscribing(false);
    }
  };

  const handleMicClick = () => {
    console.log('Botão de microfone clicado. isListening:', isListening);
    if (isListening) {
      console.log('Parando gravação...');
      stopRecording();
    } else {
      console.log('Iniciando gravação...');
      startRecording();
    }
  };

  return <div className="space-y-4 sm:space-y-6 md:space-y-8">
    {/* Header */}
    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient flex items-center gap-2 sm:gap-3">
          <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-br from-vip-primary to-vip-secondary rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-xl sm:text-3xl">MANU - Assistente Virtual</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Sua assistente inteligente da VIP Manuseios
        </p>
      </div>
      <Badge className="bg-emerald-100 text-emerald-800 self-start sm:self-auto">
        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
        Online
      </Badge>
    </div>

    {/* Main Chat Interface */}
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">

      {/* Chat Area */}
      <Card className="lg:col-span-3 card-gradient flex flex-col h-[500px] sm:h-[550px] md:h-[600px]">
        <CardHeader className="border-b border-border/50 p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-vip-primary" />
            Conversa com IA
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full p-3 sm:p-4 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((msg, idx) => <motion.div key={idx} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-vip-primary to-vip-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>}
                <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-vip-primary text-white' : 'bg-muted'} rounded-lg p-3 sm:p-4`}>
                  <div className="text-xs sm:text-sm whitespace-pre-line break-words">{msg.content}</div>
                </div>
                {msg.role === 'user' && <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[10px] sm:text-xs font-medium">Você</span>
                </div>}
              </motion.div>)}
              {(isLoading || isTranscribing) && <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-vip-primary to-vip-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg p-3 sm:p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{
                      animationDelay: '0ms'
                    }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{
                      animationDelay: '150ms'
                    }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{
                      animationDelay: '300ms'
                    }}></div>
                  </div>
                </div>
              </motion.div>}

            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="border-t border-border/50 p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Pergunte sobre seu negócio..." className="pr-16 sm:pr-20 text-sm" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} disabled={isLoading} />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 min-h-[44px] min-w-[44px] p-0 hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMicClick();
                  }}
                  disabled={isTranscribing}
                  type="button"
                >
                  <Mic className={`h-4 w-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 min-h-[44px] min-w-[44px] p-0 hidden sm:flex hover:bg-accent" disabled={isTranscribing} type="button">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => handleSendMessage()}
              className="bg-vip-primary hover:bg-vip-secondary h-9 sm:h-10 px-3 sm:px-4"
              disabled={!message.trim() || isLoading}
              type="button"
            >
              {isLoading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="hidden sm:flex flex-wrap gap-2 mt-3">
            {suggestions.slice(0, 3).map((suggestion, index) => <Button key={index} variant="outline" size="sm" className="text-xs" onClick={() => handleSendMessage(suggestion)} disabled={isLoading}>
              {suggestion}
            </Button>)}
          </div>
        </div>
      </Card>

      {/* Quick Actions Sidebar */}
      <div className="space-y-4 sm:space-y-6">

        {/* Quick Actions */}
        <Card className="card-gradient">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {quickActions.map((action, index) => <motion.div key={index} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: index * 0.05
              }}>
                {action.type === "action" ? action.action === "add-product" ? <AddProductDialog trigger={<Button variant="outline" className="w-full justify-start gap-2 sm:gap-3 h-auto p-2 sm:p-3 text-xs sm:text-sm" disabled={isLoading || isTranscribing}>
                  <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>} /> : action.action === "add-client" ? <AddClientDialog trigger={<Button variant="outline" className="w-full justify-start gap-2 sm:gap-3 h-auto p-2 sm:p-3 text-xs sm:text-sm" disabled={isLoading || isTranscribing}>
                  <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>} /> : null : <Button variant="outline" className="w-full justify-start gap-2 sm:gap-3 h-auto p-2 sm:p-3 text-xs sm:text-sm" onClick={() => handleQuickAction(action.query)} disabled={isLoading || isTranscribing}>
                  <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>}
              </motion.div>)}
            </div>
          </CardContent>
        </Card>

        {/* AI Capabilities */}
        <Card className="card-gradient hidden lg:block">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Capacidades da IA</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Análises Financeiras</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Relatórios e insights</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Previsões Inteligentes</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Demanda e tendências</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Alertas Proativos</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Identificação de problemas</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">Sugestões Estratégicas</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Otimizações personalizadas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Stats */}
        <Card className="card-gradient hidden lg:block">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span>Consultas hoje</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                  <div className="bg-vip-primary h-1.5 sm:h-2 rounded-full transition-all" style={{
                    width: '80%'
                  }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span>Precisão</span>
                  <span className="font-medium">96.8%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                  <div className="bg-emerald-500 h-1.5 sm:h-2 rounded-full transition-all" style={{
                    width: '96.8%'
                  }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span>Tempo de resposta</span>
                  <span className="font-medium">0.8s</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                  <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all" style={{
                    width: '90%'
                  }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
}
