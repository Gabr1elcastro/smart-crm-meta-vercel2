import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useUserType } from '@/hooks/useUserType';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ('Admin' | 'Gestor' | 'Atendente')[];
  requireSettingsAccess?: boolean;
  requireMeusChipsAccess?: boolean;
  requireCrmPlan?: boolean; // Adicionado para verificar se precisa do plano CRM
  requireProPlan?: boolean; // Apenas plano Pro (não Trial, nem CRM)
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserTypes,
  requireSettingsAccess = false,
  requireMeusChipsAccess = false,
  requireCrmPlan = false,
  requireProPlan = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const { userType, loading: userTypeLoading, canAccessSettings, canAccessMeusChips, plano_crm, plano_pro } = useUserType();
  const location = useLocation();

  // Se ainda está carregando, mostrar loading
  if (authLoading || userTypeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se há restrições de tipo de usuário
  if (allowedUserTypes && userType && !allowedUserTypes.includes(userType)) {
    return <Navigate to="/" replace />;
  }

  // Se requer acesso a configurações
  if (requireSettingsAccess && !canAccessSettings) {
    return <Navigate to="/" replace />;
  }

  // Se requer acesso a meus chips
  if (requireMeusChipsAccess && !canAccessMeusChips) {
    return <Navigate to="/" replace />;
  }

  // Se a rota requer plano CRM, verificar se o usuário tem acesso
  if (requireCrmPlan && !plano_crm) {
    return <Navigate to="/" replace />;
  }

  // Se a rota requer plano Pro
  if (requireProPlan && !plano_pro) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
