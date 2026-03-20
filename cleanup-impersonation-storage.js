// Script para limpar chaves antigas de impersonação
// Execute este script no console do navegador para limpar dados antigos

console.log('🧹 Iniciando limpeza de dados de impersonação antigos...');

// Limpar chaves antigas do localStorage
const oldLocalStorageKeys = [
  'impersonatedCliente',
  'isImpersonating'
];

oldLocalStorageKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`✅ Removido do localStorage: ${key}`);
  }
});

// Limpar chaves antigas do sessionStorage
const oldSessionStorageKeys = [
  'impersonatedCliente',
  'isImpersonating'
];

oldSessionStorageKeys.forEach(key => {
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    console.log(`✅ Removido do sessionStorage: ${key}`);
  }
});

// Limpar chaves escopadas por usuário (para casos onde o usuário mudou)
const allSessionKeys = Object.keys(sessionStorage);
const impersonationKeys = allSessionKeys.filter(key => 
  key.startsWith('impersonatedCliente_') || key.startsWith('isImpersonating_')
);

if (impersonationKeys.length > 0) {
  console.log('🔍 Encontradas chaves de impersonação escopadas:');
  impersonationKeys.forEach(key => {
    console.log(`  - ${key}: ${sessionStorage.getItem(key)}`);
  });
  
  // Perguntar se quer limpar todas
  const shouldClear = confirm('Encontradas chaves de impersonação escopadas. Deseja limpar todas?');
  if (shouldClear) {
    impersonationKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`✅ Removido: ${key}`);
    });
  }
}

console.log('✨ Limpeza concluída!');
console.log('💡 Dica: As novas chaves de impersonação são escopadas por usuário e mais seguras.');
