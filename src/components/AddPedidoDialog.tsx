import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Cliente {
  id: string
  codigo: string
  nome: string
}

export function AddPedidoDialog({ trigger, onSuccess }: { trigger?: React.ReactNode, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formData, setFormData] = useState({
    cliente_id: "",
    tipo_servico: "confeccao" as "confeccao" | "armazenamento" | "chapelaria" | "envio" | "manuseio" | "montagem_kits",
    descricao_servico: "",
    quantidade: "",
    status: "orcamento" as "orcamento" | "aprovado" | "em_andamento" | "concluido" | "cancelado" | "coletado",
    data_execucao: "",
    local_servico: "",
    observacoes: ""
  })

  useEffect(() => {
    if (open) {
      fetchClientes()
    }
  }, [open])

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, codigo, nome')
      .order('nome')
    
    if (error) {
      toast.error("Erro ao carregar clientes")
      return
    }
    
    setClientes(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const numeroOS = `OS-${Date.now()}`
      
      const { error } = await supabase
        .from('ordens_servico')
        .insert([{
          numero_os: numeroOS,
          cliente_id: formData.cliente_id,
          tipo_servico: formData.tipo_servico,
          descricao_servico: formData.descricao_servico,
          quantidade: parseInt(formData.quantidade),
          status: formData.status,
          data_execucao: formData.data_execucao || null,
          local_servico: formData.local_servico || null,
          observacoes: formData.observacoes || null
        }])

      if (error) throw error

      toast.success("Pedido criado com sucesso!")
      setOpen(false)
      setFormData({
        cliente_id: "",
        tipo_servico: "confeccao" as "confeccao" | "armazenamento" | "chapelaria" | "envio" | "manuseio" | "montagem_kits",
        descricao_servico: "",
        quantidade: "",
        status: "orcamento" as "orcamento" | "aprovado" | "em_andamento" | "concluido" | "cancelado" | "coletado",
        data_execucao: "",
        local_servico: "",
        observacoes: ""
      })
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      toast.error("Erro ao criar pedido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-vip-primary hover:bg-vip-secondary">
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido de Produção</DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados do pedido</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select 
              value={formData.cliente_id} 
              onValueChange={(value) => setFormData({...formData, cliente_id: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome} ({cliente.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              maxLength={500}
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
                placeholder="0"
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
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-vip-primary hover:bg-vip-secondary text-black">
              {loading ? "Salvando..." : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
