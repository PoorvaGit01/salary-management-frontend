export type CountrySalaryRow = {
  country: string;
  currency: string;
  employee_count: number;
  salary_min: number;
  salary_max: number;
  salary_avg: number;
  salary_median: number;
};

export type PayrollByCurrency = {
  currency: string;
  payroll_total: number;
  employee_count: number;
};

export type GlobalSalaryInsight = {
  by_country: CountrySalaryRow[];
  summary: {
    total_employees: number;
    countries_represented: number;
  };
  extras: {
    total_payroll_by_currency: PayrollByCurrency[];
  };
};

export type JobTitleRow = {
  job_title: string;
  employee_count: number;
  salary_min: number;
  salary_max: number;
  salary_avg: number;
  salary_median: number;
};

export type EmploymentStatusRow = {
  employment_status: string;
  employee_count: number;
  salary_avg: number;
};

export type CountrySegment = {
  currency: string;
  employee_count: number;
  salary_min: number;
  salary_max: number;
  salary_avg: number;
  salary_median: number;
  by_job_title: JobTitleRow[];
  by_employment_status: EmploymentStatusRow[];
};

export type CountrySalaryInsight = {
  country: string;
  segments: CountrySegment[];
  total_employees: number;
  extras?: {
    distinct_job_titles: number;
  };
};

export type JobTitleSegment = {
  currency: string;
  employee_count: number;
  salary_min: number;
  salary_max: number;
  salary_avg: number;
  salary_median: number;
};

export type JobTitleInCountryInsight = {
  country: string;
  job_title: string;
  segments: JobTitleSegment[];
  total_employees: number;
};

export type SalaryInsightError = {
  error?: string;
  country?: string;
  job_title?: string;
  segments: unknown[];
  total_employees: number;
};
