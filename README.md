# LinkedIn API Voyager

Biblioteca TypeScript para interagir com endpoints internos do LinkedIn (Voyager). Esta não é uma API oficial.

## Instalação

```bash
npm install linkedin-api-voyager
```

## Autenticação (cookies)

Para fazer requisições autenticadas, você precisa dos cookies `li_at` e `JSESSIONID` da sua sessão no LinkedIn.

### Onde pegar `li_at` e `JSESSIONID`

1. Faça login no LinkedIn pelo navegador.
2. Abra o DevTools do navegador.
3. Vá em:
   - Chrome/Edge: `Application` -> `Storage` -> `Cookies` -> `https://www.linkedin.com`
   - Firefox: `Storage` -> `Cookies` -> `https://www.linkedin.com`
4. Copie os valores dos cookies:
   - `li_at`: copie o valor inteiro.
   - `JSESSIONID`: o valor costuma vir no formato `"ajax:123456789"`.
     - Remova as aspas.
     - Use apenas os números após `ajax:` (ex.: `123456789`).

### Salvando cookies em `linkedin_cookies.json`

Por padrão, a lib procura o arquivo `linkedin_cookies.json` na raiz do seu projeto.

Formato esperado:

```json
{
  "JSESSIONID": "123456789",
  "li_at": "AQEDAR...",
  "timestamp": 1730000000000
}
```

Observações:

- O arquivo `linkedin_cookies.json` já está no `.gitignore`.
- Não compartilhe esses cookies e não comite esse arquivo.

## Uso rápido

```ts
import {
  getUserMiniProfile,
  getProfissionalExperiences,
  getCompany,
  searchPeople,
  getCommentsByPostUrl,
} from "linkedin-api-voyager";

const profile = await getUserMiniProfile("wesbush");
const experiences = await getProfissionalExperiences("wesbush");
const company = await getCompany("microsoft");
const people = await searchPeople("software engineer");
const comments = await getCommentsByPostUrl(
  "https://www.linkedin.com/feed/update/urn:li:activity-1234567890/",
);
```

## API (por arquivo em `src/`)

O pacote reexporta os módulos listados em `src/index.ts`: `user`, `company`, `posts`, `search`, `utils`, `config`.

### `src/config.ts`

Constantes exportadas:

- `COOKIE_FILE_PATH`: caminho padrão do arquivo de cookies (`linkedin_cookies.json`).
- `API_BASE_URL`: base URL das chamadas Voyager (`https://www.linkedin.com/voyager/api`).
- `AUTH_BASE_URL`: base URL do LinkedIn (`https://www.linkedin.com`).

Funções exportadas:

- `saveCookies(JSESSIONID: string, li_at: string): Promise<void>`
  - Salva os cookies no `COOKIE_FILE_PATH`.
- `loadCookies(): Promise<{ JSESSIONID: string; li_at: string; timestamp: number } | null>`
  - Carrega e valida o arquivo de cookies.
- `Client(providedCookies?: { JSESSIONID: string; li_at: string }): Promise<AxiosInstance>`
  - Cria um cliente HTTP com headers/cookies.
  - Se existir `linkedin_cookies.json`, usa ele.
  - Se não existir e `providedCookies` for passado, salva e usa.
- `fetchData(endpoint: string): Promise<any>`
  - Faz um `GET` usando `Client()` e retorna `response.data`.

Exemplo (salvar cookies e criar cliente):

```ts
import { Client, saveCookies } from "linkedin-api-voyager";

await saveCookies("123456789", "AQEDAR...");
const api = await Client();

const me = await api.get("/me");
```

### `src/user.ts`

Tipos exportados:

- `MiniUserProfileLinkedin`

Funções exportadas:

- `getUserMiniProfile(identifier: string): Promise<MiniUserProfileLinkedin>`
  - Busca dados básicos do perfil (nome, headline, imagens) e também o `about`.
  - `identifier` é o `publicIdentifier` (parte final da URL `linkedin.com/in/<identifier>`).

- `extractProfileIdLinkedin(profileUrl: string): Promise<string | null>`
  - Extrai o `publicIdentifier` de uma URL `linkedin.com/in/...`.
  - Se você passar apenas o identificador, ele tenta usar diretamente.
  - Retorna o ID numérico interno (sem o prefixo `urn:li:fsd_profile:`) quando encontra.

- `getProfileSectionAbout(identifier: string): Promise<string | null>`
  - Retorna o texto de “Sobre” (about) do perfil.

- `getProfissionalExperiences(identifier: string): Promise<Array<any>>`
  - Retorna a lista de experiências profissionais.
  - Para cada experiência, tenta enriquecer com dados de empresa via `getCompany`.

- `getContactInfo(identifier: string): Promise<{ ... }>`
  - Retorna informações de contato quando disponíveis (email, telefones, sites etc.).

- `getLinkedinSkills(identifier: string): Promise<Array<string | null>>`
  - Retorna as skills (habilidades) listadas no perfil.

- `getLinkedinEducation(identifier: string): Promise<Array<any>>`
  - Retorna a educação (escola, degree, datas, skills relacionadas quando houver).

- `getLinkedinCertifications(identifier: string): Promise<Array<any>>`
  - Retorna certificações.

Exemplo:

```ts
import {
  getUserMiniProfile,
  getProfileSectionAbout,
  getProfissionalExperiences,
  getContactInfo,
  getLinkedinSkills,
  getLinkedinEducation,
  getLinkedinCertifications,
} from "linkedin-api-voyager";

const identifier = "wesbush";

const mini = await getUserMiniProfile(identifier);
const about = await getProfileSectionAbout(identifier);
const experiences = await getProfissionalExperiences(identifier);
const contact = await getContactInfo(identifier);
const skills = await getLinkedinSkills(identifier);
const education = await getLinkedinEducation(identifier);
const certifications = await getLinkedinCertifications(identifier);
```

### `src/company.ts`

Funções exportadas:

- `getCompany(identifier: string): Promise<any>`
  - Busca dados de uma empresa pelo `universalName` (slug da página).
  - Exemplo de slug: `https://www.linkedin.com/company/microsoft/` -> `microsoft`.

Exemplo:

```ts
import { getCompany } from "linkedin-api-voyager";

const company = await getCompany("microsoft");
```

### `src/posts.ts`

Funções exportadas:

- `parseResponsePostLinkedin(response: any, key: string, accumulatedData: any): any`
  - Helper para selecionar itens do `included` a partir de `*elements`.

- `getCommentsByPostUrl(url: string, start = 0, limit = 50, accumulatedComments: unknown[] = []): Promise<unknown[]>`
  - Busca comentários de um post (paginando recursivamente até acabar).

- `getPosts(): Promise<unknown[]>`
  - Atualmente retorna `[]` (placeholder).

- `getPostLinkedin(url: string, commentsCount = 10, likesCount = 10): Promise<any>`
  - Busca um post pelo slug da URL e retorna os dados do post e do autor.

- `getUserPosts({ identifier, start = 0, count = 50, accumulatedPosts = [] }): Promise<any>`
  - Busca posts do usuário por `identifier` (publicIdentifier).

- `helperGetPosts(response: any, key: string, accumulatedPosts?: any, addFields?: Record<string, string>): any`
  - Helper para extrair posts e contagens (likes, comentários, shares).

- `helperGetImageUrl(item: any): string`
  - Helper para montar a URL de imagem, priorizando o maior artifact.

Exemplo (comentários):

```ts
import { getCommentsByPostUrl } from "linkedin-api-voyager";

const comments = await getCommentsByPostUrl(
  "https://www.linkedin.com/feed/update/urn:li:activity-1234567890/",
);
```

### `src/search.ts`

Constantes internas:

- `MAX_SEARCH_COUNT = 25` (limite máximo por chamada na busca geral)

Funções exportadas:

- `search(params: ISearchParams): Promise<SearchResponse>`
  - Busca geral usando `query` e/ou `filters` (formato Voyager).
  - Aceita paginação via `offset`.

- `searchPeople(queryOrParams: string | ISearchPeopleParams): Promise<ISearchPeopleResponse>`
  - Busca pessoas com helpers para montar filtros (networkDepth, regiões, empresas etc.).

Exemplo:

```ts
import { search, searchPeople } from "linkedin-api-voyager";

const res = await search({ query: "react developer" });
const people = await searchPeople({
  query: "engenheiro de software",
  regions: ["br:0"],
});
```

### `src/utils.ts`

Funções exportadas (helpers usados em parsing e normalização):

- `filterKeys(obj: any, keysToKeep: string[]): any`
- `filterOutKeys(obj: any, keysToIgnore: string[]): any`
- `getNestedValue(obj: any, path: string): any`
- `extractFields(data: any[], fieldsMap: Record<string, string>): any[]`
- `debugObjectStructure(obj: any, maxDepth = 3, currentDepth = 0): void`
- `resolveReferences(data: any, included: any[]): any`
- `extractDataWithReferences(elements: string[], included: any[], fieldsMap?: Record<string, string>): any[]`
- `debugResolvedStructure(elements: string[], included: any[], maxDepth = 2): void`
- `extractFieldsFromIncluded(included: any[], fields: string[]): Array<Record<string, any>>`
- `mergeExtraFields(mainData: any[], extraData: Array<Record<string, any>>, matchKey = "companyUrn"): any[]`
- `getDataIncludedForEntity(jsonData: Record<string, any>, entityUrn: string): any`
- `extractExperiences(jsonData: Record<string, any>): Array<{ role: string | null; idCompany: string | null; company: string | null; ... }>`
- `assert(value: unknown, message?: string | Error): asserts value`
- `getIdFromUrn(urn?: string): string | undefined`
- `getUrnFromRawUpdate(update?: string): string | undefined`
- `isLinkedInUrn(urn?: string): boolean`
- `parseExperienceItem(item: any, opts: { isGroupItem?: boolean; included: any[] }): ExperienceItem`
- `getGroupedItemId(item: any): string | undefined`
- `omit(inputObj: object, ...keys: string[]): object`
- `resolveImageUrl(vectorImage?: VectorImage): string | undefined`
- `resolveLinkedVectorImageUrl(linkedVectorImage?: LinkedVectorImage): string | undefined`
- `stringifyLinkedInDate(date?: LIDate): string | undefined`
- `normalizeRawOrganization(o?: RawOrganization): Organization`

Exemplo (mapear campos com path aninhado):

```ts
import { extractFields } from "linkedin-api-voyager";

const fieldsMap = {
  nome: "firstName",
  headline: "headline",
  foto: "profilePicture.displayImageReferenceResolutionResult.vectorImage.rootUrl",
};

const mapped = extractFields([someObject], fieldsMap);
```

### `src/types.ts`

Este arquivo exporta tipos e interfaces TypeScript usados pela biblioteca (por exemplo: `ISearchParams`, `ISearchPeopleParams`, `SearchResponse`, `Organization`, `ExperienceItem`).

## Limitações e considerações

- Usa endpoints internos do LinkedIn (Voyager), que podem mudar sem aviso.
- Requer cookies válidos de uma sessão autenticada.
- Use com moderação para reduzir risco de bloqueio.
- Respeite os termos de uso do LinkedIn.

## Licença

MIT
