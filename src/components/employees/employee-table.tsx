"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
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
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import type { Employee, EmployeeListMeta } from "@/types/employee";
import { formatDate, formatSalary, statusBadgeColor, statusLabel } from "./use-employees";

type EmployeeTableProps = {
  employees: Employee[];
  meta: EmployeeListMeta | null;
  loading: boolean;
  searchInput: string;
  debouncedSearch: string;
  perPage: number;
  onSearchChange: (value: string) => void;
  onPerPageChange: (value: number) => void;
  onRefetch: () => void;
  onCreate: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onPageChange: (updater: number | ((prev: number) => number)) => void;
};

export function EmployeeTable({
  employees,
  meta,
  loading,
  searchInput,
  debouncedSearch,
  perPage,
  onSearchChange,
  onPerPageChange,
  onRefetch,
  onCreate,
  onEdit,
  onDelete,
  onPageChange,
}: EmployeeTableProps) {
  return (
    <Flex direction="column" gap="4">
      <Flex align="start" justify="between" gap="4" wrap="wrap">
        <div>
          <Text weight="medium" size="4">
            Directory
          </Text>
          <Text color="gray" size="2">
            {meta ? `${meta.total_count.toLocaleString()} total` : "—"}
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
            onChange={(e) => onSearchChange(e.target.value)}
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
              onValueChange={(v) => onPerPageChange(Number(v))}
            >
              <Select.Trigger placeholder="Page size" />
              <Select.Content position="popper">
                <Select.Item value="25">25</Select.Item>
                <Select.Item value="50">50</Select.Item>
                <Select.Item value="100">100</Select.Item>
              </Select.Content>
            </Select.Root>
            <Button size="2" variant="soft" onClick={onRefetch}>
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
        <Flex direction="column" align="center" justify="center" gap="4" py="9">
          <Text color="gray" size="3" align="center">
            {debouncedSearch.trim()
              ? "No employees match your search."
              : "No employees yet. Create your first record to get started."}
          </Text>
          {!debouncedSearch.trim() ? (
            <Button size="3" onClick={onCreate}>
              <Flex align="center" gap="2">
                <PlusIcon width={18} height={18} />
                Add employee
              </Flex>
            </Button>
          ) : (
            <Button size="2" variant="soft" onClick={() => onSearchChange("")}>
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
                <Table.ColumnHeaderCell justify="end">Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {employees.map((employee) => (
                <Table.Row key={employee.id}>
                  <Table.RowHeaderCell>
                    <Flex direction="column" gap="1">
                      <Text weight="medium">{employee.full_name}</Text>
                      {employee.email ? (
                        <Text size="1" color="gray">
                          {employee.email}
                        </Text>
                      ) : null}
                      {employee.employee_number ? (
                        <Text size="1" color="gray">
                          #{employee.employee_number}
                        </Text>
                      ) : null}
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Text>{employee.job_title}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{employee.department ?? "—"}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="1" variant="soft" color="gray">
                      {employee.country}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text weight="medium">
                      {formatSalary(employee.salary, employee.currency)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2" color={statusBadgeColor(employee.employment_status)}>
                      {statusLabel(employee.employment_status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{formatDate(employee.hired_on)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex justify="end" gap="2">
                      <IconButton
                        size="2"
                        variant="soft"
                        color="green"
                        aria-label={`Edit ${employee.full_name}`}
                        onClick={() => onEdit(employee)}
                      >
                        <Pencil1Icon width={16} height={16} />
                      </IconButton>
                      <IconButton
                        size="2"
                        variant="soft"
                        color="red"
                        aria-label={`Delete ${employee.full_name}`}
                        onClick={() => onDelete(employee)}
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
        <Flex align="center" justify="between" gap="3" wrap="wrap" pt="1">
          <Text size="2" color="gray">
            {(() => {
              const start = (meta.page - 1) * meta.per_page + 1;
              const end = Math.min(meta.page * meta.per_page, meta.total_count);
              return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${meta.total_count.toLocaleString()}`;
            })()}
          </Text>
          <Flex align="center" gap="2">
            <Button
              size="2"
              variant="soft"
              disabled={meta.page <= 1 || loading}
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
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
              disabled={loading || meta.total_pages === 0 || meta.page >= meta.total_pages}
              onClick={() =>
                onPageChange((p) =>
                  meta.total_pages === 0 ? p : Math.min(meta.total_pages, p + 1),
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
      <Box />
    </Flex>
  );
}
