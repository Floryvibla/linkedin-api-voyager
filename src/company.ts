import { fetchData } from "./config";
import { extractDataWithReferences, extractFields } from "./utils";

export const getCompany = async (identifier: string) => {
  const response = await fetchData(
    `/organization/companies?decorationId=com.linkedin.voyager.deco.organization.web.WebFullCompanyMain-12&q=universalName&universalName=${identifier}`,
  );

  const data = extractDataWithReferences(
    response.data["*elements"],
    response.included,
  );

  const fieldsMap = {
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

  return extractFields(data, fieldsMap).map((item) => ({
    ...item,
    id: item.id.split(":")[3],
    backgroundCoverImage: `${item.backgroundCoverImage?.rootUrl}${
      item.backgroundCoverImage?.artifacts?.at(-1)
        ?.fileIdentifyingUrlPathSegment
    }`,
    logo: `${item.logo?.rootUrl}${
      item.logo?.artifacts?.at(-1)?.fileIdentifyingUrlPathSegment
    }`,
  }))[0];
};
