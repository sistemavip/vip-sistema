import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Smartphone,
  Globe,
  Save,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Menu,
  FileText,
  BarChart3
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AuditLogsTable } from "@/components/AuditLogsTable"
import { SecurityMetricsDashboard } from "@/components/SecurityMetricsDashboard"
import { SecurityRulesConfig } from "@/components/SecurityRulesConfig"
import { supabase } from "@/integrations/supabase/client"

const DEFAULT_COMPANY_SETTINGS = {
  companyName: "VIP Manuseios Ltda",
  cnpj: "12.345.678/0001-90",
  email: "contato@vipmanuseios.com.br",
  phone: "(11) 99999-0000",
  cep: "01310-100",
  address: "Av. Paulista, 1000",
  city: "São Paulo",
  state: "SP",
  country: "Brasil"
}

export function Configuracoes() {
  const [activeSection, setActiveSection] = useState('profile')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [formData, setFormData] = useState(DEFAULT_COMPANY_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    reports: false,
    stock: true
  })
  const [backupAuto, setBackupAuto] = useState(true)

  const integrations = [
    {
      name: "Correios API",
      description: "Integração para cálculo automático de fretes",
      status: "Conectado",
      lastSync: "22/01/2025 14:30"
    },
    {
      name: "WhatsApp Business",
      description: "Envio de notificações para clientes",
      status: "Conectado", 
      lastSync: "22/01/2025 12:15"
    },
    {
      name: "Email Marketing",
      description: "Campanhas automáticas de email",
      status: "Desconectado",
      lastSync: "Nunca"
    },
    {
      name: "Nota Fiscal Eletrônica",
      description: "Emissão automática de NF-e",
      status: "Configurando",
      lastSync: "Em progresso"
    }
  ]

  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('singleton_key', 'default')
          .maybeSingle()

        if (error) throw error

        if (!data) {
          setFormData(DEFAULT_COMPANY_SETTINGS)
          return
        }

        setFormData({
          companyName: data.company_name || DEFAULT_COMPANY_SETTINGS.companyName,
          cnpj: data.cnpj || "",
          email: data.email || "",
          phone: data.phone || "",
          cep: data.cep || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || ""
        })
      } catch (error) {
        console.error("Erro ao carregar configurações da empresa:", error)
        toast.error("Erro ao carregar configurações da empresa")
      } finally {
        setIsLoadingSettings(false)
      }
    }

    loadCompanySettings()
  }, [])

  const handleSaveAll = async () => {
    setIsSaving(true)

    try {
      const payload = {
        singleton_key: 'default',
        company_name: formData.companyName.trim() || null,
        cnpj: formData.cnpj.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        cep: formData.cep.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || null
      }

      const { error } = await supabase
        .from('company_settings')
        .upsert(payload, { onConflict: 'singleton_key' })

      if (error) throw error

      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configurações da empresa:", error)
      toast.error("Erro ao salvar configurações da empresa")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackup = () => {
    toast.success("Backup iniciado! Você receberá um email quando estiver pronto.")
  }

  const handleClearCache = () => {
    toast.success("Cache limpo com sucesso!")
  }

  const categories = [
    { id: 'profile', icon: User, label: 'Perfil da Empresa' },
    { id: 'notifications', icon: Bell, label: 'Notificações' },
    { id: 'security', icon: Shield, label: 'Segurança' },
    { id: 'metrics', icon: BarChart3, label: 'Métricas de Segurança' },
    { id: 'security-rules', icon: Shield, label: 'Regras de Segurança' },
    { id: 'audit', icon: FileText, label: 'Logs de Auditoria' },
    { id: 'appearance', icon: Palette, label: 'Aparência' },
    { id: 'integrations', icon: Database, label: 'Integrações' },
  ]

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Conectado": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Desconectado": "bg-destructive/20 text-destructive border-destructive/30",
      "Configurando": "bg-amber-500/20 text-amber-400 border-amber-500/30"
    }
    return statusMap[status as keyof typeof statusMap] || "bg-muted/20 text-muted-foreground border-border/30"
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Conectado": return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case "Desconectado": return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "Configurando": return <Settings className="h-4 w-4 text-amber-400" />
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const CategoryMenu = () => (
    <div className="space-y-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeSection === category.id ? "default" : "ghost"}
          className="w-full justify-start gap-3"
          onClick={() => {
            setActiveSection(category.id)
            setIsMenuOpen(false)
          }}
        >
          <category.icon className="h-4 w-4" />
          <span className="truncate">{category.label}</span>
        </Button>
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            Configurações do Sistema
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todas as configurações da VIP Manuseios
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">Categorias</h3>
                <CategoryMenu />
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleBackup}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSaveAll} disabled={isSaving || isLoadingSettings}>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{isSaving ? "Salvando..." : "Salvar Tudo"}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Settings Navigation - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-lg">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryMenu />
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Company Profile */}
          {activeSection === 'profile' && (
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-vip-primary" />
                Perfil da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSettings && (
                <p className="text-sm text-muted-foreground">Carregando configurações da empresa...</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input 
                    id="company-name" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Principal</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Endereço da Empresa</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input 
                      id="cep" 
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input 
                      id="address" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input 
                      id="city" 
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input 
                      id="state" 
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input 
                      id="country" 
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-vip-primary" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Notificações por Email</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Receber alertas importantes por email
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Notificações WhatsApp</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Receber alertas via WhatsApp Business
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.whatsapp}
                    onCheckedChange={(checked) => setNotifications({...notifications, whatsapp: checked})}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Relatórios Automáticos</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Envio automático de relatórios semanais
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.reports}
                    onCheckedChange={(checked) => setNotifications({...notifications, reports: checked})}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Alertas de Estoque</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Notificar quando produtos estão em baixa
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.stock}
                    onCheckedChange={(checked) => setNotifications({...notifications, stock: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Integrations */}
          {activeSection === 'integrations' && (
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-vip-primary" />
                Integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getStatusIcon(integration.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Última sincronização: {integration.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge className={getStatusBadge(integration.status)}>
                        {integration.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                      >
                        <Settings className="h-3 w-3" />
                        <span className="hidden sm:inline">Config</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {/* System Actions */}
          {(activeSection === 'security' || activeSection === 'profile') && (
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Backup & Restore */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="text-lg">Backup & Restauração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Último backup: 22/01/2025 02:00
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar Backup
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Restaurar
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Backup Automático</span>
                    <Switch 
                      checked={backupAuto}
                      onCheckedChange={setBackupAuto}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Backup diário às 02:00
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="text-lg">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Globe className="h-4 w-4" />
                    Configurar Domínio
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Shield className="h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Database className="h-4 w-4" />
                    Logs do Sistema
                  </Button>
                  
                  <Separator />
                  
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-3"
                    onClick={handleClearCache}
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Placeholder for Appearance and Security sections */}
          {activeSection === 'appearance' && (
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-vip-primary" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Configurações de aparência em breve...</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-vip-primary" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Configurações de segurança em breve...</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'metrics' && (
            <SecurityMetricsDashboard />
          )}

          {activeSection === 'security-rules' && (
            <SecurityRulesConfig />
          )}

          {activeSection === 'audit' && (
            <AuditLogsTable />
          )}
        </div>
      </div>
    </div>
  )
}
