"use client";

import { Box, Container, Flex, Text } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Employees" },
  { href: "/insights", label: "Salary insights" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <Box
      py="3"
      px={{ initial: "4", sm: "6" }}
      style={{ borderBottom: "1px solid var(--gray-a6)" }}
    >
      <Container size="4">
        <Flex gap="5" align="center" wrap="wrap">
          {items.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Text key={href} size="3" weight={active ? "bold" : "regular"}>
                <Link
                  href={href}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  {label}
                </Link>
              </Text>
            );
          })}
        </Flex>
      </Container>
    </Box>
  );
}
