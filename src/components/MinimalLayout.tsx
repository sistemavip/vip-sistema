import React from "react"
import { TubelightNavBar } from "@/components/ui/tubelight-navbar"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Truck,
  Users,
  Bot,
  BarChart3,
  Settings,
  FileText,
  Calculator,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"

interface MinimalLayoutProps {
  children: React.ReactNode
}

export function MinimalLayout({ children }: MinimalLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const displayName = (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "Usuário";
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', url: '/app', icon: LayoutDashboard },
    { name: 'Financeiro', url: '/app/confeccao', icon: DollarSign },
    { name: 'Estoque', url: '/app/estoque', icon: Package },
    { name: 'Envios', url: '/app/envios', icon: Truck },
    { name: 'Clientes', url: '/app/clientes', icon: Users },
    { name: 'Orçamento', url: '/app/orcamento', icon: FileText },
    { name: 'Custos', url: '/app/custos', icon: Calculator },
    { name: 'IA', url: '/app/ia', icon: Bot }
  ]

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient Background - decorative only, fully non-interactive */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/2 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Navigation */}
      <TubelightNavBar items={navItems} />

      {/* User Menu & Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-card/80 border border-border/50 rounded-full p-1 backdrop-blur-sm shadow-sm hover:bg-accent/50 transition-colors cursor-pointer">
                <Avatar className="h-9 w-9 border-2 border-vip-primary/20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-vip-primary/10 text-vip-primary font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-sm">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/app/configuracoes')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-30 pt-28 md:pt-32 pb-32 px-6 pointer-events-auto">
        <div className="mx-auto max-w-7xl">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}