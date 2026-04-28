import { useState } from "react";
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

interface AddMovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contaId: string;
  onSuccess: () => void;
}

const ITENS_MOVIMENTACAO = [
  'PIX',
  'TED',
  'Transferência',
  'Depósito',
  'Boleto',
  'Cartão',
  'Dinheiro',
  'Cheque',
  'Outro',
];

export function AddMovimentacaoDialog({
  open,
  onOpenChange,
  contaId,
  onSuccess,
}: AddMovimentacaoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: '',
    descricao_os: '',
    item: '',
    job: '',
    nota_recibo: '',
  });

  const handleSubmit = async () => {
    if (!contaId) {
      toast.error("Selecione uma conta primeiro");
      return;
    }

    if (!formData.data || !formData.valor) {
      toast.error("Preencha a data e o valor");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('movimentacoes_financeiras')
      .insert({
        conta_id: contaId,
        data: formData.data,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao_os: formData.descricao_os || null,
        item: formData.item || null,
        job: formData.job || null,
        nota_recibo: formData.nota_recibo || null,
      });

    setLoading(false);

    if (error) {
      toast.error("Erro ao adicionar movimentação");
      return;
    }

    toast.success("Movimentação adicionada com sucesso");
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipo: 'entrada',
      valor: '',
      descricao_os: '',
      item: '',
      job: '',
      nota_recibo: '',
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Movimentação</DialogTitle>
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
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'entrada' | 'saida') => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  {ITENS_MOVIMENTACAO.map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição / OS</Label>
            <Input
              placeholder="Descrição ou número da OS"
              value={formData.descricao_os}
              onChange={(e) => setFormData({ ...formData, descricao_os: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job</Label>
              <Input
                placeholder="Referência do job"
                value={formData.job}
                onChange={(e) => setFormData({ ...formData, job: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota / Recibo</Label>
              <Input
                placeholder="Número da nota"
                value={formData.nota_recibo}
                onChange={(e) => setFormData({ ...formData, nota_recibo: e.target.value })}
              />
            </div>
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
