# Empresas e Pessoas de Empresa

## Dados de uma empresa

`identifier` = slug da página da empresa (parte final de `linkedin.com/company/<slug>`).

```typescript
import { getCompany } from "@florydev/linkedin-api-voyager";

// linkedin.com/company/microsoft/ -> slug = "microsoft"
const company = await getCompany("microsoft");
// { id, name, description, username, companyPageUrl, staffCount, url,
//   companyIndustries, location, jobSearchPageUrl, phone, followerCount,
//   backgroundCoverImage, logo, permissions }
```

Usa o endpoint REST (não-GraphQL) `/organization/companies` com `decorationId`. As imagens
(`logo`, `backgroundCoverImage`) já vêm resolvidas como URL completa (rootUrl + maior artifact),
então não é preciso montar a URL manualmente.

## Pessoas de uma empresa

```typescript
import {
  getCompanyEntityId,
  searchCompanyPeople,
} from "@florydev/linkedin-api-voyager";

// Resolve o ID interno (URN) de uma empresa a partir do slug
const companyId = await getCompanyEntityId("microsoft");

// Busca pessoas que trabalham (ou trabalharam) numa empresa
const alumni = await searchCompanyPeople({
  companySlug: "microsoft", // ou companyId (evita 1 chamada extra)
  query: "software engineer", // opcional: filtro de keywords
  regions: ["urn:li:geo:106057199"], // opcional: lista de geoUrns
  schools: ["urn:li:school:..."], // opcional
  keywordTitle: "engineer", // opcional: filtro por cargo
  pastCompany: false, // true = ex-funcionários; false (padrão) = atuais
  includePrivateProfiles: true, // padrão true: mantém alinhado com searchPeople
  offset: 0,
  limit: 10, // máx. 49 por chamada
});
// { paging: { offset, count, total }, results: ProfileSearchResult[] }
```

- `getCompanyEntityId(slug)` lança erro (`assert`) se a empresa não for encontrada — trate isso se o slug puder vir errado do usuário.
- `searchCompanyPeople` aceita `companyId` OU `companySlug`; se só passar o slug, a lib resolve o ID automaticamente com uma chamada extra (uma a mais que passar `companyId` direto).
- `includePrivateProfiles` agora segue o mesmo padrão de `searchPeople`: `true` por padrão. Se quiser ocultar perfis privados, passe `false` explicitamente.
- Perfis privados podem aparecer no resultado com `name`/`headline`, mas sem `url`.

## Tipos relevantes

`Company`, `MiniCompany`, `RawOrganization`, `Organization` (versão normalizada — `Omit` de
vários campos crus + campos resolvidos como `logo: string`), `AffiliatedCompany`, `Group`,
`ShowcasePage`, `FundingData`, `Industry`.
