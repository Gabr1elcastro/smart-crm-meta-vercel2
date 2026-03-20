// Teste definitivo para verificar URL limpa
console.log('🔍 Teste Definitivo - URL de Redirecionamento\n');

// 1. URL hardcoded (como no AuthService)
const RESET_REDIRECT = 'https://app.usesmartcrm.com/update-password';

console.log('1️⃣ URL Hardcoded:');
console.log('   String:', `"${RESET_REDIRECT}"`);
console.log('   Comprimento:', RESET_REDIRECT.length);
console.log('   JSON:', JSON.stringify(RESET_REDIRECT));

// 2. Verificar caracteres invisíveis
console.log('\n2️⃣ Análise de Caracteres:');
const charCodes = [...RESET_REDIRECT].map(c => c.charCodeAt(0));
console.log('   Char codes:', charCodes);

// Verificar tipos de espaços
const hasSpace = charCodes.includes(32);        // Espaço normal
const hasNBSP = charCodes.includes(160);        // Non-breaking space
const hasZeroWidth = charCodes.includes(8203);  // Zero-width space
const hasTab = charCodes.includes(9);           // Tab
const hasNewline = charCodes.includes(10) || charCodes.includes(13); // \n ou \r

console.log('   Espaço normal (32):', hasSpace ? '❌ ENCONTRADO' : '✅ NÃO ENCONTRADO');
console.log('   NBSP (160):', hasNBSP ? '❌ ENCONTRADO' : '✅ NÃO ENCONTRADO');
console.log('   Zero-width (8203):', hasZeroWidth ? '❌ ENCONTRADO' : '✅ NÃO ENCONTRADO');
console.log('   Tab (9):', hasTab ? '❌ ENCONTRADO' : '✅ NÃO ENCONTRADO');
console.log('   Newline (10/13):', hasNewline ? '❌ ENCONTRADO' : '✅ NÃO ENCONTRADO');

// 3. Teste de limpeza
console.log('\n3️⃣ Teste de Limpeza:');
const trimmed = RESET_REDIRECT.trim();
const normalized = RESET_REDIRECT.normalize();
const noSpaces = RESET_REDIRECT.replace(/\s+/g, '');

console.log('   Original === Trimmed:', RESET_REDIRECT === trimmed ? '✅ SIM' : '❌ NÃO');
console.log('   Original === Normalized:', RESET_REDIRECT === normalized ? '✅ SIM' : '❌ NÃO');
console.log('   Original === NoSpaces:', RESET_REDIRECT === noSpaces ? '✅ SIM' : '❌ NÃO');

// 4. Validação de URL
console.log('\n4️⃣ Validação de URL:');
try {
  const url = new URL(RESET_REDIRECT);
  console.log('   ✅ URL válida');
  console.log('   Protocolo:', url.protocol);
  console.log('   Host:', url.host);
  console.log('   Pathname:', url.pathname);
  console.log('   URL completa:', url.toString());
} catch (error) {
  console.log('   ❌ URL inválida:', error.message);
}

// 5. Simulação de envio para Supabase
console.log('\n5️⃣ Simulação de Envio:');
const mockSupabaseCall = {
  email: 'teste@exemplo.com',
  redirectTo: RESET_REDIRECT
};

console.log('   Objeto enviado:', JSON.stringify(mockSupabaseCall, null, 2));
console.log('   redirectTo length:', mockSupabaseCall.redirectTo.length);

// 6. Verificação de segurança
console.log('\n6️⃣ Verificação de Segurança:');
const isSecure = RESET_REDIRECT.startsWith('https://');
const hasCorrectDomain = RESET_REDIRECT.includes('app.usesmartcrm.com');
const hasCorrectPath = RESET_REDIRECT.endsWith('/update-password');

console.log('   HTTPS:', isSecure ? '✅ SIM' : '❌ NÃO');
console.log('   Domínio correto:', hasCorrectDomain ? '✅ SIM' : '❌ NÃO');
console.log('   Path correto:', hasCorrectPath ? '✅ SIM' : '❌ NÃO');

// 7. Resumo final
console.log('\n🎯 RESUMO FINAL:');
const allClean = !hasSpace && !hasNBSP && !hasZeroWidth && !hasTab && !hasNewline;
const allValid = isSecure && hasCorrectDomain && hasCorrectPath;

if (allClean && allValid) {
  console.log('   ✅ URL PERFEITA - Pronta para uso!');
} else {
  console.log('   ❌ URL COM PROBLEMAS - Verificar origem dos espaços');
  
  if (!allClean) {
    console.log('   🔍 Problemas de caracteres:');
    if (hasSpace) console.log('      - Espaços normais detectados');
    if (hasNBSP) console.log('      - NBSP detectados');
    if (hasZeroWidth) console.log('      - Zero-width spaces detectados');
    if (hasTab) console.log('      - Tabs detectados');
    if (hasNewline) console.log('      - Newlines detectados');
  }
  
  if (!allValid) {
    console.log('   🔍 Problemas de estrutura:');
    if (!isSecure) console.log('      - Não é HTTPS');
    if (!hasCorrectDomain) console.log('      - Domínio incorreto');
    if (!hasCorrectPath) console.log('      - Path incorreto');
  }
}

console.log('\n📋 PRÓXIMOS PASSOS:');
if (allClean && allValid) {
  console.log('   1. ✅ URL está limpa - testar em produção');
  console.log('   2. ✅ Verificar configurações no Supabase');
  console.log('   3. ✅ Testar fluxo completo de reset');
} else {
  console.log('   1. ❌ Corrigir origem dos espaços');
  console.log('   2. ❌ Verificar variáveis de ambiente');
  console.log('   3. ❌ Verificar configurações do provedor');
  console.log('   4. ❌ Redigitar configurações no Supabase');
}
