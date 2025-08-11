# LinkedIn API Voyager

Uma biblioteca TypeScript para interagir com a API interna do LinkedIn (Voyager) de forma simples e eficiente.

## 🚀 Instalação

```bash
npm install linkedin-api-voyager
# ou
yarn add linkedin-api-voyager
```

## 📋 Pré-requisitos

Você precisa ter cookies válidos do LinkedIn para usar esta biblioteca. Os cookies devem estar salvos em um arquivo `linkedin_cookies.json` na raiz do seu projeto.

### Formato dos cookies:

```json
{
  "JSESSIONID": "seu_token_aqui",
  "li_at": "seu_token_aqui",
  "timestamp": "1234567890"
}
```

## 🔧 Uso

### Configuração inicial

```typescript
import {
  getProfile,
  getProfissionalExperiences,
  getCompany,
  search,
} from "linkedin-api-voyager";
```

### 👤 Perfil de usuário

```typescript
// Obter perfil completo
const profile = await getProfile("username-do-linkedin");

// Obter experiências profissionais (ordenadas do mais recente ao mais antigo)
const experiences = await getProfissionalExperiences("username-do-linkedin");
```

### 🏢 Informações de empresa

```typescript
// Obter dados completos da empresa
const company = await getCompany("nome-universal-da-empresa");
```

### 🔍 Busca

```typescript
// Busca geral
const results = await search(
  {
    keywords: "desenvolvedor javascript",
    filters: "List(resultType->PEOPLE)",
  },
  { limit: 50 }
);

// Busca com parâmetros personalizados
const customSearch = await search({
  q: "all",
  keywords: "react developer",
  filters: "List(resultType->PEOPLE,locationFilter->br:0)",
  start: 0,
  count: "25",
});
```

### 💬 Comentários de posts

```typescript
import { getCommentsByPostUrl } from "linkedin-api-voyager";

// Obter todos os comentários de um post
const comments = await getCommentsByPostUrl(
  "https://www.linkedin.com/feed/update/urn:li:activity-1234567890/",
  0, // início
  50 // limite por página
);
```

## 📊 Estrutura de dados

### Perfil

```typescript
{
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture: string;
  backgroundPicture: string;
  location: {
    country: string;
    city: string;
  }
  industry: string;
  headline: string;
  summary: string;
  // ... outros campos
}
```

### Experiências profissionais

```typescript
[
  {
    id: string;
    title: string;
    companyName: string;
    companyUrn: string;
    universalName: string; // Nome universal da empresa
    description: string;
    location: string;
    startDate: { year: number; month: number };
    endDate: { year: number; month: number } | null; // null = ativo
    // ... outros campos
  }
]
```

### Empresa

```typescript
{
  id: string;
  name: string;
  description: string;
  username: string;
  companyPageUrl: string;
  staffCount: number;
  url: string;
  location: string;
  followerCount: number;
  logo: object;
  // ... outros campos
}
```

## 🛠️ Funcionalidades avançadas

### Extração de campos personalizados

```typescript
import { extractFields, extractFieldsFromIncluded } from "linkedin-api-voyager";

// Mapear campos específicos
const fieldsMap = {
  nome: "firstName",
  empresa: "company.name",
  cargo: "title",
};

const dadosMapeados = extractFields(dados, fieldsMap);
```

### Resolução automática de referências

A biblioteca resolve automaticamente referências URN aninhadas, permitindo acesso direto a dados relacionados sem necessidade de mapeamento manual.

## ⚠️ Limitações e considerações

- Esta biblioteca usa a API interna do LinkedIn (Voyager)
- Requer cookies válidos de uma sessão autenticada
- Respeite os termos de uso do LinkedIn
- Use com moderação para evitar bloqueios
- Não é uma API oficial do LinkedIn

## 🔒 Segurança

- Mantenha seus cookies seguros
- Não compartilhe o arquivo `linkedin_cookies.json`
- O arquivo já está incluído no `.gitignore`

## 📝 Licença

MIT

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
