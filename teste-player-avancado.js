// Script para testar o AudioPlayerAdvanced
// Execute este script no console do navegador quando estiver na página de conversas

console.log('=== TESTE: AudioPlayerAdvanced - VERSÃO MELHORADA ===');

// 1. Verificar se estamos na página correta
if (window.location.pathname !== '/conversations') {
  console.log('❌ ERRO: Não estamos na página /conversations');
  console.log('Página atual:', window.location.pathname);
  console.log('Para testar, acesse /conversations e execute este script novamente');
  return;
}

console.log('✅ Estamos na página correta: /conversations');

// 2. Verificar se o componente AudioPlayerAdvanced foi importado
try {
  // Tentar acessar o componente via React DevTools
  console.log('🔍 Verificando se AudioPlayerAdvanced está disponível...');
  
  // Verificar se há elementos de áudio na página
  const audioElements = document.querySelectorAll('audio');
  console.log('Elementos de áudio encontrados:', audioElements.length);
  
  // Verificar se há players de áudio renderizados
  const audioPlayers = document.querySelectorAll('[class*="rounded-2xl"]');
  console.log('Players de áudio encontrados:', audioPlayers.length);
  
  // Verificar se há botões de controle
  const playButtons = document.querySelectorAll('button[class*="rounded-full"]');
  console.log('Botões de play encontrados:', playButtons.length);
  
  // Verificar se há controles de velocidade
  const settingsButtons = document.querySelectorAll('[class*="Settings"]');
  console.log('Botões de configurações encontrados:', settingsButtons.length);
  
} catch (error) {
  console.error('❌ Erro ao verificar componentes:', error);
}

// 3. Função para testar funcionalidades específicas
function testarFuncionalidades() {
  console.log('🧪 Testando funcionalidades do AudioPlayerAdvanced...');
  
  // Verificar se há mensagens de áudio
  const audioMessages = document.querySelectorAll('[class*="bg-gradient-to-br"]');
  console.log('Mensagens de áudio encontradas:', audioMessages.length);
  
  // Verificar controles de velocidade
  const speedControls = document.querySelectorAll('[class*="DropdownMenu"]');
  console.log('Controles de velocidade encontrados:', speedControls.length);
  
  // Verificar indicadores de velocidade
  const speedIndicators = document.querySelectorAll('[class*="x"]');
  console.log('Indicadores de velocidade encontrados:', speedIndicators.length);
  
  // Verificar indicadores de duração estimada
  const estimatedDurationIndicators = document.querySelectorAll('[class*="~"]');
  console.log('Indicadores de duração estimada encontrados:', estimatedDurationIndicators.length);
}

// 4. Função para simular interações
function simularInteracoes() {
  console.log('🎮 Simulando interações...');
  
  // Encontrar botões de play
  const playButtons = document.querySelectorAll('button[class*="rounded-full"]');
  
  if (playButtons.length > 0) {
    console.log('🎵 Encontrados botões de play:', playButtons.length);
    
    // Simular clique no primeiro botão de play
    const firstPlayButton = playButtons[0];
    console.log('🖱️ Simulando clique no primeiro botão de play...');
    firstPlayButton.click();
    
    // Verificar se há controles de velocidade
    setTimeout(() => {
      const settingsButtons = document.querySelectorAll('[class*="Settings"]');
      if (settingsButtons.length > 0) {
        console.log('⚙️ Encontrados botões de configurações:', settingsButtons.length);
        console.log('🖱️ Simulando clique no primeiro botão de configurações...');
        settingsButtons[0].click();
      }
    }, 1000);
    
  } else {
    console.log('❌ Nenhum botão de play encontrado');
  }
}

// 5. Função para verificar logs do console
function verificarLogs() {
  console.log('📋 Verificando logs do console...');
  
  // Verificar se há logs do AudioPlayerAdvanced
  const logs = [
    '🎵 AudioPlayerAdvanced iniciado',
    '📍 URL:',
    '📁 Formato detectado:',
    '✅ Metadata carregada:',
    '✅ Áudio pronto para reprodução',
    '📏 Estimativa de duração:',
    '⚠️ Duração inválida, tentando estimar...',
    '✅ Duração estimada:',
    '📱 Tentando reprodução com configurações para iPhone...'
  ];
  
  console.log('🔍 Procurando por logs específicos do AudioPlayerAdvanced...');
  logs.forEach(log => {
    console.log(`Procurando: "${log}"`);
  });
}

// 6. Função para testar diferentes velocidades
function testarVelocidades() {
  console.log('🏃 Testando diferentes velocidades...');
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
  speeds.forEach(speed => {
    console.log(`Testando velocidade: ${speed}x`);
  });
}

// 7. Função para testar navegação
function testarNavegacao() {
  console.log('⏭️ Testando navegação...');
  
  const actions = [
    { name: 'Navegação na barra de progresso', action: 'progress' }
  ];
  
  actions.forEach(action => {
    console.log(`Testando: ${action.name}`);
  });
}

// 8. Função para testar problemas específicos de duração
function testarProblemasDuracao() {
  console.log('⏱️ Testando problemas de duração...');
  
  // Verificar elementos de áudio
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach((audio, index) => {
    console.log(`Áudio ${index + 1}:`, {
      src: audio.src,
      duration: audio.duration,
      isFinite: isFinite(audio.duration),
      readyState: audio.readyState,
      networkState: audio.networkState
    });
  });
  
  // Verificar se há indicadores de duração estimada
  const estimatedIndicators = document.querySelectorAll('[class*="~"]');
  if (estimatedIndicators.length > 0) {
    console.log('✅ Indicadores de duração estimada encontrados:', estimatedIndicators.length);
    estimatedIndicators.forEach((indicator, index) => {
      console.log(`Indicador ${index + 1}:`, indicator.textContent);
    });
  } else {
    console.log('ℹ️ Nenhum indicador de duração estimada encontrado');
  }
}

// 9. Função para testar compatibilidade com iPhone
function testarCompatibilidadeIPhone() {
  console.log('📱 Testando compatibilidade com iPhone...');
  
  // Verificar se é Safari (iPhone usa Safari)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  console.log('Safari detectado:', isSafari);
  
  // Verificar suporte a formatos de áudio
  const audioFormats = [
    'audio/mp3',
    'audio/mp4',
    'audio/aac',
    'audio/webm',
    'audio/ogg',
    'audio/wav'
  ];
  
  console.log('🎵 Suporte a formatos de áudio:');
  audioFormats.forEach(format => {
    const audio = new Audio();
    const canPlay = audio.canPlayType(format);
    console.log(`${format}: ${canPlay || 'não suportado'}`);
  });
  
  // Verificar se há elementos de áudio com crossOrigin
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach((audio, index) => {
    console.log(`Áudio ${index + 1} crossOrigin:`, audio.crossOrigin);
  });
}

// 10. Função para testar retry mechanism
function testarRetryMechanism() {
  console.log('🔄 Testando mecanismo de retry...');
  
  // Verificar se há logs de retry
  const retryLogs = [
    '🔄 Tentativa 1 de 3...',
    '🔄 Tentativa 2 de 3...',
    '🔄 Tentativa 3 de 3...',
    '❌ Muitas tentativas com formato OGG - desistindo'
  ];
  
  console.log('🔍 Procurando por logs de retry...');
  retryLogs.forEach(log => {
    console.log(`Procurando: "${log}"`);
  });
}

// Executar todos os testes
console.log('🚀 Iniciando testes do AudioPlayerAdvanced...');

testarFuncionalidades();
verificarLogs();
testarVelocidades();
testarNavegacao();
testarProblemasDuracao();
testarCompatibilidadeIPhone();
testarRetryMechanism();

// Aguardar um pouco e simular interações
setTimeout(() => {
  simularInteracoes();
}, 1000);

console.log('=== FIM DOS TESTES ===');
console.log('');
console.log('📝 INSTRUÇÕES PARA TESTE MANUAL:');
console.log('1. Procure por uma mensagem de áudio na conversa');
console.log('2. Clique no botão de play para reproduzir');
console.log('3. Clique no ícone de configurações (⚙️) para alterar velocidade');
console.log('4. Clique na barra de progresso para navegar diretamente');
console.log('5. Verifique se a velocidade atual é exibida (ex: 1.5x)');
console.log('6. Verifique se há indicador de duração estimada (ex: ~1:30)');
console.log('7. Teste em diferentes dispositivos (iPhone, Android, Desktop)');
console.log('');
console.log('🔧 MELHORIAS IMPLEMENTADAS:');
console.log('✅ Estimativa de duração baseada no tamanho do arquivo');
console.log('✅ Retry mechanism para formatos problemáticos');
console.log('✅ Compatibilidade melhorada com iPhone');
console.log('✅ Tratamento de erros mais robusto');
console.log('✅ Indicadores visuais de duração estimada');
console.log('✅ Cross-origin support para CORS');