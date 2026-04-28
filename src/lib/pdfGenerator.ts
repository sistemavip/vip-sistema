import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadImageAsBase64 } from './logoBase64';
import vipLogo from '@/assets/vip-logo.png';
import { supabase } from '@/integrations/supabase/client';

interface EscopoItem {
  titulo: string;
  itens: string[];
  material_vip?: string;
  material_cliente?: string;
}

interface ValorItem {
  descricao: string;
  valor: number;
}

interface OrcamentoData {
  numero_sequencial: number;
  cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    empresa?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cpf_cnpj?: string;
  };
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  local_servico?: string;
  escopo_servico?: EscopoItem[];
  material_vip?: string[];
  material_cliente?: string[] | string;
  valores_detalhados?: ValorItem[];
  valor_total: number;
  endereco_entrega?: string;
  horario_recebimento?: string;
  condicoes_frete?: string;
  forma_pagamento?: string;
  normas_gerais?: string;
  prazo_execucao?: string;
  validade_orcamento?: number;
  status: string;
  observacoes?: string;
  politica_correios?: string;
  created_at: string;
  itens?: Array<{
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
}

interface CompanySettings {
  company_name?: string | null;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  cep?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

const DEFAULT_COMPANY_SETTINGS: Required<CompanySettings> = {
  company_name: 'VIP Manuseios Ltda',
  cnpj: '12.345.678/0001-90',
  email: 'contato@vipmanuseios.com.br',
  phone: '(11) 99999-0000',
  cep: '01310-100',
  address: 'Av. Paulista, 1000',
  city: 'São Paulo',
  state: 'SP',
  country: 'Brasil',
};

const loadCompanySettings = async (): Promise<Required<CompanySettings>> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('singleton_key', 'default')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return DEFAULT_COMPANY_SETTINGS;
    }

    return {
      company_name: data.company_name || DEFAULT_COMPANY_SETTINGS.company_name,
      cnpj: data.cnpj || DEFAULT_COMPANY_SETTINGS.cnpj,
      email: data.email || DEFAULT_COMPANY_SETTINGS.email,
      phone: data.phone || DEFAULT_COMPANY_SETTINGS.phone,
      cep: data.cep || DEFAULT_COMPANY_SETTINGS.cep,
      address: data.address || DEFAULT_COMPANY_SETTINGS.address,
      city: data.city || DEFAULT_COMPANY_SETTINGS.city,
      state: data.state || DEFAULT_COMPANY_SETTINGS.state,
      country: data.country || DEFAULT_COMPANY_SETTINGS.country,
    };
  } catch (error) {
    console.error('Erro ao carregar configurações da empresa para o PDF:', error);
    return DEFAULT_COMPANY_SETTINGS;
  }
};

export const generateOrcamentoPDF = async (orcamento: OrcamentoData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  const headerHeight = 35;
  const headerContentStart = 45;
  const tableMargin = { left: margin, right: margin, top: headerContentStart, bottom: 25 };

  // Cores
  const primaryColor: [number, number, number] = [251, 191, 36]; // VIP Gold
  const textColor: [number, number, number] = [51, 51, 51];
  const borderColor: [number, number, number] = [200, 200, 200];

  let yPos = margin;
  let logoBase64: string | null = null;
  const companySettings = await loadCompanySettings();

  // Carregar logo
  try {
    logoBase64 = await loadImageAsBase64(vipLogo);
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
  }

  const addHeader = () => {
    const logoBoxWidth = 55;

    // Fundo branco para todo o header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Borda inferior do header
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(0, headerHeight, pageWidth, headerHeight);

    // Adicionar logo (por cima do fundo branco)
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 5, 3, 45, 28);
    } else {
      // Fallback: texto estilizado
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('VIP', margin, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('MANUSEIOS', margin, 22);
      doc.setFontSize(7);
      doc.text('#SejaVIP', margin, 28);
    }

    // Informações de contato à direita
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const rightX = pageWidth - margin;
    doc.text('Ana Carolina Faria', rightX, 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(companySettings.email, rightX, 16, { align: 'right' });
    doc.text(companySettings.phone, rightX, 22, { align: 'right' });
    doc.text('www.vipmanuseios.com.br', rightX, 28, { align: 'right' });

    return headerContentStart;
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 15;

    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    const companyLine = `${companySettings.company_name} | CNPJ: ${companySettings.cnpj}`;
    const addressLine = `${companySettings.address} - ${companySettings.city}/${companySettings.state} - CEP: ${companySettings.cep}`;
    doc.text(companyLine, margin, footerY);
    doc.text(addressLine, margin, footerY + 4);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // ===== CABEÇALHO =====
  yPos = addHeader();

  // Data e Número da OS
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${new Date(orcamento.created_at).toLocaleDateString('pt-BR')}`, margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`OS#${String(orcamento.numero_sequencial).padStart(3, '0')}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  // Linha separadora
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ===== INFORMAÇÕES DO CONTATO (A/C) =====
  const contatoInfo = [];
  contatoInfo.push(['A/C:', orcamento.contato_nome || orcamento.cliente.nome]);

  if (orcamento.cliente.empresa) {
    contatoInfo.push(['Nome da Empresa:', orcamento.cliente.empresa]);
  }

  if (orcamento.contato_telefone || orcamento.cliente.telefone) {
    contatoInfo.push(['Telefone:', orcamento.contato_telefone || orcamento.cliente.telefone || '']);
  }

  if (orcamento.local_servico) {
    contatoInfo.push(['Local:', orcamento.local_servico]);
  }

  autoTable(doc, {
    startY: yPos,
    body: contatoInfo,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold', textColor: textColor },
      1: { cellWidth: 'auto', textColor: textColor }
    },
    styles: {
      fontSize: 9,
      cellPadding: 1,
    },
    margin: tableMargin
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ===== TABELA PRINCIPAL DE DUAS COLUNAS =====
  const tableRows: string[][] = [];
  const labelWidth = 55;

  // Escopo do serviço e Materiais
  if (orcamento.escopo_servico && orcamento.escopo_servico.length > 0) {
    orcamento.escopo_servico.forEach((escopo, index) => {
      let escopoContent = '';
      if (escopo.titulo) {
        escopoContent += `${escopo.titulo.toUpperCase()}\n`;

        // Itens do escopo
        if (escopo.itens && escopo.itens.length > 0) {
          escopo.itens.forEach(item => {
            if (item) {
              const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
              if (cleanItem) {
                escopoContent += `${cleanItem}\n`;
              }
            }
          });
        }

        // Materiais do escopo (VIP)
        if (escopo.material_vip && escopo.material_vip.trim()) {
          const indentedMaterial = escopo.material_vip
            .split('\n')
            .map(line => `     ${line}`)
            .join('\n');
          escopoContent += `\nMaterial VIP:\n${indentedMaterial}\n`;
        }

        // Materiais do escopo (Cliente)
        if (escopo.material_cliente && escopo.material_cliente.trim()) {
          const indentedMaterial = escopo.material_cliente
            .split('\n')
            .map(line => `     ${line}`)
            .join('\n');
          escopoContent += `\nMaterial Cliente:\n${indentedMaterial}\n`;
        }

        tableRows.push([index === 0 ? 'Escopo do serviço:' : '', escopoContent.trim()]);
      }
    });

    // Adiciona uma linha em branco ou espaçamento extra após todos os escopos se necessário
    // mas a própria divisão em linhas do autoTable já fornece a separação visual.
  }

  // Seções globais de materiais removidas (legado já migrado na edição)

  // Valores detalhados
  if (orcamento.valores_detalhados && orcamento.valores_detalhados.length > 0 && orcamento.valores_detalhados.some(v => v.descricao)) {
    orcamento.valores_detalhados.forEach(v => {
      if (v.descricao) {
        tableRows.push([v.descricao + ':', `R$ ${v.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
      }
    });
  } else if (orcamento.itens && orcamento.itens.length > 0) {
    orcamento.itens.forEach(item => {
      tableRows.push([item.descricao + ':', `R$ ${item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
    });
  }

  // Valor Total
  tableRows.push(['VALOR TOTAL:', `R$ ${orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);

  // Endereço para entrega
  if (orcamento.endereco_entrega) {
    let enderecoContent = orcamento.endereco_entrega;
    if (orcamento.horario_recebimento) {
      enderecoContent += `\nHorário: ${orcamento.horario_recebimento}`;
    }
    tableRows.push(['Endereço para entrega:', enderecoContent]);
  }

  // Condições de frete e operação
  if (orcamento.condicoes_frete) {
    tableRows.push(['Condições de frete e operação:', orcamento.condicoes_frete]);
  }

  // Forma de pagamento
  if (orcamento.forma_pagamento) {
    tableRows.push(['Forma de pagamento:', orcamento.forma_pagamento]);
  }

  // Prazo para execução
  if (orcamento.prazo_execucao) {
    tableRows.push(['Prazo para execução:', orcamento.prazo_execucao]);
  }

  // Termos e condições
  tableRows.push(['Termos e condições da O.S:', `Este orçamento é válido por ${orcamento.validade_orcamento || 3} dias`]);

  // Renderizar tabela principal
  autoTable(doc, {
    startY: yPos,
    body: tableRows,
    theme: 'grid',
    columnStyles: {
      0: {
        cellWidth: labelWidth,
        fontStyle: 'bold',
        valign: 'top',
        textColor: textColor,
        fillColor: [248, 248, 248]
      },
      1: {
        cellWidth: contentWidth - labelWidth,
        valign: 'top',
        textColor: textColor
      }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [0, 0, 0]
    },
    didParseCell: function (data) {
      // Destacar linha do valor total
      if (data.row.index >= 0 && data.row.raw && Array.isArray(data.row.raw)) {
        const firstCell = data.row.raw[0];
        if (firstCell === 'VALOR TOTAL:') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [251, 191, 36];
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    },
    margin: tableMargin
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===== NORMAS GERAIS (seção especial com bordas) =====
  if (orcamento.normas_gerais) {
    // Verificar se precisa de nova página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = addHeader();
    }

    autoTable(doc, {
      startY: yPos,
      head: [['NORMAS GERAIS']],
      body: [[orcamento.normas_gerais]],
      theme: 'grid',
      headStyles: {
        fillColor: [248, 248, 248],
        textColor: textColor,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      styles: {
        cellPadding: 5,
        lineColor: borderColor,
        lineWidth: 0.3
      },
      margin: tableMargin
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== OBSERVAÇÕES =====
  if (orcamento.observacoes) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = addHeader();
    }

    autoTable(doc, {
      startY: yPos,
      head: [['OBSERVAÇÕES']],
      body: [[orcamento.observacoes]],
      theme: 'grid',
      headStyles: {
        fillColor: [248, 248, 248],
        textColor: textColor,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      styles: {
        cellPadding: 5,
        lineColor: borderColor,
        lineWidth: 0.3
      },
      margin: tableMargin
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ===== POLÍTICA DOS CORREIOS =====
  if (orcamento.politica_correios) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = addHeader();
    }

    autoTable(doc, {
      startY: yPos,
      head: [['POLÍTICA DOS CORREIOS']],
      body: [[orcamento.politica_correios]],
      theme: 'grid',
      headStyles: {
        fillColor: [248, 248, 248],
        textColor: textColor,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      styles: {
        cellPadding: 5,
        lineColor: borderColor,
        lineWidth: 0.3
      },
      margin: tableMargin
    });
  }

  // Adicionar header e footer em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      addHeader(); // Header nas páginas adicionais (página 1 já tem)
    }
    addFooter(i, totalPages);
  }

  // Salvar PDF
  doc.save(`OS-${String(orcamento.numero_sequencial).padStart(3, '0')}.pdf`);
};
