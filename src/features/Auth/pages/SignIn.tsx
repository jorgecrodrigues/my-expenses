import React from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  IconBrandGithub,
  IconChartBar,
  IconCreditCard,
  IconReceipt2,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { BrandIcon } from "@/shared/components/icons/BrandIcon";
import { pageStaggerEnter } from "@/shared/animation/chakraMotion";
import { toaster } from "@/components/ui/toaster";

const FEATURES: { icon: TablerIcon; title: string; description: string }[] = [
  {
    icon: IconChartBar,
    title: "Dashboard",
    description: "See your spending by month, year and category.",
  },
  {
    icon: IconReceipt2,
    title: "Expenses & bills",
    description: "Keep track of what's due and what's already paid.",
  },
  {
    icon: IconCreditCard,
    title: "Credit card statements",
    description: "Upload Nubank or Inter PDFs and review every purchase.",
  },
];

function FeatureList() {
  return (
    <Stack as="ul" gap={{ base: 4, md: 5 }} listStyleType="none">
      {FEATURES.map((feature, index) => (
        <HStack
          as="li"
          key={feature.title}
          gap={3}
          align="flex-start"
          {...pageStaggerEnter(400 + index * 100)}
        >
          <Flex
            boxSize={9}
            flexShrink={0}
            align="center"
            justify="center"
            borderRadius="lg"
            bg="bg.emphasized"
            color="fg"
          >
            <Icon as={feature.icon} boxSize={5} />
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="semibold">
              {feature.title}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {feature.description}
            </Text>
          </Box>
        </HStack>
      ))}
    </Stack>
  );
}

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [signingIn, setSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn("github");
    } catch (error) {
      setSigningIn(false);
      toaster.create({
        type: "error",
        title: "Could not sign in",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <Flex
      as="main"
      minH="100dvh"
      direction={{ base: "column", md: "row" }}
      justify={{ base: "center", md: "flex-start" }}
      pt="env(safe-area-inset-top)"
      pb="env(safe-area-inset-bottom)"
    >
      <Flex
        flex={{ md: "1" }}
        direction="column"
        justify="center"
        gap={10}
        px={{ base: 6, md: 12, xl: 20 }}
        pt={{ base: 10, md: 12 }}
        pb={{ base: 8, md: 12 }}
        align={{ base: "center", md: "flex-start" }}
        textAlign={{ base: "center", md: "start" }}
        bgGradient={{ md: "to-br" }}
        gradientFrom="orange.600/25"
        gradientVia="bg"
        gradientTo="purple.500/25"
        borderEndWidth={{ md: "1px" }}
        borderColor="border.subtle"
      >
        <Stack gap={3} align={{ base: "center", md: "flex-start" }}>
          <BrandIcon boxSize={{ base: 14, md: 16 }} {...pageStaggerEnter(0)} />
          <Heading
            as="h1"
            size={{ base: "2xl", md: "4xl" }}
            letterSpacing="tight"
            {...pageStaggerEnter(100)}
          >
            My Expense Tracker
          </Heading>
          <Text
            color="fg.muted"
            fontSize={{ base: "sm", md: "lg" }}
            maxW="md"
            {...pageStaggerEnter(200)}
          >
            See where your money goes, month by month and category by category.
          </Text>
        </Stack>
        <Box hideBelow="md" maxW="md">
          <FeatureList />
        </Box>
      </Flex>

      <Flex
        flex={{ md: "1" }}
        direction="column"
        align="center"
        justify={{ base: "flex-start", md: "center" }}
        gap={8}
        px={{ base: 4, md: 12 }}
        pb={{ base: 10, md: 12 }}
      >
        <Card.Root
          w="full"
          maxW="sm"
          variant="outline"
          borderRadius="xl"
          {...pageStaggerEnter(300)}
        >
          <Card.Body gap={5} p={{ base: 5, md: 6 }}>
            <Stack gap={1} textAlign="center">
              <Heading as="h2" size="lg">
                Sign in to your account
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                Use your GitHub account to sign in and manage your expenses.
              </Text>
            </Stack>
            <Button
              size="lg"
              w="full"
              onClick={handleSignIn}
              loading={signingIn}
              loadingText="Redirecting to GitHub..."
            >
              <IconBrandGithub />
              Sign in with GitHub
            </Button>
            <Text fontSize="xs" color="fg.subtle" textAlign="center">
              Your data stays private to your account.
            </Text>
          </Card.Body>
        </Card.Root>

        <Box hideFrom="md" w="full" maxW="sm" px={1}>
          <FeatureList />
        </Box>
      </Flex>
    </Flex>
  );
}
