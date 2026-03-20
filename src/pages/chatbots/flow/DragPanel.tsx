
import React from 'react';
import { nodeTypes } from './NodeTypes';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

export function DragPanel() {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-60 shadow-lg bg-white p-0">
      <Tabs defaultValue="mensagem" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="mensagem">Mensagem</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="acao">Ação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mensagem" className="p-2 space-y-2">
          {nodeTypes
            .filter(node => node.category === 'mensagem')
            .map(node => (
              <div
                key={node.type}
                className="border rounded-md p-2 cursor-move hover:bg-gray-50 flex gap-2 items-center text-sm"
                onDragStart={(event) => onDragStart(event, node.type, node.label)}
                draggable
              >
                {node.icon}
                {node.label}
              </div>
            ))}
        </TabsContent>
        
        <TabsContent value="menu" className="p-2 space-y-2">
          {nodeTypes
            .filter(node => node.category === 'menu')
            .map(node => (
              <div
                key={node.type}
                className="border rounded-md p-2 cursor-move hover:bg-gray-50 flex gap-2 items-center text-sm"
                onDragStart={(event) => onDragStart(event, node.type, node.label)}
                draggable
              >
                {node.icon}
                {node.label}
              </div>
            ))}
        </TabsContent>
        
        <TabsContent value="acao" className="p-2 space-y-2">
          {nodeTypes
            .filter(node => node.category === 'acao')
            .map(node => (
              <div
                key={node.type}
                className="border rounded-md p-2 cursor-move hover:bg-gray-50 flex gap-2 items-center text-sm"
                onDragStart={(event) => onDragStart(event, node.type, node.label)}
                draggable
              >
                {node.icon}
                {node.label}
              </div>
            ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
