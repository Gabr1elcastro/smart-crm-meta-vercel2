export type NodeType = 
  | 'texto' 
  | 'audio' 
  | 'imagem' 
  | 'video'
  | 'documento'
  | 'menuBotoes' 
  | 'menuNumerico'
  | 'condicional'
  | 'finalizarConversa'
  | 'pergunta'
  | 'randomizador'
  | 'redirecionamento'
  | 'requisicaoHTTP'
  | 'scriptJS'
  | 'switchVariavel'
  | 'inicio';

export interface FlowNode {
  id: string;
  type: NodeType;
  data: {
    label: string;
    content?: string;
    options?: { label: string; value: string }[];
    condition?: string;
    url?: string;
    script?: string;
    variable?: string;
  };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ChatbotConfig {
  id?: number | string;
  nome: string;
  nome_empresa: string;
  descricao_empresa: string;
  endereco: string;
  descricao_produto: string;
  modulos: string;
  diferenciais: string;
  garantia: string;
  precos_condicoes: string;
  acesso: string;
  suporte_contato: string;
  type: 'ia' | 'fluxo';
  active: boolean;
  inUse?: boolean;
  lastEdited: string;
  gptModel?: string;
  apiKey?: string; 
  temperature?: number;
  prompt?: string;
  botType?: string;
  promptTypeId?: number;
  promptTypeName?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}
