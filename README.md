# Agendador Automático do RU (Restaurante Universitário)

![image](./assets/image.png)

## Dependências

Antes de rodar o projeto, você precisará ter as seguintes dependências instaladas:

- **Node.js**: Ambiente de execução JavaScript.
- **Puppeteer**: Biblioteca Node.js para automação de navegação em páginas web via Chromium.

## Como Configurar e Utilizar

### 1. Clone o repositório

```sh
git clone git@github.com:vistomia/ru.git
```

### 2. Instale as Dependências

Certifique-se de que o Node.js está instalado em seu sistema. Em seguida, instale as dependências do projeto:

```sh
npm install
```

### 3. Configure as Credenciais

Abra o arquivo `config-example.json`, edite com suas informações de login e preferências, e depois renomeie para `config.json`.

### 4. Executando o Agendador

Abra a pasta principal e rode:

```sh
node index.js
```

# Notas Adicionais

    Segurança: Não compartilhe o arquivo config.json, pois ele contém suas credenciais.
    Requisitos de Sistema: O Puppeteer requer um sistema com suporte ao Chromium ou uma versão do Google Chrome instalada.
    Ajustes: Caso o layout da página do RU seja alterado, o código pode precisar de ajustes.
