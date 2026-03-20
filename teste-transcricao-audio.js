// Script de teste para verificar a funcionalidade de transcrição de áudio
// Execute este script no console do navegador na página de Conversas

console.log('🎵 Iniciando teste de transcrição de áudio...');

// Função para verificar se a transcrição está sendo exibida
function verificarTranscricaoAudio() {
  try {
    console.log('🔍 Verificando mensagens de áudio com transcrição...');

    // 1. Verificar se há mensagens de áudio na página
    const mensagensAudio = document.querySelectorAll('[data-message-type="audio"]');
    console.log(`📊 Encontradas ${mensagensAudio.length} mensagens de áudio`);

    // 2. Verificar se há elementos de transcrição
    const elementosTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg');
    console.log(`📝 Encontrados ${elementosTranscricao.length} elementos de transcrição`);

    // 3. Verificar se há texto de transcrição
    const textosTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg p:last-child');
    console.log(`📄 Encontrados ${textosTranscricao.length} textos de transcrição`);

    // 4. Verificar estrutura das mensagens de áudio
    const playersAudio = document.querySelectorAll('audio');
    console.log(`🎤 Encontrados ${playersAudio.length} players de áudio`);

    // 5. Verificar se a interface está correta
    const containersAudio = document.querySelectorAll('.space-y-2');
    console.log(`📦 Encontrados ${containersAudio.length} containers de áudio`);

    // 6. Verificar se há ícones de transcrição
    const iconesTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg span:first-child');
    const iconesComEmoji = Array.from(iconesTranscricao).filter(span => 
      span.textContent.includes('📝')
    );
    console.log(`📝 Encontrados ${iconesComEmoji.length} ícones de transcrição`);

    // 7. Verificar se há labels "Transcrição:"
    const labelsTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg .font-medium');
    const labelsCorretos = Array.from(labelsTranscricao).filter(label => 
      label.textContent === 'Transcrição:'
    );
    console.log(`🏷️ Encontrados ${labelsCorretos.length} labels "Transcrição:"`);

    // 8. Verificar cores das bordas
    const bordasAzuis = document.querySelectorAll('.border-blue-400');
    const bordasCinzas = document.querySelectorAll('.border-gray-300');
    console.log(`🔵 Bordas azuis (mensagens enviadas): ${bordasAzuis.length}`);
    console.log(`⚫ Bordas cinzas (mensagens recebidas): ${bordasCinzas.length}`);

    console.log('✅ Teste de transcrição de áudio concluído!');

    // 9. Instruções para teste manual
    console.log('\n📋 INSTRUÇÕES PARA TESTE MANUAL:');
    console.log('1. Verifique se há mensagens de áudio nas conversas');
    console.log('2. Procure por mensagens que tenham transcrição abaixo do player');
    console.log('3. Verifique se a transcrição aparece em uma caixa cinza com borda');
    console.log('4. Verifique se há o ícone 📝 e o label "Transcrição:"');
    console.log('5. Verifique se as cores das bordas correspondem ao tipo de mensagem');
    console.log('6. Teste se a transcrição é legível e faz sentido');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Função para testar inserção de transcrição de teste
function inserirTranscricaoTeste() {
  console.log('🧪 Inserindo transcrição de teste...');

  // Simular uma mensagem de áudio com transcrição
  const mensagemTeste = {
    id: Date.now(),
    tipo_mensagem: 'audio',
    url_arquivo: 'https://exemplo.com/audio.mp3',
    transcricao_audio: 'Esta é uma transcrição de teste para verificar se a funcionalidade está funcionando corretamente.',
    tipo: false, // mensagem recebida
    timestamp: new Date().toISOString()
  };

  console.log('📝 Mensagem de teste criada:', mensagemTeste);
  console.log('💡 Para testar com dados reais, insira uma mensagem no banco com transcricao_audio');
}

// Função para verificar dados no banco
function verificarDadosBanco() {
  console.log('🗄️ Para verificar dados no banco, execute no Supabase SQL Editor:');
  console.log(`
    SELECT 
      id,
      mensagem,
      tipo_mensagem,
      url_arquivo,
      transcricao_audio,
      timestamp
    FROM agente_conversacional_whatsapp 
    WHERE tipo_mensagem = 'audio' 
    AND transcricao_audio IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 5;
  `);
}

// Executar testes
console.log('🚀 Executando testes de transcrição de áudio...');
verificarTranscricaoAudio();
inserirTranscricaoTeste();
verificarDadosBanco();

// Para testar inserção manual, use:
// inserirTranscricaoTeste(); 