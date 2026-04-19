"use client";

import {
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  ScrollArea,
  Select,
  Separator,
  Spinner,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { BarChartIcon, GlobeIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/employees";
import { fetchSalaryInsights } from "@/lib/api/salary-insights";
import type {
  CountrySalaryInsight,
  CountrySalaryRow,
  GlobalSalaryInsight,
  JobTitleInCountryInsight,
} from "@/types/salary-insights";
import {
  EmploymentMixChart,
  GlobalOverviewCharts,
  JobLookupComparisonChart,
  JobTitleSalariesChart,
  PayrollCurrencyMiniChart,
  SegmentSalaryProfileChart,
} from "@/components/insights/salary-insights-charts";

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

function employmentLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function SalaryInsightsDashboard() {
  const [globalData, setGlobalData] = useState<GlobalSalaryInsight | null>(
    null,
  );
  const [countryData, setCountryData] = useState<CountrySalaryInsight | null>(
    null,
  );
  const [jobData, setJobData] = useState<JobTitleInCountryInsight | null>(
    null,
  );
  const [selectedCountry, setSelectedCountry] = useState("");
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGlobal = useCallback(async () => {
    setLoadingGlobal(true);
    setError(null);
    try {
      const data = (await fetchSalaryInsights()) as GlobalSalaryInsight;
      setGlobalData(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadGlobal();
    });
  }, [loadGlobal]);

  const countryOptions = useMemo(() => {
    if (!globalData) return [];
    const codes = [
      ...new Set(globalData.by_country.map((r) => r.country)),
    ];
    return codes.sort((a, b) => a.localeCompare(b));
  }, [globalData]);

  useEffect(() => {
    if (!selectedCountry) {
      queueMicrotask(() => {
        setCountryData(null);
      });
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingCountry(true);
      setError(null);
      try {
        const data = (await fetchSalaryInsights({
          country: selectedCountry,
        })) as CountrySalaryInsight;
        if (!cancelled) {
          setCountryData(data);
          setJobData(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCountryData(null);
          if (e instanceof ApiError && e.status === 404) {
            setError(`No data for country ${selectedCountry}.`);
          } else {
            setError(e instanceof ApiError ? e.message : String(e));
          }
        }
      } finally {
        if (!cancelled) setLoadingCountry(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  const runJobLookup = async () => {
    if (!selectedCountry.trim()) {
      setError("Select a country first.");
      return;
    }
    const title = jobTitleInput.trim();
    if (!title) {
      setError("Enter a job title to analyze.");
      return;
    }
    setLoadingJob(true);
    setError(null);
    try {
      const data = (await fetchSalaryInsights({
        country: selectedCountry,
        job_title: title,
      })) as JobTitleInCountryInsight;
      setJobData(data);
    } catch (e) {
      setJobData(null);
      if (e instanceof ApiError && e.status === 404) {
        setError("No employees match that job title in this country.");
      } else {
        setError(e instanceof ApiError ? e.message : String(e));
      }
    } finally {
      setLoadingJob(false);
    }
  };

  return (
    <Flex direction="column" flexGrow="1" className="min-h-0">
      <Box
        style={{
          background:
            "linear-gradient(180deg, var(--green-2) 0%, var(--color-background) 40%)",
        }}
        pb="6"
        pt="8"
      >
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Flex align="center" gap="3">
            <Box
              p="3"
              style={{
                borderRadius: "var(--radius-4)",
                background: "var(--green-3)",
                color: "var(--green-11)",
              }}
            >
              <BarChartIcon width={28} height={28} aria-hidden />
            </Box>
            <Flex direction="column" gap="2" style={{ maxWidth: "40rem" }}>
              <Heading size="7" as="h1">
                Salary insights
              </Heading>
              <Text
                as="p"
                color="gray"
                size="3"
                style={{ lineHeight: 1.65 }}
              >
                Compare compensation by country, role, and employment status.
                Charts show patterns; tables show exact figures. Amounts use
                each segment&apos;s payroll currency.
              </Text>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container size="4" px={{ initial: "4", sm: "6" }} pb="8">
        {error ? (
          <Callout.Root color="red" mb="4" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        ) : null}

        {loadingGlobal ? (
          <Flex align="center" justify="center" py="9" gap="3">
            <Spinner size="3" />
            <Text color="gray">Loading insights…</Text>
          </Flex>
        ) : globalData ? (
          <Flex direction="column" gap="7">
            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
              <Card size="3" variant="classic">
                <Flex direction="column" gap="3" p="2">
                  <Text
                    as="div"
                    size="2"
                    color="gray"
                    weight="medium"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    Employees in scope
                  </Text>
                  <Text
                    as="div"
                    size="8"
                    weight="bold"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.15,
                    }}
                  >
                    {globalData.summary.total_employees.toLocaleString()}
                  </Text>
                </Flex>
              </Card>
              <Card size="3" variant="classic">
                <Flex direction="column" gap="3" p="2">
                  <Text
                    as="div"
                    size="2"
                    color="gray"
                    weight="medium"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    Countries / regions
                  </Text>
                  <Text
                    as="div"
                    size="8"
                    weight="bold"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.15,
                    }}
                  >
                    {globalData.summary.countries_represented.toLocaleString()}
                  </Text>
                </Flex>
              </Card>
            </Grid>

            <Card size="3" variant="classic">
              <Flex
                direction="column"
                gap="3"
                p="2"
                pl="4"
                style={{
                  borderLeft: "3px solid var(--green-9)",
                }}
              >
                <Text
                  as="div"
                  size="3"
                  weight="medium"
                  style={{ letterSpacing: "0.01em" }}
                >
                  Payroll roll-up (by currency)
                </Text>
                <Text
                  as="p"
                  size="3"
                  color="gray"
                  style={{
                    lineHeight: 1.7,
                    maxWidth: "52rem",
                    margin: 0,
                  }}
                >
                  Sum of salaries per currency. Use these totals for budgeting
                  within a single currency — they are not meant for ranking
                  markets across different currencies.
                </Text>
              </Flex>
            </Card>

            <GlobalOverviewCharts data={globalData} />

            <Card size="3" variant="classic">
              <Flex direction="column" gap="3" mb="4" px="1" pt="1">
                <Heading size="4" as="h2" style={{ margin: 0 }}>
                  Payroll totals by currency
                </Heading>
                <Text
                  as="p"
                  size="3"
                  color="gray"
                  style={{ lineHeight: 1.65, margin: 0, maxWidth: "48rem" }}
                >
                  Chart shows employee count per currency (top 10). Use the table
                  below for full payroll sums.
                </Text>
              </Flex>
              <PayrollCurrencyMiniChart data={globalData} />
              <Separator size="4" my="4" />
              <ScrollArea scrollbars="horizontal" type="hover">
                <Table.Root size="2" variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Currency</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Employees</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Payroll sum</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {globalData.extras.total_payroll_by_currency.map((row) => (
                      <Table.Row key={row.currency}>
                        <Table.Cell>
                          <Text weight="medium">{row.currency}</Text>
                        </Table.Cell>
                        <Table.Cell>{row.employee_count.toLocaleString()}</Table.Cell>
                        <Table.Cell>
                          {fmtMoney(row.currency, row.payroll_total)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            </Card>

            <Card size="3" variant="classic">
              <Flex direction="column" gap="4" mb="4" px="1" pt="1">
                <Flex align="center" gap="3">
                  <GlobeIcon width={22} height={22} aria-hidden />
                  <Heading size="4" as="h2" style={{ margin: 0 }}>
                    By country (min / max / avg / median)
                  </Heading>
                </Flex>
              </Flex>
              <ScrollArea scrollbars="horizontal" type="hover">
                <Table.Root size="2" variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Country</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>CCY</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Headcount</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Min</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Max</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Avg</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Median</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {globalData.by_country.map((row: CountrySalaryRow) => (
                      <Table.Row key={`${row.country}-${row.currency}`}>
                        <Table.RowHeaderCell>
                          <Text weight="medium">{row.country}</Text>
                        </Table.RowHeaderCell>
                        <Table.Cell>{row.currency}</Table.Cell>
                        <Table.Cell>
                          {row.employee_count.toLocaleString()}
                        </Table.Cell>
                        <Table.Cell>
                          {fmtMoney(row.currency, row.salary_min)}
                        </Table.Cell>
                        <Table.Cell>
                          {fmtMoney(row.currency, row.salary_max)}
                        </Table.Cell>
                        <Table.Cell>
                          {fmtMoney(row.currency, row.salary_avg)}
                        </Table.Cell>
                        <Table.Cell>
                          {fmtMoney(row.currency, row.salary_median)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            </Card>

            <Card size="3" variant="classic">
              <Flex direction="column" gap="3" mb="5" px="1" pt="1">
                <Heading size="4" as="h2" style={{ margin: 0 }}>
                  Drill down by country
                </Heading>
                <Text
                  as="p"
                  color="gray"
                  size="3"
                  style={{ lineHeight: 1.65, margin: 0, maxWidth: "44rem" }}
                >
                  Pick a country to see salary bands by currency, average pay
                  by job title, and mix by employment status.
                </Text>
              </Flex>
              <Flex gap="4" align="center" wrap="wrap" mb="5" px="1">
                <Text size="3" weight="medium" as="span">
                  Country
                </Text>
                <Select.Root
                  size="3"
                  value={selectedCountry || undefined}
                  onValueChange={setSelectedCountry}
                >
                  <Select.Trigger
                    placeholder="Select country"
                    style={{ minWidth: "12rem" }}
                  />
                  <Select.Content position="popper">
                    {countryOptions.map((c) => (
                      <Select.Item key={c} value={c}>
                        {c}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>

              {loadingCountry ? (
                <Flex align="center" gap="2" py="4">
                  <Spinner />
                  <Text color="gray" size="2">
                    Loading country…
                  </Text>
                </Flex>
              ) : countryData && countryData.segments.length > 0 ? (
                <Flex direction="column" gap="5">
                  {countryData.extras?.distinct_job_titles != null ? (
                    <Text size="2" color="gray">
                      {countryData.extras.distinct_job_titles} distinct job
                      titles in {countryData.country}
                    </Text>
                  ) : null}
                  {countryData.segments.map((seg, index) => (
                    <Box key={seg.currency}>
                      {index > 0 ? <Separator size="4" mb="4" /> : null}
                      <Heading size="3" mb="3">
                        {countryData.country} · {seg.currency}
                      </Heading>
                      <Grid columns={{ initial: "1", sm: "2", md: "5" }} gap="3" mb="4">
                        <Card size="1">
                          <Text size="1" color="gray">
                            Headcount
                          </Text>
                          <Text size="4" weight="bold">
                            {seg.employee_count.toLocaleString()}
                          </Text>
                        </Card>
                        <Card size="1">
                          <Text size="1" color="gray">
                            Minimum
                          </Text>
                          <Text size="4" weight="bold">
                            {fmtMoney(seg.currency, seg.salary_min)}
                          </Text>
                        </Card>
                        <Card size="1">
                          <Text size="1" color="gray">
                            Maximum
                          </Text>
                          <Text size="4" weight="bold">
                            {fmtMoney(seg.currency, seg.salary_max)}
                          </Text>
                        </Card>
                        <Card size="1">
                          <Text size="1" color="gray">
                            Average
                          </Text>
                          <Text size="4" weight="bold">
                            {fmtMoney(seg.currency, seg.salary_avg)}
                          </Text>
                        </Card>
                        <Card size="1">
                          <Text size="1" color="gray">
                            Median
                          </Text>
                          <Text size="4" weight="bold">
                            {fmtMoney(seg.currency, seg.salary_median)}
                          </Text>
                        </Card>
                      </Grid>
                      <Text size="2" weight="medium" mb="2">
                        Spread (max − min)
                      </Text>
                      <Text size="3" mb="4">
                        {fmtMoney(
                          seg.currency,
                          seg.salary_max - seg.salary_min,
                        )}
                      </Text>

                      <Grid
                        columns={{ initial: "1", md: "2" }}
                        gap="4"
                        mb="4"
                      >
                        <SegmentSalaryProfileChart segment={seg} />
                        <EmploymentMixChart segment={seg} />
                      </Grid>

                      <Heading size="3" mb="2">
                        Average salary by job title
                      </Heading>
                      <JobTitleSalariesChart segment={seg} />
                      <ScrollArea scrollbars="horizontal" type="hover" mb="4">
                        <Table.Root size="2" variant="surface">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeaderCell>
                                Job title
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>
                                Count
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>
                                Min
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>
                                Max
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>
                                Avg
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>
                                Median
                              </Table.ColumnHeaderCell>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {seg.by_job_title.map((jt) => (
                              <Table.Row key={jt.job_title}>
                                <Table.Cell>
                                  <Text weight="medium">{jt.job_title}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                  {jt.employee_count.toLocaleString()}
                                </Table.Cell>
                                <Table.Cell>
                                  {fmtMoney(seg.currency, jt.salary_min)}
                                </Table.Cell>
                                <Table.Cell>
                                  {fmtMoney(seg.currency, jt.salary_max)}
                                </Table.Cell>
                                <Table.Cell>
                                  {fmtMoney(seg.currency, jt.salary_avg)}
                                </Table.Cell>
                                <Table.Cell>
                                  {fmtMoney(seg.currency, jt.salary_median)}
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </ScrollArea>

                      <Heading size="3" mb="2">
                        Headcount & avg pay by employment status
                      </Heading>
                      <Flex gap="3" wrap="wrap">
                        {seg.by_employment_status.map((st) => (
                          <Card key={st.employment_status} size="2">
                            <Text size="2" weight="medium">
                              {employmentLabel(st.employment_status)}
                            </Text>
                            <Text size="2" color="gray" mt="1">
                              {st.employee_count.toLocaleString()} people
                            </Text>
                            <Text size="3" weight="bold" mt="2">
                              Avg {fmtMoney(seg.currency, st.salary_avg)}
                            </Text>
                          </Card>
                        ))}
                      </Flex>
                    </Box>
                  ))}
                </Flex>
              ) : selectedCountry ? (
                <Text color="gray" size="2">
                  No segment data.
                </Text>
              ) : null}
            </Card>

            <Card size="3" variant="classic">
              <Flex direction="column" gap="3" mb="5" px="1" pt="1">
                <Heading size="4" as="h2" style={{ margin: 0 }}>
                  Job title in a country
                </Heading>
                <Text
                  as="p"
                  color="gray"
                  size="3"
                  style={{ lineHeight: 1.65, margin: 0, maxWidth: "44rem" }}
                >
                  Matches job titles containing your text (case-insensitive).
                  Use the same country as above or select one first.
                </Text>
              </Flex>
              <Flex gap="4" wrap="wrap" align="end" mb="4" px="1">
                <Flex direction="column" gap="1" style={{ flex: "1 1 12rem" }}>
                  <Text size="2" weight="medium" as="label" htmlFor="job-q">
                    Job title contains
                  </Text>
                  <TextField.Root
                    id="job-q"
                    size="3"
                    placeholder="e.g. Engineer"
                    value={jobTitleInput}
                    onChange={(e) => setJobTitleInput(e.target.value)}
                  />
                </Flex>
                <Button
                  size="3"
                  onClick={() => void runJobLookup()}
                  disabled={loadingJob || !selectedCountry}
                  highContrast
                >
                  {loadingJob ? "Analyzing…" : "Analyze"}
                </Button>
              </Flex>

              {jobData && jobData.segments.length > 0 ? (
                <Box>
                  <Text weight="medium" mb="3">
                    {jobData.country} — “{jobData.job_title}” ·{" "}
                    {jobData.total_employees.toLocaleString()} match(es)
                  </Text>
                  <JobLookupComparisonChart data={jobData} />
                  <Grid
                    columns={{ initial: "1", sm: "2", md: "3" }}
                    gap="3"
                  >
                    {jobData.segments.map((s) => (
                      <Card key={s.currency} size="2">
                        <Text size="2" color="gray">
                          {s.currency} · {s.employee_count} people
                        </Text>
                        <Separator size="4" my="2" />
                        <Text size="2">
                          Avg {fmtMoney(s.currency, s.salary_avg)}
                        </Text>
                        <Text size="2">
                          Range {fmtMoney(s.currency, s.salary_min)} –{" "}
                          {fmtMoney(s.currency, s.salary_max)}
                        </Text>
                        <Text size="2" mt="1">
                          Median {fmtMoney(s.currency, s.salary_median)}
                        </Text>
                      </Card>
                    ))}
                  </Grid>
                </Box>
              ) : null}
            </Card>
          </Flex>
        ) : null}
      </Container>
    </Flex>
  );
}
