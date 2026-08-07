# LinkedIn API Voyager

> Biblioteca TypeScript para interagir com endpoints internos do LinkedIn Web (Voyager API).

> Aviso importante: esta biblioteca **não usa a API oficial do LinkedIn**.

[![npm version](https://img.shields.io/npm/v/@florydev/linkedin-api-voyager.svg)](https://www.npmjs.com/package/@florydev/linkedin-api-voyager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Mudança de pacote

O pacote antigo `linkedin-api-voyager` foi renomeado para `@florydev/linkedin-api-voyager`.

```bash
yarn add @florydev/linkedin-api-voyager
```

## O que esta biblioteca faz

Esta biblioteca encapsula chamadas para endpoints internos usados pelo frontend do LinkedIn e normaliza as respostas para uso em aplicações Node.js.

Ela cobre:

- perfis de usuário
- experiências, skills, educação e certificações
- dados de empresas
- busca de pessoas
- busca de pessoas por empresa
- posts e comentários
- inbox e mensagens
- convites de conexão
- eventos em tempo real via SSE

## Requisitos

- Node.js
- sessão autenticada no LinkedIn
- cookies válidos `li_at` e `JSESSIONID`

Esta biblioteca deve ser usada **somente no backend**. Não use no browser.

## Instalação

```bash
yarn add @florydev/linkedin-api-voyager
```

## Configuração obrigatória

Você precisa inicializar o `Client()` uma única vez antes de chamar qualquer função.

```ts
import { Client } from "@florydev/linkedin-api-voyager";

Client({
  li_at: process.env.LINKEDIN_LI_AT!,
  JSESSIONID: process.env.LINKEDIN_JSESSIONID!,
});
```

### Como obter `li_at` e `JSESSIONID`

1. Faça login no LinkedIn no navegador.
2. Abra o DevTools.
3. Vá em `Application` ou `Storage`.
4. Abra `Cookies` de `https://www.linkedin.com`.
5. Copie:
   - `li_at`
   - `JSESSIONID`

## Importante sobre o `JSESSIONID`

Passe somente o valor base do cookie no `Client`.

Exemplo seguro:

```ts
Client({
  li_at: "AQED....",
  JSESSIONID: "1234567890",
});
```

Se você copiar algo como `"ajax:1234567890"` do navegador, normalize antes de passar.

## Exemplo rápido

```ts
import "dotenv/config";
import {
  Client,
  getUserMiniProfile,
  getCompany,
  searchPeople,
} from "@florydev/linkedin-api-voyager";

Client({
  li_at: process.env.LINKEDIN_LI_AT!,
  JSESSIONID: process.env.LINKEDIN_JSESSIONID!,
});

async function main() {
  const profile = await getUserMiniProfile("florymignon");
  const company = await getCompany("microsoft");
  const people = await searchPeople({
    query: "software engineer",
    regions: ["br:0"],
  });

  console.log({
    profile,
    company,
    totalPeople: people.results.length,
  });
}

main().catch(console.error);
```

## API pública

### Perfis

```ts
import {
  getMe,
  getUserMiniProfile,
  extractProfileIdLinkedin,
  getProfileSectionAbout,
  getProfissionalExperiences,
  getContactInfo,
  getLinkedinSkills,
  getLinkedinEducation,
  getLinkedinCertifications,
} from "@florydev/linkedin-api-voyager";
```

- `getMe()` -> perfil da sessão autenticada
- `getUserMiniProfile(identifier)` -> mini perfil por `publicIdentifier`
- `extractProfileIdLinkedin(profileUrl)` -> resolve o ID interno do perfil
- `getProfileSectionAbout(identifier)` -> texto da seção About
- `getProfissionalExperiences(identifier)` -> experiências profissionais
- `getContactInfo(identifier)` -> informações de contato
- `getLinkedinSkills(identifier)` -> skills
- `getLinkedinEducation(identifier)` -> educação
- `getLinkedinCertifications(identifier)` -> certificações

Exemplo:

```ts
const profile = await getUserMiniProfile("florymignon");
const experiences = await getProfissionalExperiences("florymignon");
const contact = await getContactInfo("florymignon");
```

### Empresas

```ts
import { getCompany } from "@florydev/linkedin-api-voyager";

const company = await getCompany("microsoft");
```

O parâmetro é o slug da URL da empresa:

- `https://www.linkedin.com/company/microsoft/` -> `"microsoft"`

### Pessoas de uma empresa

```ts
import {
  getCompanyEntityId,
  searchCompanyPeople,
} from "@florydev/linkedin-api-voyager";

const companyId = await getCompanyEntityId("microsoft");

const people = await searchCompanyPeople({
  companyId,
  query: "engineer",
  pastCompany: false,
  includePrivateProfiles: true,
  offset: 0,
  limit: 10,
});
```

Campos úteis:

- `companySlug`
- `companyId`
- `query`
- `regions`
- `schools`
- `keywordTitle`
- `pastCompany`
- `includePrivateProfiles`

## Busca

### Busca geral

```ts
import { search } from "@florydev/linkedin-api-voyager";

const res = await search({
  query: "react developer",
  offset: 0,
  limit: 25,
});
```

### Busca de pessoas

```ts
import { searchPeople } from "@florydev/linkedin-api-voyager";

const people = await searchPeople({
  query: "engenheiro de software",
  regions: ["br:0"],
  currentCompany: ["urn:li:fsd_company:1035"],
  networkDepths: ["F", "S"],
  keywordTitle: "CTO",
});
```

Observações:

- `search()` limita cada chamada a no máximo `25` resultados.
- `searchPeople()` aceita string simples ou objeto com filtros.
- `networkDepths` usa:
  - `F` -> 1º grau
  - `S` -> 2º grau
  - `O` -> fora da rede

## Posts e comentários

```ts
import {
  getPostLinkedin,
  getCommentsByPostUrl,
  getUserPosts,
} from "@florydev/linkedin-api-voyager";
```

### Post por URL

```ts
const post = await getPostLinkedin(
  "https://www.linkedin.com/posts/florymignon_...-activity-1234567890-abcd",
  10,
  10,
);
```

### Comentários de um post

```ts
const comments = await getCommentsByPostUrl(
  "https://www.linkedin.com/feed/update/urn:li:activity-1234567890/",
);
```

### Posts de um usuário

```ts
const posts = await getUserPosts({
  identifier: "florymignon",
  start: 0,
  count: 50,
});
```

Observações:

- `getCommentsByPostUrl()` pagina recursivamente até acabar.
- `getPosts()` existe, mas hoje é placeholder e retorna `[]`.

## Mensagens e inbox

```ts
import {
  getMessagingInboxConversations,
  getMessages,
} from "@florydev/linkedin-api-voyager";
```

### Conversas da inbox

```ts
const conversations = await getMessagingInboxConversations({
  identifier: "florymignon",
});
```

### Mensagens de uma conversa

```ts
const messages = await getMessages(conversations[0].urn);
```

O retorno já trata mídia como:

- `VIDEO`
- `IMAGE`
- `FILE`
- `AUDIO`

## Convites, conexões e rede

> Todas as funções abaixo aceitam **`vanityName`** (o identificador público de `/in/fulano` ou a URL completa) como entrada. `memberId` (o `ACoA...` interno) é sempre opcional e resolvido automaticamente quando não fornecido.

```ts
import {
  receivedInvitation,
  sentInvitation,
  getMyConnections,
  sendConnectionRequest,
  cancelSentInvitation,
  removeConnection,
  followProfile,
  unfollowProfile,
  getProfileConnections,
  getProfileFollowers,
  getProfileFollowing,
} from "@florydev/linkedin-api-voyager";

const received = await receivedInvitation({ start: 0, count: 10 });
const sent = await sentInvitation({ start: 0, count: 10 });

// Minhas conexões (Voyager /relationships/connections)
const myConnections = await getMyConnections({ start: 0, count: 20 });

// Enviar convite de conexão (SDUI flagship) — só precisa do identifier
await sendConnectionRequest({
  vanityName: "ana-silva",                         // OU "https://www.linkedin.com/in/ana-silva/"
  message: "Olá Ana, gostaria de nos conectar!",   // opcional
});
// Campos opcionais que você pode sobrescrever: firstName, lastName, inviteeMemberId (ACoA...),
// legacyNumericMemberId (ID numérico legado, ex: "876631041"), trackingId, profileCanonicalUrl

// Cancelar/retirar convite enviado (invitationId vem de sentInvitation -> invitationUrn)
await cancelSentInvitation({
  invitationId: "7123456789012345678",
  inviteeVanityName: "ana-silva",                   // memberId opcional
});

// Remover conexão existente
await removeConnection({ vanityName: "ana-silva" });

// Seguir / deixar de seguir
await followProfile({ vanityName: "ana-silva" });
await unfollowProfile({ vanityName: "ana-silva" });

// Listar conexões / seguidores / seguindo de um perfil 3º
// Recebe vanity name (identifier) OU memberId (ACoA...) — auto-detectado
const identifier = "williamhgates";                 // ou "ACoAABy..."
const profileConnections = await getProfileConnections(identifier, { start: 0, count: 20 });
const profileFollowers = await getProfileFollowers(identifier, { count: 10 });
const profileFollowing = await getProfileFollowing(identifier, { count: 10 });
```

## Tempo real com SSE

```ts
import {
  Client,
  linkedinSSE,
  LinkedInRealtimeTopic,
} from "@florydev/linkedin-api-voyager";

Client({
  li_at: process.env.LINKEDIN_LI_AT!,
  JSESSIONID: process.env.LINKEDIN_JSESSIONID!,
});

await linkedinSSE({
  topics: ["Messages", "TypingIndicators", "Conversations"],
  onData: (data) => console.log(data),
  onError: (error) => console.error(error),
});
```

Algumas topics disponíveis:

- `Messages`
- `TypingIndicators`
- `Conversations`
- `Reactions`
- `Comments`

## Utilitários

```ts
import {
  extractFields,
  resolveReferences,
  extractDataWithReferences,
  getIdFromUrn,
  isLinkedInUrn,
  normalizeRawOrganization,
} from "@florydev/linkedin-api-voyager";
```

Esses helpers são úteis quando você quer consumir um endpoint cru do Voyager e montar seu próprio parser.

Exemplo:

```ts
const fieldsMap = {
  name: "firstName",
  headline: "headline",
};

const data = extractFields([someObject], fieldsMap);
```

## Funções internas importantes

### `Client()`

Inicializa a instância global usada por toda a lib.

### `fetchDataApi()`

Usa o prefixo `/voyager/api` e faz chamadas GET para endpoints internos do LinkedIn.

### `fetchDataClient()`

Usado para inspecionar redirects sem seguir automaticamente a resposta.

### `postSduiAction()`

Helper em `src/core/sdui.ts` para ações SDUI flagship-web 2025/2026 (mutations: enviar/cancelar convite, seguir, remover conexão). Faz `POST /flagship-web/rsc-action/actions/server-request` com envelope completo, headers SDUI obrigatórios (`x-li-page-instance`, `x-li-page-instance-tracking-id`, `x-li-application-instance`, `x-li-anchor-page-key`, `x-li-track mpName=web`, `x-li-rsc-stream: true`) e `_v=0.2.6676` fixo.

Exemplo:
```ts
import { postSduiAction } from "@florydev/linkedin-api-voyager/src/core/sdui";

await postSduiAction({
  sduiid: "com.linkedin.sdui.requests.mynetwork.addaUpdateFollowState",
  payload: { followStateType: "FollowStateType_FOLLOW_ACTIVE", memberUrn: { memberId: "1361766591" }, ... },
  anchorPageKey: "d_flagship3_profile_view_base",       // ou d_flagship3_people
  screenId: "com.linkedin.sdui.flagshipnav.profile.Profile", // ou ...mynetwork.Grow
  refererUrl: "https://www.linkedin.com/in/fulano/",
});
```

## Erros

O projeto exporta:

- `LinkedInClientNotInitializedError`
- `LinkedInAuthRedirectError`

Na prática, uma parte da base ainda lança `Error` simples com mensagens equivalentes. Então trate erros tanto por classe quanto por mensagem quando necessário.

## Limitações

- Esta biblioteca depende de endpoints internos do LinkedIn, então pode quebrar sem aviso.
- É necessário manter cookies válidos.
- O uso excessivo pode gerar bloqueio, challenge ou expiração de sessão.
- Algumas rotas têm respostas muito aninhadas e mudam com frequência.

## Segurança

- Nunca commite `li_at` e `JSESSIONID`.
- Nunca use essa lib no frontend.
- Nunca trate `src/teste.ts` como exemplo de produção.
- Se usar `.env`, deixe esse arquivo fora do versionamento.

## Desenvolvimento do repositório

### Scripts da raiz

```bash
yarn
yarn build
yarn dev
```

### Estrutura principal

A lib está organizada em módulos por domínio, cada um com seus próprios tipos:

```
src/
├── index.ts                # barrel principal / exports públicos
├── core/                   # código compartilhado entre todos os módulos
│   ├── config.ts           # cliente HTTP e helpers base (fetchDataApi, etc)
│   ├── errors.ts           # classes de erro
│   ├── utils.ts            # parsing e normalização (URNs, imagens, references)
│   └── types.ts            # tipos compartilhados globais
└── modules/                # camada de domínio, um módulo por assunto
    ├── user/               # perfis, seções, about, contact, recommendations
    │   ├── types.ts
    │   └── (vários arquivos de implementação)
    ├── company/            # empresas + pessoas por empresa
    │   ├── types.ts
    │   ├── company.ts
    │   └── company-people.ts
    ├── posts/              # posts e comentários
    │   ├── types.ts
    │   └── posts.ts
    ├── search/             # busca geral e busca de pessoas
    │   ├── types.ts
    │   └── search.ts
    ├── messages/           # inbox e mensagens
    │   ├── types.ts
    │   └── message.ts
    ├── network/            # convites, follow, conexões, listagens de 3º perfil
    │   ├── index.ts
    │   ├── types.ts
    │   ├── network.ts              # received/sent invitations, getMyConnections
    │   ├── invitation-actions.ts   # sendConnectionRequest, cancelSentInvitation
    │   ├── connection-actions.ts   # removeConnection
    │   ├── follow-actions.ts       # followProfile, unfollowProfile
    │   ├── profile-lists.ts        # getProfileConnections/Followers/Following
    │   └── network-helpers.ts      # resolveMemberIds, resolveMemberId, pickVanity, extractFirstLegacyNumericId
    └── sse/                # eventos em tempo real
        ├── types.ts
        └── linkedin-sse.ts
```

### Worker auxiliar

O repo também possui `worker-service/`, um subprojeto local para SSE + BullMQ + Redis + Supabase.

Comandos:

```bash
yarn --cwd worker-service build
yarn --cwd worker-service start
```

## Referências internas do projeto

Se você estiver mantendo esta lib, estes arquivos ajudam bastante:

- `skills/references/profiles.md`
- `skills/references/companies.md`
- `skills/references/posts.md`
- `skills/references/search-network.md`
- `skills/references/realtime.md`
- `skills/references/internals.md`

## Licença

MIT
