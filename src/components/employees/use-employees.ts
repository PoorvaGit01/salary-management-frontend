"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export const STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Terminated" },
];

export type FormState = {
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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

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

export function statusBadgeColor(
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

export function statusLabel(s: EmploymentStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

export function formatSalary(salary: string | number, currency: string): string {
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

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(d);
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<EmployeeListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [refetchNonce, setRefetchNonce] = useState(0);
  const prevSearchRef = useRef<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const openCreate = useCallback(() => {
    setDialogMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((employee: Employee) => {
    setDialogMode("edit");
    setEditingId(employee.id);
    setForm(employeeToForm(employee));
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback((open: boolean) => {
    setDialogOpen(open);
  }, []);

  const submitForm = useCallback(async () => {
    const validationErrors = validateForm(form);
    if (validationErrors.length) {
      setFormError(validationErrors[0] ?? "Invalid form.");
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
  }, [dialogMode, editingId, form, refetch]);

  const requestDelete = useCallback((employee: Employee) => {
    setDeleteTarget(employee);
    setDeleteOpen(true);
  }, []);

  const closeDeleteDialog = useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setListError(err instanceof ApiError ? err.messages.join(" ") : String(err));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetch]);

  const headerSubtitle = useMemo(
    () =>
      "Add, view, update, and delete employees. API is proxied from Next.js to your Rails app.",
    [],
  );

  return {
    employees,
    meta,
    page,
    perPage,
    searchInput,
    debouncedSearch,
    loading,
    listError,
    dialogOpen,
    dialogMode,
    form,
    formError,
    saving,
    deleteOpen,
    deleteTarget,
    deleting,
    headerSubtitle,
    setPage,
    setPerPage,
    setSearchInput,
    setForm,
    openCreate,
    openEdit,
    requestDelete,
    closeDialog,
    submitForm,
    closeDeleteDialog,
    confirmDelete,
    refetch,
  };
}
