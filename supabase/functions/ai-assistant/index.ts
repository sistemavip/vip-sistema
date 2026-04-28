import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Ferramentas disponíveis para a IA
const tools = [
  {
    type: "function",
    function: {
      name: "criar_cliente",
      description: "Cria um novo cliente no sistema",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do cliente" },
          email: { type: "string", description: "Email do cliente" },
          telefone: { type: "string", description: "Telefone do cliente" },
          cpf_cnpj: { type: "string", description: "CPF ou CNPJ do cliente" },
          endereco: { type: "string", description: "Endereço completo" },
          cidade: { type: "string", description: "Cidade" },
          estado: { type: "string", description: "Estado (UF)" },
        },
        required: ["nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_produto",
      description: "Adiciona um novo produto ao estoque",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do produto" },
          categoria: { type: "string", description: "Categoria do produto" },
          preco: { type: "number", description: "Preço do produto" },
          estoque: { type: "number", description: "Quantidade em estoque" },
          estoque_min: { type: "number", description: "Estoque mínimo" },
          descricao: { type: "string", description: "Descrição do produto" },
        },
        required: ["nome", "categoria", "preco"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_orcamento",
      description: "Cria um orçamento para um cliente",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente" },
          valor_total: { type: "number", description: "Valor total do orçamento" },
          status: { type: "string", description: "Status: pendente, aprovado, rejeitado" },
          observacoes: { type: "string", description: "Observações" },
        },
        required: ["cliente_nome", "valor_total"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_custo",
      description: "Registra um custo/despesa",
      parameters: {
        type: "object",
        properties: {
          categoria: { type: "string", description: "Categoria do custo" },
          descricao: { type: "string", description: "Descrição do custo" },
          valor: { type: "number", description: "Valor" },
          data: { type: "string", description: "Data no formato YYYY-MM-DD" },
        },
        required: ["categoria", "descricao", "valor"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_clientes",
      description: "Lista os clientes cadastrados",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_produtos",
      description: "Lista os produtos em estoque",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_estatisticas",
      description: "Busca estatísticas gerais do sistema",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(toolName: string, args: any, supabase: any) {
  switch (toolName) {
    case "criar_cliente": {
      const codigo = `C${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          codigo,
          nome: args.nome,
          email: args.email || null,
          telefone: args.telefone || null,
          cpf_cnpj: args.cpf_cnpj || null,
          endereco: args.endereco || null,
          cidade: args.cidade || null,
          estado: args.estado || null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data, message: `Cliente ${args.nome} criado com código ${codigo}` };
    }

    case "criar_produto": {
      const codigo = `P${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from("produtos")
        .insert({
          codigo,
          nome: args.nome,
          categoria: args.categoria,
          preco: args.preco,
          estoque: args.estoque || 0,
          estoque_min: args.estoque_min || 5,
          descricao: args.descricao || null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data, message: `Produto ${args.nome} criado com código ${codigo}` };
    }

    case "criar_orcamento": {
      const { data: clientes, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .ilike("nome", `%${args.cliente_nome}%`)
        .limit(1);

      if (clienteError || !clientes || clientes.length === 0) {
        return { success: false, error: "Cliente não encontrado" };
      }

      const cliente = clientes[0];
      const { data, error } = await supabase
        .from("orcamentos")
        .insert({
          cliente_id: cliente.id,
          codigo_cliente: cliente.codigo,
          valor_total: args.valor_total,
          status: args.status || "pendente",
          observacoes: args.observacoes || null,
          itens: [],
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return {
        success: true,
        data,
        message: `Orçamento criado para ${cliente.nome} no valor de R$ ${args.valor_total}`
      };
    }

    case "criar_custo": {
      const { data, error } = await supabase
        .from("custos")
        .insert({
          categoria: args.categoria,
          descricao: args.descricao,
          valor: args.valor,
          data: args.data || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data, message: `Custo registrado: ${args.descricao} - R$ ${args.valor}` };
    }

    case "listar_clientes": {
      const { data, error } = await supabase
        .from("clientes")
        .select("codigo, nome, email, telefone, cidade, estado")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) return { success: false, error: error.message };
      return { success: true, data, count: data.length };
    }

    case "listar_produtos": {
      const { data, error } = await supabase
        .from("produtos")
        .select("codigo, nome, categoria, preco, estoque, estoque_min")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) return { success: false, error: error.message };
      return { success: true, data, count: data.length };
    }

    case "buscar_estatisticas": {
      const [clientesRes, produtosRes, orcamentosRes, custosRes] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("produtos").select("id", { count: "exact", head: true }),
        supabase.from("orcamentos").select("valor_total, status"),
        supabase.from("custos").select("valor"),
      ]);

      const totalClientes = clientesRes.count || 0;
      const totalProdutos = produtosRes.count || 0;
      const valorOrcamentos = orcamentosRes.data?.reduce((sum: number, o: any) => sum + (o.valor_total || 0), 0) || 0;
      const totalCustos = custosRes.data?.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) || 0;

      return {
        success: true,
        data: {
          total_clientes: totalClientes,
          total_produtos: totalProdutos,
          valor_orcamentos: valorOrcamentos,
          total_custos: totalCustos,
        },
      };
    }

    default:
      return { success: false, error: "Ferramenta não encontrada" };
  }
}

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Helper: SEMPRE retorna 200 com JSON
  const jsonOk = (obj: any) => new Response(JSON.stringify(obj), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

  try {
    // 1. Auth header
    const authHeader = req.headers.get("Authorization");

    // 2. Supabase config
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonOk({ error: "DEBUG: SUPABASE_URL ou SERVICE_ROLE_KEY ausentes" });
    }

    // 3. Supabase client com service role (pode verificar qualquer JWT)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4. Verificar usuário via token JWT (se houver)
    let userId = "anonymous";
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
      } else {
        console.warn("Auth falhou, continuando sem user:", userError?.message);
      }
    }
    console.log("User ID:", userId);

    // 5. Cliente Supabase para operações (service role para evitar problemas de RLS com ES256)
    const supabase = supabaseAdmin;

    // 6. Parse body
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonOk({ error: "DEBUG: 'messages' inválido ou ausente no body" });
    }

    // 6. API Key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Listar variáveis disponíveis para debug
      const envKeys = Object.keys(Deno.env.toObject());
      return jsonOk({ 
        error: "DEBUG: LOVABLE_API_KEY não encontrada nos secrets", 
        available_env_keys: envKeys 
      });
    }

    // 7. System prompt
    const systemPrompt = `Você é a MANU, assistente virtual da VIP Manuseios, especializada em gestão de confecção e manuseios. Você tem acesso a ferramentas para:

- Criar clientes, produtos, orçamentos e registrar custos
- Listar dados de clientes e produtos
- Buscar estatísticas do sistema

Seja amigável, eficiente e proativa. Quando o usuário pedir para fazer algo, use as ferramentas disponíveis.
Sempre confirme as ações realizadas de forma clara e simpática.

Apresente-se sempre como MANU da VIP Manuseios.`;

    let conversationMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // 8. Loop de IA
    let loopCount = 0;
    const MAX_LOOPS = 5;

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`Loop ${loopCount} de ${MAX_LOOPS}`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://vip-manuseios.vercel.app",
          "X-Title": "VIP Manuseios - MANU",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: conversationMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro OpenRouter:", response.status, errorText);
        return jsonOk({ 
          error: `DEBUG: OpenRouter retornou ${response.status}`, 
          detail: errorText 
        });
      }

      const aiResponse = await response.json();
      const choice = aiResponse.choices?.[0];
      
      if (!choice) {
        return jsonOk({ error: "DEBUG: OpenRouter não retornou choices", raw: aiResponse });
      }

      const aiMessage = choice.message;
      conversationMessages.push(aiMessage);

      // Se a IA quer usar ferramentas
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        console.log(`Executando ${aiMessage.tool_calls.length} ferramentas`);

        for (const toolCall of aiMessage.tool_calls) {
          const toolName = toolCall.function.name;
          let toolArgs: any = {};
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch (_e) {
            toolArgs = {};
          }

          console.log(`Ferramenta: ${toolName}`, toolArgs);
          const result = await executeTool(toolName, toolArgs, supabase);
          console.log(`Resultado: ${toolName}`, result);

          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      // IA terminou - retorna a resposta
      console.log("IA finalizou processamento");
      return jsonOk({ message: aiMessage.content });
    }

    return jsonOk({ error: "Limite de iterações atingido" });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : null;
    console.error("ERRO FATAL:", errMsg);
    return jsonOk({ error: "DEBUG CATCH: " + errMsg, stack: errStack });
  }
});
