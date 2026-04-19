import type {
  CountrySalaryInsight,
  GlobalSalaryInsight,
  JobTitleInCountryInsight,
} from "@/types/salary-insights";
import { ApiError } from "@/lib/api/employees";

const BASE = "/api/v1/salary_insights";

export type SalaryInsightsParams = {
  country?: string;
  /** Only include when non-empty; omit entirely for country-wide insights without job filter */
  job_title?: string;
};

function buildUrl(params?: SalaryInsightsParams): string {
  const sp = new URLSearchParams();
  if (params?.country) sp.set("country", params.country);
  if (params?.job_title?.trim()) sp.set("job_title", params.job_title.trim());
  const q = sp.toString();
  return q ? `${BASE}?${q}` : BASE;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export async function fetchSalaryInsights(
  params?: SalaryInsightsParams,
): Promise<
  GlobalSalaryInsight | CountrySalaryInsight | JobTitleInCountryInsight
> {
  const res = await fetch(buildUrl(params), { cache: "no-store" });
  const body = (await parseJson(res)) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(res.status, {
      error: typeof body.error === "string" ? body.error : undefined,
    });
  }
  return body as GlobalSalaryInsight | CountrySalaryInsight | JobTitleInCountryInsight;
}
