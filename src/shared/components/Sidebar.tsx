import { Button, Flex } from "@chakra-ui/react";
import { useLocation } from "wouter";

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
        Home
      </Button>
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/dashboard" ? "bold" : "normal"}
        onClick={() => navigate("/dashboard")}
      >
        Dashboard
      </Button>
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/expenses" ? "bold" : "normal"}
        onClick={() => navigate("/expenses")}
      >
        Expenses
      </Button>
      <Button
        as="a"
        variant="ghost"
        justifyContent="flex-start"
        fontWeight={location === "/about" ? "bold" : "normal"}
        onClick={() => navigate("/about")}
      >
        About
      </Button>
    </Flex>
  );
}
