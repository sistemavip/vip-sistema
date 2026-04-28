import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface EstoqueSaidaDialogProps {
  item: any
  onSuccess?: () => void
}

export function EstoqueSaidaDialog({ item, onSuccess }: EstoqueSaidaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    quantidade_saida: "",
    data_saida: new Date().toISOString().split('T')[0],
    destino_saida: "",
    observacoes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const quantidadeSaida = parseFloat(formData.quantidade_saida)
    const saldoAtual = item.saldo || 0

    if (quantidadeSaida > saldoAtual) {
      toast.error(`Quantidade insuficiente! Saldo disponível: ${saldoAtual}`)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('estoque_cliente')
        .update({
          quantidade_saida: (item.quantidade_saida || 0) + quantidadeSaida,
          data_saida: formData.data_saida,
          destino_saida: formData.destino_saida,
          observacoes: formData.observacoes || item.observacoes
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success("Saída registrada com sucesso!")
      setOpen(false)
      setFormData({
        quantidade_saida: "",
        data_saida: new Date().toISOString().split('T')[0],
        destino_saida: "",
        observacoes: ""
      })
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao registrar saída:', error)
      toast.error("Erro ao registrar saída")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Registrar Saída
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Saída de Estoque</DialogTitle>
          <DialogDescription className="sr-only">Registrar saída de material do estoque do cliente</DialogDescription>
        </DialogHeader>
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{item.item_descricao}</p>
          <p className="text-xs text-muted-foreground mt-1">Saldo disponível: {item.saldo} unidades</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade_saida">Quantidade de Saída *</Label>
            <Input
              id="quantidade_saida"
              type="number"
              step="0.01"
              min="0.01"
              max={item.saldo}
              placeholder="0"
              value={formData.quantidade_saida}
              onChange={(e) => setFormData({...formData, quantidade_saida: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_saida">Data de Saída *</Label>
            <Input
              id="data_saida"
              type="date"
              value={formData.data_saida}
              onChange={(e) => setFormData({...formData, data_saida: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destino_saida">Destino *</Label>
            <Input
              id="destino_saida"
              placeholder="Ex: Evento X, Cliente Y, Entrega Z..."
              value={formData.destino_saida}
              onChange={(e) => setFormData({...formData, destino_saida: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Saída"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
