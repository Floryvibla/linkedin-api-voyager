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
  includePrivateProfiles: true, // padrão true aqui (diferente de searchCompanyPeople!)
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
- `includePrivateProfiles` é `true` por padrão aqui, mas `false` por padrão em
  `searchCompanyPeople` (ver `companies.md`) — inconsistência real da lib, vale checar
  explicitamente qual valor você quer em cada chamada.

## Convites de Rede

```typescript
import {
  receivedInvitation,
  sentInvitation,
} from "@florydev/linkedin-api-voyager";

// Convites de conexão recebidos (paginação manual)
const received = await receivedInvitation({ start: 0, count: 10 });

// Convites de conexão enviados
const sent = await sentInvitation({ start: 0, count: 10 });
```

Ambas retornam a resposta crua do endpoint `/relationships/invitationViews`
(`includeInsights=true`) — sem normalização adicional, então espere o formato bruto do Voyager (não um objeto já "limpo" como em `posts` ou `user`).

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
