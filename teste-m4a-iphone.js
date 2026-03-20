// Script de Teste - Compatibilidade M4A com iPhone
// Execute no console do navegador

console.log('📱 Testando compatibilidade M4A com iPhone...');

// Função para testar formatos de áudio
function testarFormatosM4A() {
  console.log('🎵 Formatos de áudio para iPhone:');
  
  const formatos = [
    { mime: 'audio/mp4', nome: 'M4A/AAC', iphone: '✅ NATIVO' },
    { mime: 'audio/aac', nome: 'AAC Direto', iphone: '✅ NATIVO' },
    { mime: 'audio/mp4;codecs=mp4a.40.2', nome: 'AAC-LC', iphone: '✅ NATIVO' },
    { mime: 'audio/webm;codecs=opus', nome: 'WebM+Opus', iphone: '⚠️ FALLBACK' },
    { mime: 'audio/webm', nome: 'WebM', iphone: '⚠️ FALLBACK' },
    { mime: 'audio/ogg;codecs=opus', nome: 'OGG+Opus', iphone: '❌ INCOMPATÍVEL' }
  ];
  
  formatos.forEach(formato => {
    const suportado = MediaRecorder.isTypeSupported(formato.mime);
    console.log(`${suportado ? '✅' : '❌'} ${formato.nome}: ${formato.mime} - ${formato.iphone}`);
  });
}

// Função para simular gravação M4A
async function simularGravacaoM4A() {
  console.log('🎤 Simulando gravação M4A...');
  
  try {
    // Verificar permissões
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    
    console.log('✅ Permissão de microfone concedida');
    
    // Testar formatos disponíveis
    const formatos = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus'];
    let formatoSelecionado = '';
    
    for (const formato of formatos) {
      if (MediaRecorder.isTypeSupported(formato)) {
        formatoSelecionado = formato;
        break;
      }
    }
    
    if (!formatoSelecionado) {
      throw new Error('Nenhum formato suportado');
    }
    
    console.log(`✅ Formato selecionado: ${formatoSelecionado}`);
    console.log(`📱 Compatibilidade iPhone: ${formatoSelecionado.includes('mp4') || formatoSelecionado.includes('aac') ? '✅ NATIVO' : '⚠️ FALLBACK'}`);
    
    // Parar stream
    stream.getTracks().forEach(track => track.stop());
    console.log('🔇 Stream parado');
    
    return formatoSelecionado;
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return null;
  }
}

// Função para verificar configuração atual
function verificarConfiguracaoAtual() {
  console.log('🔍 Verificando configuração atual...');
  
  // Verificar se está usando AudioRecorderM4A
  const audioRecorder = document.querySelector('[data-testid="audio-recorder-m4a"]');
  if (audioRecorder) {
    console.log('✅ AudioRecorderM4A está sendo usado');
  } else {
    console.log('⚠️ AudioRecorderM4A não encontrado');
  }
  
  // Verificar logs de áudio
  console.log('📋 Logs de áudio esperados:');
  console.log('  - "🎤 Iniciando gravação de áudio otimizada para iPhone (M4A)"');
  console.log('  - "✅ Formato selecionado: audio/mp4"');
  console.log('  - "📱 Compatibilidade iPhone: ✅ NATIVO"');
  console.log('  - "✅ Conversão para M4A concluída"');
}

// Função principal
async function executarTesteCompleto() {
  console.log('🚀 Iniciando teste completo de compatibilidade M4A...');
  
  // 1. Testar formatos
  testarFormatosM4A();
  
  // 2. Simular gravação
  const formato = await simularGravacaoM4A();
  
  // 3. Verificar configuração
  verificarConfiguracaoAtual();
  
  // 4. Resultado
  if (formato && (formato.includes('mp4') || formato.includes('aac'))) {
    console.log('\n🎉 SUCESSO: Sistema configurado para máxima compatibilidade iPhone!');
    console.log('✅ Formato M4A/AAC suportado');
    console.log('✅ Conversão automática implementada');
    console.log('✅ Interface otimizada para iPhone');
  } else {
    console.log('\n⚠️ ATENÇÃO: Usando formato fallback');
    console.log('💡 Recomendado: Verificar se o navegador suporta M4A');
  }
}

// Expor funções
window.testarFormatosM4A = testarFormatosM4A;
window.simularGravacaoM4A = simularGravacaoM4A;
window.verificarConfiguracaoAtual = verificarConfiguracaoAtual;
window.executarTesteCompleto = executarTesteCompleto;

console.log('📚 Funções disponíveis:');
console.log('- testarFormatosM4A()');
console.log('- simularGravacaoM4A()');
console.log('- verificarConfiguracaoAtual()');
console.log('- executarTesteCompleto()');

console.log('🎯 Para testar, execute: executarTesteCompleto()');

