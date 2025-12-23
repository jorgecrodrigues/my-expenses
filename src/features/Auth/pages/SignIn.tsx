import { BrandIcon } from "@/shared/components/icons/BrandIcon";
import { Button, Center, HStack, VStack, Text } from "@chakra-ui/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { IconBrandGithub } from "@tabler/icons-react";

export default function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <Center height="100vh">
      <VStack spaceY={4}>
        <HStack spaceX={4}>
          <BrandIcon boxSize={20} />
          <Text fontSize={35} fontWeight={700} color="#73D14F">
            My Expense Tracker
          </Text>
        </HStack>
        <Button variant="surface" onClick={() => signIn("github")}>
          Sign in with GitHub <IconBrandGithub />
        </Button>
      </VStack>
    </Center>
  );
}
