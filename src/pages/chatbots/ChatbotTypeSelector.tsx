import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PromptType {
  id: number;
  nome: string;
  description?: string;
}

interface ChatbotTypeSelectorProps {
  onSelectType: (typeId: number) => void;
  onCancel: () => void;
}

// Default prompt types to use as a fallback if DB query fails
// Comentado temporariamente - mostrando apenas "Criar do zero"
const DEFAULT_PROMPT_TYPES: PromptType[] = [
  // { id: 1, nome: "Infoprodutores", description: "Fornece informações completas e persuasivas sobre infoprodutos, destacando benefícios, resultados e condições de compra." },
  // { id: 2, nome: "Escritórios de Advocacia", description: "Fornece informações claras sobre serviços jurídicos, áreas de atuação e agendamento de consultas." },
  // { id: 3, nome: "Mentor / Professor", description: "Fornece informações claras, motivadoras e inspiradoras sobre serviços de mentoria, consultoria ou cursos." },
  // { id: 4, nome: "Clinica de Estética", description: "Fornece informações claras sobre procedimentos estéticos, preços, profissionais e agendamentos." },
  // { id: 5, nome: "Clinica Médica", description: "Fornece informações sobre serviços médicos, especialidades, convênios e agendamentos." },
  // { id: 6, nome: "Marketing Digital", description: "Fornece informações estratégicas sobre serviços de marketing digital e tráfego pago." },
  // { id: 7, nome: "Imobiliária", description: "Fornece informações personalizadas sobre imóveis, financiamento e processos de compra/venda." },
  // { id: 8, nome: "Serviços Financeiros", description: "Fornece informações sobre produtos e serviços financeiros, auxiliando na escolha das melhores soluções." },
  // { id: 9, nome: "Hotéis", description: "Fornece informações detalhadas sobre acomodações, serviços, tarifas e políticas para hóspedes." },
  // { id: 10, nome: "Negócios Digitais", description: "Assistente virtual especializado para negócios digitais e empreendedorismo online." },
  { id: 11, nome: "Criar do zero", description: "Crie um chatbot personalizado sem modelo predefinido, com total liberdade para configuração." }
];

const ChatbotTypeSelector: React.FC<ChatbotTypeSelectorProps> = ({ onSelectType, onCancel }) => {
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch prompt types from Supabase when component mounts
  useEffect(() => {
    const fetchPromptTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setUsingFallback(false);
        
        console.log("Iniciando busca de tipos de prompt...");
        
        // First try - standard query
        const { data, error } = await supabase
          .from('prompts_type')
          .select('id, nome')
          .order('id', { ascending: true });

        if (error) {
          console.error("Erro ao buscar tipos de prompt:", error);
          
          // Try a simple count query to verify table access
          console.log("Tentando consulta alternativa...");
          const testResult = await supabase.from('prompts_type').select('count');
          console.log("Resultado do teste:", testResult);
          
          // Use default types as fallback
          console.log("Usando tipos padrão como fallback devido ao erro");
          setPromptTypes(DEFAULT_PROMPT_TYPES);
          setUsingFallback(true);
          return;
        }

        console.log("Tipos de prompt recebidos:", data);
        
        if (!data || data.length === 0) {
          console.warn("Nenhum tipo de prompt encontrado na tabela prompts_type");
          console.log("Usando tipos padrão como fallback devido à tabela vazia");
          setPromptTypes(DEFAULT_PROMPT_TYPES);
          setUsingFallback(true);
          return;
        }

        // Add descriptions to each prompt type and filter only "Criar do zero"
        const enhancedTypes = data
          .filter(type => type.nome?.toLowerCase() === "criar do zero")
          .map(type => {
            let description = "Crie um chatbot personalizado sem modelo predefinido, com total liberdade para configuração.";
            
            return {
              ...type,
              description
            };
          });
        
        console.log("Tipos de prompt processados:", enhancedTypes);
        setPromptTypes(enhancedTypes);
      } catch (error) {
        console.error("Error fetching prompt types:", error);
        setError(`Erro ao carregar tipos de chatbot: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        toast.error("Erro ao carregar tipos de chatbot");
        
        // Use default types as fallback in case of error
        console.log("Usando tipos padrão como fallback devido à exceção");
        setPromptTypes(DEFAULT_PROMPT_TYPES);
        setUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromptTypes();
  }, []);

  // Ensure only "Criar do zero" option is displayed
  const ensureCreateFromScratchOption = () => {
    // Filter only "Criar do zero" from the database results
    const createFromScratchTypes = promptTypes.filter(type => 
      type.nome?.toLowerCase() === "criar do zero");
    
    // Se já tivermos "Criar do zero" no banco, retornamos apenas ele
    if (createFromScratchTypes.length > 0) {
      return createFromScratchTypes;
    }
    
    // Se não tivermos "Criar do zero" no banco, retornamos apenas ele do DEFAULT
    return [
      { 
        id: 11, 
        nome: "Criar do zero", 
        description: "Crie um chatbot personalizado sem modelo predefinido, com total liberdade para configuração." 
      }
    ];
  };

  const displayTypes = ensureCreateFromScratchOption();
  console.log("Tipos que serão exibidos:", displayTypes);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selecione um tipo de chatbot</CardTitle>
        <CardDescription>
          Crie seu chatbot personalizado do zero com total liberdade para configuração
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando tipos de chatbot...</span>
          </div>
        ) : error && !usingFallback ? (
          <div className="flex flex-col justify-center items-center h-[400px] text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 max-w-md">
              <p className="text-amber-800 font-medium">Erro ao carregar tipos</p>
              <p className="text-amber-700 text-sm mt-1">{error}</p>
            </div>
            
            {/* Comentado temporariamente - mostrando apenas "Criar do zero" */}
            {/* <div 
              className="flex flex-col border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors mt-4 max-w-md"
              onClick={() => onSelectType(10)}
            >
              <Label className="font-medium text-base">Negócios Digitais</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Assistente virtual especializado para negócios digitais e empreendedorismo online.
              </p>
            </div> */}
            
            <div 
              className="flex flex-col border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors mt-4 max-w-md"
              onClick={() => onSelectType(11)}
            >
              <Label className="font-medium text-base">Criar do zero</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um chatbot personalizado sem modelo predefinido, com total liberdade para configuração.
              </p>
            </div>
          </div>
        ) : (
          <>
            {usingFallback && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-4">
                <p className="text-blue-700 text-sm">Usando lista de tipos padrão. Alguns tipos podem não estar disponíveis no banco de dados.</p>
              </div>
            )}
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 gap-4">
                {displayTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum tipo de chatbot disponível.</p>
                    <p className="mt-2">Você ainda pode criar um chatbot do zero.</p>
                  </div>
                ) : (
                  displayTypes.map(type => (
                    <div 
                      key={type.id}
                      className="flex flex-col border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onSelectType(type.id)}
                    >
                      <Label className="font-medium text-base">{type.nome}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </CardFooter>
    </Card>
  );
};

export default ChatbotTypeSelector; 