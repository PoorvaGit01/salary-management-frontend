"use client";

import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Container,
  Dialog,
  Flex,
  Grid,
  Heading,
  IconButton,
  ScrollArea,
  Select,
  Separator,
  Spinner,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PersonIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ApiError,
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "@/lib/api/employees";
import type {
  Employee,
  EmployeeListMeta,
  EmployeePayload,
  EmploymentStatus,
} from "@/types/employee";

const STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Terminated" },
];

function statusBadgeColor(
  s: EmploymentStatus,
): "green" | "amber" | "red" | "gray" {
  switch (s) {
    case "active":
      return "green";
    case "on_leave":
      return "amber";
    case "terminated":
      return "red";
    default:
      return "gray";
  }
}

function statusLabel(s: EmploymentStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

function formatSalary(salary: string | number, currency: string): string {
  const n =
    typeof salary === "number" ? salary : Number.parseFloat(String(salary));
  if (Number.isNaN(n)) return String(salary);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(d);
}

type FormState = {
  first_name: string;
  last_name: string;
  job_title: string;
  country: string;
  currency: string;
  salary: string;
  email: string;
  department: string;
  hired_on: string;
  employment_status: EmploymentStatus;
  employee_number: string;
};

function emptyForm(): FormState {
  return {
    first_name: "",
    last_name: "",
    job_title: "",
    country: "US",
    currency: "USD",
    salary: "",
    email: "",
    department: "",
    hired_on: "",
    employment_status: "active",
    employee_number: "",
  };
}

function employeeToForm(e: Employee): FormState {
  return {
    first_name: e.first_name,
    last_name: e.last_name,
    job_title: e.job_title,
    country: e.country,
    currency: e.currency,
    salary: String(e.salary),
    email: e.email ?? "",
    department: e.department ?? "",
    hired_on: e.hired_on ? e.hired_on.slice(0, 10) : "",
    employment_status: e.employment_status,
    employee_number: e.employee_number ?? "",
  };
}

function validateForm(f: FormState): string[] {
  const errs: string[] = [];
  if (!f.first_name.trim()) errs.push("First name is required.");
  if (!f.last_name.trim()) errs.push("Last name is required.");
  if (!f.job_title.trim()) errs.push("Job title is required.");
  const cc = f.country.trim().toUpperCase();
  if (cc.length !== 2) errs.push("Country must be a 2-letter ISO code.");
  const cur = f.currency.trim().toUpperCase();
  if (cur.length !== 3) errs.push("Currency must be a 3-letter ISO code.");
  const sal = Number.parseFloat(f.salary);
  if (!Number.isFinite(sal) || sal <= 0) {
    errs.push("Salary must be a positive number.");
  }
  if (f.email.trim()) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
    if (!ok) errs.push("Email format is invalid.");
  }
  return errs;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function formToPayload(f: FormState): EmployeePayload {
  const sal = Number.parseFloat(f.salary);
  return {
    first_name: f.first_name.trim(),
    last_name: f.last_name.trim(),
    job_title: f.job_title.trim(),
    country: f.country.trim().toUpperCase(),
    currency: f.currency.trim().toUpperCase(),
    salary: sal,
    email: f.email.trim() ? f.email.trim() : null,
    department: f.department.trim() ? f.department.trim() : null,
    hired_on: f.hired_on ? f.hired_on : null,
    employment_status: f.employment_status,
    employee_number: f.employee_number.trim()
      ? f.employee_number.trim().toUpperCase()
      : null,
  };
}

export function EmployeesManager() {
  const formId = useId();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<EmployeeListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [refetchNonce, setRefetchNonce] = useState(0);
  const prevSearchRef = useRef<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const searchChanged =
      prevSearchRef.current !== null &&
      prevSearchRef.current !== debouncedSearch;
    if (prevSearchRef.current === null) {
      prevSearchRef.current = debouncedSearch;
    } else if (searchChanged) {
      prevSearchRef.current = debouncedSearch;
      if (page !== 1) {
        queueMicrotask(() => {
          setPage(1);
        });
        return () => ac.abort();
      }
    }

    void (async () => {
      setLoading(true);
      setListError(null);
      try {
        const data = await listEmployees(
          {
            page,
            per_page: perPage,
            q: debouncedSearch.trim() || undefined,
          },
          { signal: ac.signal },
        );
        setEmployees(data.employees);
        setMeta(data.meta);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setListError(e instanceof ApiError ? e.messages.join(" ") : String(e));
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [page, perPage, debouncedSearch, refetchNonce]);

  const refetch = useCallback(() => {
    setRefetchNonce((n) => n + 1);
  }, []);

  const openCreate = () => {
    setDialogMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setDialogMode("edit");
    setEditingId(e.id);
    setForm(employeeToForm(e));
    setFormError(null);
    setDialogOpen(true);
  };

  const submitForm = async () => {
    const v = validateForm(form);
    if (v.length) {
      setFormError(v[0] ?? "Invalid form.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (dialogMode === "create") {
        await createEmployee(payload);
      } else if (editingId != null) {
        await updateEmployee(editingId, payload);
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.messages.join(" ") : String(err),
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setListError(
        err instanceof ApiError ? err.messages.join(" ") : String(err),
      );
    } finally {
      setDeleting(false);
    }
  };

  const headerSubtitle = useMemo(
    () => "Add, view, update, and delete employees. API is proxied from Next.js to your Rails app.",
    [],
  );

  return (
    <Flex direction="column" flexGrow="1" className="min-h-0">
      <Box
        style={{
          background:
            "linear-gradient(180deg, var(--green-2) 0%, var(--color-background) 42%)",
        }}
        pb="6"
        pt="8"
      >
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Flex align="start" justify="between" gap="4" wrap="wrap">
            <Flex align="center" gap="3">
              <Box
                p="3"
                style={{
                  borderRadius: "var(--radius-4)",
                  background: "var(--green-3)",
                  color: "var(--green-11)",
                }}
              >
                <PersonIcon width={28} height={28} aria-hidden />
              </Box>
              <div>
                <Heading size="7" as="h1">
                  Managing employees
                </Heading>
                <Text color="gray" size="3" mt="1">
                  {headerSubtitle}
                </Text>
              </div>
            </Flex>
            <Button size="3" onClick={openCreate} highContrast>
              <Flex align="center" gap="2">
                <PlusIcon width={18} height={18} />
                Add employee
              </Flex>
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container size="4" px={{ initial: "4", sm: "6" }} pb="8" flexGrow="1">
        {listError ? (
          <Callout.Root color="red" mb="4" role="alert">
            <Callout.Text>{listError}</Callout.Text>
          </Callout.Root>
        ) : null}

        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="start" justify="between" gap="4" wrap="wrap">
              <div>
                <Text weight="medium" size="4">
                  Directory
                </Text>
                <Text color="gray" size="2">
                  {meta
                    ? `${meta.total_count.toLocaleString()} total`
                    : "—"}
                </Text>
              </div>
              <Flex
                align="center"
                gap="3"
                wrap="wrap"
                flexGrow="1"
                justify="end"
                style={{ minWidth: "min(100%, 20rem)" }}
              >
                <TextField.Root
                  size="2"
                  placeholder="Search name, email, role, department…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ flex: "1 1 14rem", minWidth: "12rem" }}
                >
                  <TextField.Slot side="left">
                    <MagnifyingGlassIcon height="16" width="16" aria-hidden />
                  </TextField.Slot>
                </TextField.Root>
                <Flex align="center" gap="2">
                  <Text size="2" color="gray" as="span">
                    Per page
                  </Text>
                  <Select.Root
                    size="2"
                    value={String(perPage)}
                    onValueChange={(v) => {
                      setPerPage(Number(v));
                      setPage(1);
                    }}
                  >
                    <Select.Trigger placeholder="Page size" />
                    <Select.Content position="popper">
                      <Select.Item value="25">25</Select.Item>
                      <Select.Item value="50">50</Select.Item>
                      <Select.Item value="100">100</Select.Item>
                    </Select.Content>
                  </Select.Root>
                  <Button size="2" variant="soft" onClick={() => refetch()}>
                    Refresh
                  </Button>
                </Flex>
              </Flex>
            </Flex>
            <Separator size="4" />

            {loading ? (
              <Flex align="center" justify="center" py="9" gap="3">
                <Spinner size="3" />
                <Text color="gray">Loading employees…</Text>
              </Flex>
            ) : meta && meta.total_count === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="4"
                py="9"
              >
                <Text color="gray" size="3" align="center">
                  {debouncedSearch.trim()
                    ? "No employees match your search."
                    : "No employees yet. Create your first record to get started."}
                </Text>
                {!debouncedSearch.trim() ? (
                  <Button size="3" onClick={openCreate}>
                    <Flex align="center" gap="2">
                      <PlusIcon width={18} height={18} />
                      Add employee
                    </Flex>
                  </Button>
                ) : (
                  <Button
                    size="2"
                    variant="soft"
                    onClick={() => setSearchInput("")}
                  >
                    Clear search
                  </Button>
                )}
              </Flex>
            ) : (
              <ScrollArea scrollbars="horizontal" type="hover">
                <Table.Root size="2" variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Department</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Country</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Compensation</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Hired</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="end">
                        Actions
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {employees.map((row) => (
                      <Table.Row key={row.id}>
                        <Table.RowHeaderCell>
                          <Flex direction="column" gap="1">
                            <Text weight="medium">{row.full_name}</Text>
                            {row.email ? (
                              <Text size="1" color="gray">
                                {row.email}
                              </Text>
                            ) : null}
                            {row.employee_number ? (
                              <Text size="1" color="gray">
                                #{row.employee_number}
                              </Text>
                            ) : null}
                          </Flex>
                        </Table.RowHeaderCell>
                        <Table.Cell>
                          <Text>{row.job_title}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text>{row.department ?? "—"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge size="1" variant="soft" color="gray">
                            {row.country}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text weight="medium">
                            {formatSalary(row.salary, row.currency)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            size="2"
                            color={statusBadgeColor(row.employment_status)}
                          >
                            {statusLabel(row.employment_status)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{formatDate(row.hired_on)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex justify="end" gap="2">
                            <IconButton
                              size="2"
                              variant="soft"
                              color="green"
                              aria-label={`Edit ${row.full_name}`}
                              onClick={() => openEdit(row)}
                            >
                              <Pencil1Icon width={16} height={16} />
                            </IconButton>
                            <IconButton
                              size="2"
                              variant="soft"
                              color="red"
                              aria-label={`Delete ${row.full_name}`}
                              onClick={() => {
                                setDeleteTarget(row);
                                setDeleteOpen(true);
                              }}
                            >
                              <TrashIcon width={16} height={16} />
                            </IconButton>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            )}
            {meta && meta.total_count > 0 ? (
              <Flex
                align="center"
                justify="between"
                gap="3"
                wrap="wrap"
                pt="1"
              >
                <Text size="2" color="gray">
                  {(() => {
                    const start = (meta.page - 1) * meta.per_page + 1;
                    const end = Math.min(
                      meta.page * meta.per_page,
                      meta.total_count,
                    );
                    return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${meta.total_count.toLocaleString()}`;
                  })()}
                </Text>
                <Flex align="center" gap="2">
                  <Button
                    size="2"
                    variant="soft"
                    disabled={meta.page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Flex align="center" gap="1">
                      <ChevronLeftIcon width={16} height={16} aria-hidden />
                      Previous
                    </Flex>
                  </Button>
                  <Text size="2">
                    Page {meta.page} of {Math.max(meta.total_pages, 1)}
                  </Text>
                  <Button
                    size="2"
                    variant="soft"
                    disabled={
                      loading ||
                      meta.total_pages === 0 ||
                      meta.page >= meta.total_pages
                    }
                    onClick={() =>
                      setPage((p) =>
                        meta.total_pages === 0
                          ? p
                          : Math.min(meta.total_pages, p + 1),
                      )
                    }
                  >
                    <Flex align="center" gap="1">
                      Next
                      <ChevronRightIcon width={16} height={16} aria-hidden />
                    </Flex>
                  </Button>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Card>
      </Container>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content
          size="4"
          style={{ maxWidth: "min(720px, 100vw - 2rem)" }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title>
            {dialogMode === "create" ? "Add employee" : "Edit employee"}
          </Dialog.Title>
          <Dialog.Description size="2" color="gray" mb="4">
            Required fields are marked. Country and currency use ISO codes (e.g.
            US, USD).
          </Dialog.Description>

          {formError ? (
            <Callout.Root color="red" mb="4" role="alert">
              <Callout.Text>{formError}</Callout.Text>
            </Callout.Root>
          ) : null}

          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              void submitForm();
            }}
          >
            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-fn`}>
                  First name
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-fn`}
                  required
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, first_name: e.target.value }))
                  }
                  placeholder="Jordan"
                />
              </Flex>
              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-ln`}>
                  Last name
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-ln`}
                  required
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, last_name: e.target.value }))
                  }
                  placeholder="Lee"
                />
              </Flex>

              <Flex direction="column" gap="2" style={{ gridColumn: "1 / -1" }}>
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-title`}>
                  Job title
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-title`}
                  required
                  value={form.job_title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, job_title: e.target.value }))
                  }
                  placeholder="Senior Software Engineer"
                />
              </Flex>

              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-cc`}>
                  Country (ISO-2)
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-cc`}
                  required
                  maxLength={2}
                  value={form.country}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      country: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="US"
                />
              </Flex>
              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-cur`}>
                  Currency (ISO-3)
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-cur`}
                  required
                  maxLength={3}
                  value={form.currency}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      currency: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="USD"
                />
              </Flex>

              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-sal`}>
                  Salary
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-sal`}
                  required
                  inputMode="decimal"
                  value={form.salary}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, salary: e.target.value }))
                  }
                  placeholder="125000"
                />
              </Flex>
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium" as="div">
                  Employment status
                </Text>
                <Select.Root
                  size="3"
                  value={form.employment_status}
                  onValueChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      employment_status: v as EmploymentStatus,
                    }))
                  }
                >
                  <Select.Trigger placeholder="Status" />
                  <Select.Content position="popper">
                    {STATUS_OPTIONS.map((o) => (
                      <Select.Item key={o.value} value={o.value}>
                        {o.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>

              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-email`}>
                  Email (optional)
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-email`}
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  placeholder="name@company.com"
                />
              </Flex>
              <Flex direction="column" gap="2">
                <Text
                  as="label"
                  size="2"
                  weight="medium"
                  htmlFor={`${formId}-dept`}
                >
                  Department (optional)
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-dept`}
                  value={form.department}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, department: e.target.value }))
                  }
                  placeholder="Engineering"
                />
              </Flex>

              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium" htmlFor={`${formId}-hire`}>
                  Hired on (optional)
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-hire`}
                  type="date"
                  value={form.hired_on}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, hired_on: e.target.value }))
                  }
                />
              </Flex>
              <Flex direction="column" gap="2">
                <Text
                  as="label"
                  size="2"
                  weight="medium"
                  htmlFor={`${formId}-enum`}
                >
                  Employee number (optional)
                </Text>
                <TextField.Root
                  size="3"
                  id={`${formId}-enum`}
                  value={form.employee_number}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      employee_number: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="ENG-001"
                />
              </Flex>
            </Grid>

            <Flex gap="3" justify="end" mt="6">
              <Dialog.Close>
                <Button type="button" size="3" variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                size="3"
                loading={saving}
                disabled={saving}
                highContrast
              >
                {dialogMode === "create" ? "Create employee" : "Save changes"}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      <AlertDialog.Root
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialog.Content style={{ maxWidth: "min(440px, 100vw - 2rem)" }}>
          <AlertDialog.Title>Remove employee</AlertDialog.Title>
          <AlertDialog.Description size="3">
            {deleteTarget ? (
              <>
                This will permanently delete{" "}
                <Text weight="bold">{deleteTarget.full_name}</Text> from the
                directory. This action cannot be undone.
              </>
            ) : null}
          </AlertDialog.Description>
          <Flex gap="3" justify="end" mt="4">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleting}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              color="red"
              loading={deleting}
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              Delete
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  );
}
