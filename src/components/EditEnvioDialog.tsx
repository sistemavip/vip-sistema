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

interface EditEnvioDialogProps {
  envio: any
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function EditEnvioDialog({ envio, trigger, onSuccess }: EditEnvioDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    destinatario_nome: envio.destinatario_nome || "",
    destinatario_endereco: envio.destinatario_endereco || "",
    destinatario_numero: envio.destinatario_numero || "",
    destinatario_bairro: envio.destinatario_bairro || "",
    destinatario_cidade: envio.destinatario_cidade || "",
    destinatario_estado: envio.destinatario_estado || "",
    cep_destino: envio.cep_destino || "",
    destinatario_telefone: envio.destinatario_telefone || "",
    forma_envio: envio.forma_envio || "correios",
    peso: envio.peso || "",
    valor_frete: envio.valor_frete || "",
    codigo_rastreio: envio.codigo_rastreio || "",
    status: envio.status || "pendente",
    observacoes: envio.observacoes || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('envios')
        .update({
          destinatario_nome: formData.destinatario_nome,
          destinatario_endereco: formData.destinatario_endereco,
          destinatario_numero: formData.destinatario_numero,
          destinatario_bairro: formData.destinatario_bairro,
          destinatario_cidade: formData.destinatario_cidade,
          destinatario_estado: formData.destinatario_estado,
          cep_destino: formData.cep_destino,
          destinatario_telefone: formData.destinatario_telefone || null,
          forma_envio: formData.forma_envio,
          peso: parseFloat(formData.peso),
          valor_frete: parseFloat(formData.valor_frete),
          codigo_rastreio: formData.codigo_rastreio || null,
          status: formData.status,
          observacoes: formData.observacoes || null
        })
        .eq('id', envio.id)

      if (error) throw error

      toast.success("Envio atualizado com sucesso!")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao atualizar envio:', error)
      toast.error("Erro ao atualizar envio")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('envios')
        .delete()
        .eq('id', envio.id)

      if (error) throw error

      toast.success("Envio apagado com sucesso!")
      setDeleteDialogOpen(false)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao apagar envio:', error)
      toast.error("Erro ao apagar envio")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Envio</DialogTitle>
            <DialogDescription className="sr-only">Atualize os dados do envio</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destinatario_nome">Nome do Destinatário *</Label>
              <Input
                id="destinatario_nome"
                value={formData.destinatario_nome}
                onChange={(e) => setFormData({...formData, destinatario_nome: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="destinatario_endereco">Endereço *</Label>
                <Input
                  id="destinatario_endereco"
                  value={formData.destinatario_endereco}
                  onChange={(e) => setFormData({...formData, destinatario_endereco: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinatario_numero">Número *</Label>
                <Input
                  id="destinatario_numero"
                  value={formData.destinatario_numero}
                  onChange={(e) => setFormData({...formData, destinatario_numero: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destinatario_bairro">Bairro *</Label>
                <Input
                  id="destinatario_bairro"
                  value={formData.destinatario_bairro}
                  onChange={(e) => setFormData({...formData, destinatario_bairro: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep_destino">CEP *</Label>
                <Input
                  id="cep_destino"
                  value={formData.cep_destino}
                  onChange={(e) => setFormData({...formData, cep_destino: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destinatario_cidade">Cidade *</Label>
                <Input
                  id="destinatario_cidade"
                  value={formData.destinatario_cidade}
                  onChange={(e) => setFormData({...formData, destinatario_cidade: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinatario_estado">Estado *</Label>
                <Input
                  id="destinatario_estado"
                  maxLength={2}
                  value={formData.destinatario_estado}
                  onChange={(e) => setFormData({...formData, destinatario_estado: e.target.value.toUpperCase()})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinatario_telefone">Telefone</Label>
              <Input
                id="destinatario_telefone"
                value={formData.destinatario_telefone}
                onChange={(e) => setFormData({...formData, destinatario_telefone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_envio">Forma de Envio *</Label>
              <Select value={formData.forma_envio} onValueChange={(value) => setFormData({...formData, forma_envio: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correios">Correios</SelectItem>
                  <SelectItem value="jadlog">Jadlog</SelectItem>
                  <SelectItem value="total">Total Express</SelectItem>
                  <SelectItem value="loggi">Loggi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.peso}
                  onChange={(e) => setFormData({...formData, peso: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_frete">Valor Frete *</Label>
                <Input
                  id="valor_frete"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_frete}
                  onChange={(e) => setFormData({...formData, valor_frete: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_rastreio">Cód. Rastreio</Label>
                <Input
                  id="codigo_rastreio"
                  value={formData.codigo_rastreio}
                  onChange={(e) => setFormData({...formData, codigo_rastreio: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_transito">Em Trânsito</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
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
                Apagar Envio
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
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
        title="Apagar Envio"
        description="Tem certeza que deseja apagar este envio? Esta ação não pode ser desfeita."
      />
    </>
  )
}
