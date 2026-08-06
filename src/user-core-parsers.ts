import { TEXT_KEYS, VECTOR_IMAGE_PATHS } from "./user-types";
import { getNestedValue } from "./utils";

export const extractText = (field: any): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  for (const k of TEXT_KEYS)
    if (typeof field?.[k] === "string") return field[k];
  for (const v of Object.values(field || {}))
    if (typeof v === "string" && v.trim()) return v;
  return "";
};

export const buildImageUrl = (
  container: any,
  preferredWidth?: number,
): string | null => {
  let vectorImage: any = null;
  for (const p of VECTOR_IMAGE_PATHS) {
    const v = getNestedValue(container, p);
    if (v) {
      vectorImage = v;
      break;
    }
  }
  if (!vectorImage) {
    const direct = container?.displayImageReference?.vectorImage;
    if (direct) vectorImage = direct;
  }
  const rootUrl = vectorImage?.rootUrl;
  const artifacts = vectorImage?.artifacts ?? [];
  if (!rootUrl || !artifacts.length) return null;
  let artifact = preferredWidth
    ? artifacts.find((a: any) => a?.width === preferredWidth)
    : null;
  if (!artifact) {
    artifact = artifacts
      .slice()
      .sort((a: any, b: any) => (b?.width ?? 0) - (a?.width ?? 0))[0];
  }
  return artifact ? `${rootUrl}${artifact.fileIdentifyingUrlPathSegment}` : null;
};

export const parseTimePeriod = (tp: any) => {
  if (!tp) return null;
  const s = tp.start ?? tp.startDate;
  const e = tp.end ?? tp.endDate;
  return {
    start: s
      ? { year: s.year ?? null, month: s.month ?? null, day: s.day ?? null }
      : null,
    end: e
      ? { year: e.year ?? null, month: e.month ?? null, day: e.day ?? null }
      : null,
  };
};

export const parseSimpleDate = (d: any) => {
  if (!d) return null;
  if (typeof d !== "object") return d;
  return {
    year: d.year ?? null,
    month: d.month ?? null,
    day: d.day ?? null,
  };
};
