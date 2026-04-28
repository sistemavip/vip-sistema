export const DEFAULT_MATERIAL_VIP = `Equipe operacional interna para recebimento, organização, manuseio, higienização, armazenagem e controle de estoque 24 horas por dia, 7 dias por semana
Até 01 rolo de plástico bolha de 100 metros para proteção de materiais
Até 01 rolo de fita adesiva e 01 rolo de fita gomada
Até 5 caixas de papelão reutilizável
Etiquetas para identificação dos materiais`

export const DEFAULT_NORMAS = `A contratação inclui quantidade de manuseio, período, descrição do serviço e prazos conforme acordados.
O orçamento poderá ser ajustado em caso de demandas extras ou não previstas.
O valor não será alterado caso o volume de materiais recebidos seja menor que o aprovado.
Não contemplado seguro para itens frágeis.
Recomendamos o envio de materiais com margem de perda.
A VIP Manuseios não se responsabiliza por atrasos no recebimento dos materiais e pode haver cobrança adicional devido ao impacto no planejamento.
Todo material deve vir acompanhado de NF ou declaração de remessa.
Não nos responsabilizamos por atrasos decorrentes de casos fortuitos ou força maior, incluindo, mas não se limitando a, pandemias, greves, falhas de sistema, falhas de internet, falta de luz, chuvas intensas, ventanias e desastres naturais.
Impostos referentes à emissão de NF de serviço e Danfe em São Paulo são aplicáveis.`

export const DEFAULT_VALORES = [
    { descricao: "Valor armazenagem mensal", valor: 0 },
    { descricao: "Valor frete (entrega e retirada) p/show", valor: 0 },
    { descricao: "Valor frete Retirada e entrega PSD", valor: 0 }
]

export const DEFAULT_POLITICA_CORREIOS = `A VIP Manuseios não se responsabiliza por atrasos, extravios ou danos causados pelos Correios ou transportadoras terceirizadas após a postagem.
Os prazos de entrega são estimados pelos Correios e estão sujeitos a alterações sem aviso prévio.
O código de rastreamento será fornecido assim que o objeto for postado.
Em caso de devolução por endereço incorreto ou destinatário ausente, o custo do reenvio será de responsabilidade do cliente.`
export const KITS = [
    {
        id: "kit-basico",
        name: "Kit Básico",
        description: "Manuseio simples de encarte",
        items: [
            {
                titulo: "Manuseio de Kit Básico",
                itens: [
                    "Recebimento dos materiais",
                    "Montagem do kit conforme instruções",
                    "Etiquetagem e identificação",
                    "Paletização e expedição"
                ],
                materialVip: DEFAULT_MATERIAL_VIP,
                materialCliente: ""
            }
        ]
    },
    {
        id: "kit-premium",
        name: "Kit Premium (Boas Vindas)",
        description: "Kit complexo com múltiplos itens",
        items: [
            {
                titulo: "Montagem de Kit Boas Vindas",
                itens: [
                    "Recebimento e conferência detalhada",
                    "Montagem de caixa personalizada",
                    "Inserção de brinde A",
                    "Inserção de carta de boas vindas",
                    "Fechamento com fita especial",
                    "Controle de qualidade unitário"
                ],
                materialVip: DEFAULT_MATERIAL_VIP + "\nFitilho especial\nPapel de seda",
                materialCliente: "Brindes\nCartas personalizadas\nCaixas especiais"
            }
        ]
    }
]
