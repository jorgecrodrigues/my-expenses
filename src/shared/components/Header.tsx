import {
  Avatar,
  Text,
  HStack,
  Popover,
  Button,
  Portal,
  IconButton,
  Box,
} from "@chakra-ui/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { BrandIcon } from "./icons/BrandIcon";
import { IconLogout } from "@tabler/icons-react";

export default function Header() {
  const { signOut } = useAuthActions();

  const user = useQuery(api.users.viewer);

  return (
    <HStack
      px={2}
      py={2}
      backgroundColor="bg.panel"
      borderBottomWidth={1}
      justify="space-between"
      align="center"
    >
      <HStack>
        <BrandIcon boxSize={10} />
        <Text fontSize="lg" fontWeight="bold" color="fg.muted">
          My Expense Tracker
        </Text>
      </HStack>
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button variant="plain" pr={0}>
            <HStack>
              <Text fontSize="sm" fontWeight="medium">
                {user?.name || "Guest"}
              </Text>
              <Avatar.Root>
                <Avatar.Fallback name={user?.name || "User"} />
                <Avatar.Image
                  src={user?.image || undefined}
                  alt={user?.name || "User avatar"}
                />
              </Avatar.Root>
            </HStack>
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Body>
                <HStack>
                  <Box>
                    <Text fontSize="md" fontWeight="bold">
                      {user?.name || "Guest"}
                    </Text>
                    <Text mb={2} fontSize="sm">
                      {user?.email || "Not provided"}
                    </Text>
                  </Box>
                  <IconButton
                    aria-label="Logout"
                    title="Logout"
                    as={IconLogout}
                    ml="auto"
                    variant="plain"
                    colorPalette="red"
                    onClick={() => signOut()}
                  />
                </HStack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </HStack>
  );
}
