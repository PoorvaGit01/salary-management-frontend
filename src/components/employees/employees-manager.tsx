"use client";

import {
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { PersonIcon, PlusIcon } from "@radix-ui/react-icons";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { EmployeeTable } from "./employee-table";
import { useEmployees } from "./use-employees";

export function EmployeesManager() {
  const employeesState = useEmployees();

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
                  {employeesState.headerSubtitle}
                </Text>
              </div>
            </Flex>
            <Button size="3" onClick={employeesState.openCreate} highContrast>
              <Flex align="center" gap="2">
                <PlusIcon width={18} height={18} />
                Add employee
              </Flex>
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container size="4" px={{ initial: "4", sm: "6" }} pb="8" flexGrow="1">
        {employeesState.listError ? (
          <Callout.Root color="red" mb="4" role="alert">
            <Callout.Text>{employeesState.listError}</Callout.Text>
          </Callout.Root>
        ) : null}

        <Card size="3">
          <EmployeeTable
            employees={employeesState.employees}
            meta={employeesState.meta}
            loading={employeesState.loading}
            searchInput={employeesState.searchInput}
            debouncedSearch={employeesState.debouncedSearch}
            perPage={employeesState.perPage}
            onSearchChange={employeesState.setSearchInput}
            onPerPageChange={(nextPerPage) => {
              employeesState.setPerPage(nextPerPage);
              employeesState.setPage(1);
            }}
            onRefetch={employeesState.refetch}
            onCreate={employeesState.openCreate}
            onEdit={employeesState.openEdit}
            onDelete={employeesState.requestDelete}
            onPageChange={employeesState.setPage}
          />
        </Card>
      </Container>

      <EmployeeFormDialog
        open={employeesState.dialogOpen}
        mode={employeesState.dialogMode}
        form={employeesState.form}
        formError={employeesState.formError}
        saving={employeesState.saving}
        onOpenChange={employeesState.closeDialog}
        onFormChange={employeesState.setForm}
        onSubmit={employeesState.submitForm}
      />
      <DeleteConfirmDialog
        open={employeesState.deleteOpen}
        target={employeesState.deleteTarget}
        deleting={employeesState.deleting}
        onOpenChange={employeesState.closeDeleteDialog}
        onConfirm={employeesState.confirmDelete}
      />
    </Flex>
  );
}
