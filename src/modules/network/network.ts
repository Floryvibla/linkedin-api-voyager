import { fetchDataApi } from "../../core/config";

export const receivedInvitation = async (
  { start, count }: { start: number; count: number } = {
    start: 0,
    count: 3,
  },
) => {
  const response = await fetchDataApi(
    `/relationships/invitationViews?q=receivedInvitation&includeInsights=true&start=${start}&count=${count}`,
  );

  return response;
};

export const sentInvitation = async (
  { start, count }: { start: number; count: number } = {
    start: 0,
    count: 3,
  },
) => {
  const response = await fetchDataApi(
    `/relationships/invitationViews?q=sentInvitation&includeInsights=true&start=${start}&count=${count}`,
  );

  return response;
};
