import { supabase } from "@/lib/supabase";

export interface Cliente {
  id: number;
  created_at: string;
  name: string;
  email: string;
  user_id_auth: string;
  instance_id: string;
  sender_number: string;
  instance_name: string;
  apikey: string;
  atendimento_humano: boolean | null;
  atendimento_ia: boolean | null;
  prompt_type: string | null;
  id_chatbot: string | null;
  phone: string | null;
  atualizando_relatorio: boolean | null;
  id_departamento_padrao: string | null;
  instance_id_2: string | null;
  instance_name_2: string | null;
  sender_number_2: string | null;
  atendimento_humano_2: boolean | null;
  atendimento_ia_2: boolean | null;
  data_hora_atualizacao_relatorio: string | null;
  id_departamento_chip_1: string | null;
  id_departamento_chip_2: string | null;
}

export interface SuperAdminData {
  id: string;
  nome: string;
  email: string;
  criado_em: string;
}

export const superAdminService = {
  // Verificar se um email é super admin
  async verifySuperAdmin(email: string): Promise<SuperAdminData | null> {
    try {
      const { data, error } = await supabase
        .from('superadmins')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao verificar super admin:', error);
      return null;
    }
  },

  // Buscar todos os clientes
  async getClientes(): Promise<Cliente[]> {
    try {
      console.log('Iniciando busca de clientes...');
      
      // Query com a estrutura real da tabela
      const { data: clientesData, error } = await supabase
        .from('clientes_info')
        .select(`
          id,
          created_at,
          name,
          email,
          user_id_auth,
          instance_id,
          sender_number,
          instance_name,
          apikey,
          atendimento_humano,
          atendimento_ia,
          prompt_type,
          id_chatbot,
          phone,
          atualizando_relatorio,
          id_departamento_padrao,
          instance_id_2,
          instance_name_2,
          sender_number_2,
          atendimento_humano_2,
          atendimento_ia_2,
          data_hora_atualizacao_relatorio,
          id_departamento_chip_1,
          id_departamento_chip_2
        `)
        .order('created_at', { ascending: false });

      console.log('Query executada');
      
      if (error) {
        console.error('Erro na query:', error);
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      console.log('Clientes encontrados:', clientesData?.length || 0);
      return clientesData || [];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  // Buscar detalhes de um cliente específico
  async getClienteById(clienteId: number): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from('clientes_info')
        .select(`
          id,
          created_at,
          name,
          email,
          user_id_auth,
          instance_id,
          sender_number,
          instance_name,
          apikey,
          atendimento_humano,
          atendimento_ia,
          prompt_type,
          id_chatbot,
          phone,
          atualizando_relatorio,
          id_departamento_padrao,
          instance_id_2,
          instance_name_2,
          sender_number_2,
          atendimento_humano_2,
          atendimento_ia_2,
          data_hora_atualizacao_relatorio,
          id_departamento_chip_1,
          id_departamento_chip_2
        `)
        .eq('id', clienteId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  },

  // Buscar usuários de um cliente
  async getUsuariosByCliente(clienteId: number) {
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select('*')
        .eq('raw_user_meta_data->id_cliente', clienteId);

      if (error) {
        throw new Error('Erro ao buscar usuários do cliente');
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  // Atualizar status de um cliente (usando atendimento_humano como status)
  async updateClienteStatus(clienteId: number, status: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clientes_info')
        .update({ atendimento_humano: status })
        .eq('id', clienteId);

      if (error) {
        throw new Error('Erro ao atualizar status do cliente');
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  },

  // Bloquear/desbloquear um cliente
  async toggleClienteBlock(clienteId: number, blocked: boolean): Promise<boolean> {
    try {
      return await this.updateClienteStatus(clienteId, !blocked);
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear cliente:', error);
      return false;
    }
  },

  // Forçar logout de todas as sessões de um cliente
  async forceLogoutCliente(clienteId: number): Promise<boolean> {
    try {
      // Buscar todos os usuários do cliente
      const usuarios = await this.getUsuariosByCliente(clienteId);
      
      // Para cada usuário, invalidar suas sessões
      for (const usuario of usuarios) {
        try {
          // Nota: Esta é uma implementação simplificada
          // Em produção, você pode querer usar RLS policies ou triggers
          console.log(`Forçando logout para usuário: ${usuario.id}`);
        } catch (error) {
          console.error(`Erro ao forçar logout para usuário ${usuario.id}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao forçar logout:', error);
      return false;
    }
  },

  // Buscar estatísticas gerais
  async getEstatisticas() {
    try {
      console.log('Iniciando busca de estatísticas...');
      
      // Buscar clientes
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes_info')
        .select('*');

      console.log('Query clientes:', clientesError ? 'ERRO' : 'OK');
      if (clientesError) {
        console.error('Erro ao buscar clientes:', clientesError);
        throw new Error('Erro ao buscar clientes');
      }

      // Buscar atendentes
      const { data: atendentes, error: atendentesError } = await supabase
        .from('atendentes')
        .select('*');

      console.log('Query atendentes:', atendentesError ? 'ERRO' : 'OK');
      if (atendentesError) {
        console.error('Erro ao buscar atendentes:', atendentesError);
        throw new Error('Erro ao buscar atendentes');
      }

      const clientesData = clientes || [];
      const atendentesData = atendentes || [];

      const estatisticas = {
        totalClientes: clientesData.length,
        clientesAtivos: clientesData.filter(c => c.atendimento_humano === true).length,
        clientesSuspensos: clientesData.filter(c => c.atendimento_humano === false).length,
        totalUsuarios: clientesData.length + atendentesData.length, // clientes + atendentes
      };

      console.log('Estatísticas calculadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}; 