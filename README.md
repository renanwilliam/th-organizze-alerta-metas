# Envio de Alertas de metas Organizze para Telegram

Consulta API do [Organizze](https://github.com/organizze) e envia para Grupo no Telegram

### Configurando Telegram

Para configurar a parte do Telegram, faça o seguinte:

- Manda uma mensagem para `/newbot` para [@BotFather](https://t.me/BotFather). Escolha um nome e username. Anote o Token
  do Bot.
- Crie um novo grupo e adicione o bot gerado
- Adicione também no grupo o bot [@getidsbot](https://t.me/getidsbot) para descobrir o **Chat ID**. Após isso, você pode
  remover o @getidsbot do grupo.

### Configurações [TunnelHub.io](https://tunnelhub.io)

- Preencha os seguintes parâmetros na automação
  - TELEGRAM_TOKEN: preencha com o Token gerado pelo @BotFather
  - TELEGRAM_CHAT_ID: preencha com o ID do @getidsbot
- Crie um sistema com o ID externo igual a ORGANIZZE, do tipo HTTP com autenticação Basic, e faça a atribuição para
  automação.

### Dados de ambiente:

* Ambiente: nodejs18.x
* Memoria: 256mb
* Timeout: 30s

### Instruções básicas:

* Instale todas as dependências com `npm install` ou `yarn`.
* Para implantar sua automação, compacte todo o seu projeto em um arquivo zip. Use `yarn run build` para transpilar todo
  o seu código e
  bibliotecas usando esbuild e salve-as na pasta `dist`.
* Confira nossa [documentação](https://docs.tunnelhub.io) para mais informações.

Para implantar, execute o comando:

* `yarn run build && th deploy-automation --env ENVNAME --message "Mensagem"`

Por conveniência, foram criados alguns scripts auxiliares:

* Para ambiente DEV: `yarn run deploy:dev --message "Mensagem"`
* Para ambiente PRD: `yarn run deploy:prd --message "Mensagem"`