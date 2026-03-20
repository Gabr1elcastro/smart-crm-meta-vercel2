import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Tag } from "lucide-react";
import { etiquetasService, Etiqueta } from "@/services/etiquetasService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientesService } from "@/services/clientesService";

export default function EtiquetasPage() {
  const { user } = useAuth();
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3B82F6'); // Cor padrão azul

  // Cores predefinidas para seleção
  const coresPredefinidas = [
    '#3B82F6', // Azul
    '#EF4444', // Vermelho
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#8B5CF6', // Roxo
    '#F97316', // Laranja
    '#06B6D4', // Ciano
    '#84CC16', // Verde lima
    '#EC4899', // Rosa
    '#6B7280', // Cinza
  ];

  // Buscar id_cliente do usuário logado
  useEffect(() => {
    async function fetchCliente() {
      if (user?.id_cliente) {
        const cliente = await clientesService.getClienteByIdCliente(user.id_cliente);
        setIdCliente(cliente?.id || null);
      }
    }
    fetchCliente();
  }, [user]);

  // Listar etiquetas
  useEffect(() => {
    if (!idCliente) return;
    setLoading(true);
    etiquetasService.listByCliente(idCliente)
      .then(setEtiquetas)
      .catch(() => toast.error('Erro ao buscar etiquetas'))
      .finally(() => setLoading(false));
  }, [idCliente]);

  // Função para abrir modal de criação
  const openCreateModal = () => {
    setEditingEtiqueta(null);
    setNome('');
    setCor('#3B82F6');
    setModalOpen(true);
  };

  // Função para abrir modal de edição
  const openEditModal = (etiqueta: Etiqueta) => {
    // Verificar se é uma etiqueta padrão do sistema
    if (etiqueta.id_cliente === null) {
      toast.error('Etiquetas padrão do sistema não podem ser editadas');
      return;
    }
    
    setEditingEtiqueta(etiqueta);
    setNome(etiqueta.nome);
    setCor(etiqueta.cor);
    setModalOpen(true);
  };

  // Função para salvar etiqueta
  const handleSave = async () => {
    if (!nome.trim() || !idCliente) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingEtiqueta) {
        // Editar etiqueta existente
        await etiquetasService.updateEtiqueta({
          id: editingEtiqueta.id,
          nome: nome.trim(),
          cor
        });
        toast.success('Etiqueta atualizada com sucesso!');
      } else {
        // Criar nova etiqueta
        await etiquetasService.createEtiqueta({
          nome: nome.trim(),
          cor,
          id_cliente: idCliente
        });
        toast.success('Etiqueta criada com sucesso!');
      }

      // Recarregar lista
      const lista = await etiquetasService.listByCliente(idCliente);
      setEtiquetas(lista);
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar etiqueta');
    } finally {
      setSaving(false);
    }
  };

  // Função para remover etiqueta
  const handleRemove = async (id: number) => {
    // Verificar se é uma etiqueta padrão do sistema
    const etiqueta = etiquetas.find(e => e.id === id);
    if (etiqueta && etiqueta.id_cliente === null) {
      toast.error('Etiquetas padrão do sistema não podem ser excluídas');
      return;
    }
    
    setDeletingId(id);
    try {
      await etiquetasService.removeEtiqueta(id);
      toast.success('Etiqueta removida com sucesso!');
      setEtiquetas(etiquetas.filter(e => e.id !== id));
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover etiqueta');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Drawer/Menu lateral para mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setMenuOpen(false)} />
          <div className="relative w-64 max-w-full h-full bg-white shadow-lg flex flex-col p-6 animate-slide-in-left">
            <button className="self-end mb-4 p-2 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col gap-4">
              <a href="/" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Dashboard</a>
              <a href="/conversations" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Conversas</a>
              <a href="/contatos" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Contatos</a>
              <a href="/etiquetas" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Etiquetas</a>
              <a href="/departamentos" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Departamentos</a>
              <a href="/followup" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Followup Automático</a>
              <a href="/settings" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Configurações</a>
            </nav>
          </div>
        </div>
      )}

      {/* Topo com botão de menu (apenas mobile) */}
      <div className="md:hidden flex items-center gap-4 p-4 border-b">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold text-xl text-primary-700">SmartCRM</span>
        <span className="ml-2 text-2xl font-semibold">Etiquetas</span>
      </div>

      <div className="flex flex-col h-screen">
        <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-0">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Tags</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Crie etiquetas para organizar e categorizar seus contatos. As etiquetas padrão do sistema estão sempre disponíveis.
                </p>
              </div>
              <Button className="ml-auto" variant="default" size="lg" onClick={openCreateModal}>
                <Plus className="h-5 w-5 mr-2" />
                Nova Etiqueta
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Carregando etiquetas...</p>
                </div>
              ) : etiquetas.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma etiqueta criada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira etiqueta para começar a organizar seus contatos.
                  </p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Etiqueta
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etiquetas.map((etiqueta) => {
                      const isEtiquetaPadrao = etiqueta.id_cliente === null;
                      return (
                        <TableRow key={etiqueta.id} className={isEtiquetaPadrao ? 'bg-gray-50' : ''}>
                          <TableCell>
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-gray-200"
                              style={{ backgroundColor: etiqueta.cor }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {etiqueta.nome}
                            {isEtiquetaPadrao && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Padrão
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEtiquetaPadrao ? (
                              <span className="text-sm text-gray-600">Sistema</span>
                            ) : (
                              <span className="text-sm text-gray-600">Cliente</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(etiqueta.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(etiqueta)}
                                disabled={isEtiquetaPadrao}
                                title={isEtiquetaPadrao ? "Etiquetas padrão não podem ser editadas" : "Editar etiqueta"}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemove(etiqueta.id)}
                                disabled={deletingId === etiqueta.id || isEtiquetaPadrao}
                                title={isEtiquetaPadrao ? "Etiquetas padrão não podem ser excluídas" : "Excluir etiqueta"}
                              >
                                {deletingId === etiqueta.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEtiqueta ? 'Editar Etiqueta' : 'Nova Etiqueta'}
            </DialogTitle>
            <DialogDescription>
              {editingEtiqueta 
                ? 'Atualize as informações da etiqueta.' 
                : 'Crie uma nova etiqueta para organizar seus contatos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="col-span-3"
                placeholder="Nome da etiqueta"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Cor</Label>
              <div className="col-span-3">
                <div className="flex gap-2 mb-2">
                  {coresPredefinidas.map((corPredefinida) => (
                    <button
                      key={corPredefinida}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        cor === corPredefinida 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: corPredefinida }}
                      onClick={() => setCor(corPredefinida)}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !nome.trim()}>
              {saving ? 'Salvando...' : editingEtiqueta ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 