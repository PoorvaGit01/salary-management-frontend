import type { Employee, EmployeePayload } from "@/types/employee";

const BASE = "/api/v1/employees";

export class ApiError extends Error {
  readonly status: number;
  readonly body: { errors?: string[]; error?: string };

  constructor(status: number, body: { errors?: string[]; error?: string }) {
    super(ApiError.messageFrom(status, body));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  static messageFrom(
    status: number,
    body: { errors?: string[]; error?: string },
  ): string {
    if (body.errors?.length) return body.errors.join("\n");
    if (body.error) return body.error;
    return `Request failed (${status})`;
  }

  get messages(): string[] {
    if (this.body.errors?.length) return this.body.errors;
    if (this.body.error) return [this.body.error];
    return [this.message];
  }
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

export async function listEmployees(): Promise<Employee[]> {
  const res = await fetch(BASE, { cache: "no-store" });
  const body = (await parseJson(res)) as Employee[] | { errors?: string[] };
  if (!res.ok) {
    throw new ApiError(res.status, body as { errors?: string[]; error?: string });
  }
  return body as Employee[];
}

export async function createEmployee(
  payload: EmployeePayload,
): Promise<Employee> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee: payload }),
  });
  const body = (await parseJson(res)) as Employee | { errors?: string[] };
  if (!res.ok) {
    throw new ApiError(res.status, body as { errors?: string[]; error?: string });
  }
  return body as Employee;
}

export async function updateEmployee(
  id: number,
  payload: EmployeePayload,
): Promise<Employee> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee: payload }),
  });
  const body = (await parseJson(res)) as Employee | { errors?: string[] };
  if (!res.ok) {
    throw new ApiError(res.status, body as { errors?: string[]; error?: string });
  }
  return body as Employee;
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await parseJson(res)) as { errors?: string[]; error?: string };
    throw new ApiError(res.status, body);
  }
}
