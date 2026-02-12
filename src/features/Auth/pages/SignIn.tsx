import { BrandIcon } from "@/shared/components/icons/BrandIcon";
import { Button, Center, HStack, VStack, Text } from "@chakra-ui/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { IconBrandGithub } from "@tabler/icons-react";

export default function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <Center p={{ base: 2, sm: 4 }} h="100vh">
      <VStack
        w="100%"
        h="100%"
        justifyContent={{ base: "center", md: "flex-start" }}
        flexDirection={{ base: "column", md: "row" }}
      >
        <HStack
          w={{ base: "auto", md: "100%" }}
          h={{ base: "auto", md: "100%" }}
          bgGradient={{
            base: "none",
            md: "to-bl",
          }}
          gradientFrom="orange.600"
          gradientTo="purple.400"
          spaceY={{ base: 3, sm: 4 }}
          borderRadius="md"
          p={{ base: 4, sm: 6 }}
          justifyContent="center"
          alignItems="center"
          flexDirection={{ base: "column", sm: "row" }}
        >
          <BrandIcon boxSize={{ base: 14, sm: 16, md: 20 }} />
          <Text
            fontSize={{ base: 20, sm: 28, md: 35 }}
            fontWeight={700}
            color="#fff"
            textAlign="center"
          >
            My Expense Tracker
          </Text>
        </HStack>
        <VStack
          alignItems="center"
          justifyContent="center"
          w={{ base: "100%", md: "100%" }}
          h={{ base: "auto", md: "100%" }}
        >
          <Text
            fontSize={{ base: 18, sm: 20 }}
            fontWeight={500}
            textAlign="center"
          >
            Sign in to your account
          </Text>
          <Text
            fontSize={{ base: 14, sm: 16 }}
            color="gray.500"
            textAlign="center"
          >
            Use your GitHub account to sign in and manage your expenses.
          </Text>
          <Button
            variant="surface"
            onClick={() => signIn("github")}
            w={{ base: "100%", sm: "auto" }}
          >
            Sign in with GitHub <IconBrandGithub />
          </Button>
        </VStack>
      </VStack>
    </Center>
  );
}
