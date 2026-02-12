import { Button, IconButton, Text, VStack } from "@chakra-ui/react";
import { useLocation } from "wouter";
import {
  IconHome,
  IconReceipt,
  IconInfoCircle,
  IconDashboard,
  IconChevronRight,
} from "@tabler/icons-react";
import { useSidebarState } from "../hooks/useSidebarState";

export default function Sidebar() {
  const [location, navigate] = useLocation();

  const [sidebarState, setSidebarState] = useSidebarState();

  // Determine if the sidebar is expanded based on the state from localStorage
  const isExpanded = sidebarState === "expanded" || sidebarState === null;

  return (
    <VStack
      px={2}
      py={4}
      minHeight="100%"
      backgroundColor="bg.panel"
      align="stretch"
      position="relative"
    >
      <Button
        as="a"
        aria-label="Home"
        title="Home"
        variant={location === "/" ? "subtle" : "ghost"}
        size="lg"
        color={location === "/" ? "blue.400" : "fg"}
        _hover={{ color: "blue.400" }}
        justifyContent="flex-start"
        onClick={() => navigate("/")}
      >
        <IconHome />
        {isExpanded ? <Text>Home</Text> : null}
      </Button>
      <Button
        as="a"
        aria-label="Dashboard"
        title="Dashboard"
        variant={location.includes("/dashboard") ? "subtle" : "ghost"}
        size="lg"
        color={location.includes("/dashboard") ? "blue.400" : "fg"}
        _hover={{ color: "blue.400" }}
        justifyContent="flex-start"
        onClick={() => navigate("/dashboard")}
      >
        <IconDashboard /> {isExpanded ? <Text>Dashboard</Text> : null}
      </Button>
      <Button
        as="a"
        aria-label="Expenses"
        title="Expenses"
        variant={location.includes("/expenses") ? "subtle" : "ghost"}
        size="lg"
        color={location.includes("/expenses") ? "blue.400" : "fg"}
        _hover={{ color: "blue.400" }}
        justifyContent="flex-start"
        onClick={() => navigate("/expenses")}
      >
        <IconReceipt /> {isExpanded ? <Text>Expenses</Text> : null}
      </Button>
      <Button
        as="a"
        aria-label="About"
        title="About"
        variant={location.includes("/about") ? "subtle" : "ghost"}
        size="lg"
        color={location.includes("/about") ? "blue.400" : "fg"}
        _hover={{ color: "blue.400" }}
        justifyContent="flex-start"
        onClick={() => navigate("/about")}
      >
        <IconInfoCircle /> {isExpanded ? <Text>About</Text> : null}
      </Button>
      <IconButton
        aria-label="Toggle Sidebar"
        as={IconChevronRight}
        variant="surface"
        size="xs"
        rounded="md"
        transform={isExpanded ? "rotate(180deg)" : "none"}
        position="absolute"
        right={2}
        bottom={4}
        onClick={() => setSidebarState(isExpanded ? "collapsed" : "expanded")}
      />
    </VStack>
  );
}
