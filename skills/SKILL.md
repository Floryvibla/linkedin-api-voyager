---
name: linkedin-api-voyager
description: >
  Use SEMPRE que o usuário quiser:
  buscar ou extrair perfis do LinkedIn (experiências, skills, educação, certificações, contato),
  buscar dados de empresas ou funcionários/ex-funcionários de uma empresa, pesquisar pessoas com filtros (cargo, empresa, escola, região, grau de conexão), ler ou paginar posts e comentários,
  ver convites de conexão recebidos/enviados, ler conversas e mensagens do LinkedIn, escutar eventos em tempo real (novas mensagens, digitação, reações). Acione também quando o usuário mencionar
  "linkedin-api-voyager", "voyager API", "scraping do LinkedIn", ou cookies `li_at`/`JSESSIONID`.
  Não é a API oficial do LinkedIn — não usar para nada relacionado à API pública/OAuth do LinkedIn (LinkedIn Marketing API, Sign In with LinkedIn, etc.), que é um produto diferente.
---

# linkedin-api-voyager

Biblioteca TypeScript para interagir com endpoints internos do LinkedIn (Voyager API), usando
os cookies de uma sessão de navegador já autenticada. **Não é a API oficial do LinkedIn.**
Funciona **apenas em Node.js (server-side)** — nunca no browser, por causa de CORS.

## Setup rápido (obrigatório antes de qualquer chamada)

```bash
npm install @florydev/linkedin-api-voyager
```

```typescript
import { Client } from "@florydev/linkedin-api-voyager";

Client({
  JSESSIONID: process.env.LINKEDIN_JSESSIONID!, // cookie JSESSIONID (ex: "123456789" nao precisa começar com ajax)
  li_at: process.env.LINKEDIN_LI_AT!, // cookie li_at
});
```

Chame `Client()` **uma única vez**, no ponto de entrada do backend, antes de qualquer outra
função da lib — todas dependem da instância axios global que ela cria. Chamar qualquer função
antes disso lança `"Client not initialized. Please call Client({ JSESSIONID, li_at }) first."`.

Para obter `li_at`/`JSESSIONID`: logar no LinkedIn no navegador → DevTools → Application/Storage
→ Cookies de `https://www.linkedin.com`. Guarde em `.env`, nunca no código.

## Referência por domínio

Leia só o(s) arquivo(s) relevante(s) para a tarefa em mãos:

| Se a tarefa envolve...                                                                                                                                    | Leia                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Perfis de pessoas: mini-perfil, sobre, experiências, contato, skills, educação, certificações                                                             | `references/profiles.md`       |
| Dados de empresa, ou funcionários/ex-funcionários de uma empresa                                                                                          | `references/companies.md`      |
| Posts de um usuário, dados de um post específico, comentários                                                                                             | `references/posts.md`          |
| Busca geral/de pessoas, convites de conexão (recebidos/enviados), conversas e mensagens (inbox)                                                           | `references/search-network.md` |
| Eventos em tempo real (SSE): novas mensagens, digitação, reações                                                                                          | `references/realtime.md`       |
| Chamar um endpoint Voyager cru (`fetchDataApi`), tratar erros de sessão, ou reaproveitar os parsers internos (`resolveReferences`, `extractFields`, etc.) | `references/internals.md`      |

## Exemplo de uso combinando módulos

```typescript
import "dotenv/config";
import {
  Client,
  getUserMiniProfile,
  getCompany,
  searchPeople,
} from "@florydev/linkedin-api-voyager";

Client({
  JSESSIONID: process.env.LINKEDIN_JSESSIONID!,
  li_at: process.env.LINKEDIN_LI_AT!,
});

async function main() {
  const profile = await getUserMiniProfile("florymignon");
  const company = await getCompany("microsoft");
  const devs = await searchPeople({
    query: "fullstack developer",
    regions: ["br:0"],
  });
  console.log({ profile, company, devsFound: devs.results.length });
}

main().catch(console.error);
```

## Boas práticas e limitações gerais

- **Rate limit:** use com moderação para evitar bloqueio/checkpoint da conta associada aos cookies.
- **Sessão expira:** cookies têm validade. Um 401/403 ou redirect (`LinkedInAuthRedirectError`,
  ver `references/internals.md`) geralmente significa que é hora de renovar `li_at`/`JSESSIONID`.
- **ToS:** respeite os termos de uso do LinkedIn ao construir automações sobre esta lib.
