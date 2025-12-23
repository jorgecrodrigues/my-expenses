import {
  Avatar,
  Text,
  HStack,
  Popover,
  Button,
  Portal,
} from "@chakra-ui/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { BrandIcon } from "./icons/BrandIcon";

export default function Header() {
  const { signOut } = useAuthActions();

  const user = useQuery(api.users.viewer);

  return (
    <HStack
      px={2}
      py={2}
      backgroundColor="blackAlpha.900"
      borderBottomWidth={1}
      justify="space-between"
      align="center"
    >
      <HStack>
        <BrandIcon boxSize={10} />
        <Text fontSize="lg" fontWeight="bold" color="white">
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
                <Text fontSize="md" fontWeight="bold">
                  {user?.name || "Guest"}
                </Text>
                <Text mb={2} fontSize="sm">
                  {user?.email || "Not provided"}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  width="100%"
                  colorPalette="red"
                  onClick={() => signOut()}
                >
                  Logout
                </Button>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </HStack>
  );
}
