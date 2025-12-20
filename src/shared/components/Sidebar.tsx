import { Button, Flex } from "@chakra-ui/react";
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
    <Flex
      minHeight="100%"
      direction="column"
      borderRightWidth={{
        base: 0,
        md: 1,
      }}
    >
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/" ? "bold" : "normal"}
        onClick={() => navigate("/")}
      >
        <IconHome /> Home
      </Button>
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/dashboard" ? "bold" : "normal"}
        onClick={() => navigate("/dashboard")}
      >
        <IconDashboard /> Dashboard
      </Button>
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/expenses" ? "bold" : "normal"}
        onClick={() => navigate("/expenses")}
      >
        <IconReceipt /> Expenses
      </Button>
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/about" ? "bold" : "normal"}
        onClick={() => navigate("/about")}
      >
        <IconInfoCircle /> About
      </Button>
    </Flex>
  );
}
