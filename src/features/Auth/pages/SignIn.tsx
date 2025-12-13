import { Button, Center, VStack } from "@chakra-ui/react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <Center height="100vh">
      <VStack spaceY={4}>
        <h2>Sign In</h2>
        <Button variant="surface" onClick={() => signIn("github")}>
          Sign in with GitHub
        </Button>
      </VStack>
    </Center>
  );
}
