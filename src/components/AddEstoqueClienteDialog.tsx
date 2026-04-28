import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

import { ImageUpload } from "@/components/ImageUpload"

interface AddEstoqueClienteDialogProps {
  onSuccess?: () => void;
  defaultClienteId?: string;
}

export function AddEstoqueClienteDialog({ onSuccess, defaultClienteId }: AddEstoqueClienteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    cliente_id: defaultClienteId || "",
    orcamento_id: "",
    item_descricao: "",
    quantidade_entrada: "",
    data_entrada: new Date().toISOString().split('T')[0],
    foto_url: "",
    observacoes: ""
  })

  useEffect(() => {
    if (open) {
      loadClientes()
    }
  }, [open])

  useEffect(() => {
    if (formData.cliente_id) {
      loadOrcamentosPorCliente(formData.cliente_id)
    } else {
      setOrcamentos([])
    }
  }, [formData.cliente_id])

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, codigo, nome')
        .order('nome')
      
      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadOrcamentosPorCliente = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, numero_sequencial')
        .eq('cliente_id', clienteId)
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
        .from('estoque_cliente')
        .insert({
          cliente_id: formData.cliente_id,
          orcamento_id: formData.orcamento_id === "none" || !formData.orcamento_id ? null : formData.orcamento_id,
          item_descricao: formData.item_descricao,
          quantidade_entrada: parseFloat(formData.quantidade_entrada),
          data_entrada: formData.data_entrada,
          foto_url: formData.foto_url || null,
          observacoes: formData.observacoes || null
        })

      if (error) throw error

      toast.success("Item adicionado ao estoque do cliente!")
      setOpen(false)
      setFormData({
        cliente_id: "",
        orcamento_id: "",
        item_descricao: "",
        quantidade_entrada: "",
        data_entrada: new Date().toISOString().split('T')[0],
        foto_url: "",
        observacoes: ""
      })
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao adicionar item:', error)
      toast.error("Erro ao adicionar item ao estoque")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Package className="h-4 w-4" />
          Adicionar Item ao Estoque
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Item ao Estoque do Cliente</DialogTitle>
          <DialogDescription className="sr-only">Registrar entrada de material no estoque do cliente</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente_id">Cliente *</Label>
            <select 
              id="cliente_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.cliente_id} 
              onChange={(e) => {
                console.log("Mudando cliente para:", e.target.value);
                setFormData({...formData, cliente_id: e.target.value, orcamento_id: ""});
              }}
              required
            >
              <option value="">Selecione o cliente</option>
              {clientes && clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.nome}
                </option>
              ))}
            </select>
          </div>

          {formData.cliente_id && (
            <div className="space-y-2">
              <Label htmlFor="orcamento_id">Orçamento (Opcional)</Label>
              <select 
                id="orcamento_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.orcamento_id} 
                onChange={(e) => setFormData({...formData, orcamento_id: e.target.value})}
              >
                <option value="none">Nenhum</option>
                {orcamentos && orcamentos.map(o => (
                  <option key={o.id} value={o.id}>
                    OS-{String(o.numero_sequencial || 0).padStart(3, '0')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="item_descricao">Descrição do Item *</Label>
            <Input
              id="item_descricao"
              placeholder="Ex: Caixas personalizadas, material promocional..."
              value={formData.item_descricao}
              onChange={(e) => setFormData({...formData, item_descricao: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade_entrada">Quantidade *</Label>
              <Input
                id="quantidade_entrada"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0"
                value={formData.quantidade_entrada}
                onChange={(e) => setFormData({...formData, quantidade_entrada: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_entrada">Data de Entrada *</Label>
              <Input
                id="data_entrada"
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({...formData, data_entrada: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto do Item (Opcional)</Label>
            <ImageUpload 
              value={formData.foto_url} 
              onChange={(url) => setFormData({...formData, foto_url: url || ""})} 
              bucketName="produtos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar ao Estoque"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
