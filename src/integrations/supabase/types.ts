export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          anexos: Json | null
          cidade: string | null
          codigo: string
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          empresa: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anexos?: Json | null
          cidade?: string | null
          codigo: string
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anexos?: Json | null
          cidade?: string | null
          codigo?: string
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          singleton_key: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          singleton_key?: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          singleton_key?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          valor_inicial: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          valor_inicial?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          valor_inicial?: number | null
        }
        Relationships: []
      }
      custos: {
        Row: {
          created_at: string
          descricao: string
          id: string
          insumo: string
          orcamento_id: string | null
          quantidade: number | null
          updated_at: string
          valor_com_imposto: number | null
          valor_com_lucro: number | null
          valor_real: number
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          insumo?: string
          orcamento_id?: string | null
          quantidade?: number | null
          updated_at?: string
          valor_com_imposto?: number | null
          valor_com_lucro?: number | null
          valor_real: number
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          insumo?: string
          orcamento_id?: string | null
          quantidade?: number | null
          updated_at?: string
          valor_com_imposto?: number | null
          valor_com_lucro?: number | null
          valor_real?: number
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      envios: {
        Row: {
          altura: number | null
          cep_destino: string | null
          cep_origem: string | null
          cliente_id: string | null
          codigo_rastreio: string | null
          created_at: string | null
          data_entrega: string | null
          data_postagem: string | null
          destinatario_bairro: string | null
          destinatario_cidade: string | null
          destinatario_complemento: string | null
          destinatario_endereco: string | null
          destinatario_estado: string | null
          destinatario_nome: string
          destinatario_numero: string | null
          destinatario_telefone: string | null
          forma_envio: string | null
          id: string
          largura: number | null
          modalidade_envio: string | null
          numero_orcamento: string | null
          observacoes: string | null
          ordem_servico_id: string | null
          peso: number | null
          prazo_entrega: number | null
          profundidade: number | null
          status: string | null
          updated_at: string | null
          valor_frete: number | null
        }
        Insert: {
          altura?: number | null
          cep_destino?: string | null
          cep_origem?: string | null
          cliente_id?: string | null
          codigo_rastreio?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_postagem?: string | null
          destinatario_bairro?: string | null
          destinatario_cidade?: string | null
          destinatario_complemento?: string | null
          destinatario_endereco?: string | null
          destinatario_estado?: string | null
          destinatario_nome: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          forma_envio?: string | null
          id?: string
          largura?: number | null
          modalidade_envio?: string | null
          numero_orcamento?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          peso?: number | null
          prazo_entrega?: number | null
          profundidade?: number | null
          status?: string | null
          updated_at?: string | null
          valor_frete?: number | null
        }
        Update: {
          altura?: number | null
          cep_destino?: string | null
          cep_origem?: string | null
          cliente_id?: string | null
          codigo_rastreio?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_postagem?: string | null
          destinatario_bairro?: string | null
          destinatario_cidade?: string | null
          destinatario_complemento?: string | null
          destinatario_endereco?: string | null
          destinatario_estado?: string | null
          destinatario_nome?: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          forma_envio?: string | null
          id?: string
          largura?: number | null
          modalidade_envio?: string | null
          numero_orcamento?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          peso?: number | null
          prazo_entrega?: number | null
          profundidade?: number | null
          status?: string | null
          updated_at?: string | null
          valor_frete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_cliente: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_entrada: string | null
          data_saida: string | null
          destino_saida: string | null
          foto_url: string | null
          id: string
          item_descricao: string
          observacoes: string | null
          orcamento_id: string | null
          quantidade_entrada: number | null
          quantidade_saida: number | null
          saldo: number | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          destino_saida?: string | null
          foto_url?: string | null
          id?: string
          item_descricao: string
          observacoes?: string | null
          orcamento_id?: string | null
          quantidade_entrada?: number | null
          quantidade_saida?: number | null
          saldo?: number | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          destino_saida?: string | null
          foto_url?: string | null
          id?: string
          item_descricao?: string
          observacoes?: string | null
          orcamento_id?: string | null
          quantidade_entrada?: number | null
          quantidade_saida?: number | null
          saldo?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_cliente_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_recebidos: {
        Row: {
          conferido: boolean | null
          created_at: string | null
          data_recebimento: string | null
          fornecedor: string | null
          id: string
          item_descricao: string
          nota_fiscal: string | null
          observacoes: string | null
          ordem_servico_id: string | null
          quantidade_recebida: number | null
          quantidade_utilizada: number | null
          tipo_embalagem: string | null
          updated_at: string | null
        }
        Insert: {
          conferido?: boolean | null
          created_at?: string | null
          data_recebimento?: string | null
          fornecedor?: string | null
          id?: string
          item_descricao: string
          nota_fiscal?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          quantidade_recebida?: number | null
          quantidade_utilizada?: number | null
          tipo_embalagem?: string | null
          updated_at?: string | null
        }
        Update: {
          conferido?: boolean | null
          created_at?: string | null
          data_recebimento?: string | null
          fornecedor?: string | null
          id?: string
          item_descricao?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          quantidade_recebida?: number | null
          quantidade_utilizada?: number | null
          tipo_embalagem?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_recebidos_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_orcamento: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          template_conteudo: Json | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"]
          updated_at: string | null
          valor_base: number | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          template_conteudo?: Json | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"]
          updated_at?: string | null
          valor_base?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          template_conteudo?: Json | null
          tipo_servico?: Database["public"]["Enums"]["tipo_servico"]
          updated_at?: string | null
          valor_base?: number | null
        }
        Relationships: []
      }
      movimentacoes_financeiras: {
        Row: {
          conta_id: string | null
          created_at: string | null
          data: string
          descricao_os: string | null
          id: string
          item: string | null
          job: string | null
          nota_recibo: string | null
          tipo: string
          valor: number
        }
        Insert: {
          conta_id?: string | null
          created_at?: string | null
          data: string
          descricao_os?: string | null
          id?: string
          item?: string | null
          job?: string | null
          nota_recibo?: string | null
          tipo: string
          valor?: number
        }
        Update: {
          conta_id?: string | null
          created_at?: string | null
          data?: string
          descricao_os?: string | null
          id?: string
          item?: string | null
          job?: string | null
          nota_recibo?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_financeiras_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          data_pagamento: string | null
          descricao: string | null
          id: string
          numero_nf: string
          observacao: string | null
          responsavel: string | null
          status: string | null
          tipo: string | null
          valor: number | null
          valor_imposto_pct: number | null
          vencimento: string | null
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          numero_nf: string
          observacao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
          valor?: number | null
          valor_imposto_pct?: number | null
          vencimento?: string | null
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          numero_nf?: string
          observacao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
          valor?: number | null
          valor_imposto_pct?: number | null
          vencimento?: string | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          codigo_cliente: string | null
          condicoes_frete: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          endereco_entrega: string | null
          escopo_servico: Json | null
          forma_pagamento: string | null
          horario_recebimento: string | null
          id: string
          itens: Json | null
          local_servico: string | null
          material_cliente: Json | null
          material_vip: Json | null
          normas_gerais: string | null
          numero_sequencial: number
          observacoes: string | null
          politica_correios: string | null
          prazo_execucao: string | null
          quantidade_envios: string | null
          status: string | null
          updated_at: string | null
          validade_orcamento: number | null
          valor_total: number | null
          valores_detalhados: Json | null
        }
        Insert: {
          cliente_id?: string | null
          codigo_cliente?: string | null
          condicoes_frete?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          endereco_entrega?: string | null
          escopo_servico?: Json | null
          forma_pagamento?: string | null
          horario_recebimento?: string | null
          id?: string
          itens?: Json | null
          local_servico?: string | null
          material_cliente?: Json | null
          material_vip?: Json | null
          normas_gerais?: string | null
          numero_sequencial?: number
          observacoes?: string | null
          politica_correios?: string | null
          prazo_execucao?: string | null
          quantidade_envios?: string | null
          status?: string | null
          updated_at?: string | null
          validade_orcamento?: number | null
          valor_total?: number | null
          valores_detalhados?: Json | null
        }
        Update: {
          cliente_id?: string | null
          codigo_cliente?: string | null
          condicoes_frete?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          endereco_entrega?: string | null
          escopo_servico?: Json | null
          forma_pagamento?: string | null
          horario_recebimento?: string | null
          id?: string
          itens?: Json | null
          local_servico?: string | null
          material_cliente?: Json | null
          material_vip?: Json | null
          normas_gerais?: string | null
          numero_sequencial?: number
          observacoes?: string | null
          politica_correios?: string | null
          prazo_execucao?: string | null
          quantidade_envios?: string | null
          status?: string | null
          updated_at?: string | null
          validade_orcamento?: number | null
          valor_total?: number | null
          valores_detalhados?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_email_vinculo: string | null
          cliente_id: string | null
          created_at: string | null
          data_execucao: string | null
          data_revisao: string | null
          data_solicitacao: string | null
          descricao_servico: string | null
          etapa_producao: number | null
          id: string
          local_servico: string | null
          material_fornecido: Json | null
          motivo_revisao: string | null
          numero_os: string
          observacoes: string | null
          quantidade: number | null
          status: Database["public"]["Enums"]["status_os"] | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"]
          updated_at: string | null
          valor_servico: number | null
          versao: number | null
          versao_anterior_id: string | null
        }
        Insert: {
          cliente_email_vinculo?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_execucao?: string | null
          data_revisao?: string | null
          data_solicitacao?: string | null
          descricao_servico?: string | null
          etapa_producao?: number | null
          id?: string
          local_servico?: string | null
          material_fornecido?: Json | null
          motivo_revisao?: string | null
          numero_os: string
          observacoes?: string | null
          quantidade?: number | null
          status?: Database["public"]["Enums"]["status_os"] | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"]
          updated_at?: string | null
          valor_servico?: number | null
          versao?: number | null
          versao_anterior_id?: string | null
        }
        Update: {
          cliente_email_vinculo?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_execucao?: string | null
          data_revisao?: string | null
          data_solicitacao?: string | null
          descricao_servico?: string | null
          etapa_producao?: number | null
          id?: string
          local_servico?: string | null
          material_fornecido?: Json | null
          motivo_revisao?: string | null
          numero_os?: string
          observacoes?: string | null
          quantidade?: number | null
          status?: Database["public"]["Enums"]["status_os"] | null
          tipo_servico?: Database["public"]["Enums"]["tipo_servico"]
          updated_at?: string | null
          valor_servico?: number | null
          versao?: number | null
          versao_anterior_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string
          codigo: string
          created_at: string | null
          descricao: string | null
          estoque: number
          estoque_min: number
          foto_url: string | null
          id: string
          imagem: string | null
          nome: string
          preco: number
          updated_at: string | null
          vendidos: number | null
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string | null
          descricao?: string | null
          estoque?: number
          estoque_min?: number
          foto_url?: string | null
          id?: string
          imagem?: string | null
          nome: string
          preco: number
          updated_at?: string | null
          vendidos?: number | null
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          estoque?: number
          estoque_min?: number
          foto_url?: string | null
          id?: string
          imagem?: string | null
          nome?: string
          preco?: number
          updated_at?: string | null
          vendidos?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provisoes_pagamento: {
        Row: {
          created_at: string | null
          data: string | null
          data_pagamento: string | null
          descricao: string
          id: string
          item: string | null
          job: string | null
          mes_referencia: string | null
          pago: boolean | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          data_pagamento?: string | null
          descricao: string
          id?: string
          item?: string | null
          job?: string | null
          mes_referencia?: string | null
          pago?: boolean | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          data_pagamento?: string | null
          descricao?: string
          id?: string
          item?: string | null
          job?: string | null
          mes_referencia?: string | null
          pago?: boolean | null
          valor?: number | null
        }
        Relationships: []
      }
      provisoes_recebimento: {
        Row: {
          created_at: string | null
          data: string | null
          data_recebimento: string | null
          id: string
          item: string | null
          mes_referencia: string | null
          nome: string
          nota: string | null
          pago: boolean | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          data_recebimento?: string | null
          id?: string
          item?: string | null
          mes_referencia?: string | null
          nome: string
          nota?: string | null
          pago?: boolean | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          data_recebimento?: string | null
          id?: string
          item?: string | null
          mes_referencia?: string | null
          nome?: string
          nota?: string | null
          pago?: boolean | null
          valor?: number | null
        }
        Relationships: []
      }
      secoes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      security_rules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          rule_type: string
          severity: string | null
          threshold_value: number | null
          time_end: string | null
          time_start: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          rule_type: string
          severity?: string | null
          threshold_value?: number | null
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          rule_type?: string
          severity?: string | null
          threshold_value?: number | null
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_cliente_codigo: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      status_os:
        | "orcamento"
        | "aprovado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
        | "coletado"
      tipo_servico:
        | "chapelaria"
        | "manuseio"
        | "armazenamento"
        | "envio"
        | "montagem_kits"
        | "confeccao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      status_os: [
        "orcamento",
        "aprovado",
        "em_andamento",
        "concluido",
        "cancelado",
        "coletado",
      ],
      tipo_servico: [
        "chapelaria",
        "manuseio",
        "armazenamento",
        "envio",
        "montagem_kits",
        "confeccao",
      ],
    },
  },
} as const
