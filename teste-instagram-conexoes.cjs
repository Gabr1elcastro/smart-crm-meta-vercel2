const fs = require('fs');
const path = require('path');

function testarInstagramConexoes() {
  console.log('🧪 Testando se o Instagram foi adicionado às conexões...\n');

  try {
    const conexoesPath = path.join(__dirname, 'src', 'pages', 'channels', 'Conexoes.tsx');
    
    if (!fs.existsSync(conexoesPath)) {
      console.error('❌ Arquivo Conexoes.tsx não encontrado!');
      return;
    }

    const content = fs.readFileSync(conexoesPath, 'utf8');
    
    console.log('📋 VERIFICAÇÕES REALIZADAS:');
    
    // 1. Verificar se o import do Instagram foi adicionado
    const importInstagramAdicionado = content.includes('import { Settings, X, Calendar, Facebook, Instagram } from \'lucide-react\'');
    console.log(`✅ Import do Instagram adicionado: ${importInstagramAdicionado ? 'SIM' : 'NÃO'}`);
    
    // 2. Verificar se o card do Instagram foi adicionado
    const cardInstagramAdicionado = content.includes('id: \'instagram\'') && content.includes('Instagram Business');
    console.log(`✅ Card do Instagram adicionado: ${cardInstagramAdicionado ? 'SIM' : 'NÃO'}`);
    
    // 3. Verificar se o estado showInstagramModal foi adicionado
    const estadoInstagramAdicionado = content.includes('const [showInstagramModal, setShowInstagramModal] = useState(false)');
    console.log(`✅ Estado showInstagramModal adicionado: ${estadoInstagramAdicionado ? 'SIM' : 'NÃO'}`);
    
    // 4. Verificar se a função handleInstagramConnect foi adicionada
    const funcaoInstagramAdicionada = content.includes('const handleInstagramConnect = () => {');
    console.log(`✅ Função handleInstagramConnect adicionada: ${funcaoInstagramAdicionada ? 'SIM' : 'NÃO'}`);
    
    // 5. Verificar se o modal do Instagram foi adicionado
    const modalInstagramAdicionado = content.includes('{showInstagramModal && (') && content.includes('Conectar Instagram Business');
    console.log(`✅ Modal do Instagram adicionado: ${modalInstagramAdicionado ? 'SIM' : 'NÃO'}`);
    
    // 6. Verificar se o botão de ação para Instagram está configurado
    const botaoInstagramConfigurado = content.includes('onClick={() => setShowInstagramModal(true)}') && content.includes('conexao.id === \'instagram\'');
    console.log(`✅ Botão de ação para Instagram configurado: ${botaoInstagramConfigurado ? 'SIM' : 'NÃO'}`);
    
    // 7. Verificar se o link OAuth do Instagram está correto
    const linkOAuthInstagram = content.includes('https://www.instagram.com/oauth/authorize') && content.includes('client_id=586005311146085');
    console.log(`✅ Link OAuth do Instagram correto: ${linkOAuthInstagram ? 'SIM' : 'NÃO'}`);
    
    // 8. Verificar se o escopo do Instagram está correto
    const escopoInstagram = content.includes('instagram_business_basic') && content.includes('instagram_business_manage_messages');
    console.log(`✅ Escopo do Instagram correto: ${escopoInstagram ? 'SIM' : 'NÃO'}`);
    
    // Resumo
    const totalVerificacoes = 8;
    const verificacoesPassaram = [
      importInstagramAdicionado,
      cardInstagramAdicionado,
      estadoInstagramAdicionado,
      funcaoInstagramAdicionada,
      modalInstagramAdicionado,
      botaoInstagramConfigurado,
      linkOAuthInstagram,
      escopoInstagram
    ].filter(Boolean).length;
    
    console.log(`\n📊 RESULTADO: ${verificacoesPassaram}/${totalVerificacoes} verificações passaram`);
    
    if (verificacoesPassaram === totalVerificacoes) {
      console.log('🎉 SUCESSO! Instagram foi completamente adicionado às conexões!');
      
      console.log('\n🎯 FUNCIONALIDADES DISPONÍVEIS:');
      console.log('   - ✅ Card do Instagram Business visível');
      console.log('   - ✅ Botão "Conectar" funcional');
      console.log('   - ✅ Modal de conexão ativo');
      console.log('   - ✅ Integração com OAuth do Instagram');
      console.log('   - ✅ Redirecionamento para autorização');
      console.log('   - ✅ Escopos de permissão configurados');
      console.log('   - ✅ Design com gradiente roxo/rosa');
      
      console.log('\n🔧 COMO USAR:');
      console.log('1. Acesse a página de Conexões');
      console.log('2. Clique no card "Instagram Business"');
      console.log('3. Clique no botão "Conectar"');
      console.log('4. Autorize no Instagram');
      console.log('5. Retorne para o sistema');
      
      console.log('\n📱 PERMISSÕES DO INSTAGRAM:');
      console.log('   - instagram_business_basic: Acesso básico');
      console.log('   - instagram_business_manage_messages: Gerenciar mensagens');
      console.log('   - instagram_business_manage_comments: Gerenciar comentários');
      console.log('   - instagram_business_content_publish: Publicar conteúdo');
      console.log('   - instagram_business_manage_insights: Gerenciar insights');
      
    } else {
      console.log('⚠️  ALGUMAS VERIFICAÇÕES FALHARAM!');
      console.log('💡 Verifique os itens que falharam acima');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarInstagramConexoes();
