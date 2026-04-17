export type EmploymentStatus = "active" | "on_leave" | "terminated";

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  country: string;
  salary: string | number;
  currency: string;
  email: string | null;
  department: string | null;
  hired_on: string | null;
  employment_status: EmploymentStatus;
  employee_number: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeListMeta = {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
};

export type EmployeeListResponse = {
  employees: Employee[];
  meta: EmployeeListMeta;
};

export type EmployeePayload = {
  first_name: string;
  last_name: string;
  job_title: string;
  country: string;
  salary: number;
  currency: string;
  email: string | null;
  department: string | null;
  hired_on: string | null;
  employment_status: EmploymentStatus;
  employee_number: string | null;
};
