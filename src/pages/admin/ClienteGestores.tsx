import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { GestorManager } from '@/components/admin/GestorManager';
import { useAuth } from '@/contexts/auth';

interface ClienteInfo {
  id: string;
  name?: string;
  email?: string;
  telefone?: string;
  created_at?: string;
  status?: string;
  plano?: string;
  id_gestor?: string[];
}

export default function ClienteGestores() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clienteId) {
      carregarClienteInfo();
    }
  }, [clienteId]);

  const carregarClienteInfo = async () => {
    if (!clienteId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('clientes_info')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) {
        console.error('Erro ao carregar cliente:', error);
        toast.error('Erro ao carregar informações do cliente');
        return;
      }

      setClienteInfo(data);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGestores = () => {
    // Recarregar informações do cliente quando gestores são atualizados
    carregarClienteInfo();
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-600">Ativo</Badge>;
      case 'suspenso':
        return <Badge variant="destructive">Suspenso</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status || 'Não definido'}</Badge>;
    }
  };

  const getPlanoBadge = (plano?: string) => {
    switch (plano?.toLowerCase()) {
      case 'premium':
        return <Badge variant="default" className="bg-purple-600">Premium</Badge>;
      case 'pro':
        return <Badge variant="default" className="bg-blue-600">Pro</Badge>;
      case 'starter':
        return <Badge variant="default" className="bg-green-600">Starter</Badge>;
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>;
      default:
        return <Badge variant="outline">{plano || 'Não definido'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando informações do cliente...</p>
        </div>
      </div>
    );
  }

  if (!clienteInfo) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Cliente não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O cliente solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              {clienteInfo.name || 'Cliente'}
            </h1>
            <p className="text-muted-foreground">Gerenciamento de gestores</p>
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Informações do Cliente
          </CardTitle>
          <CardDescription>
            Dados básicos e status do cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {clienteInfo.email || 'Não informado'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Telefone:</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {clienteInfo.telefone || 'Não informado'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Criado em:</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {clienteInfo.created_at ? formatarData(clienteInfo.created_at) : 'Não informado'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
              </div>
              <div className="ml-6">
                {getStatusBadge(clienteInfo.status)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Plano:</span>
              </div>
              <div className="ml-6">
                {getPlanoBadge(clienteInfo.plano)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Gestores:</span>
              </div>
              <div className="ml-6">
                <Badge variant="outline">
                  {clienteInfo.id_gestor?.length || 0} gestor(es)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciador de Gestores */}
      {clienteId && (
        <GestorManager
          clienteId={clienteId}
          clienteNome={clienteInfo.name}
          onUpdate={handleUpdateGestores}
        />
      )}
    </div>
  );
}




