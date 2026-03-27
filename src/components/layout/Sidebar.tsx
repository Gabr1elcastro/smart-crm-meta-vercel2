import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  MessageSquare,
  Bot,
  Settings,
  Home,
  LogOut,
  Sparkles,
  Users,
  Repeat,
  Megaphone,
  Tag,
  Zap,
  FileText,
  BarChart3,
  Instagram,
  GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useUserType } from "@/hooks/useUserType";
import { supabase } from "@/lib/supabase";
import TrialUpgradeBanner from "@/components/TrialUpgradeBanner";
import { LogoPersonalizada } from "@/components/LogoPersonalizada";

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  show?: boolean;
  disabled?: boolean;
};

const NavItem = ({
  to,
  icon: Icon,
  label,
  end = false,
  show = true,
  disabled = false,
}: NavItemProps) => {
  if (!show) return null;

  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary-200 dark:hover:bg-primary-700/50",
          isActive
            ? "bg-primary-300 text-primary-800 dark:bg-primary-700 dark:text-primary-100"
            : "text-primary-600 dark:text-primary-200"
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

interface SidebarProps {
  isPlansPage?: boolean;
}

const trialHiddenRoutes = new Set([
  "/relatorios",
  "/grupos-disparo",
  "/followup",
  "/arquivos-ia",
  "/meus-chips",
]);

export default function Sidebar({ isPlansPage = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const {
    userType,
    loading,
    canAccessSettings,
    plano_agentes,
    plano_crm,
    plano_starter,
    plano_plus,
    plano_pro,
  } = useUserType();

  /* ───────────────────────────────
     🔐 CONTROLE GLOBAL DE ATENDENTE
  ─────────────────────────────── */
  const isAtendente = userType === "Atendente";

  const atendenteAllowedRoutes = React.useMemo(
    () =>
      new Set<string>([
        "/dashboard-personal",
        "/conversations",
        "/conversations-instagram",
        "/etiquetas",
      ]),
    []
  );

  /* ───────────────────────────────
     🔁 REDIRECIONAMENTO AUTOMÁTICO
     Atendente só é redirecionado se
     estiver em rota NÃO permitida
  ─────────────────────────────── */
  React.useEffect(() => {
    if (loading || !isAtendente) return;

    const currentPath = location.pathname;

    // Se for atendente e estiver fora do permitido, redireciona
    if (!atendenteAllowedRoutes.has(currentPath)) {
      navigate("/dashboard-personal", { replace: true });
    }
  }, [loading, isAtendente, location.pathname, navigate, atendenteAllowedRoutes]);

  const [isTrial, setIsTrial] = React.useState(false);

  const hasAnyPlan =
    isTrial ||
    plano_agentes ||
    plano_crm ||
    plano_starter ||
    plano_plus ||
    plano_pro ||
    canAccessSettings;

  React.useEffect(() => {
    const checkTrialStatus = async () => {
      if (!user?.id_cliente) return;

      try {
        const { data } = await supabase
          .from("clientes_info")
          .select("trial, plano_crm")
          .eq("id", user.id_cliente)
          .single();

        if (data) {
          // Tratamos plano CRM como se fosse trial para fins de visibilidade de rotas
          setIsTrial(data.trial === true || data.plano_crm === true);
        }
      } catch (error) {
        console.error("Erro ao verificar status de trial/plano_crm:", error);
      }
    };

    checkTrialStatus();
  }, [user?.id_cliente]);

  const showNav = React.useCallback(
    (path: string, condition: boolean = true) => {
      if (!condition) return false;

      // 🔒 Atendente só vê rotas permitidas
      if (isAtendente) {
        return atendenteAllowedRoutes.has(path);
      }

      // Workflows aparece para quem tem plano Pro
      if (path === "/workflows") {
        return plano_pro === true;
      }

      // Trial mantém lógica atual
      if (!isTrial) return true;

      return !trialHiddenRoutes.has(path);
    },
    [isTrial, isAtendente, atendenteAllowedRoutes, plano_pro]
  );

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  /* ───────────────────────────────
     ⏳ LOADING
  ─────────────────────────────── */
  if (loading) {
    return (
      <div className="w-64 h-screen bg-white dark:bg-sidebar fixed left-0 top-0 flex flex-col border-r border-primary-200 dark:border-primary-800">
        <div className="flex-shrink-0 p-4 border-b border-primary-200 dark:border-primary-800 bg-gray-50 dark:bg-gray-800">
          <div className="w-full h-20 flex items-center justify-center">
            <LogoPersonalizada className="max-h-full max-w-full object-contain" />
          </div>
        </div>

        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </div>
    );
  }

  /* ───────────────────────────────
     📌 SIDEBAR
  ─────────────────────────────── */
  return (
    <div className="w-64 h-screen bg-white dark:bg-sidebar fixed left-0 top-0 flex flex-col border-r border-primary-200 dark:border-primary-800">
      <div className="flex-shrink-0 p-4 border-b border-primary-200 dark:border-primary-800 bg-gray-50 dark:bg-gray-800">
        <div className="w-full h-20 flex items-center justify-center">
          <LogoPersonalizada className="max-h-full max-w-full object-contain" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          <NavItem
            to={isAtendente ? "/dashboard-personal" : "/"}
            icon={Home}
            label={isAtendente ? "Meu Dashboard" : "Dashboard"}
            end={!isAtendente}
            show={isAtendente ? showNav("/dashboard-personal") : showNav("/")}
          />
          <NavItem to="/relatorios" icon={BarChart3} label="CRM" show={showNav("/relatorios") && !plano_plus} />

          <NavItem to="/conversations" icon={MessageSquare} label="Conversas" show={showNav("/conversations")} />
          <NavItem
            to="/conversations-instagram"
            icon={Instagram}
            label="Conversas Instagram"
            show={showNav("/conversations-instagram") && !plano_plus}
          />
          <NavItem to="/etiquetas" icon={Tag} label="Etiquetas" show={showNav("/etiquetas")} />

          <NavItem to="/contatos" icon={Sparkles} label="Contatos" show={showNav("/contatos")} />
          <NavItem to="/disparo-massa" icon={Megaphone} label="Disparo em Massa" show={showNav("/disparo-massa")} />
          {/* <NavItem to="/chatbots" icon={Bot} label="Agentes de IA" show={showNav("/chatbots")} /> */}
          <NavItem to="/workflows" icon={GitBranch} label="Chatbots" show={showNav("/workflows")} />
          <NavItem to="/departamentos" icon={Users} label="Departamentos" show={showNav("/departamentos")} />
          {/* <NavItem to="/followup" icon={Repeat} label="Followup Automático" show={showNav("/followup")} /> */}
          <NavItem to="/conexoes" icon={Zap} label="Conexões" show={showNav("/conexoes")} />
          <NavItem to="/arquivos-ia" icon={FileText} label="Arquivos para IA" show={showNav("/arquivos-ia")} />
          <NavItem to="/settings/users" icon={Users} label="Usuários" show={showNav("/settings/users")} />
          <NavItem to="/settings" icon={Settings} label="Configurações" show={showNav("/settings")} />
        </nav>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-primary-200 dark:border-primary-800">
        <TrialUpgradeBanner />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
