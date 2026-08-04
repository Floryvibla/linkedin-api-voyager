import { fetchDataApi } from "./config";
import { extractDataWithReferences, extractFields } from "./utils";

const FIELDS_MAP = {
  id: "entityUrn",
  name: "name",
  description: "description",
  username: "universalName",
  companyPageUrl: "companyPageUrl",
  staffCount: "staffCount",
  url: "url",
  companyIndustries: "*companyIndustries[0].localizedName",
  location: "locationName",
  jobSearchPageUrl: "jobSearchPageUrl",
  phone: "phone",
  followerCount: "followingInfo.followerCount",
  backgroundCoverImage: "backgroundCoverImage.image",
  logo: "logo.image",
  permissions: "permissions",
};

const resolveArt = (i: any) =>
  i?.artifacts?.at(-1)?.fileIdentifyingUrlPathSegment ?? "";

export const getCompany = async (identifier: string) => {
  const res = await fetchDataApi(
    `/organization/companies?decorationId=com.linkedin.voyager.deco.organization.web.WebFullCompanyMain-12&q=universalName&universalName=${identifier}`,
  );
  const data = extractDataWithReferences(res.data["*elements"], res.included);
  return extractFields(data, FIELDS_MAP).map((i: any) => ({
    ...i,
    id: i.id.split(":")[3],
    backgroundCoverImage: `${i.backgroundCoverImage?.rootUrl}${resolveArt(
      i.backgroundCoverImage,
    )}`,
    logo: `${i.logo?.rootUrl}${resolveArt(i.logo)}`,
  }))[0];
};