import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { clientSchema } from "@/lib/validation";
import { z } from "zod";
import { formatCpfCnpj } from "@/lib/utils";

interface EditClientDialogProps {
  client: any;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function EditClientDialog({ client, trigger, onSuccess }: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: client.codigo || "",
    nome: client.nome || "",
    empresa: client.empresa || "",
    email: client.email || "",
    telefone: client.telefone || "",
    cpf_cnpj: client.cpf_cnpj ? formatCpfCnpj(client.cpf_cnpj) : "",
    endereco: client.endereco || "",
    cidade: client.cidade || "",
    estado: client.estado || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validar dados com Zod
      const validatedData = clientSchema.parse({
        codigo: formData.codigo,
        nome: formData.nome,
        empresa: formData.empresa || '',
        email: formData.email || '',
        telefone: formData.telefone || '',
        cpf_cnpj: formData.cpf_cnpj || '',
        endereco: formData.endereco || '',
        cidade: formData.cidade || '',
        estado: formData.estado || ''
      });

      const { error } = await supabase
        .from('clientes')
        .update({
          nome: validatedData.nome,
          empresa: validatedData.empresa || null,
          email: validatedData.email || null,
          telefone: validatedData.telefone || null,
          cpf_cnpj: validatedData.cpf_cnpj || null,
          endereco: validatedData.endereco || null,
          cidade: validatedData.cidade || null,
          estado: validatedData.estado || null
        })
        .eq('id', client.id);

      if (error) throw error;
      toast.success('Cliente atualizado!');
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        const firstError = err.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Erro ao atualizar cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', client.id);

      if (error) throw error;
      toast.success('Cliente removido com sucesso!');
      setDeleteDialogOpen(false);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Nome da empresa"
                    maxLength={150}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Apagar Cliente
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Tem certeza que deseja apagar este cliente?"
        description="Esta ação não pode ser desfeita. Todos os dados do cliente serão permanentemente removidos do sistema."
      />
    </>
  );
}
