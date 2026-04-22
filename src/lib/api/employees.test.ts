import {
  ApiError,
  createEmployee,
  deleteEmployee,
  listEmployees,
} from "./employees";
import type { EmployeePayload } from "@/types/employee";

describe("employees api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("surfaces backend validation errors from list endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: ["Invalid page"] }), {
        status: 422,
      }),
    );

    await expect(listEmployees({ page: 0 })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "Invalid page",
    });
  });

  it("returns fallback message when error body is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));

    await expect(deleteEmployee(1)).rejects.toThrow("Request failed (500)");
  });

  it("wraps failed create responses in ApiError.messages", async () => {
    const payload: EmployeePayload = {
      first_name: "Ada",
      last_name: "Lovelace",
      job_title: "Engineer",
      country: "US",
      salary: 100,
      currency: "USD",
      email: null,
      department: null,
      hired_on: null,
      employment_status: "active",
      employee_number: null,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: ["Salary must be positive"] }), {
        status: 422,
      }),
    );

    try {
      await createEmployee(payload);
      throw new Error("expected createEmployee to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.messages).toEqual(["Salary must be positive"]);
      expect(apiError.message).toContain("Salary must be positive");
    }
  });
});
