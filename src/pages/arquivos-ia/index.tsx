import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Globe, Upload, X, Trash2, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth';
import { DocumentosCatalogoService, DocumentoCatalogo } from '@/services/documentosCatalogoService';
import { toast } from 'sonner';

// Remover interface antiga - agora usando DocumentoCatalogo do serviço

export default function ArquivosIAPage() {
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoCatalogo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar documentos do cliente ao montar o componente
  useEffect(() => {
    if (user?.id) {
      carregarDocumentos();
    }
  }, [user?.id]);

  // Verificar e criar bucket se necessário
  useEffect(() => {
    DocumentosCatalogoService.verificarBucket();
  }, []);

  const carregarDocumentos = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const docs = await DocumentosCatalogoService.listarDocumentosCliente(parseInt(user.id));
      setDocumentos(docs);
    } catch (error) {
      console.error('❌ Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tipo: 'xml' | 'xls') => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    
    try {
      const resultado = await DocumentosCatalogoService.uploadArquivo(
        file, 
        parseInt(user.id)
      );
      
      if (resultado.success && resultado.documento) {
        setDocumentos(prev => [resultado.documento!, ...prev]);
        toast.success('Arquivo enviado com sucesso!');
        console.log('✅ Arquivo enviado:', resultado.documento);
      } else {
        toast.error(resultado.error || 'Erro ao enviar arquivo');
        console.error('❌ Erro no upload:', resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleWebsiteSubmit = async (url: string) => {
    if (!url.trim() || !user?.id) return;

    try {
      const resultado = await DocumentosCatalogoService.adicionarWebsite(
        url, 
        parseInt(user.id)
      );
      
      if (resultado.success && resultado.documento) {
        setDocumentos(prev => [resultado.documento!, ...prev]);
        toast.success('Website adicionado com sucesso!');
        console.log('✅ Website adicionado:', resultado.documento);
      } else {
        toast.error(resultado.error || 'Erro ao adicionar website');
        console.error('❌ Erro ao adicionar website:', resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao adicionar website');
    }
  };

  const removeDocumento = async (id: number) => {
    try {
      const success = await DocumentosCatalogoService.removerDocumento(id);
      if (success) {
        setDocumentos(prev => prev.filter(doc => doc.id !== id));
        toast.success('Documento removido com sucesso!');
      } else {
        toast.error('Erro ao remover documento');
      }
    } catch (error) {
      console.error('❌ Erro ao remover documento:', error);
      toast.error('Erro ao remover documento');
    }
  };

  const getStatusBadge = (status: DocumentoCatalogo['status']) => {
    const variants = {
      'Pendente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Processando': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Concluído': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Erro': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <Badge className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'xml':
        return <FileText className="w-4 h-4" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Verificar se há documentos pendentes
  const temDocumentosPendentes = documentos.some(doc => doc.status === 'Pendente');

  return (
    <div className="container mx-auto p-6 space-y-6">
             {/* Header */}
       <div className="text-center space-y-2">
         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
           Arquivos para IA
         </h1>
         <p className="text-gray-600 dark:text-gray-400">
           Treine sua IA com diferentes tipos de conteúdo
         </p>
       </div>

       {/* Banner de Documentos Pendentes */}
       {temDocumentosPendentes && (
         <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
           <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
           <AlertDescription className="text-blue-800 dark:text-blue-200">
             <span className="font-medium">Você possui documentos em análise.</span> Em breve serão liberados ou o suporte entrará em contato com você.
           </AlertDescription>
         </Alert>
       )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card XML */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setSelectedCard('xml')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-lg">Arquivo XML</CardTitle>
            <CardDescription>
              Carregue arquivos XML para treinar a IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.filter(doc => doc.tipo === 'xml').map(documento => (
                  <div key={documento.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(documento.tipo)}
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {documento.tipo === 'website' ? documento.link : 'Arquivo XML'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {documento.created_at ? new Date(documento.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
                        {getStatusBadge(documento.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {documento.url_arquivo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(documento.url_arquivo, '_blank');
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (documento.id) removeDocumento(documento.id);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {documentos.filter(doc => doc.tipo === 'xml').length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Nenhum arquivo XML encontrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card XLS */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setSelectedCard('xls')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-lg">Arquivo XLS</CardTitle>
            <CardDescription>
              Carregue planilhas Excel para treinar a IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.filter(doc => ['xls', 'xlsx', 'csv'].includes(doc.tipo.toLowerCase())).map(documento => (
                  <div key={documento.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(documento.tipo)}
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {documento.tipo === 'website' ? documento.link : `Arquivo ${documento.tipo.toUpperCase()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {documento.created_at ? new Date(documento.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
                        {getStatusBadge(documento.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {documento.url_arquivo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(documento.url_arquivo, '_blank');
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (documento.id) removeDocumento(documento.id);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {documentos.filter(doc => ['xls', 'xlsx', 'csv'].includes(doc.tipo.toLowerCase())).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Nenhum arquivo Excel encontrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Website */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setSelectedCard('website')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-lg">Website</CardTitle>
            <CardDescription>
              Adicione URLs de websites para treinar a IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.filter(doc => doc.tipo === 'website').map(documento => (
                  <div key={documento.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(documento.tipo)}
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {documento.link || 'Website'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {documento.created_at ? new Date(documento.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
                        {getStatusBadge(documento.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {documento.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(documento.link, '_blank');
                          }}
                          className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (documento.id) removeDocumento(documento.id);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {documentos.filter(doc => doc.tipo === 'website').length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Nenhum website encontrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Upload */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCard === 'xml' && 'Carregar Arquivo XML'}
                {selectedCard === 'xls' && 'Carregar Arquivo XLS'}
                {selectedCard === 'website' && 'Adicionar Website'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {selectedCard === 'website' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website-url">URL do Website</Label>
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://exemplo.com"
                    className="mt-1"
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    const input = document.getElementById('website-url') as HTMLInputElement;
                    if (input?.value) {
                      handleWebsiteSubmit(input.value);
                      input.value = '';
                      setSelectedCard(null);
                    }
                  }}
                >
                  Adicionar Website
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {selectedCard === 'xml' ? 'XML, TXT' : 'XLS, XLSX, CSV, PDF, DOC'} até 10MB
                  </p>
                </div>
                <Input
                  type="file"
                  accept={selectedCard === 'xml' ? '.xml,.txt' : '.xls,.xlsx,.csv,.pdf,.doc,.docx'}
                  onChange={(e) => {
                    handleFileUpload(e, selectedCard as 'xml' | 'xls');
                    setSelectedCard(null);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  className="w-full"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Carregando...' : 'Selecionar Arquivo'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
