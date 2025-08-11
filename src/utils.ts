export function filterKeys(obj: any, keysToKeep: string[]) {
  const filteredObject: any = {};
  keysToKeep.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      filteredObject[key] = obj[key];
    }
  });
  return filteredObject;
}

export function filterOutKeys(obj: any, keysToIgnore: string[]) {
  const filteredObject: any = {};
  Object.keys(obj).forEach((key) => {
    if (!keysToIgnore.includes(key)) {
      filteredObject[key] = obj[key];
    }
  });
  return filteredObject;
}

// Nova função para extrair valores de caminhos aninhados
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    // Lidar com arrays como attributes[0]
    if (key.includes('[') && key.includes(']')) {
      const [arrayKey, indexStr] = key.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

// Nova função melhorada para filtrar com caminhos aninhados
export function extractFields(data: any[], fieldsMap: Record<string, string>): any[] {
  return data.map(item => {
    const extracted: any = {};
    
    Object.entries(fieldsMap).forEach(([newKey, path]) => {
      const value = getNestedValue(item, path);
      if (value !== undefined) {
        extracted[newKey] = value;
      }
    });
    
    return extracted;
  });
}

// Função para debug - mostra a estrutura do objeto
export function debugObjectStructure(obj: any, maxDepth: number = 3, currentDepth: number = 0): void {
  if (currentDepth >= maxDepth) return;
  
  const indent = '  '.repeat(currentDepth);
  
  if (Array.isArray(obj)) {
    console.log(`${indent}Array[${obj.length}]:`);
    if (obj.length > 0) {
      console.log(`${indent}  [0]:`);
      debugObjectStructure(obj[0], maxDepth, currentDepth + 2);
    }
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).slice(0, 10).forEach(key => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        console.log(`${indent}${key}:`);
        debugObjectStructure(value, maxDepth, currentDepth + 1);
      } else {
        console.log(`${indent}${key}: ${typeof value} = ${String(value).slice(0, 50)}...`);
      }
    });
  }
}

// Função para resolver referências URN dinamicamente
export function resolveReferences(data: any, included: any[]): any {
  if (!data || !included) return data;

  // Criar um mapa de URN para acesso rápido
  const urnMap = new Map();
  included.forEach(item => {
    if (item.entityUrn) {
      urnMap.set(item.entityUrn, item);
    }
  });

  // Função recursiva para resolver referências
  function resolveObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => resolveObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const resolved: any = {};
      
      Object.entries(obj).forEach(([key, value]) => {
        // Detectar chaves que começam com * (referências URN)
        if (key.startsWith('*') && typeof value === 'string') {
          const referencedData = urnMap.get(value);
          if (referencedData) {
            // Remover o * e usar como chave
            const cleanKey = key.substring(1);
            resolved[cleanKey] = resolveObject(referencedData);
          } else {
            resolved[key] = value; // Manter original se não encontrar
          }
        }
        // Detectar arrays de URNs
        else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('urn:li:')) {
          const resolvedArray = value.map(urn => {
            const referencedData = urnMap.get(urn);
            return referencedData ? resolveObject(referencedData) : urn;
          }).filter(item => item !== null);
          resolved[key] = resolvedArray;
        }
        // Recursão para objetos aninhados
        else if (value && typeof value === 'object') {
          resolved[key] = resolveObject(value);
        }
        // Valores primitivos
        else {
          resolved[key] = value;
        }
      });
      
      return resolved;
    }
    
    return obj;
  }

  return resolveObject(data);
}

// Função para extrair dados com resolução automática de referências
export function extractDataWithReferences(
  elements: string[], 
  included: any[], 
  fieldsMap?: Record<string, string>
): any[] {
  // Filtrar dados pelos elementos
  const filteredData = included.filter(item => 
    elements.includes(item.entityUrn)
  );

  // Resolver todas as referências
  const resolvedData = filteredData.map(item => 
    resolveReferences(item, included)
  );

  // Se há mapeamento de campos, aplicar
  if (fieldsMap) {
    return extractFields(resolvedData, fieldsMap);
  }

  return resolvedData;
}

// Função para debug de estrutura com referências resolvidas
export function debugResolvedStructure(
  elements: string[], 
  included: any[], 
  maxDepth: number = 2
): void {
  console.log('🔍 Estrutura dos dados com referências resolvidas:');
  const resolved = extractDataWithReferences(elements, included);
  
  if (resolved.length > 0) {
    console.log(`📊 Total de itens: ${resolved.length}`);
    console.log('📋 Estrutura do primeiro item:');
    debugObjectStructure(resolved[0], maxDepth);
  }
}

// Função para extrair campos específicos de todos os objetos no included
export function extractFieldsFromIncluded(
  included: any[], 
  fields: string[]
): Record<string, any>[] {
  return included
    .filter(item => fields.some(field => item[field] !== undefined))
    .map(item => {
      const extracted: any = { entityUrn: item.entityUrn };
      
      fields.forEach(field => {
        if (item[field] !== undefined) {
          extracted[field] = item[field];
        }
      });
      
      return extracted;
    });
}

// Função para associar dados extras aos dados principais
export function mergeExtraFields(
  mainData: any[],
  extraData: Record<string, any>[],
  matchKey: string = 'companyUrn'
): any[] {
  return mainData.map(item => {
    const extraItem = extraData.find(extra => 
      item[matchKey] && extra.entityUrn === item[matchKey]
    );
    
    if (extraItem) {
      const { entityUrn, ...extraFields } = extraItem;
      return { ...item, ...extraFields };
    }
    
    return item;
  });
}
