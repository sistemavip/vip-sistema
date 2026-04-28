import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddProvisaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'pagamento' | 'recebimento';
  mesReferencia: string;
  onSuccess: () => void;
}

const ITENS_PROVISAO = [
  'Salário',
  'Fornecedor',
  'Imposto',
  'Aluguel',
  'Serviço',
  'Comissão',
  'Frete',
  'Outro',
];

const DESCRICOES_PAGAMENTO = [
  'HUGO RICARDO',
  'ANA CAROLINA',
  'F5',
  'AQV',
  'CORREIOS',
  'IMPOSTOS (DAS)',
  'Outro',
];

export function AddProvisaoDialog({
  open,
  onOpenChange,
  tipo,
  mesReferencia,
  onSuccess,
}: AddProvisaoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: '',
    item: '',
    descricao: '',
    nome: '',
    valor: '',
    job: '',
    nota: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        data: '',
        item: '',
        descricao: '',
        nome: '',
        valor: '',
        job: '',
        nota: '',
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (tipo === 'pagamento' && !formData.descricao) {
      toast.error("Preencha a descrição");
      return;
    }

    if (tipo === 'recebimento' && !formData.nome) {
      toast.error("Preencha o nome");
      return;
    }

    setLoading(true);

    if (tipo === 'pagamento') {
      const { error } = await supabase
        .from('provisoes_pagamento')
        .insert({
          data: formData.data || null,
          item: formData.item || null,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor) || 0,
          job: formData.job || null,
          mes_referencia: mesReferencia,
        });

      setLoading(false);

      if (error) {
        toast.error("Erro ao adicionar provisão de pagamento");
        return;
      }
    } else {
      const { error } = await supabase
        .from('provisoes_recebimento')
        .insert({
          data: formData.data || null,
          item: formData.item || null,
          nome: formData.nome,
          valor: parseFloat(formData.valor) || 0,
          nota: formData.nota || null,
          mes_referencia: mesReferencia,
        });

      setLoading(false);

      if (error) {
        toast.error("Erro ao adicionar provisão de recebimento");
        return;
      }
    }

    toast.success("Provisão adicionada com sucesso");
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipo === 'pagamento' ? 'Adicionar Provisão de Pagamento' : 'Adicionar Provisão de Recebimento'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              <Select
                value={formData.item}
                onValueChange={(value) => setFormData({ ...formData, item: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ITENS_PROVISAO.map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tipo === 'pagamento' ? (
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Select
                value={formData.descricao}
                onValueChange={(value) => setFormData({ ...formData, descricao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a descrição" />
                </SelectTrigger>
                <SelectContent>
                  {DESCRICOES_PAGAMENTO.map(desc => (
                    <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.descricao === 'Outro' && (
                <Input
                  placeholder="Digite a descrição"
                  className="mt-2"
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome do cliente/pagador"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>
            {tipo === 'pagamento' ? (
              <div className="space-y-2">
                <Label>Job</Label>
                <Input
                  placeholder="Referência do job"
                  value={formData.job}
                  onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Nota</Label>
                <Input
                  placeholder="Número da nota"
                  value={formData.nota}
                  onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
