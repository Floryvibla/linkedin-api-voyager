# Tempo Real / SSE

Escuta eventos em tempo real do LinkedIn (novas mensagens, indicadores de digitação, reações,
etc.) via Server-Sent Events. Requer `Client()` já inicializado (lança erro se não).

```typescript
import {
  Client,
  linkedinSSE,
  LinkedInRealtimeTopic,
} from "@florydev/linkedin-api-voyager";

Client({
  JSESSIONID: process.env.LINKEDIN_JSESSIONID!,
  li_at: process.env.LINKEDIN_LI_AT!,
});

await linkedinSSE({
  topics: ["Messages", "TypingIndicators", "Conversations"], // key, array de keys, ou "*"
  onData: (data) => console.log("Evento recebido:", data),
  onError: (err) => console.error("Erro no stream:", err),
});
```

## Como funciona

- Abre uma conexão `GET /realtime/connect?rc=1` com `responseType: "stream"` e processa Server-Sent Events (`data: {...}\n\n`) chamando `onData` para cada evento que bate com os tópicos pedidos.
- `topics` aceita uma **key** do enum `LinkedInRealtimeTopicKey` (ex: `"Messages"`), um **array** delas, ou a string `"*"` para não filtrar nada (recebe tudo).
- A conexão fica aberta indefinidamente (streaming) — pense em como você vai encerrá-la (ex: guardar a referência do processo/stream e cancelar quando o servidor desligar).

## Tópicos disponíveis

Algumas das principais keys de `LinkedInRealtimeTopic` (o enum completo é exportado e tem mais opções além dessas): `Messages`, `MessagesBroadcast`, `TypingIndicators`, `Conversations`,
`ConversationsBroadcast`, `MessageReactionSummaries`, `MessageSeenReceipts`, `Reactions`,
`Comments`, `ReactionsOnComments`, `MessageDrafts`, `ConversationDrafts`,
`RealtimeSearchResultClusters`, `MemberVerificationResultsPersonal`.

## Helpers internos (para montar seu próprio parser)

Se `linkedinSSE` não cobrir seu caso (ex: você quer processar o stream de outra forma), esses helpers também são exportados:

- `getLinkedInRealtimeQueryMap()`
- `createLinkedInRealtimeTopicsSet(topics)`
- `parseLinkedInSSEChunk({ buffer, chunk, topicsSet, onEvent, onError })`
