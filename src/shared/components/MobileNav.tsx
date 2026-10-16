import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import { useLocation } from "wouter";
import { NAV_ITEMS } from "@/shared/components/navItems";

export default function MobileNav() {
  const [location, navigate] = useLocation();

  return (
    <Flex
      as="nav"
      aria-label="Mobile navigation"
      align="stretch"
      justify="space-around"
      gap={1}
      px={2}
      pt={1.5}
      pb="calc(0.375rem + env(safe-area-inset-bottom, 0px))"
      backgroundColor="bg.panel"
      borderTopWidth="1px"
      borderColor="border"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.isActive(location);
        return (
          <Button
            key={item.path}
            type="button"
            variant="ghost"
            colorPalette="gray"
            flex="1"
            minW={0}
            h="auto"
            minH="3.25rem"
            px={1}
            py={1}
            flexDirection="column"
            gap={1}
            borderRadius="lg"
            color={active ? "fg" : "fg.muted"}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(item.path)}
            _hover={{ bg: "transparent", color: "fg" }}
            _active={{ bg: "bg.muted" }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={4}
              py={0.5}
              borderRadius="full"
              bg={active ? "bg.emphasized" : "transparent"}
              transitionProperty="background-color"
              transitionDuration="0.15s"
            >
              <Icon as={item.icon} boxSize={5} />
            </Box>
            <Text
              as="span"
              fontSize="2xs"
              fontWeight={active ? "semibold" : "medium"}
              lineHeight="1"
              maxW="full"
              truncate
            >
              {item.label}
            </Text>
          </Button>
        );
      })}
    </Flex>
  );
}
