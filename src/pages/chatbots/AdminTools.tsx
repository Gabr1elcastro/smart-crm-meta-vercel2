import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Trash, RefreshCw, AlertCircle } from 'lucide-react';

// Default types that should exist in the database
const DEFAULT_TYPES = [
  { id: 1, nome: "Infoprodutores" },
  { id: 2, nome: "Escritórios de Advocacia" },
  { id: 3, nome: "Mentor / Professor" },
  { id: 4, nome: "Clinica de Estética" },
  { id: 5, nome: "Clinica Médica" },
  { id: 6, nome: "Marketing Digital" },
  { id: 7, nome: "Imobiliária" },
  { id: 8, nome: "Serviços Financeiros" },
  { id: 9, nome: "Hotéis" },
  { id: 10, nome: "Construir do Zero" }
];

export function AdminTools() {
  const [promptTypes, setPromptTypes] = useState<{id: number, nome: string}[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [hasError, setHasError] = useState(false);

  // Buscar tipos existentes ao carregar
  useEffect(() => {
    loadPromptTypes();
  }, []);

  const loadPromptTypes = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      console.log('Verificando se a tabela prompts_type existe...');
      
      // Tentar fazer uma contagem simples para verificar se a tabela existe
      const { count, error: countError } = await supabase
        .from('prompts_type')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Erro ao verificar existência da tabela:', countError);
        setTableExists(false);
      } else {
        console.log('Tabela existe, contagem:', count);
        setTableExists(true);
      }
      
      // Buscar os tipos da tabela
      const { data, error } = await supabase
        .from('prompts_type')
        .select('id, nome')
        .order('id', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tipos de prompt:', error);
        toast.error('Falha ao carregar tipos de prompt');
        setHasError(true);
        
        // Se a tabela não existir, criar com os tipos padrão
        if (!tableExists) {
          console.log('Criando tabela prompts_type com tipos padrão...');
          
          const defaultTypes = [
            { id: 1, nome: "Infoprodutores" },
            { id: 2, nome: "Escritórios de Advocacia" },
            { id: 3, nome: "Mentor / Professor" },
            { id: 4, nome: "Clinica de Estética" },
            { id: 5, nome: "Clinica Médica" },
            { id: 6, nome: "Marketing Digital" },
            { id: 7, nome: "Imobiliária" },
            { id: 8, nome: "Serviços Financeiros" },
            { id: 9, nome: "Hotéis" },
            { id: 10, nome: "Negócios Digitais" },
            { id: 11, nome: "Criar do zero" }
          ];
        }
      } else {
        console.log('Tipos de prompt carregados:', data);
        setPromptTypes(data || []);
      }
    } catch (error) {
      console.error('Exceção ao buscar tipos de prompt:', error);
      toast.error('Erro ao carregar tipos de prompt');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error('O nome do tipo não pode estar vazio');
      return;
    }

    setIsAdding(true);
    try {
      // Determine o próximo ID (pode ser necessário mudar se a tabela tiver uma sequência)
      const nextId = promptTypes.length > 0 
        ? Math.max(...promptTypes.map(t => t.id)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('prompts_type')
        .insert([{ id: nextId, nome: newTypeName.trim() }])
        .select();

      if (error) {
        console.error('Erro ao adicionar tipo de prompt:', error);
        toast.error(`Falha ao adicionar tipo: ${error.message}`);
      } else {
        console.log('Tipo de prompt adicionado:', data);
        toast.success('Tipo de prompt adicionado com sucesso');
        setNewTypeName('');
        await loadPromptTypes(); // Recarregar a lista
      }
    } catch (error) {
      console.error('Exceção ao adicionar tipo de prompt:', error);
      toast.error('Erro ao adicionar tipo de prompt');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveType = async (id: number) => {
    if (!confirm(`Tem certeza que deseja excluir este tipo de prompt?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('prompts_type')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover tipo de prompt:', error);
        toast.error(`Falha ao remover tipo: ${error.message}`);
      } else {
        console.log('Tipo de prompt removido:', id);
        toast.success('Tipo de prompt removido com sucesso');
        await loadPromptTypes(); // Recarregar a lista
      }
    } catch (error) {
      console.error('Exceção ao remover tipo de prompt:', error);
      toast.error('Erro ao remover tipo de prompt');
    }
  };

  const handleCreateTable = async () => {
    if (!confirm('Tem certeza que deseja criar a tabela prompts_type?')) {
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro tenta a função RPC personalizada (se existir no seu Supabase)
      console.log('Tentando criar tabela via RPC...');
      
      try {
        const { error: rpcError } = await supabase.rpc('create_prompts_type_table');
        
        if (rpcError) {
          console.error('Erro ao criar tabela via RPC:', rpcError);
          console.log('RPC falhou, tentando método alternativo...');
          throw rpcError; // Forçar a ir para o método alternativo
        } else {
          console.log('Tabela criada com sucesso via RPC');
          toast.success('Tabela criada com sucesso');
          await loadPromptTypes();
          return;
        }
      } catch (rpcErr) {
        // Continuar para o método alternativo
        console.log('Passando para método alternativo após falha RPC');
      }
      
      // Método alternativo: inserir tipos padrão diretamente
      toast.info('Tentando criar tabela via API...');
      await insertDefaultTypes();
      
    } catch (error) {
      console.error('Exceção ao criar tabela:', error);
      toast.error('Erro ao criar tabela');
    } finally {
      setIsLoading(false);
    }
  };
  
  const insertDefaultTypes = async () => {
    try {
      toast.info('Inserindo tipos padrão...');
      
      const { error } = await supabase
        .from('prompts_type')
        .insert(DEFAULT_TYPES);
        
      if (error) {
        console.error('Erro ao inserir tipos padrão:', error);
        
        // Tentar inserir um por um para ver se algum funciona
        let someSuccess = false;
        
        for (const type of DEFAULT_TYPES) {
          try {
            const { error: singleError } = await supabase
              .from('prompts_type')
              .insert([type]);
              
            if (!singleError) {
              someSuccess = true;
              console.log(`Tipo ${type.id} inserido com sucesso: ${type.nome}`);
            }
          } catch (e) {
            console.error(`Erro ao inserir tipo ${type.id}:`, e);
          }
        }
        
        if (someSuccess) {
          toast.success('Alguns tipos foram inseridos com sucesso');
        } else {
          toast.error('Falha ao inserir tipos padrão');
        }
      } else {
        console.log('Tipos padrão inseridos com sucesso');
        toast.success('Tipos padrão inseridos com sucesso');
      }
      
      await loadPromptTypes();
    } catch (error) {
      console.error('Exceção ao inserir tipos padrão:', error);
      toast.error('Erro ao inserir tipos padrão');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Administração de Tipos de Chatbot</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando...</span>
          </div>
        ) : (
          <>
            {promptTypes.length === 0 ? (
              <div className="text-center py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 mx-auto max-w-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                    <p className="text-amber-800 font-medium">Nenhum tipo de chatbot encontrado</p>
                  </div>
                  <p className="text-amber-700 mt-1 text-sm">
                    A tabela prompts_type parece estar vazia ou não existe. Insira os tipos padrão para permitir a criação de chatbots.
                  </p>
                </div>
                <Button 
                  onClick={handleCreateTable}
                  className="mx-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Processando...
                    </>
                  ) : (
                    <>
                      Criar Tabela e Inserir Tipos Padrão
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Tipos Disponíveis</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadPromptTypes}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
                  </Button>
                </div>
                <div className="space-y-2">
                  {promptTypes.map(type => (
                    <div key={type.id} className="flex items-center justify-between border p-2 rounded">
                      <div>
                        <span className="font-medium">{type.id}.</span> {type.nome}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveType(type.id)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddType} className="mt-8 space-y-4">
              <h3 className="text-lg font-medium">Adicionar Novo Tipo</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeName">Nome do Tipo</Label>
                  <Input
                    id="typeName"
                    placeholder="Ex: Loja Virtual"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Tipo
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={loadPromptTypes} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Atualizar Lista
        </Button>
        {promptTypes.length > 0 && (
          <Button variant="outline" onClick={insertDefaultTypes} disabled={isLoading}>
            Restaurar Tipos Padrão
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 