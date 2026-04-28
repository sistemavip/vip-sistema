import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Truck,
  Users,
  Bot,
  BarChart3,
  Settings,
  Menu,
  Building2,
  FileText,
  Calculator,
  Zap,
  Calendar,
  TrendingUp
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/app",
    icon: LayoutDashboard,
    description: "Visão geral"
  },
  {
    title: "Financeiro",
    url: "/app/confeccao",
    icon: DollarSign,
    description: "Gestão financeira"
  },
  {
    title: "Estoque",
    url: "/app/estoque",
    icon: Package,
    description: "Inventário"
  },
  {
    title: "Envios",
    url: "/app/envios",
    icon: Truck,
    description: "Logística"
  },
  {
    title: "Clientes",
    url: "/app/clientes",
    icon: Users,
    description: "CRM"
  },
  {
    title: "Orçamento",
    url: "/app/orcamento",
    icon: FileText,
    description: "Propostas"
  },
  {
    title: "Custos",
    url: "/app/custos",
    icon: Calculator,
    description: "Financeiro"
  },
  {
    title: "Faturamento",
    url: "/app/faturamento",
    icon: TrendingUp,
    description: "Dashboard mensal"
  },
  {
    title: "Cronograma",
    url: "/app/cronograma",
    icon: Calendar,
    description: "Prazos"
  },
  {
    title: "Operações",
    url: "/app/operacoes",
    icon: Zap,
    description: "Gestão de OS"
  },
  {
    title: "IA Assistant",
    url: "/app/ia",
    icon: Bot,
    description: "Inteligência"
  },
]

const adminItems = [
  {
    title: "Relatórios",
    url: "/app/relatorios",
    icon: BarChart3,
    description: "Analytics"
  },
  {
    title: "Configurações",
    url: "/app/configuracoes",
    icon: Settings,
    description: "Sistema"
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path

  const getNavClasses = (active: boolean) =>
    `group relative w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${active
      ? "bg-primary text-background font-semibold shadow-lg shadow-primary/20"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`

  return (
    <Sidebar
      className="border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300"
      collapsible="icon"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 border-b border-border/50 p-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg flex-shrink-0">
            <Building2 className="h-5 w-5 text-background" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <h1 className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  VIP Manuseios
                </h1>
                <p className="text-[10px] text-muted-foreground truncate">Sistema de Gestão para Empresas de Confecção com IA Integrada</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <SidebarContent className="px-2 py-3">
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) => getNavClasses(isActive)}
                            title={collapsed ? item.title : item.description}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <AnimatePresence mode="wait">
                              {!collapsed && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: "auto" }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex-1 min-w-0"
                                >
                                  <div className="font-medium text-sm truncate">{item.title}</div>
                                  {!isActive(item.url) && (
                                    <div className="text-[10px] opacity-70 truncate">
                                      {item.description}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Admin Section */}
            <SidebarGroup className="mt-2">
              <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {adminItems.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navigationItems.length + index) * 0.03 }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) => getNavClasses(isActive)}
                            title={collapsed ? item.title : item.description}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <AnimatePresence mode="wait">
                              {!collapsed && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: "auto" }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex-1 min-w-0"
                                >
                                  <div className="font-medium text-sm truncate">{item.title}</div>
                                  {!isActive(item.url) && (
                                    <div className="text-[10px] opacity-70 truncate">
                                      {item.description}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ScrollArea>

        {/* Footer */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="border-t border-border/50 p-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20 flex-shrink-0">
                  <span className="text-xs font-bold text-primary">VM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">VIP Manuseios</p>
                  <p className="text-[10px] text-muted-foreground truncate">v2.0 • All-Black</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sidebar>
  )
}