// 🧪 Script de Teste - Sistema de Senha Mestra
// Execute este script para testar a funcuramento da senha mestra

console.log('🔑 Testando Sistema de Senha Mestra - SmartCRM');
console.log('================================================');

// Configurações de teste
const TEST_CONFIG = {
  masterPassword: 'smartcrm2024', // Senha padrão
  testEmails: [
    'admin@smartcrm.com',
    'usuario@exemplo.com',
    'suporte@empresa.com'
  ],
  invalidEmails: [
    'naoexiste@teste.com',
    'invalido@',
    'teste@teste'
  ]
};

// Função para testar validação de email
function testEmailValidation(email) {
  console.log(`\n📧 Testando email: ${email}`);
  
  // Validação básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailRegex.test(email);
  
  console.log(`  ✅ Formato válido: ${isValidFormat}`);
  
  if (!isValidFormat) {
    console.log(`  ❌ Email com formato inválido`);
    return false;
  }
  
  // Simular verificação de existência no banco
  const emailExists = TEST_CONFIG.testEmails.includes(email);
  console.log(`  ✅ Email existe no sistema: ${emailExists}`);
  
  return emailExists;
}

// Função para testar autenticação mestra
function testMasterAuthentication(email, masterPassword) {
  console.log(`\n🔐 Testando autenticação mestra para: ${email}`);
  
  // Verificar se o email é válido
  if (!testEmailValidation(email)) {
    console.log(`  ❌ Falha na validação do email`);
    return false;
  }
  
  // Verificar se a senha mestra está correta
  const isMasterPasswordCorrect = masterPassword === TEST_CONFIG.masterPassword;
  console.log(`  ✅ Senha mestra correta: ${isMasterPasswordCorrect}`);
  
  if (!isMasterPasswordCorrect) {
    console.log(`  ❌ Senha mestra incorreta`);
    return false;
  }
  
  // Simular verificação de conta ativa
  const isAccountActive = true; // Simulado
  console.log(`  ✅ Conta ativa: ${isAccountActive}`);
  
  if (!isAccountActive) {
    console.log(`  ❌ Conta não está ativa`);
    return false;
  }
  
  console.log(`  🎉 Autenticação mestra bem-sucedida!`);
  return true;
}

// Função para testar cenários de erro
function testErrorScenarios() {
  console.log(`\n🚨 Testando Cenários de Erro`);
  console.log(`=============================`);
  
  // Teste 1: Email inválido
  console.log(`\n1️⃣ Email inválido:`);
  testMasterAuthentication('emailinvalido', TEST_CONFIG.masterPassword);
  
  // Teste 2: Senha mestra incorreta
  console.log(`\n2️⃣ Senha mestra incorreta:`);
  testMasterAuthentication('admin@smartcrm.com', 'senhaerrada');
  
  // Teste 3: Email inexistente
  console.log(`\n3️⃣ Email inexistente:`);
  testMasterAuthentication('naoexiste@teste.com', TEST_CONFIG.masterPassword);
  
  // Teste 4: Campos vazios
  console.log(`\n4️⃣ Campos vazios:`);
  testMasterAuthentication('', '');
}

// Função para testar cenários de sucesso
function testSuccessScenarios() {
  console.log(`\n✅ Testando Cenários de Sucesso`);
  console.log(`================================`);
  
  TEST_CONFIG.testEmails.forEach((email, index) => {
    console.log(`\n${index + 1}️⃣ Testando com email válido: ${email}`);
    testMasterAuthentication(email, TEST_CONFIG.masterPassword);
  });
}

// Função para simular log de auditoria
function simulateAuditLog(email, success) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: success ? 'MASTER_ACCESS_GRANTED' : 'MASTER_ACCESS_DENIED',
    targetUser: email,
    masterUser: 'admin@smartcrm.com',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Test Script)',
    success: success
  };
  
  console.log(`\n📝 Log de Auditoria:`);
  console.log(JSON.stringify(logEntry, null, 2));
  
  return logEntry;
}

// Função principal de teste
function runAllTests() {
  console.log('🚀 Iniciando testes do sistema de senha mestra...\n');
  
  // Teste 1: Cenários de sucesso
  testSuccessScenarios();
  
  // Teste 2: Cenários de erro
  testErrorScenarios();
  
  // Teste 3: Simulação de logs
  console.log(`\n📊 Simulando Logs de Auditoria`);
  console.log(`================================`);
  
  TEST_CONFIG.testEmails.forEach(email => {
    simulateAuditLog(email, true);
  });
  
  // Teste com email inválido
  simulateAuditLog('emailinvalido@teste.com', false);
  
  console.log(`\n🎯 Testes Concluídos!`);
  console.log(`=======================`);
  console.log(`✅ Cenários de sucesso: ${TEST_CONFIG.testEmails.length}`);
  console.log(`❌ Cenários de erro: 4`);
  console.log(`📝 Logs de auditoria: ${TEST_CONFIG.testEmails.length + 1}`);
  
  console.log(`\n💡 Dicas de Uso:`);
  console.log(`• Use apenas para suporte técnico`);
  console.log(`• Mantenha a senha mestra segura`);
  console.log(`• Monitore os logs de acesso`);
  console.log(`• Altere a senha regularmente`);
}

// Executar testes se o script for executado diretamente
if (typeof window === 'undefined') {
  // Ambiente Node.js
  runAllTests();
} else {
  // Ambiente do navegador
  console.log('🌐 Execute este script no console do navegador para testar');
  console.log('💡 Use: runAllTests()');
  
  // Expor função globalmente para teste no console
  window.runAllTests = runAllTests;
  window.testMasterAuthentication = testMasterAuthentication;
  window.simulateAuditLog = simulateAuditLog;
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testMasterAuthentication,
    simulateAuditLog,
    runAllTests,
    TEST_CONFIG
  };
}

