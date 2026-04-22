"use client";

import { AlertDialog, Button, Flex, Text } from "@radix-ui/themes";
import type { Employee } from "@/types/employee";

type DeleteConfirmDialogProps = {
  open: boolean;
  target: Employee | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

export function DeleteConfirmDialog({
  open,
  target,
  deleting,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content style={{ maxWidth: "min(440px, 100vw - 2rem)" }}>
        <AlertDialog.Title>Remove employee</AlertDialog.Title>
        <AlertDialog.Description size="3">
          {target ? (
            <>
              This will permanently delete <Text weight="bold">{target.full_name}</Text>{" "}
              from the directory. This action cannot be undone.
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
            onClick={() => void onConfirm()}
          >
            Delete
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
