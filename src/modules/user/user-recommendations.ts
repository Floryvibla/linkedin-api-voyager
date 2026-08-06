import { fetchDataApi } from "../../core/config";
import {
  extractProfileIdLinkedin,
  RECOMMENDATIONS_QUERY_ID,
} from "./user-loader";
import { ProfilePaged } from "./user-types";
import { mapRecommendation } from "./user-section-mappers-b";

type PageOpts = { start?: number; count?: number; autoPaginate?: boolean };

export const getLinkedinRecommendations = async (
  identifier: string,
  opts?: { received?: boolean; given?: boolean } & PageOpts,
): Promise<ProfilePaged<any>> => {
  const received = opts?.received ?? true;
  const given = opts?.given ?? false;
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) return { paging: { start: 0, count: 0, total: 0 }, items: [] };
  const cats: Array<"received" | "given"> = [];
  if (received) cats.push("received");
  if (given) cats.push("given");
  const all: any[] = [];
  let total = 0;
  for (const category of cats) {
    try {
      const ep = `graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},category:${category},start:${opts?.start ?? 0},count:${opts?.count ?? 100})&queryId=${RECOMMENDATIONS_QUERY_ID}`;
      const resp = await fetchDataApi(ep);
      const direct = resp?.data?.identityDashRecommendationsByProfileUrn;
      const paged =
        (Array.isArray(direct?.elements) ? direct : null) ??
        (resp?.included || []).find(
          (i: any) =>
            Array.isArray(i?.elements) && i.elements[0]?.recommendationType,
        );
      const elements = paged?.elements ?? [];
      total += Number(paged?.paging?.total ?? elements.length) || 0;
      for (const el of elements) {
        const mapped = mapRecommendation(el);
        (mapped as any).category = category;
        all.push(mapped);
      }
    } catch {}
  }
  return {
    paging: {
      start: opts?.start ?? 0,
      count: all.length,
      total: total || all.length,
    },
    items: all,
  };
};
