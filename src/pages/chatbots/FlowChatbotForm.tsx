
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import FlowBuilder from './flow/FlowBuilder';
import { FlowNode, FlowEdge } from './types';

interface FlowChatbotFormProps {
  onSave: (chatbot: any) => void;
  onCancel: () => void;
}

const FlowChatbotForm: React.FC<FlowChatbotFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);

  const handleSaveFlow = (flowNodes: FlowNode[], flowEdges: FlowEdge[]) => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const handleSubmit = () => {
    if (!name) {
      toast.error("O nome do chatbot é obrigatório");
      return;
    }
    
    if (nodes.length === 0) {
      toast.error("O fluxo está vazio. Adicione pelo menos um nó.");
      return;
    }
    
    const chatbot = {
      id: Date.now(),
      name,
      description,
      type: 'fluxo',
      active,
      nodes,
      edges,
      lastEdited: "Agora mesmo"
    };
    
    onSave(chatbot);
    toast.success("Chatbot com Fluxo criado com sucesso!");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Criar Chatbot com Fluxo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Chatbot</Label>
          <Input 
            id="name" 
            placeholder="Ex: FAQ Bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input 
            id="description" 
            placeholder="Descreva brevemente o propósito deste chatbot"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Switch 
            id="active" 
            checked={active}
            onCheckedChange={setActive}
          />
          <Label htmlFor="active">Ativar chatbot</Label>
        </div>
        
        <div className="space-y-2">
          <Label>Construtor de Fluxo</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste os elementos do painel da esquerda para criar seu fluxo de conversação.
          </p>
          <FlowBuilder onSave={handleSaveFlow} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>Criar Chatbot</Button>
      </CardFooter>
    </Card>
  );
};

export default FlowChatbotForm;
