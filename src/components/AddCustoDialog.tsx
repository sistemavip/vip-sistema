import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface AddCustoDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddCustoDialog({ trigger, onSuccess }: AddCustoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    orcamento_id: "",
    insumo: "",
    descricao: "",
    quantidade: "1",
    valor_unitario: ""
  })

  useEffect(() => {
    if (open) {
      loadOrcamentos()
    }
  }, [open])

  const loadOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, numero_sequencial, codigo_cliente')
        .order('numero_sequencial', { ascending: false })
      
      if (error) throw error
      setOrcamentos(data || [])
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('custos')
        .insert({
          orcamento_id: formData.orcamento_id || null,
          insumo: formData.insumo,
          descricao: formData.descricao,
          quantidade: parseFloat(formData.quantidade),
          valor_real: parseFloat(formData.valor_unitario)
        })

      if (error) throw error

      toast.success("Custo registrado com sucesso!")
      setOpen(false)
      setFormData({
        orcamento_id: "",
        insumo: "",
        descricao: "",
        quantidade: "1",
        valor_unitario: ""
      })
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao registrar custo:', error)
      toast.error("Erro ao registrar custo")
    } finally {
      setLoading(false)
    }
  }

  const valorComImposto = formData.valor_unitario ? (parseFloat(formData.valor_unitario) * 1.15).toFixed(2) : "0.00"
  const valorComLucro = formData.valor_unitario ? (parseFloat(formData.valor_unitario) * 1.15 * 1.40).toFixed(2) : "0.00"
  const valorTotal = formData.valor_unitario && formData.quantidade ? 
    (parseFloat(formData.valor_unitario) * 1.15 * 1.40 * parseFloat(formData.quantidade)).toFixed(2) : "0.00"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Custo</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Novo Custo</DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados do custo</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orcamento_id">Orçamento (Opcional)</Label>
          <Select value={formData.orcamento_id || "none"} onValueChange={(value) => setFormData({...formData, orcamento_id: value === "none" ? "" : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um orçamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {orcamentos.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    OS-{String(o.numero_sequencial).padStart(3, '0')} - {o.codigo_cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="insumo">Insumo/Material *</Label>
            <Input
              id="insumo"
              placeholder="Ex: Tecido, Linha, Mão de obra..."
              value={formData.insumo}
              onChange={(e) => setFormData({...formData, insumo: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              placeholder="Detalhes do custo..."
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1"
                value={formData.quantidade}
                onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
              <Input
                id="valor_unitario"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.valor_unitario}
                onChange={(e) => setFormData({...formData, valor_unitario: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Cálculo Automático */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <p className="text-sm font-medium">Cálculo Automático:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Com Impostos (+15%):</span>
                <p className="font-medium">R$ {valorComImposto}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Com Lucro (+40%):</span>
                <p className="font-medium">R$ {valorComLucro}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground">Total (Qtd × Valor com Lucro):</span>
              <p className="font-bold text-primary text-base">R$ {valorTotal}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Registrar Custo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
