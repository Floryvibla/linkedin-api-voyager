import { fetchData } from "./config";
import {
  extractDataWithReferences,
  extractFields,
  extractFieldsFromIncluded,
  mergeExtraFields,
} from "./utils";

export const getProfile = async (identifier: string) => {
  const response = await fetchData(
    `/identity/profiles/${identifier}/profileView`
  );

  const data = response.data;
  const dataResult: any[] = response?.included;

  const getEntityByUrn = (urn: string) =>
    dataResult.find((item) => item.entityUrn === urn);

  const keyProfile = getEntityByUrn(data?.["*profile"]);
  if (!keyProfile) throw new Error("Key profile not found");

  const miniProfile = getEntityByUrn(keyProfile?.["*miniProfile"]);
  if (!miniProfile) throw new Error("Mini profile not found");

  const profile = {
    // id_urn: keyProfile.entityUrn?.split("urn:li:fs_profile:")[1] || null,
    publicIdentifier: miniProfile?.publicIdentifier || null,
    firstName: keyProfile.firstName || null,
    lastName: keyProfile.lastName || null,
    fullName: `${keyProfile.firstName || ""} ${keyProfile.lastName || ""}`,
    birthDate: keyProfile.birthDate
      ? JSON.stringify({
          month: keyProfile.birthDate.month,
          day: keyProfile.birthDate.day,
        })
      : null,
    profilePicture: miniProfile.picture
      ? `${miniProfile.picture.rootUrl}${
          miniProfile.picture.artifacts[
            miniProfile.picture.artifacts.length - 1
          ]?.fileIdentifyingUrlPathSegment
        }`
      : null,
    backgroundPicture: miniProfile.backgroundImage
      ? `${miniProfile.backgroundImage.rootUrl}${
          miniProfile.backgroundImage.artifacts[
            miniProfile.backgroundImage.artifacts.length - 1
          ]?.fileIdentifyingUrlPathSegment
        }`
      : null,
    location: {
      country: keyProfile.locationName || null,
      city: keyProfile.geoLocationName || null,
    },
    address: keyProfile.address || null,
    industry: keyProfile.industryName || null,
    headline: keyProfile.headline || null,
    summary: keyProfile.summary || null,
  };

  return profile;
};

export const getProfissionalExperiences = async (identifier: string) => {
  const response = await fetchData(
    `/identity/profiles/${identifier}/positions`
  );

  let { data, included } = response;
  const elements = data["*elements"] as string[];

  // Usar a nova função para resolver referências automaticamente
  const dataExperiences = extractDataWithReferences(elements, included);

  // Extrair campos específicos do included
  const extraFields = extractFieldsFromIncluded(included, ["universalName"]);

  // Mapeamento de campos
  const fieldsMap = {
    id: "entityUrn",
    title: "title",
    companyName: "company.miniCompany.name",
    companyUrn: "companyUrn",
    companyEmployeeCount: "company.employeeCountRange",
    companyIndustries: "company.miniCompany.industries",
    description: "description",
    location: "locationName",
    geoLocation: "geoLocationName",
    timePeriod: "timePeriod",
    startDate: "timePeriod.startDate",
    endDate: "timePeriod.endDate",
  };

  // Aplicar mapeamento aos dados resolvidos
  const mappedExperiences = extractFields(dataExperiences, fieldsMap);

  // Associar campos extras
  const experiencesWithExtras = mergeExtraFields(
    mappedExperiences,
    extraFields,
    "companyUrn"
  );

  // Ordenar: sem endDate (ativo) primeiro, depois do mais recente ao mais antigo
  return experiencesWithExtras.sort((a, b) => {
    if (!a.endDate && b.endDate) return -1;
    if (a.endDate && !b.endDate) return 1;
    if (!a.endDate && !b.endDate) return 0;

    const yearDiff = (b.endDate.year || 0) - (a.endDate.year || 0);
    if (yearDiff !== 0) return yearDiff;

    return (b.endDate.month || 0) - (a.endDate.month || 0);
  });
};
