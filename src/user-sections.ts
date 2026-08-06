import { fetchDataApi } from "./config";
import { extractProfileIdLinkedin } from "./user-resolvers";

const SECTIONS_QUERY_ID =
  "voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a";

type RawSectionEntry = {
  $type?: string;
  components?: any;
};

const pagedSectionElements = (response: any) => {
  const included: RawSectionEntry[] = response?.included || [];
  return included
    .filter(
      (item) =>
        item?.$type ===
        "com.linkedin.voyager.dash.identity.profile.tetris.PagedListComponent",
    )
    .map((item) => item?.components?.elements ?? [])
    .filter((list: any[]) => list !== null);
};

export const getLinkedinSkills = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) return [];
  const response = await fetchDataApi(
    `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:skills,locale:pt_BR)&queryId=${SECTIONS_QUERY_ID}`,
  );
  const groups = pagedSectionElements(response);
  return groups
    .flatMap((elements: any[]) =>
      elements.map(
        (el) => el?.components?.entityComponent?.titleV2?.text?.text ?? null,
      ),
    )
    .filter((item) => item !== null);
};

export const getLinkedinEducation = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) return [];
  const response = await fetchDataApi(
    `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:education,locale:pt_BR)&queryId=${SECTIONS_QUERY_ID}`,
  );
  const rows = pagedSectionElements(response)?.[0] ?? [];
  return rows.map((item: any) => {
    const component = item?.components?.entityComponent;
    const isStudying = component?.caption === null;
    const caption = component?.caption?.text ?? "";
    const skills = component?.subComponents?.components?.find(
      (s: any) => s?.components?.insightComponent === null,
    );
    const range = caption ? caption.split(" - ") : [];
    return {
      schoolName: component?.titleV2?.text?.text ?? null,
      linkedinUrlSchool: component?.textActionTarget ?? null,
      degreeName: component?.subtitle?.text ?? null,
      startDate: !isStudying ? Number(range[0]) || null : null,
      endDate: !isStudying ? Number(range[1]) || null : null,
      isStudying,
      skills:
        skills?.components?.fixedListComponent?.components?.[0]?.components
          ?.textComponent?.text?.text ?? null,
    };
  });
};

export const getLinkedinCertifications = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) return [];
  const response = await fetchDataApi(
    `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:certifications,locale:pt_BR)&queryId=${SECTIONS_QUERY_ID}`,
  );
  const rows = pagedSectionElements(response)?.[0] ?? [];
  return rows.map((item: any) => item?.components?.entityComponent ?? null);
};
