import { Button, VStack } from "@chakra-ui/react";
import { useLocation } from "wouter";
import {
  IconHome,
  IconReceipt,
  IconInfoCircle,
  IconDashboard,
} from "@tabler/icons-react";

export default function Sidebar() {
  const [location, navigate] = useLocation();

  return (
    <VStack
      py={4}
      minHeight="100%"
      backgroundColor="blackAlpha.900"
      align="flex-start"
      borderRightWidth={{
        base: 0,
        md: 1,
      }}
    >
      <Button
        as="a"
        variant="plain"
        size="lg"
        color="white"
        _hover={{ color: "blue.400" }}
        fontWeight={location === "/" ? "bold" : "normal"}
        onClick={() => navigate("/")}
      >
        <IconHome /> Home
      </Button>
      <Button
        as="a"
        variant="ghost"
        size="lg"
        color="white"
        _hover={{ color: "blue.400" }}
        fontWeight={location === "/dashboard" ? "bold" : "normal"}
        onClick={() => navigate("/dashboard")}
      >
        <IconDashboard /> Dashboard
      </Button>
      <Button
        as="a"
        variant="ghost"
        size="lg"
        color="white"
        _hover={{ color: "blue.400" }}
        fontWeight={location === "/expenses" ? "bold" : "normal"}
        onClick={() => navigate("/expenses")}
      >
        <IconReceipt /> Expenses
      </Button>
      <Button
        as="a"
        variant="ghost"
        size="lg"
        color="white"
        _hover={{ color: "blue.400" }}
        fontWeight={location === "/about" ? "bold" : "normal"}
        onClick={() => navigate("/about")}
      >
        <IconInfoCircle /> About
      </Button>
    </VStack>
  );
}
