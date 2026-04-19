"use client";

import { Box, Card, Flex, Grid, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CountrySegment,
  CountrySalaryRow,
  GlobalSalaryInsight,
  JobTitleInCountryInsight,
} from "@/types/salary-insights";

const GREEN = "#30A46C";
const GREEN_LIGHT = "#92CEAC";
const GREEN_MID = "#3CB179";
const AXIS = "#8B9199";
const GRID = "rgba(0,0,0,0.08)";

function fmtMoney(currency: string, value: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}

function compactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function aggregateHeadcountByCountry(rows: CountrySalaryRow[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.country, (m.get(r.country) ?? 0) + r.employee_count);
  }
  return [ ...m.entries() ]
    .map(([country, headcount]) => ({ country, headcount }))
    .sort((a, b) => b.headcount - a.headcount);
}


function GlobalOverviewCharts({ data }: { data: GlobalSalaryInsight }) {
  const headcountBars = useMemo(() => {
    return aggregateHeadcountByCountry(data.by_country).map((d) => ({
      name: d.country,
      employees: d.headcount,
    }));
  }, [data.by_country]);

  const payrollBars = useMemo(() => {
    return [ ...data.extras.total_payroll_by_currency ]
      .sort((a, b) => b.payroll_total - a.payroll_total)
      .map((r) => ({
        name: r.currency,
        payroll: r.payroll_total,
        employees: r.employee_count,
      }));
  }, [data.extras.total_payroll_by_currency]);

  const avgTop = useMemo(() => {
    return [ ...data.by_country ]
      .sort((a, b) => b.salary_avg - a.salary_avg)
      .slice(0, 14)
      .map((r) => ({
        label: `${r.country} (${r.currency})`,
        avg: r.salary_avg,
        currency: r.currency,
      }));
  }, [data.by_country]);

  return (
    <Grid columns={{ initial: "1", lg: "2" }} gap="4">
      <Card size="3" variant="classic">
        <Flex direction="column" gap="2" mb="3" px="1" pt="1">
          <Text as="div" size="3" weight="medium">
            Employees by country
          </Text>
          <Text as="div" size="2" color="gray" style={{ lineHeight: 1.6 }}>
            Total headcount aggregated across currencies per country.
          </Text>
        </Flex>
        <Box style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={headcountBars}
              margin={{ top: 8, right: 16, left: 0, bottom: 48 }}
            >
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: AXIS, fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={56}
                interval={0}
              />
              <YAxis
                tick={{ fill: AXIS, fontSize: 11 }}
                tickFormatter={(v) => compactNumber(Number(v))}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                }}
                formatter={(value) => [
                  Number(value ?? 0).toLocaleString(),
                  "Employees",
                ]}
              />
              <Bar dataKey="employees" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      <Card size="3" variant="classic">
        <Flex direction="column" gap="2" mb="3" px="1" pt="1">
          <Text as="div" size="3" weight="medium">
            Highest average salaries (top markets)
          </Text>
          <Text as="div" size="2" color="gray" style={{ lineHeight: 1.6 }}>
            Country × currency segments, ranked by mean salary.
          </Text>
        </Flex>
        <Box style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={avgTop}
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal />
              <XAxis
                type="number"
                tick={{ fill: AXIS, fontSize: 11 }}
                tickFormatter={(v) => compactNumber(Number(v))}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={118}
                tick={{ fill: AXIS, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  maxWidth: 320,
                }}
                formatter={(value, _n, item) => {
                  const cur =
                    (item?.payload as { currency?: string })?.currency ?? "USD";
                  return [fmtMoney(cur, Number(value ?? 0)), "Average"];
                }}
              />
              <Bar
                dataKey="avg"
                fill={GREEN_MID}
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      <Card size="3" variant="classic" style={{ gridColumn: "1 / -1" }}>
        <Flex direction="column" gap="2" mb="3" px="1" pt="1">
          <Text as="div" size="3" weight="medium">
            Payroll volume by currency
          </Text>
          <Text as="div" size="2" color="gray" style={{ lineHeight: 1.6 }}>
            Sum of salaries — hover for full amount. Axis uses compact
            notation.
          </Text>
        </Flex>
        <Box style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={payrollBars}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 12 }} />
              <YAxis
                tick={{ fill: AXIS, fontSize: 11 }}
                tickFormatter={(v) => compactNumber(Number(v))}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                }}
                formatter={(value, _name, item) => {
                  const row = item?.payload as {
                    name?: string;
                    payroll?: number;
                    employees?: number;
                  };
                  const cur = row?.name ?? "USD";
                  return [
                    `${fmtMoney(cur, Number(value ?? 0))} · ${row?.employees?.toLocaleString() ?? "—"} people`,
                    "Payroll",
                  ];
                }}
              />
              <Bar dataKey="payroll" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Grid>
  );
}

function PayrollCurrencyMiniChart({ data }: { data: GlobalSalaryInsight }) {
  const rows = useMemo(
    () =>
      [ ...data.extras.total_payroll_by_currency ]
        .sort((a, b) => b.employee_count - a.employee_count)
        .slice(0, 10)
        .map((r) => ({
          name: r.currency,
          people: r.employee_count,
        })),
    [data.extras.total_payroll_by_currency],
  );

  return (
    <Box style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--gray-a6)" }}
            formatter={(v) => [Number(v ?? 0).toLocaleString(), "Employees"]}
          />
          <Bar dataKey="people" fill={GREEN_LIGHT} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

function SegmentSalaryProfileChart({ segment }: { segment: CountrySegment }) {
  const chartData = [
    { key: "Min", value: segment.salary_min },
    { key: "Median", value: segment.salary_median },
    { key: "Avg", value: segment.salary_avg },
    { key: "Max", value: segment.salary_max },
  ];

  return (
    <Box mb="4">
      <Text
        as="div"
        size="3"
        weight="medium"
        mb="3"
        style={{ lineHeight: 1.4 }}
      >
        Salary profile (same currency)
      </Text>
      <Box style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="key" tick={{ fill: AXIS, fontSize: 12 }} />
            <YAxis
              tick={{ fill: AXIS, fontSize: 11 }}
              tickFormatter={(v) => compactNumber(Number(v))}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--gray-a6)" }}
              formatter={(v) => [
                fmtMoney(segment.currency, Number(v ?? 0)),
                "Salary",
              ]}
            />
            <Bar dataKey="value" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

function JobTitleSalariesChart({ segment }: { segment: CountrySegment }) {
  const rows = useMemo(() => {
    return [ ...segment.by_job_title ]
      .sort((a, b) => b.salary_avg - a.salary_avg)
      .slice(0, 14)
      .map((j) => ({
        short:
          j.job_title.length > 36
            ? `${j.job_title.slice(0, 34)}…`
            : j.job_title,
        full: j.job_title,
        avg: j.salary_avg,
      }));
  }, [segment.by_job_title]);

  if (rows.length === 0) return null;

  return (
    <Box mb="4">
      <Text
        as="div"
        size="3"
        weight="medium"
        mb="3"
        style={{ lineHeight: 1.4 }}
      >
        Average pay by role (chart)
      </Text>
      <Box style={{ width: "100%", height: Math.min(420, 80 + rows.length * 28) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={rows}
            margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
          >
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal />
            <XAxis
              type="number"
              tick={{ fill: AXIS, fontSize: 11 }}
              tickFormatter={(v) => compactNumber(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="short"
              width={132}
              tick={{ fill: AXIS, fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--gray-a6)" }}
              formatter={(v, _n, item) => [
                fmtMoney(segment.currency, Number(v ?? 0)),
                (item?.payload as { full?: string })?.full ?? "Role",
              ]}
            />
            <Bar dataKey="avg" fill={GREEN_MID} radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

const PIE_COLORS = [ GREEN, GREEN_MID, GREEN_LIGHT, "#C4E8D4", "#E6F6EB", "#AB9C86" ];

function EmploymentMixChart({ segment }: { segment: CountrySegment }) {
  const pieData = segment.by_employment_status.map((s) => ({
    name: s.employment_status.replace(/_/g, " "),
    value: s.employee_count,
    key: s.employment_status,
  }));

  if (pieData.length === 0) return null;

  return (
    <Box mb="4">
      <Text
        as="div"
        size="3"
        weight="medium"
        mb="3"
        style={{ lineHeight: 1.4 }}
      >
        Headcount by employment status
      </Text>
      <Box style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {pieData.map((_, i) => (
                <Cell key={pieData[i].key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--gray-a6)" }}
              formatter={(v) => [Number(v ?? 0).toLocaleString(), "People"]}
            />
            <Legend
              verticalAlign="bottom"
              height={28}
              formatter={(value) => (
                <span style={{ color: AXIS, fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

function JobLookupComparisonChart({ data }: { data: JobTitleInCountryInsight }) {
  const rows = data.segments.map((s) => ({
    currency: s.currency,
    avg: s.salary_avg,
    median: s.salary_median,
    min: s.salary_min,
    max: s.salary_max,
  }));

  return (
    <Box mt="3">
      <Text
        as="div"
        size="3"
        weight="medium"
        mb="3"
        style={{ lineHeight: 1.4 }}
      >
        Compare currencies for this search
      </Text>
      <Box style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="currency" tick={{ fill: AXIS, fontSize: 12 }} />
            <YAxis
              tick={{ fill: AXIS, fontSize: 11 }}
              tickFormatter={(v) => compactNumber(Number(v))}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--gray-a6)" }}
              formatter={(value, name, item) => {
                const cur =
                  (item?.payload as { currency?: string })?.currency ?? "USD";
                return [fmtMoney(cur, Number(value ?? 0)), String(name)];
              }}
            />
            <Legend />
            <Bar dataKey="avg" fill={GREEN} name="Average" radius={[4, 4, 0, 0]} />
            <Bar dataKey="median" fill={GREEN_LIGHT} name="Median" radius={[4, 4, 0, 0]} />
            <Bar dataKey="min" fill="#C4E8D4" name="Min" radius={[4, 4, 0, 0]} />
            <Bar dataKey="max" fill="#18794E" name="Max" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export {
  EmploymentMixChart,
  GlobalOverviewCharts,
  JobLookupComparisonChart,
  JobTitleSalariesChart,
  PayrollCurrencyMiniChart,
  SegmentSalaryProfileChart,
};
