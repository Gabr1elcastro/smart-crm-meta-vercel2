import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Componente para detectar códigos de confirmação de email na URL da raiz
 * e implementar timeout de 2 segundos para redirecionar para /login
 */
export const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Verificar se há um código na URL (confirmação de email)
    const code = searchParams.get('code');
    
    if (code) {
      console.log('📧 [EMAIL CONFIRMATION] Código de confirmação detectado na URL:', code);
      console.log('📍 [EMAIL CONFIRMATION] URL atual:', window.location.href);
      console.log('🔄 [EMAIL CONFIRMATION] Processando confirmação de e-mail...');
      
      // Tentar processar o código de confirmação
      const processConfirmationCode = async () => {
        try {
          console.log('🔄 [EMAIL CONFIRMATION] Processando código de confirmação...');
          
          // Usar exchangeCodeForSession para confirmar o email
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ [EMAIL CONFIRMATION] Erro ao processar código:', error);
            console.log('⏰ [EMAIL CONFIRMATION] Redirecionando para /login após timeout...');
            
            // Aguardar 2 segundos e redirecionar para login
            setTimeout(() => {
              console.log('🚪 [EMAIL CONFIRMATION] Redirecionando para /login');
              navigate('/login');
            }, 2000);
            return;
          }
          
          if (data.session) {
            console.log('✅ [EMAIL CONFIRMATION] Email confirmado com sucesso!');
            console.log('👤 [EMAIL CONFIRMATION] Usuário:', data.session.user.email);
            
            // Limpar a URL removendo os parâmetros de confirmação
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Comentado temporariamente - confirmação de e-mail desabilitada no Supabase
            // Redirecionar imediatamente para a página de sucesso
            // console.log('🚪 [EMAIL CONFIRMATION] Redirecionando para /email-confirmed');
            // navigate('/email-confirmed');
            
            // Redirecionar diretamente para login já que não há mais confirmação de e-mail
            console.log('🚪 [EMAIL CONFIRMATION] Redirecionando para /login');
            navigate('/login');
          } else {
            console.log('⚠️ [EMAIL CONFIRMATION] Nenhuma sessão retornada');
            setTimeout(() => {
              console.log('🚪 [EMAIL CONFIRMATION] Redirecionando para /login');
              navigate('/login');
            }, 2000);
          }
          
        } catch (error) {
          console.error('❌ [EMAIL CONFIRMATION] Erro inesperado:', error);
          setTimeout(() => {
            console.log('🚪 [EMAIL CONFIRMATION] Redirecionando para /login após erro');
            navigate('/login');
          }, 2000);
        }
      };
      
      // Processar o código imediatamente
      processConfirmationCode();
    }
  }, [searchParams, navigate]);

  // Este componente não renderiza nada, apenas executa a lógica
  return null;
};
