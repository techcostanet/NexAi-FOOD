# Regras do Projeto NexAi-FOOD

Toda alteração de código ou deploy neste projeto deve seguir rigorosamente as seguintes diretrizes:

1. **Versionamento Automático & Histórico de Versões:**
   - A cada alteração/deploy, a versão deve ser incrementada em `package.json` e `src/client/src/data/versions.ts`.
   - O histórico de versões (`VERSIONS_HISTORY`) deve registrar detalhadamente as mudanças com data, título, tag e categoria.

2. **Persistência em Banco de Dados Nuvem (Firebase Firestore):**
   - Todos os dados (Produtos, Entradas, Sobras/Desperdício, Usuários, Áreas, etc.) devem ser salvos e lidos exclusivamente no Firebase Cloud Firestore.
   - Manter escuta em tempo real (`onSnapshot` / evento `firestore:sync`) em todos os componentes UI.

3. **Sincronização com GitHub:**
   - A cada deploy ou alteração concluída, o código deve obrigatoriamente ser commitado e enviado (*push*) para o repositório no GitHub (`origin main`).
