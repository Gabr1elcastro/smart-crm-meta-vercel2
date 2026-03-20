// 🧪 Script de Teste - Acesso Mestra
// Execute este script para testar o funcionamento do acesso mestra

console.log('🔑 Testando Sistema de Acesso Mestra - SmartCRM');
console.log('================================================');

// Configurações de teste
const TEST_CONFIG = {
  masterPassword: 'smartcrm2024', // Senha padrão
  testEmails: [
    'bbf.materiais@gmail.com',
    'diego.almeidalmeida+004@gmail.com',
    'teste@exemplo.com'
  ]
};

// Função para simular verificação de acesso mestra
function testMasterAccess(email, masterPassword) {
  console.log(`\n🔍 Testando acesso mestra para: ${email}`);
  
  // Verificar senha mestra
  if (masterPassword !== TEST_CONFIG.masterPassword) {
    console.log('  ❌ Senha mestra incorreta');
    return false;
  }
  console.log('  ✅ Senha mestra correta');
  
  // Simular verificação na tabela clientes_info
  const emailExists = TEST_CONFIG.testEmails.includes(email);
  console.log(`  ✅ Email existe na tabela: ${emailExists}`);
  
  if (!emailExists) {
    console.log('  ❌ Email não encontrado na tabela clientes_info');
    return false;
  }
  
  console.log('  🎉 Acesso mestra concedido com sucesso!');
  return true;
}

// Função para testar cenários
function runTests() {
  console.log('🚀 Iniciando testes...\n');
  
  // Teste 1: Email válido + senha correta
  console.log('1️⃣ Teste com email válido e senha correta:');
  testMasterAccess('bbf.materiais@gmail.com', 'smartcrm2024');
  
  // Teste 2: Email válido + senha incorreta
  console.log('\n2️⃣ Teste com email válido e senha incorreta:');
  testMasterAccess('bbf.materiais@gmail.com', 'senhaerrada');
  
  // Teste 3: Email inválido + senha correta
  console.log('\n3️⃣ Teste com email inválido e senha correta:');
  testMasterAccess('naoexiste@teste.com', 'smartcrm2024');
  
  // Teste 4: Campos vazios
  console.log('\n4️⃣ Teste com campos vazios:');
  testMasterAccess('', '');
  
  console.log('\n🎯 Testes concluídos!');
}

// Função para verificar estrutura da tabela
function checkTableStructure() {
  console.log('\n📊 Verificando Estrutura da Tabela clientes_info');
  console.log('================================================');
  
  const expectedColumns = [
    'id',
    'email', 
    'nome',
    'telefone',
    'empresa',
    'created_at',
    'updated_at'
  ];
  
  console.log('Colunas esperadas:');
  expectedColumns.forEach(col => {
    console.log(`  ✅ ${col}`);
  });
  
  console.log('\n💡 Para verificar a estrutura real, execute no Supabase:');
  console.log('SELECT column_name, data_type FROM information_schema.columns');
  console.log("WHERE table_name = 'clientes_info' ORDER BY ordinal_position;");
}

// Função para verificar emails na tabela
function checkEmailsInTable() {
  console.log('\n📧 Verificando Emails na Tabela clientes_info');
  console.log('==============================================');
  
  console.log('💡 Para verificar emails reais, execute no Supabase:');
  console.log("SELECT id, email, nome FROM clientes_info ORDER BY id;");
  console.log('\n🔍 Verifique se os emails de teste existem:');
  TEST_CONFIG.testEmails.forEach(email => {
    console.log(`  📧 ${email}`);
  });
}

// Função principal
function main() {
  runTests();
  checkTableStructure();
  checkEmailsInTable();
  
  console.log('\n🔧 Próximos passos para debug:');
  console.log('1. Verifique se a tabela clientes_info existe');
  console.log('2. Verifique se os emails de teste estão na tabela');
  console.log('3. Verifique as permissões RLS da tabela');
  console.log('4. Teste o acesso mestra no console do navegador');
}

// Executar se estiver no Node.js
if (typeof window === 'undefined') {
  main();
} else {
  // No navegador, expor funções globalmente
  console.log('🌐 Execute este script no console do navegador');
  console.log('💡 Use: main() para executar todos os testes');
  
  window.main = main;
  window.testMasterAccess = testMasterAccess;
  window.checkTableStructure = checkTableStructure;
  window.checkEmailsInTable = checkEmailsInTable;
}
