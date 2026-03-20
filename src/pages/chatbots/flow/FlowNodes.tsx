
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  MessageSquare, 
  AudioLines, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  List,
  ListOrdered, 
  GitBranch, 
  XSquare, 
  HelpCircle, 
  Shuffle, 
  CornerDownRight, 
  Globe, 
  Code, 
  ToggleLeft,
  Play 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NodeProps {
  data: {
    label: string;
    content?: string;
    options?: { label: string; value: string }[];
  };
  selected?: boolean;
}

// Componente base para nós com estilização comum
const BaseNode = ({ data, selected, children, color, icon }: NodeProps & { children?: React.ReactNode; color: string; icon: React.ReactNode }) => {
  return (
    <div className={cn(
      "px-4 py-2 shadow-md rounded-md bg-white border-2 transition-all",
      selected ? "border-primary" : `border-${color}-200`,
      "min-w-[180px]"
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-xs font-bold text-gray-700">{data.label}</div>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
};

// Nó de início
export const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="green" icon={<Play className="h-4 w-4 text-green-500" />}>
      <div className="text-xs text-gray-500">Início do fluxo</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-green-500" />
    </BaseNode>
  );
});

// Nó de texto
export const TextNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="blue" icon={<MessageSquare className="h-4 w-4 text-blue-500" />}>
      <div className="text-xs text-gray-500 truncate max-w-full">{data.content || "Mensagem de texto"}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-blue-500" />
    </BaseNode>
  );
});

// Nó de áudio
export const AudioNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="purple" icon={<AudioLines className="h-4 w-4 text-purple-500" />}>
      <div className="text-xs text-gray-500">Arquivo de áudio</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-purple-500" />
    </BaseNode>
  );
});

// Nó de imagem
export const ImageNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="pink" icon={<ImageIcon className="h-4 w-4 text-pink-500" />}>
      <div className="text-xs text-gray-500">Arquivo de imagem</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-pink-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-pink-500" />
    </BaseNode>
  );
});

// Nó de vídeo
export const VideoNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="red" icon={<Video className="h-4 w-4 text-red-500" />}>
      <div className="text-xs text-gray-500">Arquivo de vídeo</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-red-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-red-500" />
    </BaseNode>
  );
});

// Nó de documento
export const DocumentNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="orange" icon={<FileText className="h-4 w-4 text-orange-500" />}>
      <div className="text-xs text-gray-500">Arquivo de documento</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-orange-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-orange-500" />
    </BaseNode>
  );
});

// Nó de menu de botões
export const ButtonMenuNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="emerald" icon={<List className="h-4 w-4 text-emerald-500" />}>
      <div className="flex flex-col gap-1 mt-2">
        {data.options?.slice(0, 3).map((option, index) => (
          <Badge key={index} variant="outline" className="text-xs">{option.label}</Badge>
        ))}
        {(data.options?.length || 0) > 3 && (
          <div className="text-xs text-gray-400">+{(data.options?.length || 0) - 3} opções</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-emerald-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-emerald-500" />
    </BaseNode>
  );
});

// Nó de menu numérico
export const NumericMenuNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="cyan" icon={<ListOrdered className="h-4 w-4 text-cyan-500" />}>
      <div className="flex flex-col gap-1 mt-2">
        {data.options?.slice(0, 3).map((option, index) => (
          <Badge key={index} variant="outline" className="text-xs">{index + 1}. {option.label}</Badge>
        ))}
        {(data.options?.length || 0) > 3 && (
          <div className="text-xs text-gray-400">+{(data.options?.length || 0) - 3} opções</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-cyan-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-cyan-500" />
    </BaseNode>
  );
});

// Nó condicional
export const ConditionalNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="amber" icon={<GitBranch className="h-4 w-4 text-amber-500" />}>
      <div className="text-xs text-gray-500">{data.content || "Condição"}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-amber-500" />
      <Handle type="source" position={Position.Bottom} id="true" className="w-2 h-2 rounded-full bg-green-500 left-[30%]" />
      <Handle type="source" position={Position.Bottom} id="false" className="w-2 h-2 rounded-full bg-red-500 left-[70%]" />
    </BaseNode>
  );
});

// Nó de finalizar conversa
export const EndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="rose" icon={<XSquare className="h-4 w-4 text-rose-500" />}>
      <div className="text-xs text-gray-500">Finaliza o fluxo de conversa</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-rose-500" />
    </BaseNode>
  );
});

// Exporte outros nós seguindo o mesmo padrão
export const QuestionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="violet" icon={<HelpCircle className="h-4 w-4 text-violet-500" />}>
      <div className="text-xs text-gray-500">{data.content || "Pergunta"}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-violet-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-violet-500" />
    </BaseNode>
  );
});

export const RandomizerNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="indigo" icon={<Shuffle className="h-4 w-4 text-indigo-500" />}>
      <div className="text-xs text-gray-500">Distribuição aleatória</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-indigo-500" />
      <Handle type="source" position={Position.Bottom} id="option1" className="w-2 h-2 rounded-full bg-indigo-500 left-[30%]" />
      <Handle type="source" position={Position.Bottom} id="option2" className="w-2 h-2 rounded-full bg-indigo-500 left-[70%]" />
    </BaseNode>
  );
});

export const RedirectNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="blue" icon={<CornerDownRight className="h-4 w-4 text-blue-400" />}>
      <div className="text-xs text-gray-500">{data.content || "Redirecionamento"}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-blue-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-blue-400" />
    </BaseNode>
  );
});

export const HttpRequestNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="teal" icon={<Globe className="h-4 w-4 text-teal-500" />}>
      <div className="text-xs text-gray-500">{data.content || "GET request"}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-teal-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-teal-500" />
    </BaseNode>
  );
});

export const ScriptNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="yellow" icon={<Code className="h-4 w-4 text-yellow-500" />}>
      <div className="text-xs text-gray-500">Execução de script JS</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-yellow-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-full bg-yellow-500" />
    </BaseNode>
  );
});

export const SwitchNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode data={data} selected={selected} color="lime" icon={<ToggleLeft className="h-4 w-4 text-lime-500" />}>
      <div className="text-xs text-gray-500">{data.content || "Switch de variável"}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-full bg-lime-500" />
      {data.options?.slice(0, 3).map((option, idx) => (
        <Handle
          key={idx}
          type="source"
          position={Position.Bottom}
          id={`option-${idx}`}
          className="w-2 h-2 rounded-full bg-lime-500"
          style={{ left: `${25 + idx * 25}%` }}
        />
      ))}
    </BaseNode>
  );
});
