import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Info, Sparkles, MessageSquare, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { clientesService } from '@/services/clientesService';
import { toast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    //annual: number;//
  };
  features: string[];
  popular?: boolean;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
  mostRequested?: boolean;
}

const Plans: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'individual' | 'agencies'>('individual');

  // Buscar informações do cliente
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!user?.id_cliente) return;
      
      try {
        const info = await clientesService.getClienteByIdCliente(user.id_cliente);
        setClientInfo(info);
      } catch (error) {
        console.error('Erro ao buscar informações do cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, [user?.id_cliente]);

  // Proteção: apenas usuários Trial podem acessar esta página
  useEffect(() => {
    if (!loading && clientInfo) {
      const isTrial = clientInfo.trial === true;
      if (!isTrial) {
        // Se não está no Trial, redirecionar para o dashboard
        navigate('/');
      }
    }
  }, [loading, clientInfo, navigate]);

  // Planos para Individual
  const individualPlans: Plan[] = [
    {
      id: 'solo',
      name: 'Start',
      description: 'Para começar a rastrear seus leads',
      price: {
        monthly: 197.00,
        //annual: 129.90//
      },
      features: [
        '1 chip',
        'Agente de IA',
        'Chatbot',
        'Leads ilimitados',
        'Disparo em massa ilimitados',
        'Até 2 atendentes',
        'Rastreio automático de leads',
        'API de Conversão',
        'Relatórios gerenciais',
        'Conexão Google Agenda',
        'Conexão Instagram',
        'Clientes extras: R$197,00/mês'
      ],
      popular: false,
      color: 'bg-gray-100',
      icon: Sparkles
    },
    {
      id: 'solo-chat',
      name: 'Pro',
      description: 'Com atendimento em tempo real integrado',
      price: {
        monthly: 297.00,
        //annual: 199.90//
      },
      features: [
        '1 chip',
        'Agente de IA',
        'Chatbot',
        'Leads ilimitados',
        'Disparo em massa ilimitados',
        'Até 5 atendentes',
        'Rastreio automático de leads',
        'API de conversão ',
        'Relatórios gerenciais',
        'Conexão Google Agenda',
        'Conexão Instagram',
        'API Oficial',
        'CRM Kanban',
        'Clientes extras: R$297,00/mês'

      ],
      popular: false,
      mostRequested: true,
      color: 'bg-purple-600',
      icon: MessageSquare
    }
  ];

  // Planos para Agências
  const agencyPlans: Plan[] = [
    {
      id: 'start',
      name: 'Start',
      description: 'Para agências que estão começando',
      price: {
        monthly: 467.00,
        //annual: 219.90//
      },
      features: [
        '1 chip',
        'Agente de IA',
        'Chatbot',
        'Leads ilimitados',
        'Disparo em massa ilimitados',
        'Até 2 atendentes',
        'Rastreio automático de leads',
        'API de conversão',
        'Relatórios gerenciais',
        'Conexão Google Agenda',
        'Conexão Instagram',
        '3 clientes',
        'Clientes extras: R$157,00/mês'
      ],
      popular: false,
      color: 'bg-gray-100',
      icon: Building2
    },
    {
      id: 'pro-chat',
      name: 'PRO',
      description: 'Com atendimento em tempo real integrado',
      price: {
        monthly: 697.00,
        //annual: 379.90//
      },
      features: [
        '1 chip',
        'Agente de IA',
        'Chatbot',
        'Leads ilimitados',
        'Disparo em massa ilimitados',
        'Até 5 atendentes',
        'Rastreio automático de leads',
        'API de conversão',
        'Relatórios gerenciais',
        'Conexão Google Agenda',
        'Conexão Instagram',
        '3 clientes',
        'API Oficial',
        'CRM Kanban',
        'Clientes extras: R$233,00/mês'
      ],
      popular: false,
      mostRequested: true,
      color: 'bg-purple-600',
      icon: MessageSquare
    }
  ];

  const plans = selectedTab === 'individual' ? individualPlans : agencyPlans;

  const handlePlanSelection = async (planId: string) => {
    if (!user?.id_cliente) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive"
      });
      return;
    }

    try {
      // Links de checkout Asaas por plano
      const checkoutLinks: Record<string, string | null> = {
        'premium': 'https://buy.stripe.com/4gM14m7846vU3ONb5y9Ve0a',
        // Individual: 129,90 e 199,90
        'solo': 'https://www.asaas.com/c/w6y8tv4gejdldrpu',
        'solo-chat': 'https://www.asaas.com/c/4leyq08tomkfv2p6',
        // Agência: 219,90 e 379,90
        'start': 'https://www.asaas.com/c/9k6sah4aa3m77x6u',
        'pro-chat': 'https://www.asaas.com/c/08sp6407srlakf5j',
        'enterprise': null
      };

      const checkoutLink = checkoutLinks[planId];

      if (checkoutLink) {
        window.open(checkoutLink, '_blank');
        
        toast({
          title: "Redirecionando...",
          description: `Você será redirecionado para finalizar a assinatura do plano.`,
        });
      } else {
        // Para planos sem link do Stripe, mostrar mensagem
        console.log(`Plano selecionado: ${planId}`);
        
        toast({
          title: "Plano selecionado",
          description: `Você selecionou o plano ${planId}. Em breve entraremos em contato para finalizar a assinatura.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar seleção do plano",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCurrentPlan = () => {
    if (!clientInfo) return null;
    
    // ✅ NOVA LÓGICA: Trial tem acesso completo, depois apenas Premium
    if (clientInfo.trial) return 'trial';
    if (clientInfo.plano_agentes || clientInfo.plano_pro || clientInfo.plano_plus || clientInfo.plano_starter) return 'premium';
    return null;
  };

  // Remover a função getAvailableUpgradePlans - vamos mostrar todos os planos



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  // Se não está no Trial, não renderizar nada (será redirecionado pelo useEffect)
  if (!clientInfo || !clientInfo.trial) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header com plano atual */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          {currentPlan && (
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              <span>Plano Atual:</span>
              <span className="font-bold">
                {currentPlan === 'trial' ? 'Trial' : 
                 currentPlan === 'premium' ? 'Premium' : currentPlan}
              </span>
            </div>
          )}
        </div>

        {/* Seletor de Abas */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setSelectedTab('individual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'individual'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setSelectedTab('agencies')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'agencies'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Para Agências
            </button>
          </div>
        </div>

        {/* Cards dos Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const monthlyPrice = plan.price.monthly;
            const isDarkCard = plan.color === 'bg-purple-600';
            const IconComponent = plan.icon || Sparkles;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
                  isDarkCard 
                    ? 'bg-gradient-to-b from-purple-600 to-purple-700 text-white border-purple-500 shadow-lg' 
                    : 'bg-white border-gray-200'
                } ${isCurrentPlan ? 'ring-2 ring-purple-500' : ''}`}
              >
                {plan.mostRequested && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className={`${isDarkCard ? 'bg-purple-500 text-white' : 'bg-purple-500 text-white'} px-3 py-1 rounded-full`}>
                      Mais Pedido
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      Seu Plano
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDarkCard ? 'bg-purple-500' : 'bg-purple-50 border border-purple-200'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isDarkCard ? 'text-white' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`text-2xl font-bold ${isDarkCard ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </CardTitle>
                      <CardDescription className={isDarkCard ? 'text-gray-300' : 'text-gray-600'}>
                        {plan.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col h-full">
                  <div className="flex-1 space-y-6">
                    {/* Preço */}
                    <div>
                      <div className={`flex items-baseline ${isDarkCard ? 'text-white' : 'text-gray-900'}`}>
                        <span className="text-4xl font-bold">
                          {formatPrice(monthlyPrice)}
                        </span>
                        <span className={`text-lg ml-1 ${isDarkCard ? 'text-gray-300' : 'text-gray-500'}`}>/mês</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            isDarkCard ? 'text-white' : 'text-green-500'
                          }`} />
                          <span className={`text-sm ${isDarkCard ? 'text-gray-200' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botão - sempre na parte inferior */}
                  <div className="pt-6 mt-auto">
                    {isCurrentPlan ? (
                      <Button 
                        variant="outline" 
                        className={`w-full ${isDarkCard ? 'border-purple-400 text-white hover:bg-purple-700' : 'border-purple-500 text-purple-600'}`}
                        disabled
                      >
                        Plano Atual
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handlePlanSelection(plan.id)}
                        className={`w-full ${
                          isDarkCard 
                            ? 'bg-white text-purple-600 hover:bg-gray-50 font-semibold' 
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        }`}
                      >
                        Assinar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Seção Enterprise */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
              <CardDescription className="text-gray-300">
                Precisa de uma solução personalizada para sua empresa? Nós podemos ajudar!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Recursos ilimitados e personalizados</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Integrações específicas para seu negócio</span>
                </div>
              </div>
              
                             <Button 
                 className="bg-white text-gray-900 hover:bg-gray-100 border-white"
                 onClick={() => window.open('https://api.whatsapp.com/send/?phone=5511965117876', '_blank')}
               >
                 Fale com um Consultor
                 <ArrowRight className="h-4 w-4 ml-2" />
               </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Info className="h-5 w-5" />
            <span>Dúvidas? Fale Conosco no WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans; 