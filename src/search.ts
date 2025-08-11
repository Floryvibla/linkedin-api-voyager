import { Client as ClientState } from "./config";

// Constantes
const MAX_SEARCH_COUNT = 25;
const MAX_REPEATED_REQUESTS = 40;

// Interfaces
export interface SearchParams {
  count?: string;
  filters?: string;
  origin?: string;
  q?: string;
  start?: number;
  queryContext?: string;
  [key: string]: any; // Para permitir parâmetros adicionais
}

export interface SearchElement {
  [key: string]: any; // Estrutura flexível para elementos de busca
}

export interface SearchDataElement {
  elements: SearchElement[];
  extendedElements?: SearchElement[];
}

export interface SearchResponse {
  data: {
    elements: SearchDataElement[];
  };
}

export interface SearchOptions {
  limit?: number;
  results?: SearchElement[];
}

// Função utilitária para criar query string
const createQueryString = (params: Record<string, any>): string => {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
};

// Função utilitária para fazer fetch (assumindo que existe uma função _fetch no client)
const fetchData = async (endpoint: string): Promise<SearchResponse> => {
  const api = await ClientState();
  const response = await api.get(endpoint);
  return response.data;
};

// Função principal de busca
export const search = async (
  params: SearchParams,
  options: SearchOptions = {}
): Promise<SearchElement[]> => {
  const { limit, results = [] } = options;

  // Determinar o count baseado no limite
  const count = limit && limit <= MAX_SEARCH_COUNT ? limit : MAX_SEARCH_COUNT;

  // Parâmetros padrão
  const defaultParams: SearchParams = {
    count: count.toString(),
    filters: "List()",
    origin: "GLOBAL_SEARCH_HEADER",
    q: "all",
    start: results.length,
    queryContext:
      "List(spellCorrectionEnabled->true,relatedSearchesEnabled->true,kcardTypes->PROFILE|COMPANY)",
  };

  // Mesclar parâmetros padrão com os fornecidos
  const mergedParams = { ...defaultParams, ...params };

  // Fazer a requisição
  const endpoint = `/search/blended?${createQueryString(mergedParams)}`;

  const response = await fetchData(endpoint);

  // Processar os dados da resposta
  const newElements: SearchElement[] = [];

  if (response.data && response.data.elements) {
    for (let i = 0; i < response.data.elements.length; i++) {
      if (response.data.elements[i].elements) {
        newElements.push(...response.data.elements[i].elements);
      }
      // Comentário: não tenho certeza do que extendedElements geralmente se refere
      // - busca por palavra-chave retorna um único trabalho?
      // if (response.data.elements[i].extendedElements) {
      //   newElements.push(...response.data.elements[i].extendedElements);
      // }
    }
  }

  // Adicionar novos elementos aos resultados
  const updatedResults = [...results, ...newElements];

  // Sempre cortar os resultados, não importa o que a requisição retorna
  const trimmedResults = limit
    ? updatedResults.slice(0, limit)
    : updatedResults;

  // Caso base da recursão
  const shouldStop =
    (limit !== undefined &&
      (trimmedResults.length >= limit || // se nossos resultados excedem o limite definido
        trimmedResults.length / count >= MAX_REPEATED_REQUESTS)) ||
    newElements.length === 0;

  if (shouldStop) {
    return trimmedResults;
  }

  // Chamada recursiva
  return search(params, {
    limit,
    results: trimmedResults,
  });
};

// Função auxiliar para busca simples (não recursiva)
// export const searchSingle = async (
//   client: ClientState,
//   params: SearchParams
// ): Promise<SearchElement[]> => {
//   return search(client, params, { limit: MAX_SEARCH_COUNT });
// };

// // Função para busca com limite específico
// export const searchWithLimit = async (
//   client: ClientState,
//   params: SearchParams,
//   limit: number
// ): Promise<SearchElement[]> => {
//   return search(client, params, { limit });
// };

// // Função para busca de pessoas
// export const searchPeople = async (
//   client: ClientState,
//   query: string,
//   limit?: number
// ): Promise<SearchElement[]> => {
//   const params: SearchParams = {
//     keywords: query,
//     filters: "List(resultType->PEOPLE)",
//   };

//   return search(client, params, { limit });
// };

// // Função para busca de empresas
// export const searchCompanies = async (
//   client: ClientState,
//   query: string,
//   limit?: number
// ): Promise<SearchElement[]> => {
//   const params: SearchParams = {
//     keywords: query,
//     filters: "List(resultType->COMPANIES)",
//   };

//   return search(client, params, { limit });
// };

// // Função para busca de empregos
// export const searchJobs = async (
//   client: ClientState,
//   query: string,
//   limit?: number
// ): Promise<SearchElement[]> => {
//   const params: SearchParams = {
//     keywords: query,
//     filters: "List(resultType->JOBS)",
//   };

//   return search(client, params, { limit });
// };
