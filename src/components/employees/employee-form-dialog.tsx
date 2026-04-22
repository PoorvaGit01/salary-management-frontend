"use client";

import { useId } from "react";
import { Button, Callout, Dialog, Flex, Grid, Select, Text, TextField } from "@radix-ui/themes";
import type { EmploymentStatus } from "@/types/employee";
import { STATUS_OPTIONS, type FormState } from "./use-employees";

type EmployeeFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  form: FormState;
  formError: string | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (updater: (prev: FormState) => FormState) => void;
  onSubmit: () => Promise<void>;
};

export function EmployeeFormDialog({
  open,
  mode,
  form,
  formError,
  saving,
  onOpenChange,
  onFormChange,
  onSubmit,
}: EmployeeFormDialogProps) {
  const formId = useId();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        size="4"
        style={{ maxWidth: "min(720px, 100vw - 2rem)" }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Dialog.Title>{mode === "create" ? "Add employee" : "Edit employee"}</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Required fields are marked. Country and currency use ISO codes (e.g. US,
          USD).
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
            void onSubmit();
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
                onChange={(e) => onFormChange((s) => ({ ...s, first_name: e.target.value }))}
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
                onChange={(e) => onFormChange((s) => ({ ...s, last_name: e.target.value }))}
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
                onChange={(e) => onFormChange((s) => ({ ...s, job_title: e.target.value }))}
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
                  onFormChange((s) => ({ ...s, country: e.target.value.toUpperCase() }))
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
                  onFormChange((s) => ({ ...s, currency: e.target.value.toUpperCase() }))
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
                onChange={(e) => onFormChange((s) => ({ ...s, salary: e.target.value }))}
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
                  onFormChange((s) => ({ ...s, employment_status: v as EmploymentStatus }))
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
                onChange={(e) => onFormChange((s) => ({ ...s, email: e.target.value }))}
                placeholder="name@company.com"
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium" htmlFor={`${formId}-dept`}>
                Department (optional)
              </Text>
              <TextField.Root
                size="3"
                id={`${formId}-dept`}
                value={form.department}
                onChange={(e) => onFormChange((s) => ({ ...s, department: e.target.value }))}
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
                onChange={(e) => onFormChange((s) => ({ ...s, hired_on: e.target.value }))}
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium" htmlFor={`${formId}-enum`}>
                Employee number (optional)
              </Text>
              <TextField.Root
                size="3"
                id={`${formId}-enum`}
                value={form.employee_number}
                onChange={(e) =>
                  onFormChange((s) => ({ ...s, employee_number: e.target.value.toUpperCase() }))
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
            <Button type="submit" size="3" loading={saving} disabled={saving} highContrast>
              {mode === "create" ? "Create employee" : "Save changes"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
