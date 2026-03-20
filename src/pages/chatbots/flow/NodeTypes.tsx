
import { 
  MessageSquare, 
  AudioLines, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  ListOrdered, 
  List, 
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
import { NodeType } from "../types";

interface NodeTypeItem {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  category: 'mensagem' | 'menu' | 'acao';
}

export const nodeTypes: NodeTypeItem[] = [
  { type: 'inicio', label: 'Início', icon: <Play className="h-4 w-4 text-green-500" />, category: 'acao' },
  { type: 'texto', label: 'Texto', icon: <MessageSquare className="h-4 w-4 text-blue-500" />, category: 'mensagem' },
  { type: 'audio', label: 'Áudio', icon: <AudioLines className="h-4 w-4 text-purple-500" />, category: 'mensagem' },
  { type: 'imagem', label: 'Imagem', icon: <ImageIcon className="h-4 w-4 text-pink-500" />, category: 'mensagem' },
  { type: 'video', label: 'Vídeo', icon: <Video className="h-4 w-4 text-red-500" />, category: 'mensagem' },
  { type: 'documento', label: 'Documento', icon: <FileText className="h-4 w-4 text-orange-500" />, category: 'mensagem' },
  { type: 'menuBotoes', label: 'Menu de botões', icon: <List className="h-4 w-4 text-emerald-500" />, category: 'menu' },
  { type: 'menuNumerico', label: 'Menu numérico', icon: <ListOrdered className="h-4 w-4 text-cyan-500" />, category: 'menu' },
  { type: 'condicional', label: 'Condicional', icon: <GitBranch className="h-4 w-4 text-amber-500" />, category: 'acao' },
  { type: 'finalizarConversa', label: 'Finalizar conversa', icon: <XSquare className="h-4 w-4 text-rose-500" />, category: 'acao' },
  { type: 'pergunta', label: 'Pergunta', icon: <HelpCircle className="h-4 w-4 text-violet-500" />, category: 'acao' },
  { type: 'randomizador', label: 'Randomizador', icon: <Shuffle className="h-4 w-4 text-indigo-500" />, category: 'acao' },
  { type: 'redirecionamento', label: 'Redirecionar', icon: <CornerDownRight className="h-4 w-4 text-blue-400" />, category: 'acao' },
  { type: 'requisicaoHTTP', label: 'Requisição HTTP', icon: <Globe className="h-4 w-4 text-teal-500" />, category: 'acao' },
  { type: 'scriptJS', label: 'Script JS', icon: <Code className="h-4 w-4 text-yellow-500" />, category: 'acao' },
  { type: 'switchVariavel', label: 'Switch variável', icon: <ToggleLeft className="h-4 w-4 text-lime-500" />, category: 'acao' },
];
