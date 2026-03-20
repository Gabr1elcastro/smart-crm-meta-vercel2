// Script para atualizar Conversations.tsx
// Substitui todos os usos de user.id_cliente por clientId

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/conversations/Conversations.tsx');

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Substituições necessárias
const replacements = [
  // Substituir user.id_cliente por clientId em todas as ocorrências
  { from: /\.eq\('id_cliente', user\.id_cliente\)/g, to: ".eq('id_cliente', clientId)" },
  { from: /\.eq\('id_cliente', user\.id_cliente\);/g, to: ".eq('id_cliente', clientId);" },
  { from: /id_cliente: user\.id_cliente,/g, to: "id_cliente: clientId," },
  { from: /updateVendaStatus\(leadData\.id, user\.id_cliente,/g, to: "updateVendaStatus(leadData.id, clientId," },
  { from: /updateLead\(editingLead\.id, user\.id_cliente,/g, to: "updateLead(editingLead.id, clientId," },
  { from: /listar\(user\.id_cliente\)/g, to: "listar(clientId)" },
  { from: /getByClientId\(user\.id_cliente\)/g, to: "getByClientId(clientId)" },
  { from: /listByCliente\(user\.id_cliente\)/g, to: "listByCliente(clientId)" },
  { from: /idCliente={user\.id_cliente}/g, to: "idCliente={clientId}" },
];

// Aplicar todas as substituições
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Escrever o arquivo atualizado
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Arquivo Conversations.tsx atualizado com sucesso!');
console.log('📝 Todas as referências a user.id_cliente foram substituídas por clientId'); 