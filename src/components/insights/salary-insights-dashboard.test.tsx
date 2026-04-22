import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import { SalaryInsightsDashboard } from "./salary-insights-dashboard";
import { fetchSalaryInsights } from "@/lib/api/salary-insights";

vi.mock("@/components/insights/salary-insights-charts", () => ({
  EmploymentMixChart: () => <div>EmploymentMixChart</div>,
  GlobalOverviewCharts: () => <div>GlobalOverviewCharts</div>,
  JobLookupComparisonChart: () => <div>JobLookupComparisonChart</div>,
  JobTitleSalariesChart: () => <div>JobTitleSalariesChart</div>,
  PayrollCurrencyMiniChart: () => <div>PayrollCurrencyMiniChart</div>,
  SegmentSalaryProfileChart: () => <div>SegmentSalaryProfileChart</div>,
}));

vi.mock("@/lib/api/salary-insights", () => ({
  fetchSalaryInsights: vi.fn(),
}));

const mockedFetchSalaryInsights = vi.mocked(fetchSalaryInsights);

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("SalaryInsightsDashboard filters", () => {
  beforeEach(() => {
    mockedFetchSalaryInsights.mockReset();
  });

  it("loads global insights and applies country + job filters", async () => {
    const user = userEvent.setup();
    mockedFetchSalaryInsights
      .mockResolvedValueOnce({
        summary: { total_employees: 20, countries_represented: 2 },
        by_country: [
          {
            country: "US",
            currency: "USD",
            employee_count: 10,
            salary_min: 100,
            salary_max: 200,
            salary_avg: 150,
            salary_median: 150,
          },
        ],
        extras: {
          total_payroll_by_currency: [
            { currency: "USD", payroll_total: 1000, employee_count: 10 },
          ],
        },
      })
      .mockResolvedValueOnce({
        country: "US",
        total_employees: 10,
        extras: { distinct_job_titles: 1 },
        segments: [
          {
            currency: "USD",
            employee_count: 10,
            salary_min: 100,
            salary_max: 200,
            salary_avg: 150,
            salary_median: 150,
            by_job_title: [
              {
                job_title: "Engineer",
                employee_count: 10,
                salary_min: 100,
                salary_max: 200,
                salary_avg: 150,
                salary_median: 150,
              },
            ],
            by_employment_status: [
              {
                employment_status: "active",
                employee_count: 10,
                salary_avg: 150,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        country: "US",
        job_title: "Engineer",
        total_employees: 10,
        segments: [
          {
            currency: "USD",
            employee_count: 10,
            salary_min: 100,
            salary_max: 200,
            salary_avg: 150,
            salary_median: 150,
          },
        ],
      });

    renderWithTheme(<SalaryInsightsDashboard />);

    await screen.findByRole("heading", { name: "Salary insights" });
    expect(mockedFetchSalaryInsights).toHaveBeenCalledWith();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "US" }));

    await waitFor(() => {
      expect(mockedFetchSalaryInsights).toHaveBeenCalledWith({ country: "US" });
    });

    await user.type(screen.getByLabelText("Job title contains"), "  Engineer  ");
    await user.click(screen.getByRole("button", { name: "Analyze" }));

    await waitFor(() => {
      expect(mockedFetchSalaryInsights).toHaveBeenCalledWith({
        country: "US",
        job_title: "Engineer",
      });
    });
  });
});
