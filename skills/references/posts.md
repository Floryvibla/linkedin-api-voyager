# Posts e Comentários

```typescript
import {
  getPostLinkedin,
  getCommentsByPostUrl,
  getUserPosts,
  getPosts,
} from "@florydev/linkedin-api-voyager";

// Dados de um post específico (extrai o slug da URL) + dados do autor (actor)
const post = await getPostLinkedin(
  "https://www.linkedin.com/posts/florymignon_...-activity-1234567890-abcd",
  10, // commentsCount (padrão: 10)
  10, // likesCount (padrão: 10)
);

// Comentários de um post — pagina recursivamente até acabar
const comments = await getCommentsByPostUrl(
  "https://www.linkedin.com/feed/update/urn:li:activity-1234567890/",
  0, // start (padrão: 0)
  50, // limit por página (padrão: 50)
);

// Posts de um usuário (paginação automática via accumulatedPosts)
const userPosts = await getUserPosts({
  identifier: "florymignon",
  start: 0,
  count: 50,
});

// Placeholder — sempre retorna [] hoje, não está implementada ainda
const posts = await getPosts();
```

## Formato de retorno

Cada post retornado inclui `urn`, `postUrl`, `contentText`, `tags`, `media` (imagens/vídeo já
resolvidos), `dateDescription`, `numLikes`, `numComments`, `reactionCounts`, `numShares`.

## Pontos de atenção

- `getCommentsByPostUrl` extrai o ID do post via regex `-(\d{10,})-` na URL — funciona com URLs
  de `/posts/...-activity-<id>-...` e `/feed/update/urn:li:activity-<id>/`. Uma URL fora desse padrão não vai resolver o ID corretamente.
- `getCommentsByPostUrl` **é recursiva**: continua chamando a API até esgotar os comentários. Em posts virais (milhares de comentários) isso pode gerar muitas requisições seguidas — considere adicionar um limite próprio (ex: parar após N páginas) se for consumir posts populares.
- `getPosts()` ainda é um placeholder no código-fonte atual e sempre retorna `[]` — não confie nela para nada além de um stub temporário.
