import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"

interface EditPedidoDialogProps {
  pedido: any
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function EditPedidoDialog({ pedido, trigger, onSuccess }: EditPedidoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    tipo_servico: (pedido.tipo_servico || "confeccao") as "confeccao" | "armazenamento" | "chapelaria" | "envio" | "manuseio" | "montagem_kits",
    descricao_servico: pedido.descricao_servico || "",
    quantidade: pedido.quantidade || "",
    status: (pedido.status || "orcamento") as "orcamento" | "aprovado" | "em_andamento" | "concluido" | "cancelado" | "coletado",
    data_execucao: pedido.data_execucao || "",
    local_servico: pedido.local_servico || "",
    observacoes: pedido.observacoes || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({
          tipo_servico: formData.tipo_servico,
          descricao_servico: formData.descricao_servico,
          quantidade: parseInt(formData.quantidade),
          status: formData.status,
          data_execucao: formData.data_execucao || null,
          local_servico: formData.local_servico || null,
          observacoes: formData.observacoes || null
        })
        .eq('id', pedido.id)

      if (error) throw error

      toast.success("Pedido atualizado com sucesso!")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
      toast.error("Erro ao atualizar pedido")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .delete()
        .eq('id', pedido.id)

      if (error) throw error

      toast.success("Pedido apagado com sucesso!")
      setDeleteDialogOpen(false)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao apagar pedido:', error)
      toast.error("Erro ao apagar pedido")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
            <DialogDescription className="sr-only">Atualize os dados do pedido</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
              <Select value={formData.tipo_servico} onValueChange={(value: any) => setFormData({...formData, tipo_servico: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="confeccao">Confecção</SelectItem>
                <SelectItem value="armazenamento">Armazenamento</SelectItem>
                <SelectItem value="chapelaria">Chapelaria</SelectItem>
                <SelectItem value="envio">Envio</SelectItem>
                <SelectItem value="manuseio">Manuseio</SelectItem>
                <SelectItem value="montagem_kits">Montagem de Kits</SelectItem>
              </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_servico">Descrição do Serviço *</Label>
              <Textarea
                id="descricao_servico"
                placeholder="Descreva o serviço..."
                value={formData.descricao_servico}
                onChange={(e) => setFormData({...formData, descricao_servico: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_execucao">Data de Execução</Label>
                <Input
                  id="data_execucao"
                  type="date"
                  value={formData.data_execucao}
                  onChange={(e) => setFormData({...formData, data_execucao: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="orcamento">Orçamento</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local_servico">Local do Serviço</Label>
              <Input
                id="local_servico"
                placeholder="Local onde será executado"
                value={formData.local_servico}
                onChange={(e) => setFormData({...formData, local_servico: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais..."
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Apagar Pedido
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-vip-primary hover:bg-vip-secondary text-black">
                  {loading ? "Salvando..." : "Salvar"}
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
        title="Apagar Pedido"
        description="Tem certeza que deseja apagar este pedido? Esta ação não pode ser desfeita."
      />
    </>
  )
}
