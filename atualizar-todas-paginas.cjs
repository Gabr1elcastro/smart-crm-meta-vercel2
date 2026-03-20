const fs = require('fs');
const path = require('path');

// Função para atualizar um arquivo
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Verificar se o arquivo já importa useClientId
    if (!content.includes('useClientId')) {
      // Adicionar import do useClientId
      const importMatch = content.match(/import.*useAuth.*from.*@\/contexts\/auth/);
      if (importMatch) {
        const newImport = importMatch[0] + '\nimport { useClientId } from \'@/hooks/useClientId\';';
        content = content.replace(importMatch[0], newImport);
        updated = true;
      }
    }

    // Adicionar const { clientId } = useClientId(); após const { user } = useAuth();
    const userAuthMatch = content.match(/const\s*\{\s*user\s*\}\s*=\s*useAuth\(\);/);
    if (userAuthMatch && !content.includes('const { clientId } = useClientId();')) {
      const newLine = userAuthMatch[0] + '\n  const { clientId } = useClientId();';
      content = content.replace(userAuthMatch[0], newLine);
      updated = true;
    }

    // Substituir user.id_cliente por clientId
    const oldContent = content;
    content = content.replace(/user\.id_cliente/g, 'clientId');
    
    if (content !== oldContent) {
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)} atualizado`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error.message);
    return false;
  }
}

// Lista de arquivos para atualizar
const filesToUpdate = [
  'src/pages/reports/Reports.tsx',
  'src/pages/reports/ListView.tsx',
  'src/pages/reports/board/context/BoardContext.tsx',
  'src/pages/contatos/Contatos.tsx',
  'src/pages/settings/UsersData.tsx',
  'src/pages/GruposDisparo.tsx',
  'src/pages/followup/ConfigFollowup.tsx',
  'src/pages/etiquetas/index.tsx',
  'src/pages/departamentos/index.tsx',
  'src/hooks/useUserType.ts',
  'src/hooks/usePermissions.ts'
];

console.log('🔄 Atualizando todas as páginas para usar clientId...');

let updatedCount = 0;
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    if (updateFile(fullPath)) {
      updatedCount++;
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
  }
});

console.log(`\n✅ Concluído! ${updatedCount} arquivos atualizados.`);
console.log('📝 Todas as páginas agora usam o ID correto do cliente.'); 