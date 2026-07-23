# DevOps Status Page

Projeto educacional de uma página de status para a empresa fictícia **Nimbus Tecnologia**.
A aplicação apresenta a situação dos serviços, a disponibilidade recente e o histórico de
incidentes em uma interface escura, responsiva e acessível.

O projeto foi pensado para uma aula prática em estações corporativas: não exige instalação
de dependências, servidor local, framework, CDN ou imagens externas. Todo o processo de
teste, build e publicação pode acontecer no GitHub Actions.

## Objetivos educacionais

Ao concluir a atividade, a turma terá praticado:

- versionamento de código com Git;
- publicação de um repositório pelo VS Code;
- criação e leitura de um workflow em YAML;
- integração contínua com testes automatizados;
- geração e transferência de artefatos entre jobs;
- entrega contínua no GitHub Pages;
- investigação de logs e nova execução de workflows.

## Arquitetura da solução

A aplicação é formada por HTML, CSS e JavaScript puros. Quando a página abre,
`public/app.js` usa `fetch` para carregar `public/services.json` e cria os cards e o
histórico dinamicamente. Todos os caminhos são relativos, por isso o site funciona tanto
na raiz quanto em um subdiretório do GitHub Pages.

O Node.js é usado somente na automação:

1. `node --test` valida o contrato dos dados.
2. `scripts/build.js` recria `dist`, copia os arquivos públicos e adiciona `.nojekyll`.
3. O GitHub Actions armazena `dist` como artefato do Pages.
4. O job de deploy publica esse artefato.

O navegador não precisa do Node.js. Abrir `public/index.html` diretamente pode impedir o
`fetch` por uma política de segurança do navegador; isso não afeta a versão publicada no
GitHub Pages.

## Estrutura de diretórios

```text
devops-status-page/
├── .github/
│   └── workflows/
│       └── pages.yml
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── services.json
├── scripts/
│   └── build.js
├── tests/
│   └── services.test.js
├── .gitignore
├── package.json
└── README.md
```

## CI e CD

**Integração contínua (CI)** é a validação automática de cada mudança. Neste projeto, o
job `validate` executa os testes, gera o site e confirma que `dist/index.html` existe.
Assim, problemas nos dados ou no build aparecem antes da publicação.

**Entrega contínua (CD)** é a preparação e disponibilização automática de uma versão
validada. O job `deploy` recebe o artefato gerado por `validate` e o publica no GitHub
Pages. Ele não executa em pull requests.

### Gatilhos do workflow

- `pull_request` para `main`: testa e gera o build, mas nunca publica.
- `push` em `main`: testa, gera o build e, se tudo passar, publica.
- `workflow_dispatch`: permite iniciar manualmente a mesma validação e publicação pela
  aba **Actions**.

### Jobs, steps e runners

Um **workflow** é todo o processo definido em `.github/workflows/pages.yml`. Um **job** é
um conjunto de tarefas executadas no mesmo ambiente. Cada tarefa dentro dele é um
**step**. O **runner** é a máquina temporária que executa os steps; aqui, os dois jobs
usam `ubuntu-latest`.

O job `validate` baixa o repositório, configura o Node.js 20, executa testes, faz o build
e verifica sua saída. Fora de pull requests, ele também configura o Pages e envia o
conteúdo de `dist`.

O job `deploy` declara `needs: validate`. Essa relação faz com que a publicação só comece
depois que toda a validação terminar com sucesso. As permissões de escrita no Pages e de
identidade são concedidas apenas a esse job.

### Artefato do GitHub Pages

Um artefato é um pacote produzido durante uma execução. O step
`actions/upload-pages-artifact` empacota `dist` no job `validate`. Como jobs usam
máquinas isoladas, esse pacote é a ponte até o job `deploy`, onde
`actions/deploy-pages` publica exatamente os arquivos já validados.

## Testes e build

Não há dependências nem `npm install`. Se houver Node.js 20 disponível, os mesmos comandos
da automação podem ser executados localmente:

```bash
npm test
npm run build
```

Os testes usam apenas `node:test` e `node:assert`. Eles verificam a existência e a
estrutura de `services.json`, campos obrigatórios, estados permitidos, IDs únicos,
disponibilidade e datas ISO dos incidentes.

O build remove uma eventual pasta `dist`, cria uma nova, copia todo o conteúdo de
`public`, cria `dist/.nojekyll` e confirma a presença de `dist/index.html`. A pasta
`dist` é gerada e, portanto, não deve ser versionada.

## Publicar usando o VS Code

1. Abra esta pasta no VS Code.
2. Abra a área **Controle do Código-Fonte**.
3. Se necessário, selecione **Inicializar Repositório**.
4. Revise os arquivos alterados e clique no botão `+` para prepará-los.
5. Escreva uma mensagem, por exemplo `Cria página de status e pipeline`.
6. Selecione **Commit**.
7. Use **Publicar Branch** ou **Sincronizar Alterações** e autentique-se no GitHub quando
   solicitado.
8. Confirme que a branch principal do repositório se chama `main`.

Também é possível usar o terminal integrado:

```bash
git add .
git commit -m "Cria página de status e pipeline"
git branch -M main
git push -u origin main
```

O endereço do repositório remoto e a autenticação dependem da conta e das políticas da
organização. Nenhum token deve ser salvo nos arquivos do projeto.

## Habilitar o GitHub Pages

1. No GitHub, abra o repositório.
2. Acesse **Settings** e depois **Pages**.
3. Em **Build and deployment**, escolha **GitHub Actions** como origem.
4. Faça um push em `main` ou execute o workflow manualmente.

Não selecione uma branch como origem de publicação: este projeto usa o artefato produzido
pelo workflow.

## Acompanhar uma execução

1. Abra a aba **Actions** do repositório.
2. Selecione o workflow **Validar e publicar a página de status**.
3. Abra a execução associada ao commit desejado.
4. Acompanhe os jobs `Testar e gerar o site` e `Publicar no GitHub Pages`.

Para localizar um erro, abra o job marcado em vermelho e expanda o step que falhou. O log
mostra o comando executado e, normalmente, a mensagem de teste ou build responsável pela
falha. Comece pela primeira mensagem de erro, corrija o arquivo indicado, faça um novo
commit e envie a alteração.

Para executar novamente sem criar outro commit, abra a execução e use **Re-run jobs**.
É possível repetir todos os jobs ou somente os que falharam, conforme as opções exibidas
pelo GitHub.

## Acessar a página publicada

Depois de um deploy concluído, a URL aparece:

- no resumo da execução do workflow;
- no job `Publicar no GitHub Pages`, vinculada ao ambiente `github-pages`;
- em **Settings > Pages**.

Em geral, o formato é `https://USUARIO.github.io/NOME-DO-REPOSITORIO/`. A atualização
pode levar alguns instantes para ficar disponível após o job terminar.

## Estados disponíveis

| Valor no JSON | Texto exibido | Significado |
| --- | --- | --- |
| `operational` | Operacional | Serviço funcionando normalmente |
| `degraded` | Desempenho degradado | Serviço disponível, mas com impacto |
| `maintenance` | Em manutenção | Intervenção planejada em andamento |
| `offline` | Indisponível | Serviço fora do ar |

Os estados são comunicados por texto, símbolos e cores. Dessa forma, a informação não
depende apenas da percepção de cor.
