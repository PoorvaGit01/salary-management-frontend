import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import { EmployeeTable } from "./employee-table";
import type { Employee, EmployeeListMeta } from "@/types/employee";

function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    first_name: "Ada",
    last_name: "Lovelace",
    full_name: "Ada Lovelace",
    job_title: "Engineer",
    country: "US",
    salary: 120000,
    currency: "USD",
    email: "ada@example.com",
    department: "Engineering",
    hired_on: "2024-01-01",
    employment_status: "active",
    employee_number: "ENG-001",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const meta: EmployeeListMeta = {
  page: 1,
  per_page: 25,
  total_count: 1,
  total_pages: 1,
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("EmployeeTable", () => {
  it("renders rows and core employee fields", () => {
    renderWithTheme(
      <EmployeeTable
        employees={[buildEmployee()]}
        meta={meta}
        loading={false}
        searchInput=""
        debouncedSearch=""
        perPage={25}
        onSearchChange={vi.fn()}
        onPerPageChange={vi.fn()}
        onRefetch={vi.fn()}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("Directory")).toBeInTheDocument();
    expect(screen.getByText("1 total")).toBeInTheDocument();
  });

  it("invokes edit and delete callbacks from action buttons", async () => {
    const user = userEvent.setup();
    const employee = buildEmployee();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithTheme(
      <EmployeeTable
        employees={[employee]}
        meta={meta}
        loading={false}
        searchInput=""
        debouncedSearch=""
        perPage={25}
        onSearchChange={vi.fn()}
        onPerPageChange={vi.fn()}
        onRefetch={vi.fn()}
        onCreate={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onPageChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Ada Lovelace" }));
    await user.click(screen.getByRole("button", { name: "Delete Ada Lovelace" }));

    expect(onEdit).toHaveBeenCalledWith(employee);
    expect(onDelete).toHaveBeenCalledWith(employee);
  });

  it("invokes add employee action from empty state", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    renderWithTheme(
      <EmployeeTable
        employees={[]}
        meta={{ ...meta, total_count: 0, total_pages: 0 }}
        loading={false}
        searchInput=""
        debouncedSearch=""
        perPage={25}
        onSearchChange={vi.fn()}
        onPerPageChange={vi.fn()}
        onRefetch={vi.fn()}
        onCreate={onCreate}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add employee/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
