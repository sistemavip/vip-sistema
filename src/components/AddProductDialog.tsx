import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Package } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"

interface AddProductDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddProductDialog({ trigger, onSuccess }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    categoria: "",
    descricao: "",
    preco: "",
    estoque: "",
    estoque_min: "5",
    foto_url: null as string | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("produtos").insert({
        codigo: formData.codigo,
        nome: formData.nome,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        preco: parseFloat(formData.preco),
        estoque: parseInt(formData.estoque),
        estoque_min: parseInt(formData.estoque_min),
        foto_url: formData.foto_url
      })

      if (error) throw error

      toast.success("Produto adicionado com sucesso!")
      setOpen(false)
      setFormData({
        codigo: "",
        nome: "",
        categoria: "",
        descricao: "",
        preco: "",
        estoque: "",
        estoque_min: "5",
        foto_url: null
      })
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      toast.error("Erro ao adicionar produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            Adicionar Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados para cadastrar um produto</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: P010"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Camiseta Básica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Input
                id="categoria"
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Vestuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do produto..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem do Produto</Label>
              <ImageUpload
                value={formData.foto_url}
                onChange={(url) => setFormData({ ...formData, foto_url: url })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  required
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque">Estoque *</Label>
                <Input
                  id="estoque"
                  type="number"
                  required
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_min">Estoque Mín *</Label>
                <Input
                  id="estoque_min"
                  type="number"
                  required
                  value={formData.estoque_min}
                  onChange={(e) => setFormData({ ...formData, estoque_min: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
