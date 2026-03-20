
import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeTypes,
  Connection,
  Edge,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

import '@xyflow/react/dist/style.css';

import { nodeTypes } from './NodeTypes';
import { 
  StartNode, 
  TextNode, 
  AudioNode, 
  ImageNode, 
  VideoNode, 
  DocumentNode,
  ButtonMenuNode,
  NumericMenuNode,
  ConditionalNode,
  EndNode,
  QuestionNode,
  RandomizerNode,
  RedirectNode,
  HttpRequestNode,
  ScriptNode,
  SwitchNode
} from './FlowNodes';
import { FlowNode, FlowEdge } from '../types';
import { DragPanel } from './DragPanel';

const initialNodes: FlowNode[] = [
  {
    id: 'start',
    type: 'inicio',
    data: { label: 'Início' },
    position: { x: 250, y: 5 }
  },
];

const NODE_TYPES: NodeTypes = {
  inicio: StartNode,
  texto: TextNode,
  audio: AudioNode,
  imagem: ImageNode,
  video: VideoNode,
  documento: DocumentNode,
  menuBotoes: ButtonMenuNode,
  menuNumerico: NumericMenuNode,
  condicional: ConditionalNode,
  finalizarConversa: EndNode,
  pergunta: QuestionNode,
  randomizador: RandomizerNode,
  redirecionamento: RedirectNode,
  requisicaoHTTP: HttpRequestNode,
  scriptJS: ScriptNode,
  switchVariavel: SwitchNode,
};

interface FlowBuilderProps {
  existingNodes?: FlowNode[];
  existingEdges?: FlowEdge[];
  onSave?: (nodes: FlowNode[], edges: FlowEdge[]) => void;
}

// The internal component that uses the ReactFlow hooks
const FlowBuilderContent: React.FC<FlowBuilderProps> = ({ existingNodes, existingEdges, onSave }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(existingNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(existingEdges || []);
  
  // Use the useReactFlow hook to get access to the instance
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((edges) => addEdge({...params, animated: true}, edges));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow/label');
      
      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Use the screenToFlowPosition method from useReactFlow
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: FlowNode = {
        id: `${type}-${Date.now()}`,
        type: type as any,
        position,
        data: {
          label: label || type,
          options: type.includes('menu') ? [
            { label: 'Opção 1', value: '1' },
            { label: 'Opção 2', value: '2' }
          ] : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = () => {
    if (nodes.length === 0) {
      toast.error("O fluxo está vazio. Adicione pelo menos um nó.");
      return;
    }
    
    toast.success("Fluxo salvo com sucesso!");
    
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  return (
    <div className="h-[600px] w-full border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={NODE_TYPES}
        fitView
      >
        <Panel position="top-left">
          <DragPanel />
        </Panel>
        <Panel position="top-right">
          <Button onClick={handleSave} variant="default" size="sm" className="flex gap-2 items-center">
            <Save className="h-4 w-4" />
            Salvar Fluxo
          </Button>
        </Panel>
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
};

// Wrapper component that provides the ReactFlow context
const FlowBuilder: React.FC<FlowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent {...props} />
    </ReactFlowProvider>
  );
};

export default FlowBuilder;
