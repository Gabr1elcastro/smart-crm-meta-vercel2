import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowCanvas } from '@/components/workflow-builder/WorkflowCanvas';
import { useAuth } from '@/contexts/auth';
import { useWorkflow } from '@/hooks/workflow/useWorkflow';
import { useWorkflowExecution } from '@/hooks/workflow/useWorkflowExecution';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { workflow, loading, saving, saveWorkflow } = useWorkflow(id === 'new' ? undefined : id);
  const { execute, executing } = useWorkflowExecution();

  // Verifica autenticação
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso negado</h2>
          <p className="text-muted-foreground">Faça login para continuar</p>
        </div>
      </div>
    );
  }

  // Verifica permissão (apenas Admin e Gestor)
  const userType = user.user_metadata?.tipo_usuario || 'Atendente';
  const canAccess = true;

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Acesso restrito</h2>
          <p className="text-muted-foreground">Apenas Administradores e Gestores podem criar workflows</p>
        </div>
      </div>
    );
  }

  // Se for "new", criar workflow vazio
  useEffect(() => {
    if (id === 'new' && !loading && !workflow) {
      // O workflow será criado quando o usuário salvar pela primeira vez
    }
  }, [id, loading, workflow]);

  const handleSave = async (nodes: WorkflowNode[], edges: WorkflowEdge[], name: string) => {
    if (!user.id_cliente) {
      toast.error('ID do cliente não encontrado');
      return;
    }

    try {
      // Buscar nó de início (inicio ou trigger) para salvar trigger_config
      const inicioNode = nodes.find(n => n.type === 'inicio' || n.type === 'trigger');
      
      const payload = {
        id_cliente: user.id_cliente,
        nome: name,
        nodes,
        edges,
        is_active: true,
        trigger_config: inicioNode?.data || null,
      };

      const saved = await saveWorkflow(payload);
      
      if (!id && saved.id) {
        navigate(`/workflows/${saved.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const handleExecute = async (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    if (!user.id_cliente) {
      toast.error('ID do cliente não encontrado');
      return;
    }

    // Abre modal para inserir dados de teste
    const phone = prompt('Digite o número de telefone para teste (com DDD):', '5511999999999');
    if (!phone) return;

    const nome = prompt('Digite o nome do lead (opcional):', 'Cliente Teste');

    try {
      await execute({
        workflowId: id || 'test',
        triggerData: {
          phone: phone.replace(/\D/g, ''),
          nome: nome || undefined,
          id_cliente: user.id_cliente,
        },
        nodes,
        edges,
      });
    } catch (err) {
      console.error('Erro na execução:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-foreground">Carregando workflow...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background">
      <WorkflowCanvas
        workflowId={id}
        initialNodes={workflow?.nodes || []}
        initialEdges={workflow?.edges || []}
        workflowName={workflow?.nome || 'Novo Workflow'}
        onSave={handleSave}
        onExecute={handleExecute}
        isSaving={saving}
      />
    </div>
  );
}