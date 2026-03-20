import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useLocation } from "wouter";
import type { IconProps } from "@tabler/icons-react";
import {
  IconBuildingBank,
  IconChevronRight,
  IconDashboard,
  IconHome,
  IconInfoCircle,
  IconReceipt,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { useSidebarState } from "../hooks/useSidebarState";

type NavItem = {
  path: string;
  label: string;
  icon: ComponentType<IconProps>;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Home",
    icon: IconHome,
    isActive: (pathname) => pathname === "/",
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: IconDashboard,
    isActive: (pathname) => pathname.includes("/dashboard"),
  },
  {
    path: "/expenses",
    label: "Expenses",
    icon: IconReceipt,
    isActive: (pathname) => pathname.includes("/expenses"),
  },
  {
    path: "/bank-accounts",
    label: "Bank Accounts",
    icon: IconBuildingBank,
    isActive: (pathname) => pathname.includes("/bank-accounts"),
  },
  {
    path: "/about",
    label: "About",
    icon: IconInfoCircle,
    isActive: (pathname) => pathname.includes("/about"),
  },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();

  const [sidebarState, setSidebarState] = useSidebarState();

  const isExpanded = sidebarState === "expanded" || sidebarState === null;

  return (
    <Flex
      as="nav"
      aria-label="Main navigation"
      direction="column"
      minH="100%"
      w={isExpanded ? "240px" : "4.25rem"}
      minW={isExpanded ? "240px" : "4.25rem"}
      maxW={isExpanded ? "240px" : "4.25rem"}
      px={isExpanded ? 3 : 2}
      py={4}
      gap={0}
      backgroundColor="bg.panel"
      borderRightWidth="1px"
      borderColor="border"
      align="stretch"
      transitionProperty="width, min-width, max-width, padding"
      transitionDuration="0.2s"
      transitionTimingFunction="ease-out"
    >
      <VStack align="stretch" gap={1} flex="1" pb={2}>
        {isExpanded ? (
          <Text
            px={2}
            pb={2}
            fontSize="xs"
            fontWeight="semibold"
            color="fg.subtle"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Menu
          </Text>
        ) : null}

        {NAV_ITEMS.map((item) => {
          const active = item.isActive(location);
          return (
            <Button
              key={item.path}
              type="button"
              variant="ghost"
              w="full"
              h="auto"
              minH="2.75rem"
              py={2}
              px={isExpanded ? 3 : 2}
              borderRadius="lg"
              justifyContent={isExpanded ? "flex-start" : "center"}
              gap={3}
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
              title={!isExpanded ? item.label : undefined}
              borderLeftWidth={isExpanded ? "3px" : "0"}
              borderLeftColor={
                isExpanded && active ? "fg.accent" : "transparent"
              }
              bg={active ? "bg.muted" : "transparent"}
              color={active ? "fg" : "fg.muted"}
              fontWeight={active ? "semibold" : "medium"}
              colorPalette="gray"
              transitionProperty="background-color, color, border-color"
              transitionDuration="0.15s"
              _hover={{
                bg: "bg.muted",
                color: "fg",
              }}
            >
              <Icon
                as={item.icon}
                boxSize={5}
                flexShrink={0}
                opacity={active ? 1 : 0.9}
              />
              {isExpanded ? (
                <Text as="span" truncate>
                  {item.label}
                </Text>
              ) : null}
            </Button>
          );
        })}
      </VStack>

      <Box
        borderTopWidth="1px"
        borderColor="border.subtle"
        pt={3}
        mt="auto"
      >
        <Tooltip
          content={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          positioning={{ placement: "right" }}
        >
          <IconButton
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            w="full"
            variant="surface"
            size="sm"
            borderRadius="lg"
            onClick={() =>
              setSidebarState(isExpanded ? "collapsed" : "expanded")
            }
          >
            <Icon
              as={IconChevronRight}
              boxSize={5}
              transform={isExpanded ? "rotate(180deg)" : "none"}
              transitionProperty="transform"
              transitionDuration="0.2s"
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Flex>
  );
}
