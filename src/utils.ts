/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  AffiliatedCompany,
  Artifact,
  ExperienceItem,
  Group,
  LIDate,
  LinkedVectorImage,
  Organization,
  RawOrganization,
  ShowcasePage,
  VectorImage,
} from "./types";

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
  return path.split(".").reduce((current, key) => {
    // Lidar com arrays como attributes[0]
    if (key.includes("[") && key.includes("]")) {
      const [arrayKey, indexStr] = key.split("[");
      const index = parseInt(indexStr.replace("]", ""));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

// Nova função melhorada para filtrar com caminhos aninhados
export function extractFields(
  data: any[],
  fieldsMap: Record<string, string>,
): any[] {
  return data?.map((item) => {
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
export function debugObjectStructure(
  obj: any,
  maxDepth: number = 3,
  currentDepth: number = 0,
): void {
  if (currentDepth >= maxDepth) return;

  const indent = "  ".repeat(currentDepth);

  if (Array.isArray(obj)) {
    console.log(`${indent}Array[${obj.length}]:`);
    if (obj.length > 0) {
      console.log(`${indent}  [0]:`);
      debugObjectStructure(obj[0], maxDepth, currentDepth + 2);
    }
  } else if (obj && typeof obj === "object") {
    Object.keys(obj)
      .slice(0, 10)
      .forEach((key) => {
        const value = obj[key];
        if (typeof value === "object" && value !== null) {
          console.log(`${indent}${key}:`);
          debugObjectStructure(value, maxDepth, currentDepth + 1);
        } else {
          console.log(
            `${indent}${key}: ${typeof value} = ${String(value).slice(
              0,
              50,
            )}...`,
          );
        }
      });
  }
}

// Função para resolver referências URN dinamicamente
export function resolveReferences(data: any, included: any[]): any {
  if (!data || !included) return data;

  // Criar um mapa de URN para acesso rápido
  const urnMap = new Map();
  included.forEach((item) => {
    if (item.entityUrn) {
      urnMap.set(item.entityUrn, item);
    }
  });

  // Função recursiva para resolver referências
  function resolveObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => resolveObject(item));
    }

    if (obj && typeof obj === "object") {
      const resolved: any = {};

      Object.entries(obj).forEach(([key, value]) => {
        // Detectar chaves que começam com * (referências URN)
        if (key.startsWith("*") && typeof value === "string") {
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
        else if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "string" &&
          value[0].startsWith("urn:li:")
        ) {
          const resolvedArray = value
            .map((urn) => {
              const referencedData = urnMap.get(urn);
              return referencedData ? resolveObject(referencedData) : urn;
            })
            .filter((item) => item !== null);
          resolved[key] = resolvedArray;
        }
        // Recursão para objetos aninhados
        else if (value && typeof value === "object") {
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
  fieldsMap?: Record<string, string>,
): any[] {
  // Filtrar dados pelos elementos
  const filteredData = included.filter((item) =>
    elements.includes(item.entityUrn),
  );

  // Resolver todas as referências
  const resolvedData = filteredData.map((item) =>
    resolveReferences(item, included),
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
  maxDepth: number = 2,
): void {
  console.log("🔍 Estrutura dos dados com referências resolvidas:");
  const resolved = extractDataWithReferences(elements, included);

  if (resolved.length > 0) {
    console.log(`📊 Total de itens: ${resolved.length}`);
    console.log("📋 Estrutura do primeiro item:");
    debugObjectStructure(resolved[0], maxDepth);
  }
}

// Função para extrair campos específicos de todos os objetos no included
export function extractFieldsFromIncluded(
  included: any[],
  fields: string[],
): Record<string, any>[] {
  return included
    .filter((item) => fields.some((field) => item[field] !== undefined))
    .map((item) => {
      const extracted: any = { entityUrn: item.entityUrn };

      fields.forEach((field) => {
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
  matchKey: string = "companyUrn",
): any[] {
  return mainData.map((item) => {
    const extraItem = extraData.find(
      (extra) => item[matchKey] && extra.entityUrn === item[matchKey],
    );

    if (extraItem) {
      const { entityUrn, ...extraFields } = extraItem;
      return { ...item, ...extraFields };
    }

    return item;
  });
}

// src/libs/linkedin/extractExperiences.ts
type AnyObject = Record<string, any>;

interface Experience {
  role: string | null;
  idCompany: string | null;
  company: string | null;
  time_duration?: string | null;
  location?: string | null;
  description?: string | null;
  time_period?: string | null;
  duration?: string | null;
}

export const getDataIncludedForEntity = (
  jsonData: AnyObject,
  entityUrn: string,
) => {
  const data = jsonData?.included;
  if (data.length) {
    const dataEntityUrn = data.find((item: any) =>
      item.entityUrn.toLowerCase().includes(entityUrn.toLowerCase()),
    );
    return dataEntityUrn;
  }
  return [];
};

export function extractExperiences(jsonData: AnyObject): Experience[] {
  const experiences: Experience[] = [];

  try {
    const included = jsonData?.included ?? [];
    if (!included.length) {
      console.warn("[PROFILE] No 'included' array found");
      return experiences;
    }

    // ===== PASS 1: Build component map by URN =====
    console.info(
      `[PROFILE] Pass 1: Building component map from ${included.length} items`,
    );
    const componentMap: Record<string, AnyObject> = {};
    for (const item of included) {
      const urn = item?.entityUrn;
      if (urn) componentMap[urn] = item;
    }

    console.info(
      `[PROFILE] Pass 1: Indexed ${
        Object.keys(componentMap).length
      } components by URN`,
    );

    // ===== PASS 2: Find anchor and traverse =====
    let mainExperienceUrn: string | null = null;
    for (const urn of Object.keys(componentMap)) {
      if (
        urn.includes("EXPERIENCE_VIEW_DETAILS") &&
        urn.includes("fsd_profile:")
      ) {
        mainExperienceUrn = urn;
        console.info(`[PROFILE] Pass 2: Found main experience anchor: ${urn}`);
        break;
      }
    }

    if (!mainExperienceUrn) {
      console.warn("[PROFILE] Pass 2: No experience anchor found");
      return experiences;
    }

    const mainList = componentMap[mainExperienceUrn];
    if (!mainList) {
      console.error(
        "[PROFILE] Pass 2: Anchor URN not in map (shouldn't happen)",
      );
      return experiences;
    }

    let elements: any[] =
      mainList.elements ?? mainList.components?.elements ?? [];

    console.info(
      `[PROFILE] Pass 2: Found ${elements.length} experience blocks`,
    );

    const paging = mainList.paging ?? mainList.components?.paging;
    if (paging) {
      const { total = "unknown", count = "unknown", start = 0 } = paging;
      console.warn(
        `[PROFILE] PAGINATION: ${count} of ${total} experiences (start: ${start})`,
      );
    }

    if (!elements.length) {
      console.warn("[PROFILE] Pass 2: No elements in main list");
      return experiences;
    }

    // Step 4: Process each experience block
    elements.forEach((elem, idx) => {
      try {
        if (typeof elem !== "object" || elem === null) return;

        const entity = elem?.components?.entityComponent;
        if (typeof entity !== "object" || !entity) {
          console.debug(`[PROFILE] Element ${idx}: No entityComponent`);
          return;
        }

        // Detect nested grouped roles (company with multiple positions)
        let nestedUrn: string | null = null;
        const subCompsWrapper = entity.subComponents;
        if (typeof subCompsWrapper === "object" && subCompsWrapper) {
          const subComponents = subCompsWrapper.components;
          if (Array.isArray(subComponents) && subComponents.length > 0) {
            const firstSub = subComponents[0];
            const subComps = firstSub?.components;
            if (typeof subComps === "object" && subComps) {
              for (const key of ["*pagedListComponent", "pagedListComponent"]) {
                const value = subComps[key];
                if (value) {
                  nestedUrn =
                    typeof value === "string"
                      ? value
                      : (value?.entityUrn ?? null);
                  if (nestedUrn) break;
                }
              }
              if (!nestedUrn) {
                for (const [key, value] of Object.entries(subComps)) {
                  if (
                    key.toLowerCase().includes("pagedlistcomponent") &&
                    value
                  ) {
                    nestedUrn =
                      typeof value === "string"
                        ? value
                        : ((value as any)?.entityUrn ?? null);
                    if (nestedUrn) break;
                  }
                }
              }
            }
          }
        }

        if (nestedUrn) {
          // GROUPED ENTRY (company with multiple roles)
          let companyName = "";
          const titleV2 = entity.titleV2;
          if (titleV2 && typeof titleV2 === "object") {
            const textObj = titleV2.text;
            companyName =
              typeof textObj === "string" ? textObj : (textObj?.text ?? "");
          }

          let totalDuration = "";
          const subtitle = entity.subtitle;
          if (subtitle && typeof subtitle === "object") {
            const textObj = subtitle.text;
            totalDuration =
              typeof textObj === "string" ? textObj : (textObj?.text ?? "");
          }

          console.info(
            `[PROFILE] Element ${idx}: Grouped company '${companyName}' (${totalDuration})`,
          );

          const nestedList = componentMap[nestedUrn];
          if (nestedList) {
            const nestedElements =
              nestedList.elements ?? nestedList.components?.elements ?? [];

            console.info(
              `[PROFILE] Found ${nestedElements.length} roles for '${companyName}'`,
            );

            for (const [roleIdx, roleElem] of nestedElements.entries()) {
              const roleEntity = roleElem?.components?.entityComponent;
              if (roleEntity && typeof roleEntity === "object") {
                const exp = extractOneExperience(roleEntity, companyName);
                if (exp) {
                  console.debug(
                    `[PROFILE] Extracted role ${roleIdx + 1}/${
                      nestedElements.length
                    }: ${exp.role} at ${companyName}`,
                  );
                  experiences.push(exp);
                }
              }
            }
          } else {
            console.warn(`[PROFILE] Nested URN not found in map: ${nestedUrn}`);
          }

          // Continue to next element without extracting parent
          return;
        }

        // SINGLE ENTRY
        const titleV2 = entity.titleV2;
        const caption = entity.caption;

        if (titleV2 && !caption) {
          console.warn(
            `[PROFILE] Element ${idx}: Skipping potential parent block`,
          );
          return;
        }

        const exp = extractOneExperience(entity);
        if (exp) experiences.push(exp);
      } catch (err: any) {
        console.warn(`[PROFILE] Error on element ${idx}: ${err.message}`);
      }
    });

    console.info(
      `[PROFILE] Successfully extracted ${experiences.length} total experiences`,
    );
  } catch (err: any) {
    console.error(`[PROFILE] Fatal error: ${err.message}`);
  }

  return experiences;
}

// Helper function
function extractOneExperience(
  entity: AnyObject,
  companyOverride?: string,
): Experience | null {
  if (!entity || typeof entity !== "object") return null;

  const safeGetText = (obj: any, ...keys: string[]): string => {
    let current = obj;
    for (const key of keys) {
      if (typeof current !== "object" || current === null) return "";
      current = current[key];
      if (current === undefined || current === null) return "";
    }
    return typeof current === "string" ? current : (current?.text ?? "");
  };

  const title = safeGetText(entity, "titleV2", "text", "text");
  const idCompany =
    safeGetText(entity, "textActionTarget")?.match(/\/(\d+)\/?$/)?.[1] || null;
  if (!title) return null;

  let company = companyOverride ?? "";
  if (!company) {
    const subtitle = entity.subtitle;
    if (subtitle && typeof subtitle === "object") {
      company =
        typeof subtitle.text === "string"
          ? subtitle.text
          : (subtitle.text?.text ?? "");
    }
  }

  let dates = "";
  const caption = entity.caption;
  if (caption && typeof caption === "object") {
    dates =
      typeof caption.text === "string"
        ? caption.text
        : (caption.text?.text ?? "");
  }

  let location = "";
  const metadata = entity.metadata;
  if (metadata && typeof metadata === "object") {
    location =
      typeof metadata.text === "string"
        ? metadata.text
        : (metadata.text?.text ?? "");
  }

  let description = "";
  try {
    const subcomps = entity.subComponents;
    const components = subcomps?.components;
    if (Array.isArray(components)) {
      for (const sc of components) {
        const scComps = sc?.components;
        const fixed = scComps?.fixedListComponent;
        const fixedComps = fixed?.components;
        if (Array.isArray(fixedComps)) {
          for (const fc of fixedComps) {
            const txtComp = fc?.components?.textComponent;
            const txt = safeGetText(txtComp, "text", "text");
            if (txt) {
              description = txt;
              break;
            }
          }
        }
        if (description) break;
      }
    }
  } catch (err: any) {
    console.debug(`[PROFILE] Error extracting description: ${err.message}`);
  }

  const result: Experience = {
    role: title,
    idCompany,
    company: company || null,
    time_duration: dates || "",
    location: location || "",
    description: description || null,
  };

  if (dates.includes("·")) {
    const parts = dates.split("·");
    result.time_period = parts[0].trim();
    if (parts[1]) result.duration = parts[1].trim();
  }

  console.info(`[PROFILE] ✓ ${title} at ${company || null}`);
  return result;
}

export function assert(
  value: unknown,
  message?: string | Error,
): asserts value {
  if (value) {
    return;
  }

  if (!message) {
    throw new Error("Assertion failed");
  }

  throw typeof message === "string" ? new Error(message) : message;
}

export function getIdFromUrn(urn?: string) {
  return urn?.split(":").at(-1);
}

/**
 * Return the URN of a raw group update
 *
 * Example: urn:li:fs_miniProfile:<id>
 * Example: urn:li:fs_updateV2:(<urn>,GROUP_FEED,EMPTY,DEFAULT,false)
 */
export function getUrnFromRawUpdate(update?: string) {
  return update?.split("(")[1]?.split(",").at(0)?.trim();
}

export function isLinkedInUrn(urn?: string) {
  return urn?.startsWith("urn:li:") && urn.split(":").length >= 4;
}

export function parseExperienceItem(
  item: any,
  { isGroupItem = false, included }: { isGroupItem?: boolean; included: any[] },
): ExperienceItem {
  const component = item.components.entityComponent;
  const title = component.titleV2.text.text;
  const subtitle = component.subtitle;
  const subtitleParts = subtitle?.text?.split(" · ");
  const company = subtitleParts?.[0];
  const employmentType = subtitleParts?.[1];
  const companyId: string | undefined =
    getIdFromUrn(component.image?.attributes?.[0]?.["*companyLogo"]) ??
    component.image?.actionTarget?.split("/").findLast(Boolean);
  const companyUrn = companyId ? `urn:li:fsd_company:${companyId}` : undefined;
  let companyImage: string | undefined;

  if (companyId) {
    const companyEntity = included.find((i: any) =>
      i.entityUrn?.endsWith(companyId),
    );

    if (companyEntity) {
      companyImage = resolveImageUrl(
        companyEntity.logoResolutionResult?.vectorImage,
      );
    }
  }

  const metadata = component?.metadata || {};
  const location = metadata?.text;

  const durationText = component.caption?.text;
  const durationParts = durationText?.split(" · ");
  const dateParts = durationParts?.[0]?.split(" - ");

  const duration = durationParts?.[1];
  const startDate = dateParts?.[0];
  const endDate = dateParts?.[1];

  const subComponents = component.subComponents;
  const fixedListComponent =
    subComponents?.components?.[0]?.components?.fixedListComponent;

  const fixedListTextComponent =
    fixedListComponent?.components?.[0]?.components?.textComponent;

  const description = fixedListTextComponent?.text?.text;

  const parsedData: ExperienceItem = {
    title,
    companyName: !isGroupItem ? company : undefined,
    employmentType: isGroupItem ? company : employmentType,
    location,
    duration,
    startDate,
    endDate,
    description,
    company: {
      entityUrn: companyUrn,
      id: companyId,
      name: !isGroupItem ? company : undefined,
      logo: companyImage,
    },
  };

  return parsedData;
}

export function getGroupedItemId(item: any): string | undefined {
  const subComponents = item.components?.entityComponent?.subComponents;
  const subComponentsComponents = subComponents?.components?.[0]?.components;

  const pagedListComponentId = subComponentsComponents?.["*pagedListComponent"];

  if (pagedListComponentId?.includes("fsd_profilePositionGroup")) {
    const pattern = /urn:li:fsd_profilePositionGroup:\([\dA-z]+,[\dA-z]+\)/;
    const match = pagedListComponentId.match(pattern);
    return match?.[0];
  }

  return undefined;
}

export const omit = <
  T extends Record<string, unknown> | object,
  K extends keyof any,
>(
  inputObj: T,
  ...keys: K[]
): Omit<T, K> => {
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(inputObj).filter(([k]) => !keysSet.has(k as any)),
  ) as any;
};

export function resolveImageUrl(vectorImage?: VectorImage): string | undefined {
  if (!vectorImage?.rootUrl) return;
  if (!vectorImage.artifacts?.length) return;

  const largestArtifact = vectorImage.artifacts.reduce(
    (a, b) => {
      if (b.width > a.width) return b;
      return a;
    },
    vectorImage.artifacts[0] ?? ({ width: 0, height: 0 } as Artifact),
  );

  if (!largestArtifact?.fileIdentifyingUrlPathSegment) return;

  return `${vectorImage.rootUrl}${largestArtifact.fileIdentifyingUrlPathSegment}`;
}

export function resolveLinkedVectorImageUrl(
  linkedVectorImage?: LinkedVectorImage,
): string | undefined {
  return resolveImageUrl(
    linkedVectorImage?.["com.linkedin.common.VectorImage"],
  );
}

export function stringifyLinkedInDate(date?: LIDate): string | undefined {
  if (!date) return undefined;
  if (date.year === undefined) return undefined;

  return [date.year, date.month].filter(Boolean).join("-");
}

export function normalizeRawOrganization(o?: RawOrganization): Organization {
  assert(o, "Missing organization");
  assert(o.entityUrn, "Invalid organization: missing entityUrn");

  const id = getIdFromUrn(o.entityUrn);
  assert(id, `Invalid organization ID: ${o.entityUrn}`);

  return {
    ...omit(
      o,
      "universalName",
      "logo",
      "backgroundCoverImage",
      "coverPhoto",
      "overviewPhoto",
      "$recipeType",
      "callToAction",
      "phone",
      "permissions",
      "followingInfo",
      "adsRule",
      "autoGenerated",
      "lcpTreatment",
      "staffingCompany",
      "showcase",
      "paidCompany",
      "claimable",
      "claimableByViewer",
      "viewerPendingAdministrator",
      "viewerConnectedToAdministrator",
      "viewerFollowingJobsUpdates",
      "viewerEmployee",
      "associatedHashtags",
      "associatedHashtagsResolutionResults",
      "affiliatedCompaniesResolutionResults",
      "groupsResolutionResults",
      "showcasePagesResolutionResults",
    ),
    id,
    publicIdentifier: o.universalName,
    logo: resolveLinkedVectorImageUrl(o.logo?.image),
    backgroundCoverImage: resolveLinkedVectorImageUrl(
      o.backgroundCoverImage?.image,
    ),
    coverPhoto:
      o.coverPhoto?.["com.linkedin.voyager.common.MediaProcessorImage"]?.id,
    overviewPhoto:
      o.overviewPhoto?.["com.linkedin.voyager.common.MediaProcessorImage"]?.id,
    callToActionUrl: o.callToAction?.url,
    phone: o.phone?.number,
    numFollowers: o.followingInfo?.followerCount,
    affiliatedCompaniesResolutionResults: Object.fromEntries(
      Object.entries(o.affiliatedCompaniesResolutionResults ?? {}).map(
        ([k, v]) => [
          k,
          {
            ...omit(
              v,
              "universalName",
              "logo",
              "$recipeType",
              "followingInfo",
              "showcase",
              "paidCompany",
            ),
            id: getIdFromUrn(v.entityUrn)!,
            publicIdentifier: v.universalName,
            numFollowers: v.followingInfo?.followerCount,
            logo: resolveLinkedVectorImageUrl(v.logo?.image),
          } as AffiliatedCompany,
        ],
      ),
    ),
    groupsResolutionResults: Object.fromEntries(
      Object.entries(o.groupsResolutionResults ?? {}).map(([k, v]) => [
        k,
        {
          ...omit(v, "logo", "$recipeType"),
          id: getIdFromUrn(v.entityUrn)!,
          logo: resolveLinkedVectorImageUrl(v.logo),
        } as Group,
      ]),
    ),
    showcasePagesResolutionResults: Object.fromEntries(
      Object.entries(o.showcasePagesResolutionResults ?? {}).map(([k, v]) => [
        k,
        {
          ...omit(
            v,
            "universalName",
            "logo",
            "$recipeType",
            "followingInfo",
            "showcase",
            "paidCompany",
          ),
          id: getIdFromUrn(v.entityUrn)!,
          publicIdentifier: v.universalName,
          numFollowers: v.followingInfo?.followerCount,
          logo: resolveLinkedVectorImageUrl(v.logo?.image),
        } as ShowcasePage,
      ]),
    ),
  };
}
