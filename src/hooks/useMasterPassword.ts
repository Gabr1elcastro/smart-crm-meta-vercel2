import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MasterAccess {
  isMasterAccess: boolean;
  targetUserId: string | null;
  targetUserEmail: string | null;
  accessTime: Date | null;
}

export const useMasterPassword = () => {
  const [masterAccess, setMasterAccess] = useState<MasterAccess>({
    isMasterAccess: false,
    targetUserId: null,
    targetUserEmail: null,
    accessTime: null
  });

  // Verificar se a senha mestra está configurada
  const MASTER_PASSWORD = import.meta.env.VITE_MASTER_PASSWORD || 'smartcrm2024';

  // Função para autenticar com senha mestra
  const authenticateWithMasterPassword = async (email: string, masterPassword: string): Promise<boolean> => {
    try {
      console.log('🔍 Iniciando autenticação mestra...');
      console.log('📧 Email:', email);
      console.log('🔑 Senha mestra fornecida:', masterPassword);
      console.log('🔑 Senha mestra esperada:', MASTER_PASSWORD);
      
      // Verificar se a senha mestra está correta
      if (masterPassword !== MASTER_PASSWORD) {
        console.log('❌ Senha mestra incorreta');
        return false;
      }

      console.log('✅ Senha mestra correta, verificando email...');

      // Verificar se o email existe na tabela clientes_info
      const { data: clienteInfo, error: clienteError } = await supabase
        .from('clientes_info')
        .select('*')
        .eq('email', email)
        .single();

      if (clienteError) {
        console.error('❌ Erro ao buscar dados do cliente:', clienteError);
        return false;
      }

      if (!clienteInfo) {
        console.error('❌ Cliente não encontrado:', email);
        return false;
      }

      console.log('✅ Cliente encontrado:', clienteInfo);

      // Definir acesso mestra
      setMasterAccess({
        isMasterAccess: true,
        targetUserId: clienteInfo.id?.toString() || null,
        targetUserEmail: email,
        accessTime: new Date()
      });

      // Log de acesso mestra (para auditoria)
      console.log(`🔑 Acesso mestra concedido para: ${email} em ${new Date().toISOString()}`);

      // Salvar no localStorage para persistir durante a sessão
      localStorage.setItem('masterAccess', JSON.stringify({
        isMasterAccess: true,
        targetUserId: clienteInfo.id?.toString() || null,
        targetUserEmail: email,
        accessTime: new Date().toISOString()
      }));

      return true;
    } catch (error) {
      console.error('❌ Erro na autenticação mestra:', error);
      return false;
    }
  };

  // Função para sair do acesso mestra
  const logoutMasterAccess = () => {
    setMasterAccess({
      isMasterAccess: false,
      targetUserId: null,
      targetUserEmail: null,
      accessTime: null
    });
    
    localStorage.removeItem('masterAccess');
    console.log('🔒 Acesso mestra encerrado');
  };

  // Função para obter dados do usuário alvo
  const getTargetUserData = async () => {
    if (!masterAccess.isMasterAccess || !masterAccess.targetUserEmail) {
      return null;
    }

    try {
      // Buscar dados completos do usuário alvo
      const { data: clienteInfo, error } = await supabase
        .from('clientes_info')
        .select('*')
        .eq('email', masterAccess.targetUserEmail)
        .single();

      if (error) {
        console.error('Erro ao buscar dados do usuário alvo:', error);
        return null;
      }

      return clienteInfo;
    } catch (error) {
      console.error('Erro ao obter dados do usuário alvo:', error);
      return null;
    }
  };

  // Função para simular login do usuário alvo
  const simulateUserLogin = async () => {
    if (!masterAccess.isMasterAccess || !masterAccess.targetUserEmail) {
      return false;
    }

    try {
      // Aqui você pode implementar a lógica para simular o login
      // Por exemplo, redirecionar para o dashboard com contexto do usuário alvo
      console.log(`🔄 Simulando login para usuário: ${masterAccess.targetUserEmail}`);
      
      // Redirecionar para o dashboard com parâmetros de usuário alvo
      window.location.href = `/?master_user=${masterAccess.targetUserId}&master_email=${masterAccess.targetUserEmail}`;
      
      return true;
    } catch (error) {
      console.error('Erro ao simular login:', error);
      return false;
    }
  };

  // Restaurar acesso mestra do localStorage ao inicializar
  useEffect(() => {
    const savedMasterAccess = localStorage.getItem('masterAccess');
    if (savedMasterAccess) {
      try {
        const parsed = JSON.parse(savedMasterAccess);
        setMasterAccess({
          ...parsed,
          accessTime: parsed.accessTime ? new Date(parsed.accessTime) : null
        });
      } catch (error) {
        console.error('Erro ao restaurar acesso mestra:', error);
        localStorage.removeItem('masterAccess');
      }
    }
  }, []);

  return {
    masterAccess,
    authenticateWithMasterPassword,
    logoutMasterAccess,
    getTargetUserData,
    simulateUserLogin,
    MASTER_PASSWORD: MASTER_PASSWORD // Para debug/desenvolvimento
  };
};

