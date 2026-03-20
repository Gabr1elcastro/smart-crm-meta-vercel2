import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Plus, 
  Edit, 
  Trash2,
  Loader2,
  Play,
  Pause
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { WorkflowService } from "@/services/workflowService";
import { Workflow } from "@/types/workflow";
import { useAuth } from "@/contexts/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WorkflowsList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar workflows do cliente
  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      if (!user?.id_cliente) {
        console.error("Cliente não encontrado");
        setIsLoading(false);
        return;
      }

      const data = await WorkflowService.getByClient(user.id_cliente);
      setWorkflows(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar workflows:", error);
      toast.error("Falha ao buscar workflows");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id_cliente) {
      fetchWorkflows();
    }
  }, [user?.id_cliente]);

  // Toggle ativo/inativo
  const handleToggleActive = async (workflow: Workflow) => {
    try {
      await WorkflowService.update(workflow.id.toString(), {
        is_active: !workflow.is_active,
      });
      toast.success(`Workflow ${workflow.is_active ? 'pausado' : 'ativado'} com sucesso!`);
      fetchWorkflows();
    } catch (error: any) {
      console.error("Erro ao atualizar workflow:", error);
      toast.error("Erro ao atualizar workflow");
    }
  };

  // Abrir diálogo de exclusão
  const handleDeleteClick = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!workflowToDelete) return;

    try {
      await WorkflowService.delete(workflowToDelete.id.toString());
      toast.success("Workflow excluído com sucesso!");
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
      fetchWorkflows();
    } catch (error: any) {
      console.error("Erro ao excluir workflow:", error);
      toast.error("Erro ao excluir workflow");
    }
  };

  // Criar novo workflow
  const handleCreateWorkflow = async () => {
    try {
      if (!user?.id_cliente) {
        toast.error("Cliente não encontrado");
        return;
      }

      // Criar workflow vazio
      const newWorkflow = await WorkflowService.create({
        id_cliente: user.id_cliente,
        nome: "Novo Workflow",
        nodes: [],
        edges: [],
        is_active: false,
        trigger_config: null,
      });

      // Navegar para o editor
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (error: any) {
      console.error("Erro ao criar workflow:", error);
      toast.error("Erro ao criar workflow");
    }
  };

  // Editar workflow
  const handleEditWorkflow = (workflow: Workflow) => {
    navigate(`/workflows/${workflow.id}`);
  };

  // Contar nós no workflow
  const getNodeCount = (workflow: Workflow) => {
    try {
      const nodes = typeof workflow.nodes === 'string' 
        ? JSON.parse(workflow.nodes) 
        : workflow.nodes;
      return Array.isArray(nodes) ? nodes.length : 0;
    } catch {
      return 0;
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie seus fluxos de automação
          </p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Workflow
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-2">
            Nenhum workflow criado
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Criar Workflow" para começar a criar seus fluxos de automação
          </p>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Workflow
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{workflow.nome || "Sem nome"}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workflow.is_active || false}
                      onCheckedChange={() => handleToggleActive(workflow)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(workflow)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    <span>Workflow</span>
                    {workflow.is_active ? (
                      <Badge className="ml-2 bg-green-500 text-white">
                        <Play className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="ml-2 bg-gray-500 text-white">
                        <Pause className="h-3 w-3 mr-1" />
                        Pausado
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Nós:</span> {getNodeCount(workflow)}
                  </div>
                  {workflow.descricao && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.descricao}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {workflow.updated_at ? formatDate(workflow.updated_at) : 'Sem data'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditWorkflow(workflow)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o workflow "{workflowToDelete?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
