# AGENTS.md

> Guia operacional para agentes de IA trabalhando no repositório `@florydev/linkedin-api-voyager`.

## O que é este repositório

Este repo mantém uma biblioteca TypeScript para acessar endpoints internos do LinkedIn Web, conhecidos informalmente como **Voyager API**. Ela **não usa a API oficial do LinkedIn** e depende de uma sessão autenticada do navegador, reaproveitando cookies como `li_at` e `JSESSIONID`.

O pacote publicado no npm é `@florydev/linkedin-api-voyager`. A saída publicada é a pasta `lib/`, gerada a partir de `src/`.

## O que é LinkedIn Voyager

`Voyager` é o conjunto de endpoints internos usados pelo frontend web do LinkedIn. Na prática, este repo faz três coisas:

1. Inicializa um cliente HTTP autenticado com headers/cookies parecidos com o navegador.
2. Chama endpoints REST e GraphQL internos do LinkedIn.
3. Normaliza respostas cheias de `included`, URNs e estruturas aninhadas para objetos mais simples.

## Regras essenciais para qualquer agente

- Rode tudo em **Node.js**, nunca no browser.
- Sempre inicialize `Client({ JSESSIONID, li_at })` antes de qualquer chamada.
- Nunca commite cookies, `.env`, `linkedin_cookies.json` ou credenciais hardcoded.
- Nunca edite `lib/` manualmente. Edite `src/` e gere build.
- Nunca trate `src/teste.ts` como exemplo de produção: ele é um playground local e hoje contém credenciais hardcoded.
- Se adicionar nova feature pública, atualize `src/index.ts`, `README.md` e `skills/references/*.md`.
- Se mexer no `worker-service`, trate-o como um subprojeto local separado da lib principal.

## Comandos principais

- Instalar dependências raiz: `yarn`
- Build da lib: `yarn build`
- Playground local atual: `yarn dev`
- Build do worker: `yarn --cwd worker-service build`
- Rodar worker compilado: `yarn --cwd worker-service start`

## Como a arquitetura funciona

### 1. Núcleo HTTP

Arquivo central: `src/core/config.ts`

- `Client()` cria a instância global `apiInstance`.
- `fetchDataApi()` faz `GET` em `/voyager/api${endpoint}`.
- `fetchDataClient()` faz `GET` direto e retorna `location` quando o interesse é inspecionar redirect.

Sem `Client()`, o resto da lib quebra.

O diretório `src/core/` contém também `errors.ts` (classes de erro), `utils.ts` (parsers compartilhados) e `types.ts` (tipos compartilhados globais).

### 2. Camada de domínio

Cada módulo em `src/modules/<nome>/` encapsula uma parte do LinkedIn, com seu próprio `types.ts` e `index.ts` barrel:

- `src/modules/user/` -> perfis, about, experiências, contato, skills, educação, certificações, projetos, voluntariado, honras, cursos, organizações, publicações, patentes, testes/scores, idiomas, recomendações
- `src/modules/company/` -> empresa por slug + busca funcionários/ex-funcionários
- `src/modules/posts/` -> post, posts de usuário, comentários
- `src/modules/search/` -> busca geral e busca de pessoas
- `src/modules/messages/` -> inbox e mensagens
- `src/modules/network/` -> convites recebidos/enviados
- `src/modules/sse/` -> realtime/SSE

### 3. Parsing e normalização

Arquivo crítico: `src/core/utils.ts`

Este arquivo existe porque o LinkedIn devolve muitos dados em formato normalizado:

- entidades separadas em `included`
- referências em chaves como `*entityResult`
- imagens como `rootUrl + artifact`
- URNs como `urn:li:fsd_profile:...`

Helpers como `resolveReferences`, `extractDataWithReferences`, `extractFields`, `getIdFromUrn` e `normalizeRawOrganization` fazem esse trabalho pesado.

### 4. Tipagem

Não há mais um `types.ts` monolítico. A tipagem é distribuída:

- `src/core/types.ts` -> tipos compartilhados globais (Paging, URNs de imagem, etc)
- `src/modules/<dominio>/types.ts` -> tipos específicos do domínio

Se um endpoint novo entrar, coloque os tipos no `types.ts` do módulo correspondente. Se for compartilhado, coloque em `core/types.ts`.

### 5. Superfície pública

Arquivo: `src/index.ts`

Tudo que o pacote expõe publicamente precisa ser reexportado aqui. O barrel agregador reexporta de cada `src/modules/<nome>/index.ts`.

## Estrutura do repositório

### Raiz

- `package.json` -> pacote npm principal, build via `tsc`, publicação de `lib/**/*`
- `tsconfig.json` -> compila `src` para `lib`, exclui `lib`
- `README.md` -> documentação pública da biblioteca
- `AGENTS.md` -> este arquivo
- `yarn.lock` / `pnpm-lock.yaml` -> lockfiles
- `.gitignore` -> ignora `lib`, `.env`, `src/teste.ts`, `worker-service`, cookies e lockfile de npm

### `src/`

```
src/
├── index.ts                # barrel principal / exports públicos
├── teste.ts                # playground local (ignorado no git)
├── core/                   # compartilhado (não pertence a nenhum domínio)
│   ├── config.ts           # cliente HTTP, headers, cookies, fetch helpers
│   ├── errors.ts           # classes de erro
│   ├── utils.ts            # parsing, URNs, imagens, normalização
│   └── types.ts            # tipos compartilhados globais
└── modules/                # camada de domínio por assunto
    ├── user/               # APIs de perfil (15+ arquivos)
    │   ├── index.ts
    │   ├── types.ts
    │   └── user-*.ts
    ├── company/            # empresa + pessoas por empresa
    │   ├── index.ts
    │   ├── types.ts
    │   ├── company.ts
    │   └── company-people.ts
    ├── posts/              # posts e comentários
    │   ├── index.ts
    │   ├── types.ts
    │   └── posts.ts
    ├── search/             # busca geral e pessoas
    │   ├── index.ts
    │   ├── types.ts
    │   └── search.ts
    ├── messages/           # inbox e mensagens
    │   ├── index.ts
    │   ├── types.ts
    │   └── message.ts
    ├── network/            # convites, conexões, follow, lists de 3º perfil
    │   ├── index.ts
    │   ├── types.ts
    │   ├── network.ts              # received/sent invitations, getMyConnections
    │   ├── invitation-actions.ts   # sendConnectionRequest, cancelSentInvitation
    │   ├── connection-actions.ts   # removeConnection
    │   ├── follow-actions.ts       # followProfile, unfollowProfile
    │   ├── profile-lists.ts        # getProfileConnections/Followers/Following
    │   └── profile-lists-shared.ts # shared vars + parser
    └── sse/                # streaming de eventos em tempo real
        ├── index.ts
        ├── types.ts
        └── linkedin-sse.ts
```

### `skills/`

Documentação operacional para agentes focados na própria lib.

- `skills/SKILL.md` -> roteador de uso
- `skills/references/profiles.md`
- `skills/references/companies.md`
- `skills/references/posts.md`
- `skills/references/search-network.md`
- `skills/references/realtime.md`
- `skills/references/internals.md`

Esses arquivos são a forma mais rápida de descobrir como um módulo deveria ser usado.

### `lib/`

Artefato gerado de build. Não editar manualmente.

### `worker-service/`

Subprojeto local voltado a SSE + fila + Supabase.

- `worker-service/src/index.ts` -> entrypoint principal
- `worker-service/src/sse-listener.ts` -> inicia um listener SSE para uma conta única via env
- `worker-service/src/listener.ts` -> sincroniza contas ativas e publica eventos iniciais na fila
- `worker-service/src/queue.ts` -> integração BullMQ/Redis
- `worker-service/src/accounts.ts` -> carrega contas ativas do Supabase
- `worker-service/src/supabase.ts` -> cliente admin do Supabase
- `worker-service/src/env.ts` -> parser e validação de envs
- `worker-service/src/constants.ts` -> nomes de tabela, fila, jobs e eventos
- `worker-service/src/worker.ts` -> fluxo legado/experimental com webhook externo
- `worker-service/dist/` -> build gerado
- `worker-service/.env.example` -> variáveis esperadas

Observação importante: `worker-service` está ignorado no `.gitignore` da raiz. Trate como ambiente auxiliar/local, não como parte do pacote publicado.

## Onde achar os endpoints do Voyager neste repo

Comece por `src/core/config.ts`: toda chamada passa por `/voyager/api`.

Mapa prático:

- Perfil próprio: `src/modules/user/` -> `/me`
- Perfil por vanity name: `src/modules/user/` -> `graphql?...queryId=voyagerIdentityDashProfiles...`
- About / cards do perfil: `src/modules/user/` -> `voyagerIdentityDashProfileCards...`
- Experiências / skills / education / certifications: `src/modules/user/` -> `voyagerIdentityDashProfileComponents...`
- Empresa por slug: `src/modules/company/company.ts` -> `/organization/companies?...q=universalName`
- Pessoas da empresa: `src/modules/company/company-people.ts` -> `voyagerSearchDashClusters...`
- Busca geral e pessoas: `src/modules/search/` -> `voyagerSearchDashClusters...`
- Comentários: `src/modules/posts/` -> `voyagerSocialDashComments...`
- Post por slug: `src/modules/posts/` -> `voyagerFeedDashUpdates...`
- Posts do usuário: `src/modules/posts/` -> `voyagerFeedDashProfileUpdates...`
- Inbox: `src/modules/messages/` -> `/voyagerMessagingGraphQL/graphql?queryId=messengerConversations...`
- Mensagens: `src/modules/messages/` -> `/voyagerMessagingGraphQL/graphql?queryId=messengerMessages...`
- Convites recebidos/enviados: `src/modules/network/network.ts` -> `/relationships/invitationViews`
- Minhas conexões: `src/modules/network/network.ts` -> `/relationships/connections`
- Enviar/cancelar convite / follow/unfollow / remover conexão -> **SDUI flagship-web RSC** (não mais Voyager)
  - Base: `POST /flagship-web/rsc-action/actions/server-request?sduiid=<sduiid>&_v=0.2.6676`
  - requestId **= sduiid** (NÃO UUID aleatório!)
  - Estrutura do envelope (validado em captura real 2026):
    ```
    {
      requestId: "<SDUI_ID>",
      serverRequest: {
        requestId: "<mesmo SDUI_ID>",
        requestedArguments: {
          $type: "proto.sdui.actions.requests.RequestedArguments",
          requestedStateKeys: [],          // vazio na maioria
          payload: <payload ESPECÍFICO>,
          requestMetadata: { $type: "proto.sdui.common.RequestMetadata" }
        },
        onClientRequestFailureAction: { actions: [] },  // SEM failureType
        isApfcEnabled: false,
        isStreaming: false,
        rumPageKey: ""
      },
      states: [],
      requestedArguments: {                   // DUPLICADO na raiz
        $type: "proto.sdui.actions.requests.RequestedArguments",
        payload: <cópia idêntica>,
        requestMetadata: {...},
        states: [],
        screenId: "com.linkedin.sdui.flagshipnav.profile.Profile" | "...mynetwork.Grow",
        knownTemplateIds: []
      }
    }
    ```
  - Headers obrigatórios SDUI (injetados por postSduiAction):
    - `Content-Type: application/json`
    - `x-li-rsc-stream: true`
    - `x-li-application-version: 0.2.6676`
    - `x-li-page-instance-tracking-id: <16 bytes base64>`
    - `x-li-application-instance: "undefined"` (ou UUID real)
    - `x-li-anchor-page-key: d_flagship3_profile_view_base | d_flagship3_people`
    - `x-li-page-instance: urn:li:page:<anchor>;<tracking_id>`
    - `x-li-track: { clientVersion:"0.2.6676", mpName:"web", mpVersion:"0.2.6676", osName:"web", ... }`
  - Helper: `src/core/sdui.ts` -> `postSduiAction({ sduiid, payload, anchorPageKey?, screenId?, refererUrl? })`
  - sduiids: `addaAddConnection`, `addaWithdrawInvitation`, `addaUpdateFollowState`, `mynetwork.RemoveConnectionVanityName`
  - **Payloads reais validados (GROUND TRUTH)**:
    - **addaUpdateFollowState (seguir/parar de seguir)**:
      ```
      {
        followStateType: "FollowStateType_FOLLOW_ACTIVE" | "FollowStateType_FOLLOW_INACTIVE",
        memberUrn: { memberId: "<ID_NUMÉRICO_LEGADO>" },    // NÃO é o ACoA!
        followStateBinding: {
          key: "urn:li:fsd_followingState:urn:li:member:<numid>",
          namespace: null
        },
        postActionSentConfigs: []
      }
      ```
    - **addaAddConnection (enviar convite)**:
      ```
      {
        inviteeUrn: { memberId: "<ID_NUMÉRICO_LEGADO>" },  // objeto, NÃO string URN!
        nonIterableProfileId: "ACoA...",                     // fsdMemberId
        renderMode: "IconAndText",
        firstName: "Nome", lastName: "Sobrenome",            // opcionais
        origin: "InvitationOrigin_PYMK_COHORT_SECTION",      // (ou PROFILE_VIEW)
        clientContext: "MyNetworkPYMK",                      // (ou string do contexto)
        isDisabled: { key: "connect-button-disabled-...", namespace: "MemoryNamespace" },
        connectionState: { key: "state:invitation:urn:li:member:<numid>", namespace: "MemoryNamespace" },
        profileCanonicalUrl: "https://...",
        postActionSentConfigs: []
      }
      ```
  - **IMPORTANTE**: `memberUrn.memberId` e `inviteeUrn.memberId` usam o **ID legado numérico**
    (ex: `701527688`), **NÃO** o `fsd_member:ACoA...`. Esse ID vem de `resolveMemberIds().legacyNumericMemberId`
    e é extraído via varredura recursiva por regex `urn:li:member:(\d+)` no JSON de perfil
    (helper `extractFirstLegacyNumericId` em `network-helpers.ts`).
- Conexões/seguidores de perfil 3º: `src/modules/network/profile-lists.ts` -> `voyagerSearchDashClusters` com filtro `NETWORK.connectionOf=urn:li:fsd_member:<id>`
- Realtime: `src/modules/sse/` -> `https://www.linkedin.com/realtime/connect?rc=1`

Para descobrir endpoints novos, procure por:

- `fetchDataApi(`
- `postSduiAction(`
- `queryId=`
- `/voyagerMessagingGraphQL/`
- `/organization/companies`
- `/relationships/`
- `/realtime/`
- `/flagship-web/rsc-action/`

## Como um agente deve desenvolver novas features aqui

### Fluxo recomendado

1. Identifique o domínio certo (`user`, `company`, `posts`, `message`, etc.) em `src/modules/<dominio>/`.
2. Localize o endpoint real do LinkedIn.
3. Faça primeiro uma versão crua com `fetchDataApi()` de `src/core/config.ts`.
4. Inspecione `included`, `*entityResult`, URNs e imagens.
5. Extraia helpers reutilizáveis para `src/core/utils.ts` se houver padrão repetido.
6. Crie ou refine tipos no `src/modules/<dominio>/types.ts` (ou `src/core/types.ts` se for compartilhado).
7. Exponha função de alto nível no módulo correto.
8. Reexporte no `src/modules/<dominio>/index.ts` e depois no `src/index.ts`.
9. Documente no `README.md` e no arquivo adequado em `skills/references/`.

### Padrões do repo que devem ser preservados

- Funções de domínio são pequenas e focadas em um endpoint/uso.
- Mapeamentos de campos costumam usar `extractFields`.
- Resolução de URNs costuma passar por `resolveReferences` ou `extractDataWithReferences`.
- Imagens devem ser convertidas para URL final sempre que possível.
- Busca de IDs internos usa helpers como `getIdFromUrn`.

### Coisas que merecem cuidado

- Há muito `any` no código atual. Melhorar tipagem é bem-vindo, mas sem quebrar a API pública.
- Alguns módulos têm comportamento inconsistente, por exemplo defaults diferentes para `includePrivateProfiles`.
- `getPosts()` hoje é placeholder e retorna `[]`.
- `errors.ts` existe, mas nem toda a base usa essas classes de forma consistente.
- `config.ts` hoje tem headers/cookies hardcoded além dos cookies fornecidos. Mudanças aí afetam a lib inteira.

## Playbook de engenharia reversa do LinkedIn

Use este processo ao adicionar um endpoint novo:

1. Faça login manual no LinkedIn no navegador.
2. Abra DevTools -> Network.
3. Filtre por `voyager`, `graphql`, `messaging`, `realtime` ou pela ação que você quer reproduzir.
4. Execute a ação no site.
5. Ache a request correta e capture:
   - URL completa
   - `queryId`
   - `variables`
   - headers importantes
   - necessidade de cookies/sessão
   - formato da resposta
6. Verifique se a resposta usa:
   - `included`
   - URNs em chaves com `*`
   - imagens em `vectorImage`
   - paginação em `paging`
7. Reproduza a chamada primeiro com `fetchDataApi()`.
8. Só depois construa a função pública tipada.

### Dicas específicas de engenharia reversa para Voyager

- GraphQL interno do LinkedIn costuma usar `queryId` fixo em vez de nomes amigáveis.
- Muitos relacionamentos vêm como URN e precisam ser resolvidos contra `included`.
- Em busca, o dado útil frequentemente está em `res.data.data.searchDashClustersByAll`.
- Em messaging, existem endpoints separados sob `/voyagerMessagingGraphQL/graphql`.
- Em SSE, o stream vem em blocos `data: {...}\n\n`; o parser atual já trata isso.
- Em imagens, quase sempre é necessário concatenar `rootUrl` com o melhor `artifact`.
- Em URLs públicas do perfil, primeiro resolva `publicIdentifier`, depois o ID interno, se necessário.

## Segurança e limites

- Nunca salve `li_at` e `JSESSIONID` em código-fonte.
- Não leia nem replique valores de `.env`, `linkedin_cookies.json` ou scripts com cookies reais.
- Se encontrar credenciais hardcoded, trate como dívida técnica e não como padrão.
- Lembre que esta biblioteca depende de endpoints internos do LinkedIn e pode quebrar sem aviso.
- Use volume moderado de requests; perfis com muitas experiências e comentários grandes podem gerar cascata de chamadas.

## Quando mexer no worker-service

Só mexa nele se a tarefa envolver ingestão de eventos, BullMQ, Redis, Supabase ou listeners SSE persistentes.

Fluxo atual:

1. Lê envs.
2. Cria fila BullMQ.
3. Tenta iniciar um listener de conta única via env.
4. Se não houver credenciais únicas, sincroniza contas ativas do Supabase.

`worker-service/src/worker.ts` não é o fluxo principal atual. Ele parece um caminho legado/experimental baseado em webhook externo.

## Checklist de mudança

Antes de encerrar qualquer tarefa neste repo, confirme:

- código alterado em `src/`, não em `lib/`
- export público atualizado em `src/index.ts` (e no `src/modules/<dominio>/index.ts` correspondente)
- tipos adicionados/ajustados no `src/modules/<dominio>/types.ts` (ou `core/types.ts` se compartilhado)
- parsing reutilizável extraído para `src/core/utils.ts` quando faz sentido
- docs sincronizadas em `README.md` e `skills/references/*.md`
- nenhum secret foi introduzido

## Arquivos que um agente deve ler primeiro, dependendo da tarefa

- Contexto geral -> `README.md`
- API pública -> `src/index.ts`
- Cliente HTTP -> `src/core/config.ts`
- Parsers -> `src/core/utils.ts`
- Tipos compartilhados -> `src/core/types.ts`
- Tipos de um domínio -> `src/modules/<dominio>/types.ts`
- Como usar perfis -> `skills/references/profiles.md`
- Como usar empresas -> `skills/references/companies.md`
- Como usar busca/mensagens/rede -> `skills/references/search-network.md`
- Como usar posts -> `skills/references/posts.md`
- Como usar realtime -> `skills/references/realtime.md`
- Como chamar endpoints crus e entender internals -> `skills/references/internals.md`
