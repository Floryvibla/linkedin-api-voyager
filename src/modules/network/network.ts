import { fetchDataApi } from "../../core/config";
import type { NetworkPaginationArgs } from "./types";

export const receivedInvitation = async (
  { start, count }: NetworkPaginationArgs = { start: 0, count: 3 },
) =>
  fetchDataApi(
    `/relationships/invitationViews?q=receivedInvitation&includeInsights=true&start=${start ?? 0}&count=${count ?? 3}`,
  );

export const sentInvitation = async (
  { start, count }: NetworkPaginationArgs = { start: 0, count: 3 },
) =>
  fetchDataApi(
    `/relationships/invitationViews?q=sentInvitation&includeInsights=true&start=${start ?? 0}&count=${count ?? 3}`,
  );

export const getMyConnections = async (
  { start, count }: NetworkPaginationArgs = { start: 0, count: 10 },
) =>
  fetchDataApi(
    `/relationships/connections?start=${start ?? 0}&count=${count ?? 10}`,
  );
