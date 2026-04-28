import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar se o usuário está autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o usuário é admin (relaxado para debug)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log(`Role do usuário (rag-chat):`, roleData?.role || 'nenhuma');

    console.log("Processando requisição rag-chat");

    const { messages } = await req.json();
    // Procurar a chave padrão LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
                          
    if (!LOVABLE_API_KEY) {
      throw new Error('Chave de API (IA) não configurada (LOVABLE_API_KEY)');
    }

    // REMOVIDO: supabaseServiceKey e supabaseAdmin
    // Agora usamos apenas o cliente autenticado (supabase) que respeita RLS

    const systemPrompt = `Você é o Cérebro Contador da VIP Manuseios, uma IA especializada em gestão empresarial de confecção.

Você tem acesso a ferramentas para:
- Consultar produtos e estoque (get_products)
- Criar novos produtos (create_product)
- Remover produtos (delete_product)
- Consultar clientes (get_clients)
- Criar novos clientes (create_client)
- Remover clientes (delete_client)
- Criar envios/remessas (create_envio)
- Gerar relatórios financeiros completos (get_financial_report)
- Verificar status de produção (get_production_status)
- Monitorar envios (get_shipments_status)
- Analisar clientes e vendas (get_clients_analysis)
- Atualizar estoque (update_stock)
- Criar orçamentos (create_budget)

Sempre seja preciso, use as ferramentas disponíveis e forneça análises detalhadas.
Formate respostas com bullets, números e emojis quando apropriado.
Quando o usuário pedir para criar, remover ou modificar dados, use as ferramentas apropriadas e confirme a ação realizada.`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_products',
          description: 'Busca produtos do estoque. Pode filtrar por código, nome ou listar todos',
          parameters: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Código ou nome do produto (opcional)' },
              limit: { type: 'number', description: 'Limite de resultados (padrão: 10)' }
            }
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_product',
          description: 'Cria um novo produto no estoque',
          parameters: {
            type: 'object',
            properties: {
              codigo: { type: 'string', description: 'Código único do produto' },
              nome: { type: 'string', description: 'Nome do produto' },
              categoria: { type: 'string', description: 'Categoria do produto' },
              preco: { type: 'number', description: 'Preço do produto' },
              estoque: { type: 'number', description: 'Quantidade inicial em estoque' },
              descricao: { type: 'string', description: 'Descrição do produto (opcional)' }
            },
            required: ['codigo', 'nome', 'categoria', 'preco']
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'delete_product',
          description: 'Remove um produto do estoque',
          parameters: {
            type: 'object',
            properties: {
              codigo: { type: 'string', description: 'Código do produto a ser removido' }
            },
            required: ['codigo']
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_clients',
          description: 'Busca clientes. Pode filtrar por código, nome ou listar todos',
          parameters: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Código ou nome do cliente (opcional)' },
              limit: { type: 'number', description: 'Limite de resultados (padrão: 10)' }
            }
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_client',
          description: 'Cria um novo cliente',
          parameters: {
            type: 'object',
            properties: {
              codigo: { type: 'string', description: 'Código único do cliente' },
              nome: { type: 'string', description: 'Nome do cliente' },
              email: { type: 'string', description: 'Email do cliente (opcional)' },
              telefone: { type: 'string', description: 'Telefone do cliente (opcional)' },
              cpf_cnpj: { type: 'string', description: 'CPF/CNPJ do cliente (opcional)' },
              endereco: { type: 'string', description: 'Endereço do cliente (opcional)' },
              cidade: { type: 'string', description: 'Cidade do cliente (opcional)' },
              estado: { type: 'string', description: 'Estado do cliente (opcional)' }
            },
            required: ['codigo', 'nome']
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'delete_client',
          description: 'Remove um cliente',
          parameters: {
            type: 'object',
            properties: {
              codigo: { type: 'string', description: 'Código do cliente a ser removido' }
            },
            required: ['codigo']
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_envio',
          description: 'Cria um novo envio/remessa',
          parameters: {
            type: 'object',
            properties: {
              destinatario_nome: { type: 'string', description: 'Nome do destinatário' },
              destinatario_cidade: { type: 'string', description: 'Cidade do destinatário' },
              destinatario_estado: { type: 'string', description: 'Estado do destinatário' },
              forma_envio: { type: 'string', description: 'Forma de envio (Correios, Jadlog, etc)' },
              peso: { type: 'number', description: 'Peso em kg (opcional)' },
              valor_frete: { type: 'number', description: 'Valor do frete (opcional)' }
            },
            required: ['destinatario_nome', 'destinatario_cidade', 'destinatario_estado']
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_financial_report',
          description: 'Gera relatório financeiro com vendas, custos e lucro',
          parameters: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['monthly', 'yearly', 'all'], description: 'Período do relatório' }
            },
            required: ['period']
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_production_status',
          description: 'Retorna status atual da produção (ordens de serviço)',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_shipments_status',
          description: 'Retorna status dos envios (pendentes, em trânsito, entregues)',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['pendente', 'em_transito', 'entregue', 'all'], description: 'Filtrar por status' }
            }
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_clients_analysis',
          description: 'Análise de clientes (gastos, pedidos, top clientes)',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_stock',
          description: 'Atualiza o estoque de um produto',
          parameters: {
            type: 'object',
            properties: {
              codigo: { type: 'string', description: 'Código do produto' },
              delta: { type: 'number', description: 'Quantidade a ajustar (positivo adiciona, negativo remove)' },
            },
            required: ['codigo', 'delta'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_budget',
          description: 'Cria um novo orçamento',
          parameters: {
            type: 'object',
            properties: {
              cliente_codigo: { type: 'string', description: 'Código do cliente' },
              itens: { type: 'array', description: 'Lista de itens do orçamento' },
              observacoes: { type: 'string', description: 'Observações adicionais' }
            },
            required: ['cliente_codigo', 'itens']
          },
        },
      },
    ];

    const aiResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vip-manuseios.vercel.app',
        'X-Title': 'VIP Manuseios - Cérebro Contador',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: 'Créditos insuficientes para IA.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const t = await aiResp.text();
      console.error('AI error', aiResp.status, t);
      throw new Error('AI gateway error');
    }

    const aiJson = await aiResp.json();
    let assistantMessage = aiJson.choices?.[0]?.message;
    const toolCalls: ToolCall[] | undefined = assistantMessage?.tool_calls;

    if (toolCalls && toolCalls.length) {
      const toolResults: any[] = [];

      for (const call of toolCalls) {
        const { name, arguments: argsStr } = call.function;
        let args: any = {};
        try { args = JSON.parse(argsStr || '{}'); } catch { }

        console.log(`Tool call: ${name}`, args);

        if (name === 'get_products') {
          let query = supabase.from('produtos').select('*');
          if (args.search) {
            const sanitized = String(args.search).replace(/[%_\\]/g, '\\$&').trim().substring(0, 100);
            if (sanitized.length > 0) {
              query = query.or(`codigo.ilike.%${sanitized}%,nome.ilike.%${sanitized}%`);
            }
          }
          const limit = Math.min(Math.max(1, parseInt(args.limit) || 10), 100);
          const { data } = await query.limit(limit);
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(data) });
        }

        if (name === 'get_financial_report') {
          const { data: produtos } = await supabase.from('produtos').select('preco, vendidos, estoque');
          const { data: orcamentos } = await supabase.from('orcamentos').select('valor_total, created_at');

          const totalVendas = produtos?.reduce((sum: number, p: any) => sum + (parseFloat(p.preco) * (p.vendidos || 0)), 0) || 0;
          const totalEstoque = produtos?.reduce((sum: number, p: any) => sum + (parseFloat(p.preco) * p.estoque), 0) || 0;
          const orcamentosTotal = orcamentos?.reduce((sum: number, o: any) => sum + (parseFloat(o.valor_total) || 0), 0) || 0;

          const result = {
            vendas: totalVendas,
            estoque_valor: totalEstoque,
            orcamentos: orcamentosTotal,
            lucro_estimado: totalVendas * 0.35,
            periodo: args.period,
            total_produtos: produtos?.length || 0
          };
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(result) });
        }

        if (name === 'get_production_status') {
          const { data } = await supabase.from('ordens_servico').select('*').order('created_at', { ascending: false }).limit(20);
          const statusCount = data?.reduce((acc: any, os: any) => {
            acc[os.status] = (acc[os.status] || 0) + 1;
            return acc;
          }, {});
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ ordens: data, resumo: statusCount }) });
        }

        if (name === 'get_shipments_status') {
          let query = supabase.from('envios').select('*');
          if (args.status && args.status !== 'all') {
            query = query.eq('status', args.status);
          }
          const { data } = await query.order('created_at', { ascending: false }).limit(20);
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(data) });
        }

        if (name === 'get_clients_analysis') {
          const { data: clientes } = await supabase.from('clientes').select('*');
          const { data: orcamentos } = await supabase.from('orcamentos').select('cliente_id, valor_total, codigo_cliente');

          const clientesComGastos = clientes?.map((c: any) => {
            const gastosCliente = orcamentos?.filter((o: any) => o.cliente_id === c.id)
              .reduce((sum: number, o: any) => sum + (parseFloat(o.valor_total) || 0), 0) || 0;
            const pedidos = orcamentos?.filter((o: any) => o.cliente_id === c.id).length || 0;
            return { ...c, gastos: gastosCliente, pedidos };
          }).sort((a: any, b: any) => b.gastos - a.gastos);

          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ clientes: clientesComGastos, total_clientes: clientes?.length }) });
        }

        if (name === 'update_stock') {
          const codigo = String(args.codigo || '').trim().substring(0, 20);
          const delta = Number(args.delta || 0);

          if (!codigo) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Código do produto é obrigatório' }) });
            continue;
          }

          const { data: produto } = await supabase.from('produtos').select('*').eq('codigo', codigo).maybeSingle();

          if (!produto) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: `Produto ${codigo} não encontrado` }) });
          } else {
            const novo = Math.max(0, (produto.estoque ?? 0) + delta);
            await supabase.from('produtos').update({ estoque: novo }).eq('id', produto.id);
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ codigo, nome: produto.nome, estoque_anterior: produto.estoque, estoque_atual: novo }) });
          }
        }

        if (name === 'create_product') {
          const codigo = String(args.codigo || '').trim().substring(0, 20);
          const nome = String(args.nome || '').trim().substring(0, 200);
          const categoria = String(args.categoria || '').trim().substring(0, 100);
          const preco = Number(args.preco || 0);
          const estoque = Number(args.estoque || 0);
          const descricao = String(args.descricao || '').trim().substring(0, 500);

          if (!codigo || !nome || !categoria) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Código, nome e categoria são obrigatórios' }) });
            continue;
          }

          const { data: existente } = await supabase.from('produtos').select('codigo').eq('codigo', codigo).maybeSingle();
          if (existente) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: `Produto com código ${codigo} já existe` }) });
            continue;
          }

          const { data, error } = await supabase.from('produtos').insert({
            codigo, nome, categoria, preco, estoque, descricao
          }).select();

          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(error ? { error: error.message } : { success: true, produto: data?.[0] }) });
        }

        if (name === 'delete_product') {
          const codigo = String(args.codigo || '').trim().substring(0, 20);

          if (!codigo) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Código do produto é obrigatório' }) });
            continue;
          }

          const { data: produto } = await supabase.from('produtos').select('*').eq('codigo', codigo).maybeSingle();
          if (!produto) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: `Produto ${codigo} não encontrado` }) });
            continue;
          }

          const { error } = await supabase.from('produtos').delete().eq('codigo', codigo);
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(error ? { error: error.message } : { success: true, produto_removido: produto.nome }) });
        }

        if (name === 'get_clients') {
          let query = supabase.from('clientes').select('*');
          if (args.search) {
            const sanitized = String(args.search).replace(/[%_\\]/g, '\\$&').trim().substring(0, 100);
            if (sanitized.length > 0) {
              query = query.or(`codigo.ilike.%${sanitized}%,nome.ilike.%${sanitized}%`);
            }
          }
          const limit = Math.min(Math.max(1, parseInt(args.limit) || 10), 100);
          const { data } = await query.limit(limit);
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(data) });
        }

        if (name === 'create_client') {
          const codigo = String(args.codigo || '').trim().substring(0, 20);
          const nome = String(args.nome || '').trim().substring(0, 200);

          if (!codigo || !nome) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Código e nome são obrigatórios' }) });
            continue;
          }

          const { data: existente } = await supabase.from('clientes').select('codigo').eq('codigo', codigo).maybeSingle();
          if (existente) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: `Cliente com código ${codigo} já existe` }) });
            continue;
          }

          const { data, error } = await supabase.from('clientes').insert({
            codigo, nome,
            email: args.email ? String(args.email).trim().substring(0, 200) : null,
            telefone: args.telefone ? String(args.telefone).trim().substring(0, 20) : null,
            cpf_cnpj: args.cpf_cnpj ? String(args.cpf_cnpj).trim().substring(0, 20) : null,
            endereco: args.endereco ? String(args.endereco).trim().substring(0, 300) : null,
            cidade: args.cidade ? String(args.cidade).trim().substring(0, 100) : null,
            estado: args.estado ? String(args.estado).trim().substring(0, 2) : null,
          }).select();

          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(error ? { error: error.message } : { success: true, cliente: data?.[0] }) });
        }

        if (name === 'delete_client') {
          const codigo = String(args.codigo || '').trim().substring(0, 20);

          if (!codigo) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Código do cliente é obrigatório' }) });
            continue;
          }

          const { data: cliente } = await supabase.from('clientes').select('*').eq('codigo', codigo).maybeSingle();
          if (!cliente) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: `Cliente ${codigo} não encontrado` }) });
            continue;
          }

          const { error } = await supabase.from('clientes').delete().eq('codigo', codigo);
          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(error ? { error: error.message } : { success: true, cliente_removido: cliente.nome }) });
        }

        if (name === 'create_envio') {
          const { data, error } = await supabase.from('envios').insert({
            destinatario_nome: String(args.destinatario_nome || '').trim().substring(0, 200),
            destinatario_cidade: String(args.destinatario_cidade || '').trim().substring(0, 100),
            destinatario_estado: String(args.destinatario_estado || '').trim().substring(0, 2),
            forma_envio: args.forma_envio ? String(args.forma_envio).trim().substring(0, 100) : null,
            peso: args.peso ? Number(args.peso) : null,
            valor_frete: args.valor_frete ? Number(args.valor_frete) : null,
            status: 'pendente'
          }).select();

          toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(error ? { error: error.message } : { success: true, envio: data?.[0] }) });
        }

        if (name === 'create_budget') {
          const clienteCodigo = String(args.cliente_codigo || '').trim().substring(0, 20);

          if (!clienteCodigo) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Código do cliente é obrigatório' }) });
            continue;
          }

          const { data: cliente } = await supabase
            .from('clientes')
            .select('id')
            .eq('codigo', clienteCodigo)
            .maybeSingle();

          if (!cliente) {
            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify({ error: 'Cliente não encontrado' }) });
          } else {
            const valorTotal = args.itens.reduce((sum: number, item: any) => sum + (item.preco * item.quantidade), 0);
            const { data, error } = await supabase.from('orcamentos').insert({
              cliente_id: cliente.id,
              codigo_cliente: clienteCodigo,
              itens: args.itens,
              valor_total: valorTotal,
              observacoes: args.observacoes
            }).select();

            toolResults.push({ tool_call_id: call.id, role: 'tool', name, content: JSON.stringify(error ? { error: error.message } : { success: true, orcamento: data }) });
          }
        }
      }

      const followUp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${LOVABLE_API_KEY}`, 
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vip-manuseios.vercel.app',
          'X-Title': 'VIP Manuseios - Cérebro Contador',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults,
          ],
        }),
      });

      const followJson = await followUp.json();
      assistantMessage = followJson.choices?.[0]?.message;
    }

    return new Response(
      JSON.stringify({ message: assistantMessage?.content ?? 'Ok.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro desconhecido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
