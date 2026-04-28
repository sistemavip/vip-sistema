import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusCard } from "@/components/StatusCard"
import { Input } from "@/components/ui/input"
import { AddProductDialog } from "@/components/AddProductDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Download,
  Grid,
  List,
  ShoppingCart,
  Trash2
} from "lucide-react";
import { EditProductDialog } from "@/components/EditProductDialog";
import { ReporEstoqueDialog } from "@/components/ReporEstoqueDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { exportToExcel } from "@/lib/export"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export function Estoque() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('estoque', { ascending: true })

      if (error) throw error

      const productsWithStatus = data?.map(p => {
        const estoque = Number(p.estoque) || 0
        const min = Math.max(0, Number(p.estoque_min) || 0)
        return {
          ...p,
          status: estoque <= min / 2 ? 'Crítico' : estoque <= min ? 'Baixo' : 'Normal'
        }
      }) || []

      setProducts(productsWithStatus)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    // Guarda estado anterior para possível rollback
    const prevProducts = products

    try {
      // Otimista: remove da UI imediatamente
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id))

      // Tenta deletar e exigir representação para confirmar exclusão (pode vir vazio se RLS bloquear)
      const { data, error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productToDelete.id)
        .select('id')

      if (error) throw error

      if (!data || data.length === 0) {
        // Nenhuma linha deletada (provável falta de permissão)
        toast.error('Você não tem permissão para apagar este produto.')
        setProducts(prevProducts) // rollback
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        return
      }

      toast.success('Produto removido com sucesso!')
      setDeleteDialogOpen(false)
      setProductToDelete(null)

      // Recarrega para garantir sincronização (após pequeno atraso)
      setTimeout(() => {
        loadProducts()
      }, 300)
    } catch (error) {
      console.error('Erro ao remover produto:', error)
      toast.error('Erro ao remover produto')
      // Rollback em caso de erro
      setProducts(prevProducts)
    }
  }

  const openDeleteDialog = (product: any) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.codigo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const totalProdutos = products.length
  const produtosBaixos = products.filter(p => p.status === 'Baixo' || p.status === 'Crítico').length
  const valorEstoque = products.reduce((acc, p) => acc + (p.preco * p.estoque), 0)
  const vendidosMes = products.reduce((acc, p) => acc + p.vendidos, 0)

  const stats = [
    {
      title: "Total de Produtos",
      value: totalProdutos.toString(),
      description: "Em estoque",
      icon: Package,
      trend: { value: "5%", isPositive: true },
      variant: "default" as const
    },
    {
      title: "Produtos em Baixa",
      value: produtosBaixos.toString(),
      description: "Necessitam reposição",
      icon: AlertTriangle,
      variant: "warning" as const
    },
    {
      title: "Valor do Estoque",
      value: `R$ ${(valorEstoque / 1000).toFixed(1)}k`,
      description: "Valor total",
      icon: TrendingUp,
      trend: { value: "12%", isPositive: true },
      variant: "success" as const
    },
    {
      title: "Produtos Vendidos (Mês)",
      value: vendidosMes.toString(),
      description: "Meta: 200",
      icon: ShoppingCart,
      trend: { value: "8%", isPositive: true },
      variant: "success" as const
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Normal": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Baixo": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Crítico": "bg-destructive/20 text-destructive border-destructive/30"
    }
    return statusMap[status as keyof typeof statusMap] || "bg-muted text-muted-foreground"
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      "Normal": "border-emerald-500/30",
      "Baixo": "border-amber-500/30",
      "Crítico": "border-destructive/30"
    }
    return colorMap[status as keyof typeof colorMap] || "border-border"
  }

  return (
    <div className="space-y-6 md:space-y-8 pointer-events-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Controle de Estoque
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seu inventário de produtos de confecção
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => exportToExcel('estoque', products, [
          { key: 'codigo', header: 'Código' },
          { key: 'nome', header: 'Nome' },
          { key: 'categoria', header: 'Categoria' },
          { key: 'preco', header: 'Preço' },
          { key: 'estoque', header: 'Estoque' },
          { key: 'estoque_min', header: 'Estoque Mínimo' },
        ])}>
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatusCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters and View Controls */}
      <Card className="card-gradient">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl">Produtos em Estoque</CardTitle>
              <AddProductDialog onSuccess={loadProducts} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 w-full sm:w-[200px] text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px] text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                  <SelectItem value="Crítico">Crítico</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 border border-border rounded-lg p-1 self-end sm:self-auto relative z-20">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMode('grid')
                    console.log('Modo grid ativado')
                  }}
                  className="h-8 w-8 p-0 relative z-20"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMode('list')
                    console.log('Modo lista ativado')
                  }}
                  className="h-8 w-8 p-0 relative z-20"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm sm:text-base text-muted-foreground">Carregando produtos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm sm:text-base text-muted-foreground">Nenhum produto encontrado com os filtros aplicados</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className={`p-3 sm:p-4 rounded-lg border-2 hover:shadow-lg transition-all duration-200 ${getStatusColor(product.status)} bg-card hover-lift relative`}>
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="flex justify-center mb-2">
                        {product.foto_url ? (
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-border shadow-sm">
                            <img
                              src={product.foto_url}
                              alt={product.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="text-3xl sm:text-4xl">{product.imagem || '📦'}</div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1 mb-1">{product.nome}</h3>
                      <p className="text-xs text-muted-foreground truncate">{product.categoria}</p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Estoque</span>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          {product.estoque} un
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Mínimo</span>
                        <Badge className="bg-muted text-muted-foreground border-border/40 text-xs">
                          {product.estoque_min} un
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Preço</span>
                        <span className="text-xs sm:text-sm font-medium">R$ {product.preco.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Vendidos</span>
                        <span className="text-xs sm:text-sm">{product.vendidos}</span>
                      </div>

                      {/* Stock progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${product.estoque <= product.estoque_min / 2 ? 'bg-red-500' :
                                product.estoque <= product.estoque_min ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            style={{ width: `${Math.min(100, (product.estoque / (product.estoque_min * 2)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 relative z-10">
                      <EditProductDialog
                        product={product}
                        onSuccess={loadProducts}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9">Editar</Button>
                        }
                      />
                      <ReporEstoqueDialog
                        product={product}
                        onSuccess={loadProducts}
                        trigger={
                          <Button size="sm" className="flex-1 bg-vip-primary hover:bg-vip-secondary text-black text-xs sm:text-sm h-8 sm:h-9">Repor</Button>
                        }
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteDialog(product)
                        }}
                      >
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm sm:text-base text-muted-foreground">Carregando produtos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm sm:text-base text-muted-foreground">Nenhum produto encontrado com os filtros aplicados</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      {product.foto_url ? (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-border">
                          <img
                            src={product.foto_url}
                            alt={product.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-xl sm:text-2xl w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-muted/50 rounded-md">{product.imagem || '📦'}</div>
                      )}
                    </div>

                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                      <div className="col-span-2">
                        <p className="font-medium text-sm line-clamp-1">{product.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.categoria} • {product.codigo}</p>
                      </div>

                      <div className="text-left sm:text-center">
                        <p className="text-xs sm:text-sm font-medium">R$ {product.preco.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Preço</p>
                      </div>

                      <div className="text-left sm:text-center">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          {product.estoque} un
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Estoque</p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">Mín: {product.estoque_min} un</p>
                      </div>

                      <div className="text-left sm:text-center">
                        <p className="text-xs sm:text-sm font-medium">{product.vendidos}</p>
                        <p className="text-xs text-muted-foreground">Vendidos</p>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex gap-1.5 sm:gap-2 relative z-10">
                        <EditProductDialog
                          product={product}
                          onSuccess={loadProducts}
                          trigger={<Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm h-8">Editar</Button>}
                        />
                        <ReporEstoqueDialog
                          product={product}
                          onSuccess={loadProducts}
                          trigger={<Button size="sm" className="flex-1 sm:flex-none bg-vip-primary hover:bg-vip-secondary text-black text-xs sm:text-sm h-8">Repor</Button>}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 sm:flex-none text-xs sm:text-sm h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(product)
                          }}
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card className="card-gradient border-amber-200">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-amber-800 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Produtos com Estoque Baixo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.filter(p => p.status === 'Baixo' || p.status === 'Crítico').map((product) => (
              <div key={product.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                <div className="flex-shrink-0">
                  {product.foto_url ? (
                    <div className="w-10 h-10 rounded-md overflow-hidden border border-amber-300">
                      <img src={product.foto_url} alt={product.nome} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg">{product.imagem || '📦'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm line-clamp-1">{product.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Restam apenas {product.estoque} un
                  </p>
                </div>
                <ReporEstoqueDialog
                  product={product}
                  onSuccess={loadProducts}
                  trigger={<Button size="sm" className="bg-vip-primary hover:bg-vip-secondary text-black text-xs h-8 px-2 sm:px-3">Repor</Button>}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteProduct}
        title="Tem certeza que deseja remover este produto?"
        description={`O produto "${productToDelete?.nome}" será permanentemente removido do estoque. Esta ação não pode ser desfeita.`}
        confirmText="Apagar Produto"
      />
    </div>
  )
}