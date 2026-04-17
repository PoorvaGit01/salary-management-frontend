import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";

export default function Home() {
  return (
    <Flex flexGrow="1" align="center" justify="center" p="6">
      <Box maxWidth="480px" width="100%">
        <Card size="3">
          <Flex direction="column" gap="4">
            <Heading size="6">Salary Management</Heading>
            <Text color="gray" size="3">
              Frontend for the salary management system. Pair this app with{" "}
              <code>salary-management-backend</code> APIs.
            </Text>
            <Separator size="4" />
            <Flex gap="3" wrap="wrap">
              <Button size="2">Get started</Button>
              <Button size="2" variant="soft" asChild>
                <a href="https://www.radix-ui.com/themes/docs/overview">
                  Radix Themes docs
                </a>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Flex>
  );
}
