# Perfis de Usuário

`identifier` = o `publicIdentifier` do perfil (parte final de `linkedin.com/in/<identifier>`).
A maioria das funções aceita esse identifier direto; `extractProfileIdLinkedin` também aceita a
URL completa e faz o parse.

```typescript
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

const id = "florymignon"; // linkedin.com/in/florymignon

// Perfil do dono da sessão logada (via /me) — dados básicos + data de nascimento
const me = await getMe();

// Perfil básico de qualquer usuário (nome, headline, fotos, about)
const profile = await getUserMiniProfile(id);

// Texto da seção "Sobre"
const about = await getProfileSectionAbout(id);

// Experiências profissionais (enriquecidas com dados de empresa via getCompany, ver companies.md)
const experiences = await getProfissionalExperiences(id);

// Contato (endereço, telefones, e-mail, sites) — quando disponível
const contact = await getContactInfo(id);

// Skills (habilidades) listadas no perfil
const skills = await getLinkedinSkills(id);

// Educação (escola, degree, datas, "cursando" ou não, skills relacionadas)
const education = await getLinkedinEducation(id);

// Certificações
const certifications = await getLinkedinCertifications(id);

// Extrair publicIdentifier + resolver para ID interno numérico a partir de uma URL completa
const idUrn = await extractProfileIdLinkedin(
  "https://www.linkedin.com/in/florymignon/",
);
```

## Notas de implementação

- `getMe()` usa `/me` e só preenche `firstName`/`lastName`/`birthDate`; `headline` e `about`
  ficam como `"N/A"` (limitação do próprio endpoint do LinkedIn, não da lib).
- `getUserMiniProfile` e `extractProfileIdLinkedin` usam GraphQL
  (`voyagerIdentityDashProfiles...`) filtrando o `included` pelo `publicIdentifier`.
- `getProfissionalExperiences` chama `getCompany` (ver `companies.md`) para cada posição — várias
  requisições em paralelo via `Promise.all`. Para perfis com muitas posições isso gera bastante
  tráfego; se só precisar dos cargos/datas sem os detalhes da empresa, considere paralelizar
  menos ou cachear `getCompany` por slug.

## Tipos relevantes

Respostas cruas: `ProfileView`, `ProfileViewProfile`, `MiniProfile`, `PositionView`,
`PositionGroupView`, `EducationView`, `SkillView`, `Element`, `Position`, `TimePeriod`, `LIDate`.

Normalizados (o que as funções acima retornam): `Profile`, `ExperienceItem`, `EducationItem`,
`ProfileContactInfo`, `ProfileSkills`, `SelfProfile`.
