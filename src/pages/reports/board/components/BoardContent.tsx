import React, { useState, useEffect } from "react";
import BoardOperations from "./BoardOperations";
import { BoardView } from "./BoardView";
import { BoardProvider } from "../context/BoardContext";
import { FunilComEtapas } from "@/types/global";
import { FunisService } from "@/services/funisService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";

export default function BoardContent() {
  
  const { toast } = useToast();
  const [selectedFunil, setSelectedFunil] = useState<FunilComEtapas | null>(null);
  const [funis, setFunis] = useState<FunilComEtapas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadFunis();
  }, []);

  const loadFunis = async () => {
    try {
      console.log('BoardContent: loadFunis iniciado');
      setLoading(true);
      const funisData = await FunisService.getFunis();
      console.log('BoardContent: funisData recebido:', funisData);
      
      // Buscar etapas para cada funil
      const funisComEtapas = await Promise.all(
        funisData.map(async (funil) => {
          const funilCompleto = await FunisService.getFunilComEtapas(funil.id);
          return funilCompleto || { ...funil, etapas: [] };
        })
      );

      console.log('BoardContent: funisComEtapas processado:', funisComEtapas);
      setFunis(funisComEtapas);
      
      // Se não há funis, mostrar formulário de criação
      if (funisComEtapas.length === 0) {
        console.log('BoardContent: Nenhum funil encontrado, definindo showCreateForm = true');
        setShowCreateForm(true);
      } else {
        // Só selecionar automaticamente se não houver funil selecionado
        if (!selectedFunil) {
          // Buscar funil padrão primeiro
          const funilPadrao = funisComEtapas.find(funil => funil.id_funil_padrao);
          
          if (funilPadrao) {
            console.log('BoardContent: Funil padrão encontrado, selecionando:', funilPadrao.nome);
            setSelectedFunil(funilPadrao);
          } else {
            // Se não há funil padrão, selecionar o primeiro funil
            console.log('BoardContent: Nenhum funil padrão encontrado, selecionando o primeiro');
            setSelectedFunil(funisComEtapas[0]);
          }
        }
      }
    } catch (error) {
      console.error('BoardContent: Erro ao carregar funis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFunilChange = (funil: FunilComEtapas | null) => {
    setSelectedFunil(funil);
  };

  const handleFunilCreated = async () => {
    // Recarregar a lista de funis quando um novo funil é criado
    await loadFunis();
    // O funil criado já será selecionado automaticamente pelo BoardOperations
  };

  const handleFunilUpdated = async () => {
    // Recarregar a lista de funis quando um funil é atualizado
    await loadFunis();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando funis...</p>
        </div>
      </div>
    );
  }

  // Se não há funis, mostrar tela de criação
  if (funis.length === 0 && !showCreateForm) {
    console.log('BoardContent: Não há funis, mostrando tela de criação');
    console.log('BoardContent: showCreateForm =', showCreateForm);
    
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum funil criado ainda
          </h3>
          <p className="text-gray-600 mb-4">
            Para começar a usar o CRM, você precisa criar seu primeiro funil de vendas.
          </p>
          <Button 
            onClick={() => {
              console.log('BoardContent: Botão clicado, definindo showCreateForm = true');
              setShowCreateForm(true);
            }} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Primeiro Funil
          </Button>
        </div>
      </div>
    );
  }

  // Se há funis mas nenhum selecionado, selecionar o primeiro
  if (!selectedFunil && funis.length > 0) {
    setSelectedFunil(funis[0]);
    return null;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <BoardOperations 
        selectedFunil={selectedFunil}
        onFunilChange={handleFunilChange}
        showCreateForm={showCreateForm}
        onShowCreateForm={setShowCreateForm}
        onFunilCreated={handleFunilCreated}
        onFunilUpdated={handleFunilUpdated}
      />
      
      {/* Sempre mostrar o BoardView quando há um funil selecionado */}
      {selectedFunil && (
        <div className="flex-1 min-h-0 h-full">
          <BoardProvider funilId={selectedFunil.id}>
            <BoardView 
              funil={selectedFunil}
              onFunilChange={handleFunilChange}
            />
          </BoardProvider>
        </div>
      )}
    </div>
  );
}
