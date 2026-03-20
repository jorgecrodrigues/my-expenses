import {
  Button,
  Center,
  HStack,
  VStack,
  Text,
  Heading,
} from "@chakra-ui/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { IconBrandGithub } from "@tabler/icons-react";
import { BrandIcon } from "@/shared/components/icons/BrandIcon";
import { pageStaggerEnter } from "@/shared/animation/chakraMotion";

export default function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <Center
      h="100vh"
      p={{ base: 8, sm: 4 }}
      justifyContent={{ base: "center", md: "flex-start" }}
      flexDirection={{ base: "column", md: "row" }}
      gap={8}
    >
      <HStack
        w={{ base: "auto", md: "100%" }}
        h={{ base: "auto", md: "100%" }}
        bgGradient={{ base: "none", md: "to-bl" }}
        gradientFrom="orange.600"
        gradientTo="purple.400"
        borderRadius="md"
        p={{ base: 4, sm: 6 }}
        justifyContent="center"
        alignItems="center"
        flexDirection={{ base: "column", sm: "row" }}
      >
        <BrandIcon boxSize={{ base: 14, sm: 16, md: 20 }} />
        <Heading
          size={{ base: "2xl", lg: "4xl", "2xl": "6xl" }}
          color="fg"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Text {...pageStaggerEnter(0)}>My</Text>
          <Text {...pageStaggerEnter(100)}>Expense</Text>
          <Text {...pageStaggerEnter(200)}>Tracker</Text>
        </Heading>
      </HStack>
      <VStack
        w={{ base: "100%", md: "100%" }}
        h={{ base: "auto", md: "100%" }}
        alignItems="center"
        justifyContent="center"
      >
        <Text
          {...pageStaggerEnter(300)}
          fontSize={{ base: 18, sm: 20 }}
          fontWeight={500}
          textAlign="center"
        >
          Sign In to your account
        </Text>
        <Text
          mb={4}
          {...pageStaggerEnter(400)}
          fontSize={{ base: 14, sm: 16 }}
          color="gray.500"
          textAlign="center"
        >
          Use your GitHub account to sign in and manage your expenses.
        </Text>
        <Button
          {...pageStaggerEnter(500)}
          variant="surface"
          w={{ base: "100%", sm: "auto" }}
          whiteSpace="nowrap"
          onClick={() => signIn("github")}
        >
          Sign in with GitHub <IconBrandGithub />
        </Button>
      </VStack>
    </Center>
  );
}
