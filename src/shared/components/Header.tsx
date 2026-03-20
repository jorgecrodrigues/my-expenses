import {
  Avatar,
  Box,
  Button,
  HStack,
  Icon,
  Popover,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { popoverContentMotion } from "@/shared/animation/chakraMotion";
import { BrandIcon } from "./icons/BrandIcon";
import { IconChevronDown, IconLogout } from "@tabler/icons-react";

export default function Header() {
  const { signOut } = useAuthActions();

  const user = useQuery(api.users.viewer);

  const displayName = user?.name || "Guest";
  const email = user?.email || "Not provided";

  return (
    <HStack
      px={{ base: 3, md: 6 }}
      py={3}
      minH="3.75rem"
      backgroundColor="bg.panel"
      borderBottomWidth={1}
      borderColor="border"
      justify="space-between"
      align="center"
      gap={3}
    >
      <HStack gap={{ base: 2.5, md: 3 }} minW={0} flex="1">
        <Box
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={1.5}
          borderRadius="lg"
          bg="bg.muted"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <BrandIcon boxSize={{ base: "9", md: "10" }} />
        </Box>
        <VStack align="flex-start" gap={0} minW={0}>
          <Text
            as="span"
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="semibold"
            color="fg"
            lineHeight="shorter"
            truncate
          >
            My Expense Tracker
          </Text>
          <Text
            fontSize="xs"
            color="fg.subtle"
            lineHeight="short"
            display={{ base: "none", sm: "block" }}
          >
            Spending insights at a glance
          </Text>
        </VStack>
      </HStack>

      <Popover.Root positioning={{ placement: "bottom-end", gutter: 8 }}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            borderRadius="full"
            px={{ base: 2, sm: 3 }}
            py={2}
            h="auto"
            minH="2.75rem"
            borderColor="border.subtle"
            bg="bg.panel"
            _hover={{
              bg: "bg.muted",
              borderColor: "border.emphasized",
            }}
            _open={{
              bg: "bg.muted",
              borderColor: "border.emphasized",
            }}
          >
            <HStack gap={2}>
              <Avatar.Root
                size="sm"
                flexShrink={0}
                colorPalette="blue"
                ring="2px"
                ringColor="border.subtle"
                ringOffset="2px"
                ringOffsetColor="bg.panel"
              >
                <Avatar.Fallback name={displayName} />
                <Avatar.Image
                  src={user?.image || undefined}
                  alt={`${displayName} avatar`}
                />
              </Avatar.Root>
              <Text
                fontSize="sm"
                fontWeight="medium"
                maxW={{ base: "100px", sm: "140px", md: "180px" }}
                truncate
                display={{ base: "none", sm: "block" }}
              >
                {displayName}
              </Text>
              <Icon
                as={IconChevronDown}
                boxSize={4}
                color="fg.muted"
                flexShrink={0}
              />
            </HStack>
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content
              {...popoverContentMotion}
              minW="min(18rem, calc(100vw - 2rem))"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="border.subtle"
              boxShadow="lg"
            >
              <Popover.Arrow />
              <Popover.Body px={4} py={4}>
                <VStack align="stretch" gap={4}>
                  <HStack align="flex-start" gap={3}>
                    <Avatar.Root size="md" flexShrink={0} colorPalette="blue">
                      <Avatar.Fallback name={displayName} />
                      <Avatar.Image
                        src={user?.image || undefined}
                        alt={`${displayName} avatar`}
                      />
                    </Avatar.Root>
                    <VStack align="flex-start" gap={0.5} minW={0}>
                      <Text fontWeight="semibold" color="fg" lineClamp={2}>
                        {displayName}
                      </Text>
                      <Text fontSize="sm" color="fg.muted" wordBreak="break-word">
                        {email}
                      </Text>
                    </VStack>
                  </HStack>

                  <Box h="1px" bg="border" />

                  <Button
                    variant="ghost"
                    colorPalette="red"
                    justifyContent="flex-start"
                    size="sm"
                    onClick={() => signOut()}
                  >
                    <Icon as={IconLogout} boxSize={4} />
                    Sign out
                  </Button>
                </VStack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </HStack>
  );
}
