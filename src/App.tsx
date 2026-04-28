import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MinimalLayout } from "@/components/MinimalLayout";
import { UserLayout } from "@/components/UserLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserProtectedRoute } from "@/components/UserProtectedRoute";
import { Login } from "@/pages/Login";
import { ResetPassword } from "@/pages/ResetPassword";
import { Dashboard } from "@/pages/Dashboard";
import { Confeccao } from "@/pages/Confeccao";
import { EstoqueCliente } from "@/pages/EstoqueCliente";
import { Envios } from "@/pages/Envios";
import { Clientes } from "@/pages/Clientes";
import { Orcamento } from "@/pages/Orcamento";
import { PlanilhaCustos } from "@/pages/PlanilhaCustos";
import { Faturamento } from "@/pages/Faturamento";
import { IAAssistant } from "@/pages/IAAssistant";
import { Cronograma } from "@/pages/Cronograma";
import Operacoes from "@/pages/Operacoes";
import { Relatorios } from "@/pages/Relatorios";
import { Configuracoes } from "@/pages/Configuracoes";
import { GraficosOrcamento } from "@/pages/GraficosOrcamento";
import { PortalHome } from "@/pages/portal/PortalHome";
import { MeusPedidos } from "@/pages/portal/MeusPedidos";
import { DetalhePedido } from "@/pages/portal/DetalhePedido";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="vip-theme" disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Portal do Cliente (User Routes) */}
              <Route
                path="/portal/*"
                element={
                  <UserProtectedRoute>
                    <UserLayout>
                      <Routes>
                        <Route path="/" element={<PortalHome />} />
                        <Route path="/pedidos" element={<MeusPedidos />} />
                        <Route path="/pedido/:id" element={<DetalhePedido />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </UserLayout>
                  </UserProtectedRoute>
                }
              />
              
              {/* Admin Protected Routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <MinimalLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/confeccao" element={<Confeccao />} />
                        <Route path="/estoque" element={<EstoqueCliente />} />
                        <Route path="/estoque-cliente" element={<EstoqueCliente />} />
                        <Route path="/envios" element={<Envios />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/orcamento" element={<Orcamento />} />
                        <Route path="/custos" element={<PlanilhaCustos />} />
                        <Route path="/faturamento" element={<Faturamento />} />
                        <Route path="/cronograma" element={<Cronograma />} />
                        <Route path="/ia" element={<IAAssistant />} />
                        <Route path="/operacoes" element={<Operacoes />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/graficos-orcamento" element={<GraficosOrcamento />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MinimalLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
