import { supabase } from '@/lib/supabase';

// CONSTANTE HARDCODED - NUNCA usar env para esta URL
const RESET_PASSWORD_REDIRECT = 'https://app.usesmartcrm.com/update-password';

/**
 * Serviço para operações de autenticação
 */
export class AuthService {
  
  /**
   * Envia email de redefinição de senha
   * @param email Email do usuário
   */
  static async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Log detalhado para debug
      console.log('🔐 [AUTH SERVICE] Iniciando reset de senha...');
      console.log('📧 [AUTH SERVICE] Email:', email);
      console.log('🔗 [AUTH SERVICE] Redirect URL (hardcoded):', RESET_PASSWORD_REDIRECT);
      console.log('🔗 [AUTH SERVICE] Redirect URL length:', RESET_PASSWORD_REDIRECT.length);
      console.log('🔗 [AUTH SERVICE] Redirect URL JSON:', JSON.stringify(RESET_PASSWORD_REDIRECT));
      
      // Verificar se a URL está limpa
      const cleanUrl = RESET_PASSWORD_REDIRECT.trim();
      if (cleanUrl !== RESET_PASSWORD_REDIRECT) {
        console.warn('⚠️ [AUTH SERVICE] URL tinha espaços, foi limpa');
      }
      
      // Verificar caracteres invisíveis
      const charCodes = [...RESET_PASSWORD_REDIRECT].map(c => c.charCodeAt(0));
      console.log('🔍 [AUTH SERVICE] Char codes:', charCodes);
      
      // Verificar se há espaços (código 32) ou NBSP (código 160)
      const hasSpaces = charCodes.includes(32);
      const hasNBSP = charCodes.includes(160);
      
      if (hasSpaces || hasNBSP) {
        console.error('❌ [AUTH SERVICE] URL CONTAMINADA com espaços!');
        console.error('❌ [AUTH SERVICE] Espaços:', hasSpaces);
        console.error('❌ [AUTH SERVICE] NBSP:', hasNBSP);
        throw new Error('URL de redirecionamento contaminada com espaços');
      }
      
      // Verificar estrutura da URL
      try {
        const url = new URL(RESET_PASSWORD_REDIRECT);
        console.log('✅ [AUTH SERVICE] URL válida:', {
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          full: url.toString()
        });
      } catch (urlError) {
        console.error('❌ [AUTH SERVICE] URL inválida:', urlError);
        throw new Error('URL de redirecionamento inválida');
      }
      
      // Enviar email de reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_PASSWORD_REDIRECT,
      });
      
      if (error) {
        console.error('❌ [AUTH SERVICE] Erro do Supabase:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ [AUTH SERVICE] Email de reset enviado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [AUTH SERVICE] Erro inesperado:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro inesperado' 
      };
    }
  }
  
  /**
   * Troca código de recuperação por sessão
   * @param code Código de recuperação da URL
   */
  static async exchangeRecoveryCode(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [AUTH SERVICE] Trocando código de recuperação:', code);
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ [AUTH SERVICE] Erro ao trocar código:', error);
        return { success: false, error: error.message };
      }
      
      if (!data.session) {
        console.error('❌ [AUTH SERVICE] Nenhuma sessão retornada');
        return { success: false, error: 'Nenhuma sessão retornada' };
      }
      
      console.log('✅ [AUTH SERVICE] Sessão estabelecida com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [AUTH SERVICE] Erro inesperado ao trocar código:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro inesperado' 
      };
    }
  }
  
  /**
   * Atualiza senha do usuário
   * @param password Nova senha
   */
  static async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 [AUTH SERVICE] Atualizando senha...');
      
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('❌ [AUTH SERVICE] Erro ao atualizar senha:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ [AUTH SERVICE] Senha atualizada com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [AUTH SERVICE] Erro inesperado ao atualizar senha:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro inesperado' 
      };
      }
  }
}
