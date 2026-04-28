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

export function AddEnvioDialog({ trigger, onSuccess }: { trigger?: React.ReactNode, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formData, setFormData] = useState({
    cliente_id: "",
    destinatario_nome: "",
    destinatario_endereco: "",
    destinatario_numero: "",
    destinatario_bairro: "",
    destinatario_cidade: "",
    destinatario_estado: "",
    cep_destino: "",
    destinatario_telefone: "",
    forma_envio: "correios",
    peso: "",
    valor_frete: "",
    codigo_rastreio: "",
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
      const { error } = await supabase
        .from('envios')
        .insert([{
          cliente_id: formData.cliente_id,
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
          observacoes: formData.observacoes || null,
          status: 'pendente'
        }])

      if (error) throw error

      toast.success("Envio cadastrado com sucesso!")
      setOpen(false)
      setFormData({
        cliente_id: "",
        destinatario_nome: "",
        destinatario_endereco: "",
        destinatario_numero: "",
        destinatario_bairro: "",
        destinatario_cidade: "",
        destinatario_estado: "",
        cep_destino: "",
        destinatario_telefone: "",
        forma_envio: "correios",
        peso: "",
        valor_frete: "",
        codigo_rastreio: "",
        observacoes: ""
      })
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar envio:', error)
      toast.error("Erro ao criar envio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Envio</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Envio</DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados do envio</DialogDescription>
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
            <Label htmlFor="destinatario_nome">Nome do Destinatário *</Label>
            <Input
              id="destinatario_nome"
              placeholder="Nome completo"
              value={formData.destinatario_nome}
              onChange={(e) => setFormData({...formData, destinatario_nome: e.target.value})}
              maxLength={150}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="destinatario_endereco">Endereço *</Label>
              <Input
                id="destinatario_endereco"
                placeholder="Rua, Avenida..."
                value={formData.destinatario_endereco}
                onChange={(e) => setFormData({...formData, destinatario_endereco: e.target.value})}
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinatario_numero">Número *</Label>
              <Input
                id="destinatario_numero"
                placeholder="123"
                value={formData.destinatario_numero}
                onChange={(e) => setFormData({...formData, destinatario_numero: e.target.value})}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destinatario_bairro">Bairro *</Label>
              <Input
                id="destinatario_bairro"
                placeholder="Bairro"
                value={formData.destinatario_bairro}
                onChange={(e) => setFormData({...formData, destinatario_bairro: e.target.value})}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep_destino">CEP *</Label>
              <Input
                id="cep_destino"
                placeholder="00000-000"
                value={formData.cep_destino}
                onChange={(e) => setFormData({...formData, cep_destino: e.target.value})}
                maxLength={9}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destinatario_cidade">Cidade *</Label>
              <Input
                id="destinatario_cidade"
                placeholder="Cidade"
                value={formData.destinatario_cidade}
                onChange={(e) => setFormData({...formData, destinatario_cidade: e.target.value})}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinatario_estado">Estado *</Label>
              <Input
                id="destinatario_estado"
                placeholder="UF"
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
              placeholder="(00) 00000-0000"
              value={formData.destinatario_telefone}
              onChange={(e) => setFormData({...formData, destinatario_telefone: e.target.value})}
              maxLength={20}
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
                placeholder="0.0"
                value={formData.peso}
                onChange={(e) => setFormData({...formData, peso: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_frete">Valor Frete (R$) *</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.valor_frete}
                onChange={(e) => setFormData({...formData, valor_frete: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_rastreio">Código Rastreio</Label>
              <Input
                id="codigo_rastreio"
                placeholder="BR123456789"
                value={formData.codigo_rastreio}
                onChange={(e) => setFormData({...formData, codigo_rastreio: e.target.value})}
                maxLength={50}
              />
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Envio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
