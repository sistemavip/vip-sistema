import React from "react";
import { motion } from "framer-motion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-40 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl"
          >
            <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <SidebarTrigger className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:bg-primary/10 transition-colors flex-shrink-0" />
                
                <div className="relative hidden md:block flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-10 w-full bg-background/50 border-border/50 focus:border-primary/50 transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors h-8 w-8 sm:h-9 sm:w-9">
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary rounded-full border-2 border-background"
                  />
                </Button>
                
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors h-8 w-8 sm:h-9 sm:w-9">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-background via-background to-muted/20 pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-7xl pointer-events-auto"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}