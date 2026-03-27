import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Conversations from "./pages/conversations/Conversations";
import ConversationsInstagram from "./pages/conversations/ConversationsInstagram";
import WorkflowBuilderPage from "@/pages/workflows";
import WorkflowsList from "@/pages/workflows/WorkflowsList";
import Chatbots from "./pages/chatbots/Chatbots";
import Settings from "./pages/settings/Settings";
import UsersData from "./pages/settings/UsersData";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import SuperAdminLogin from "./pages/auth/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/auth/ForgotPassword";
import UpdatePassword from "./pages/auth/UpdatePassword";
import FacebookCallback from "./pages/auth/FacebookCallback";
import Plans from "./pages/plans/Plans";
import Reports from "./pages/reports/Reports";
import ManagementReports from "./pages/reports/ManagementReports";
import SalesReport from "./pages/reports/SalesReport";
import VendorsReport from "./pages/reports/VendorsReport";
import { AuthProvider } from "./contexts/auth";
import { RealtimeProvider } from "./contexts/realtimeContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Contatos from "./pages/contatos/Contatos";
import DepartamentosPage from "./pages/departamentos";
import EtiquetasPage from "./pages/etiquetas";
import ConfigFollowup from "./pages/followup/ConfigFollowup";
import DisparoMassa from "./pages/DisparoMassa";
import GruposDisparo from "./pages/GruposDisparo";
import MeusChips from "./pages/meus-chips";
// TODO: Ajuda - Temporariamente oculta enquanto são feitas melhorias
// import Ajuda from './pages/ajuda/Ajuda';
import Conexoes from "./pages/channels/Conexoes";
import ArquivosIA from "./pages/arquivos-ia";
// import TutorialChecklist from './pages/tutorial/TutorialChecklist'; // Tutorial desativado
import { useUserType } from "./hooks/useUserType";
import DashboardPersonal from "./pages/dashboard-personal/DashboardPersonal";
// Comentado temporariamente - confirmação de e-mail desabilitada no Supabase
// import EmailConfirmedSuccess from './pages/auth/EmailConfirmedSuccess';
// import { EmailConfirmationHandler } from './components/EmailConfirmationHandler';

// Create a new QueryClient instance outside of the component
const queryClient = new QueryClient();

// Componente para redirecionar starter para /conversations
const HomeRedirect = () => {
  const { plano_starter, plano_crm, loading, isAtendente, trial } = useUserType();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Atendente usa o dashboard pessoal
  if (isAtendente) {
    return <Navigate to="/dashboard-personal" replace />;
  }

  // Starter sem CRM e sem Trial vai para conversas
  if (plano_starter && !plano_crm && !trial) {
    return <Navigate to="/conversations" replace />;
  }

  // Caso contrário, mostrar Dashboard
  return <Dashboard />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {/* Place toast components outside of conditional rendering */}
          <Toaster />
          <Sonner />

          <AuthProvider>
            {/* Comentado temporariamente - confirmação de e-mail desabilitada no Supabase */}
            {/* <EmailConfirmationHandler deve estar fora das rotas protegidas para processar códigos />
            <EmailConfirmationHandler /> */}

            <Routes>
              {/* Auth routes (outside of AppLayout) */}
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="update-password" element={<UpdatePassword />} />
              <Route path="facebook-callback" element={<FacebookCallback />} />
              {/* Comentado temporariamente - confirmação de e-mail desabilitada no Supabase */}
              {/* <Route path="email-confirmed" element={<EmailConfirmedSuccess />} /> */}

              {/* Super Admin routes */}
              <Route path="super-admin-login" element={<SuperAdminLogin />} />
              <Route path="super-admin" element={<SuperAdminDashboard />} />

              <Route path="*" element={<NotFound />} />

              {/* Protected routes with AppLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RealtimeProvider>
                      <AppLayout />
                    </RealtimeProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomeRedirect />} />
                <Route
                  path="dashboard-personal"
                  element={
                    <ProtectedRoute allowedUserTypes={["Atendente"]}>
                      <DashboardPersonal />
                    </ProtectedRoute>
                  }
                />
                <Route path="conversations" element={<Conversations />} />
                <Route
                  path="conversations-instagram"
                  element={<ConversationsInstagram />}
                />
                <Route path="chatbots" element={<Chatbots />} />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute requireSettingsAccess>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings/users"
                  element={
                    <ProtectedRoute requireSettingsAccess>
                      <UsersData />
                    </ProtectedRoute>
                  }
                />
                <Route path="contatos" element={<Contatos />} />
                <Route
                  path="departamentos"
                  element={
                    <ProtectedRoute allowedUserTypes={["Admin", "Gestor"]}>
                      <DepartamentosPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="etiquetas" element={<EtiquetasPage />} />
                <Route path="followup" element={<ConfigFollowup />} />
                <Route path="disparo-massa" element={<DisparoMassa />} />
                <Route path="grupos-disparo" element={<Navigate to="/disparo-massa" replace />} />
                <Route
                  path="meus-chips"
                  element={
                    <ProtectedRoute requireMeusChipsAccess>
                      <MeusChips />
                    </ProtectedRoute>
                  }
                />
                <Route path="conexoes" element={<Conexoes />} />
                <Route path="arquivos-ia" element={<ArquivosIA />} />
                {/* TODO: Ajuda - Temporariamente oculta enquanto são feitas melhorias */}
                {/* <Route path="ajuda" element={<Ajuda />} /> */}
                {/* <Route path="tutorial" element={<TutorialChecklist />} /> Tutorial desativado */}
                <Route path="plans" element={<Plans />} />
                <Route
                  path="relatorios"
                  element={
                    <ProtectedRoute requireCrmPlan>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="relatorios-gerenciais"
                  element={
                    <ProtectedRoute
                      requireCrmPlan
                      allowedUserTypes={["Admin", "Gestor"]}
                    >
                      <ManagementReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="relatorios-gerenciais/vendas"
                  element={
                    <ProtectedRoute
                      requireCrmPlan
                      allowedUserTypes={["Admin", "Gestor"]}
                    >
                      <SalesReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="relatorios-gerenciais/vendedores"
                  element={
                    <ProtectedRoute
                      requireCrmPlan
                      allowedUserTypes={["Admin", "Gestor"]}
                    >
                      <VendorsReport />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="workflows"
                  element={
                    <ProtectedRoute
                      requireProPlan
                      allowedUserTypes={["Admin", "Gestor"]}
                    >
                      <WorkflowsList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="workflows/:id"
                  element={
                    <ProtectedRoute
                      requireProPlan
                      allowedUserTypes={["Admin", "Gestor"]}
                    >
                      <WorkflowBuilderPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
