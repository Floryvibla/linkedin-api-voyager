# Busca, Convites e Mensagens

## Busca

```typescript
import { search, searchPeople } from "@florydev/linkedin-api-voyager";

// Busca geral (GraphQL cru, retorna EntitySearchResult[])
const res = await search({ query: "react developer" });
const page2 = await search({ query: "react developer", offset: 25 }); // paginação

// Busca de pessoas — filtros de alto nível já tratados
const people = await searchPeople({
  query: "engenheiro de software",
  regions: ["br:0"], // geoUrns
  currentCompany: ["urn:li:fsd_company:1035"],
  pastCompanies: ["..."],
  industries: ["..."],
  schools: ["..."],
  networkDepths: ["F", "S"], // 1º e 2º grau ("F"=1st, "S"=2nd, "O"=out of network)
  keywordFirstName: "Ana",
  keywordLastName: "Silva",
  keywordTitle: "CTO",
  keywordCompany: "Nubank",
  keywordSchool: "USP",
  includePrivateProfiles: true, // padrão true
  offset: 0,
  limit: 25,
});

// Forma simples (string vira { query })
const people2 = await searchPeople("product manager");
```

- `MAX_SEARCH_COUNT = 25` — limite máximo de resultados por chamada em `search()`.
- `searchPeople` monta os `filters` do Voyager automaticamente a partir dos parâmetros de alto
  nível. `networkDepth`/`title` estão `@deprecated` no código — prefira `networkDepths`/
  `keywordTitle`.
- `includePrivateProfiles` é `true` por padrão aqui e também em
  `searchCompanyPeople` (ver `companies.md`)
  explicitamente qual valor você quer em cada chamada.
- Perfis privados podem vir sem `url`, mesmo quando incluídos no resultado.

## Convites, conexões e rede

> **API-friendly agora**: todas as funções aceitam `vanityName` (o identifier público de `/in/fulano` ou a URL completa do perfil) como entrada. O `memberId` interno (`ACoA...`) foi promovido a **opcional** em tudo — ele é resolvido automaticamente via `extractProfileIdLinkedin` quando não fornecido (apenas 1 chamada Voyager a mais, cacheável por quem chamar). `getProfileConnections/Followers/Following` recebem uma string única (`profileIdentifier`) e auto-detectam se é vanity ou memberId pelo prefixo `ACoA`.

```typescript
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

// Convites recebidos (paginação manual, endpoint Voyager legado)
const received = await receivedInvitation({ start: 0, count: 10 });

// Convites enviados
const sent = await sentInvitation({ start: 0, count: 10 });

// Minhas conexões (Voyager /relationships/connections, resposta crua)
const myConnections = await getMyConnections({ start: 0, count: 20 });

// Enviar convite de conexão (SDUI flagship-web RSC)
// Apenas vanityName basta — firstName, lastName e profileCanonicalUrl são auto-populados
await sendConnectionRequest({
  vanityName: "ana-silva",                         // ou "https://www.linkedin.com/in/ana-silva/"
  message: "Olá Ana, gostaria de nos conectar!",   // opcional
});
// Campos opcionais de override:
// - inviteeMemberId (fsd ACoA...)
// - legacyNumericMemberId (ID numérico legado, ex: "876631041") — necessário para SDUI;
//   quando omitido, é extraído via varredura profunda por regex urn:li:member:(\d+) no JSON de perfil
// - firstName, lastName, trackingId, profileCanonicalUrl

// Retirar/cancelar convite já enviado (antes de ser aceito)
// invitationId vem em sentInvitation -> invitationUrn (o id dps de urn:li:fsd_invitation:)
await cancelSentInvitation({
  invitationId: "7123456789012345678",
  inviteeVanityName: "ana-silva",                   // inviteeMemberId opcional
});

// Remover uma conexão já estabelecida (desconectar) — vanity obrigatório
await removeConnection({ vanityName: "ana-silva" });

// Seguir / deixar de seguir um perfil
await followProfile({ vanityName: "ana-silva" });
await unfollowProfile({ vanityName: "ana-silva" });

// Conexões / seguidores / seguindo de um perfil 3º (GraphQL search clusters)
// 1º param recebe vanity ou memberId (auto-detectado por prefixo ACoA)
const identifier = "williamhgates";                 // ou "ACoAABy..."
const page1 = await getProfileConnections(identifier, { start: 0, count: 20 });
const followers = await getProfileFollowers(identifier, { count: 10 });
const following = await getProfileFollowing(identifier, { count: 10 });
// Retorno: { start, count, total, items: ProfileListItem[] }
```

### Detalhes importantes das mutações SDUI

A partir de 2025 o LinkedIn migrou as ações de mutação (enviar/cancelar convite,
seguir/desseguir, remover conexão) para **SDUI flagship-web RSC actions**:

- `POST /flagship-web/rsc-action/actions/server-request?sduiid=com.linkedin.sdui.requests.mynetwork.<acao>&_v=0.2.6676`
- Header `csrf-token: ajax:<JSESSIONID>` já é injetado por `Client()`; headers SDUI extras
  (`x-li-page-instance`, `x-li-page-instance-tracking-id`, `x-li-anchor-page-key`,
  `x-li-application-instance`, `x-li-rsc-stream: true`, `x-li-track mpName=web`) são
  injetados pelo helper `postSduiAction` em `src/core/sdui.ts`.
- `requestId` **= sduiid** (NÃO UUID aleatório)
- Envelope completo validado em captura real e helpers de resolução em `src/modules/network/network-helpers.ts`:
  - `resolveMemberIds({ vanityName, memberId, legacyNumericMemberId })` → `{ fsdMemberId, legacyNumericMemberId }`
  - `resolveMemberId(...)` — versão simples só do ACoA
  - `pickVanity`, `resolveFirstLast`, `normalizeInvitationUrn`, `normalizeVanity`
  - `extractFirstLegacyNumericId(obj)` — regex `urn:li:member:(\d+)` em profundidade com WeakSet anti-loop
  - `loadLegacyNumericMemberId(vanityName)` — tenta fetchFullProfileRaw depois query graphql legada

| Ação | sduiid | Arquivo | Observação chave |
|---|---|---|---|
| Enviar convite | `addaAddConnection` | `invitation-actions.ts` | `inviteeUrn: { memberId: "<NUMÉRICO_LEGADO>" }` — objeto, NÃO string URN; requer `nonIterableProfileId`, `isDisabled`, `connectionState`, `postActionSentConfigs: []`, `renderMode`, `origin` |
| Retirar convite | `addaWithdrawInvitation` | `invitation-actions.ts` | `invitationUrn: urn:li:fsd_invitation:<id>` |
| Remover conexão | `mynetwork.RemoveConnectionVanityName` | `connection-actions.ts` | usa `disconnectVanityName` no payload |
| Seguir/desseguir | `addaUpdateFollowState` | `follow-actions.ts` | `followStateType: "FollowStateType_FOLLOW_ACTIVE" | "…_INACTIVE"` (NÃO boolean), `memberUrn: { memberId: "<NUMÉRICO_LEGADO>" }`, `followStateBinding` |

**Ground truth de payloads (captura real 2026):**

```ts
// addaUpdateFollowState (seguir)
{
  followStateType: "FollowStateType_FOLLOW_ACTIVE",
  memberUrn: { memberId: "1361766591" },             // ID NUMÉRICO LEGADO
  followStateBinding: {
    key: "urn:li:fsd_followingState:urn:li:member:1361766591",
    namespace: null,
  },
  postActionSentConfigs: [],
}

// addaAddConnection (convite da página Minha Rede / Grow)
{
  inviteeUrn: { memberId: "701527688" },              // ID NUMÉRICO LEGADO
  nonIterableProfileId: "ACoAACnQdogBTUSnnAS4OotPoaKEYTyhywPBsWI",   // ACoA = fsdMemberId
  renderMode: "IconAndText",
  firstName: "Nidia Licia",
  lastName: "Araujo",
  isDisabled: {
    key: "connect-button-disabled-nidia-licia-araujo-808b34176",
    namespace: "MemoryNamespace",
  },
  connectionState: {
    key: "state:invitation:urn:li:member:701527688",
    namespace: "MemoryNamespace",
  },
  origin: "InvitationOrigin_PYMK_COHORT_SECTION",
  clientContext: "MyNetworkPYMK",
  profileCanonicalUrl: "https://www.linkedin.com/in/nidia-licia-araujo-808b34176",
  postActionSentConfigs: [],
}
```

`anchorPageKey` / `screenId` usados:
- Perfil → `d_flagship3_profile_view_base` / `com.linkedin.sdui.flagshipnav.profile.Profile`
- Minha Rede / Grow → `d_flagship3_people` / `com.linkedin.sdui.flagshipnav.mynetwork.Grow`

### Listagens de 3º perfil

`getProfileConnections` / `getProfileFollowers` / `getProfileFollowing` usam o
mesmo endpoint de busca GraphQL `voyagerSearchDashClusters` com filtro `NETWORK`
e parâmetro `connectionOf: urn:li:fsd_member:<memberId>`. Isso porque o LinkedIn
removeu as URLs diretas `/detail/people/connections/` e agora tudo roda via overlay
SDUI no frontend. O retorno já vem normalizado como `ProfileListItem[]` com
`memberId`, nomes, headline, localização e foto resolvida.

### Tipos relevantes

`NetworkPaginationArgs`, `SendConnectionArgs`, `WithdrawInvitationArgs`,
`RemoveConnectionArgs`, `FollowStateArgs`, `InvitationView`,
`InvitationListResponse`, `ProfileListItem`, `ProfileListResponse`,
`CollectionType`.

## Mensagens / Inbox

```typescript
import {
  getMessagingInboxConversations,
  getMessages,
  organizeInbox,
} from "@florydev/linkedin-api-voyager";

// Lista conversas da caixa de entrada
const conversations = await getMessagingInboxConversations({
  identifier: "florymignon", // OU mailboxUrn diretamente (evita 1 chamada extra)
  // queryId: "..."                // opcional: sobrescreve o queryId GraphQL padrão
});
// LinkedInConversation[]: urn, identifier, fullName, headline, profilePicture,
// lastMessage: { text, sentAt, isRead }, unreadCount, isGroup

// Mensagens de uma conversa específica (usa a urn da conversa acima)
const messages = await getMessages(conversations[0].urn);
// LinkedInMessage[]: id, text, sentAt, media?, sender: { urn, fullName, profilePicture, isSelf }
```

- `organizeInbox(rawPayload)` é o parser interno usado por `getMessagingInboxConversations` —
  pode ser chamado diretamente se você já tiver o payload cru do endpoint
  `messengerConversations` (por exemplo, obtido via `fetchDataApi` direto).
- `getMessages` suporta mídia: `VIDEO`, `IMAGE`, `FILE`, `AUDIO` (já com URL resolvida quando
  disponível).
- Resultado de `getMessages` vem ordenado por `sentAt` decrescente (mais recente primeiro).

## Tipos relevantes

Busca: `ISearchParams`, `ISearchPeopleParams`, `ISearchCompanyPeopleParams`,
`SearchCompaniesParams`, `NetworkDepth` (`"F" | "S" | "O"`), `SearchResponse`,
`ISearchPeopleResponse`, `SearchCompaniesResponse`, `EntitySearchResult`,
`ProfileSearchResult`, `CompanySearchResult`, `PagingResponse`, `TextData`, `FullLocation`.

Mensagens: `LinkedInConversation`, `LinkedInMessage`.

Rede / Network: `NetworkPaginationArgs`, `SendConnectionArgs`,
`WithdrawInvitationArgs`, `RemoveConnectionArgs`, `FollowStateArgs`,
`InvitationView`, `InvitationListResponse`, `ProfileListItem`,
`ProfileListResponse`, `CollectionType`.
