# Config, Erros e Utilitários

Leia este arquivo quando precisar: chamar um endpoint Voyager que a lib ainda não expõe como função de alto nível, tratar erros de sessão/autenticação, ou reaproveitar os parsers internos para normalizar respostas cruas do Voyager.

## Config

Localização: `src/core/config.ts`

```typescript
import {
  Client,
  fetchDataApi,
  fetchDataClient,
  API_BASE_URL,
} from "@florydev/linkedin-api-voyager";
```

- `Client(config: { JSESSIONID: string; li_at: string }): AxiosInstance` — inicializa e retorna
  a instância axios global. Deve ser chamada antes de qualquer outra função da lib.
- `API_BASE_URL` — `"https://www.linkedin.com"`.
- `fetchDataApi(endpoint: string, options?: { headers?: Record<string,string> }): Promise<any>` —
  helper interno usado por quase todos os módulos; faz `GET` em `` `/voyager/api${endpoint}` ``.
  **Use direto quando precisar de um endpoint Voyager que a lib não expõe ainda:**
  ```typescript
  const raw = await fetchDataApi("/identity/profileView/florymignon");
  ```
- `fetchDataClient(endpoint, options?): Promise<string>` — faz `GET` sem seguir redirecionamentos
  (`maxRedirects: 0`) e retorna o header `location` da resposta (302). Útil para resolver URLs de
  redirecionamento do LinkedIn (ex: links curtos).

## Erros (`errors.ts`)

Localização: `src/core/errors.ts`

```typescript
import {
  LinkedInClientNotInitializedError,
  LinkedInAuthRedirectError,
} from "@florydev/linkedin-api-voyager";
```

- `LinkedInClientNotInitializedError` — erro para quando `Client()` não foi chamado (hoje as
  funções internas ainda lançam `Error` simples com essa mensagem, não necessariamente essa
  classe — mas ela está exportada e pode ser usada em `try/catch`/`instanceof` no seu código).
- `LinkedInAuthRedirectError` — erro para quando o LinkedIn redireciona a requisição (geralmente
  sessão expirada ou conta bloqueada/checkpoint). Tem `status: number` e `location: string | null`.

```typescript
try {
  await getUserMiniProfile("alguem");
} catch (err) {
  if (err instanceof LinkedInAuthRedirectError) {
    console.error(`Sessão inválida (HTTP ${err.status}) -> ${err.location}`);
    // aqui é um bom lugar para avisar o usuário que precisa renovar li_at/JSESSIONID
  }
}
```

## Utilitários (`utils.ts`)

Localização: `src/core/utils.ts`

Helpers de parsing/normalização usados internamente por todos os outros módulos. Reaproveite-os
quando estiver consumindo respostas cruas do Voyager via `fetchDataApi` diretamente.

```typescript
import {
  extractFields,
  resolveReferences,
  extractDataWithReferences,
  getIdFromUrn,
  isLinkedInUrn,
  encodeLinkedinUrn,
  normalizeRawOrganization,
  debugObjectStructure,
} from "@florydev/linkedin-api-voyager";

// Mapear campos com paths aninhados (suporta array[índice])
const fieldsMap = {
  nome: "firstName",
  headline: "headline",
  foto: "profilePicture.displayImageReferenceResolutionResult.vectorImage.rootUrl",
};
const mapped = extractFields([someObject], fieldsMap);

// Resolver referências URN (chaves "*algumaCoisa") contra o array `included` de uma resposta Voyager
const resolved = resolveReferences(rawItem, response.included);

// Atalho: filtra `included` pelos entityUrn de `elements` + resolve referências (+ mapeia campos)
const items = extractDataWithReferences(
  elementsUrns,
  response.included,
  fieldsMap,
);

// Extrair ID de um URN
const id = getIdFromUrn("urn:li:fsd_profile:ABC123"); // -> "ABC123"

// Verificar se uma string é um URN válido do LinkedIn
isLinkedInUrn("urn:li:fsd_profile:ABC123"); // -> true

// Encode seguro de URN para query string (trata parênteses)
encodeLinkedinUrn("urn:li:fsd_profile:(ABC,DEF)");

// Normalizar uma organização crua (empresa/escola) em formato mais limpo
const org = normalizeRawOrganization(rawOrganizationFromApi);

// Debug: imprime a estrutura de um objeto (profundidade limitada) no console
debugObjectStructure(someResponse, 3);
```

Lista completa das funções exportadas por `utils.ts` (use quando o padrão acima não bastar):
`filterKeys`, `filterOutKeys`, `getNestedValue`, `extractFields`, `debugObjectStructure`,
`resolveReferences`, `extractDataWithReferences`, `debugResolvedStructure`,
`extractFieldsFromIncluded`, `mergeExtraFields`, `encodeLinkedinUrn`,
`getDataIncludedForEntity`, `extractExperiences`, `assert`, `getIdFromUrn`,
`getUrnFromRawUpdate`, `isLinkedInUrn`, `parseExperienceItem`, `getGroupedItemId`, `omit`,
`resolveImageUrl`, `resolveLinkedVectorImageUrl`, `stringifyLinkedInDate`,
`normalizeRawOrganization`.

## Tipos de imagem

Os tipos de imagem compartilhados ficam em `src/core/types.ts`. Os tipos por domínio ficam em `src/modules/<dominio>/types.ts` (ex: `src/modules/user/types.ts`).

`VectorImage`, `Artifact`, `LinkedVectorImage`, `LinkedMediaProcessorImage`, `ImageViewModel` — formatos crus de imagem do LinkedIn; os helpers `resolveImageUrl`/`resolveLinkedVectorImageUrl` acima já convertem esses formatos em uma URL string simples.
