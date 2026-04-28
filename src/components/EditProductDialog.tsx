import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

interface EditProductDialogProps {
  product: any;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function EditProductDialog({ product, trigger, onSuccess }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: product.nome ?? "",
    categoria: product.categoria ?? "",
    descricao: product.descricao ?? "",
    preco: String(product.preco ?? ""),
    estoque_min: String(product.estoque_min ?? 5),
    foto_url: product.foto_url ?? null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    if (!formData.categoria.trim()) {
      toast.error('Categoria é obrigatória');
      return;
    }
    if (!formData.preco || parseFloat(formData.preco) <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }
    if (!formData.estoque_min || parseInt(formData.estoque_min) < 0) {
      toast.error('Estoque mínimo não pode ser negativo');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .update({
          nome: formData.nome.trim(),
          categoria: formData.categoria.trim(),
          descricao: formData.descricao?.trim() || null,
          preco: parseFloat(formData.preco),
          estoque_min: parseInt(formData.estoque_min),
          foto_url: formData.foto_url,
        })
        .eq('id', product.id);

      if (error) throw error;
      toast.success('Produto atualizado com sucesso!');
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>Atualize as informações do produto no estoque</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome do Produto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Camiseta Básica"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-sm font-medium">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <Input
              id="categoria"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ex: Vestuário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            <ImageUpload
              value={formData.foto_url}
              onChange={(url) => setFormData({ ...formData, foto_url: url })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Adicione detalhes sobre o produto..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco" className="text-sm font-medium">
                Preço (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_min" className="text-sm font-medium">
                Estoque Mínimo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="estoque_min"
                type="number"
                min="0"
                value={formData.estoque_min}
                onChange={(e) => setFormData({ ...formData, estoque_min: e.target.value })}
                placeholder="5"
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}