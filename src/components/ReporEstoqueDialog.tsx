import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReporEstoqueDialogProps {
  product: any;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function ReporEstoqueDialog({ product, trigger, onSuccess }: ReporEstoqueDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantidade, setQuantidade] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantidade || '0');
    if (!qty || qty <= 0) return toast.error('Informe uma quantidade válida');

    setLoading(true);
    try {
      const novoEstoque = (product.estoque ?? 0) + qty;
      const { error } = await supabase
        .from('produtos')
        .update({ estoque: novoEstoque })
        .eq('id', product.id);

      if (error) throw error;
      toast.success(`Reposto com sucesso (+${qty})`);
      setOpen(false);
      setQuantidade("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao repor estoque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Repor Estoque — {product.nome}</DialogTitle>
          <DialogDescription className="sr-only">Informe a quantidade a repor</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade a adicionar</Label>
            <Input id="quantidade" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="0" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Atualizando...' : 'Confirmar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}