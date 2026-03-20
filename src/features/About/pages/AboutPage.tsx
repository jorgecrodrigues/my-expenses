import {
  Box,
  Card,
  Container,
  Heading,
  HStack,
  Icon,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IconChartBar,
  IconCode,
  IconHeart,
  IconMail,
  IconReceipt2,
} from "@tabler/icons-react";
import { pageStaggerSlideLeftCompact } from "@/shared/animation/chakraMotion";

const CONTACT_EMAIL = "jorgerodrigues9@outlook.com";

export default function AboutPage() {
  return (
    <Container maxW="3xl" py={{ base: 2, md: 4 }} px={{ base: 0, sm: 4 }}>
      <VStack align="stretch" gap={{ base: 8, md: 10 }}>
        <Box
          borderRadius="xl"
          px={{ base: 4, md: 8 }}
          py={{ base: 8, md: 10 }}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          {...pageStaggerSlideLeftCompact(0)}
        >
          <VStack align="flex-start" gap={3}>
            <Heading as="h1" size="3xl" letterSpacing="tight">
              About
            </Heading>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color="fg.muted"
              lineHeight="tall"
              maxW="2xl"
            >
              My Expense Tracker helps you see where your money goes—month by
              month, category by category—so you can plan with confidence instead
              of guessing.
            </Text>
          </VStack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Card.Root
            variant="outline"
            borderRadius="xl"
            {...pageStaggerSlideLeftCompact(55)}
          >
            <Card.Header pb={2}>
              <HStack gap={3} align="flex-start">
                <Icon
                  as={IconChartBar}
                  boxSize={6}
                  color="fg.accent"
                  mt={0.5}
                  flexShrink={0}
                />
                <Card.Title textStyle="lg">What you can do</Card.Title>
              </HStack>
            </Card.Header>
            <Card.Body pt={0}>
              <Text color="fg.muted" lineHeight="tall">
                Browse spending on the dashboard by month and year, drill into
                categories, keep your expense list up to date, and attach files
                to transactions when you need a paper trail.
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root
            variant="outline"
            borderRadius="xl"
            {...pageStaggerSlideLeftCompact(110)}
          >
            <Card.Header pb={2}>
              <HStack gap={3} align="flex-start">
                <Icon
                  as={IconCode}
                  boxSize={6}
                  color="fg.accent"
                  mt={0.5}
                  flexShrink={0}
                />
                <Card.Title textStyle="lg">Built with</Card.Title>
              </HStack>
            </Card.Header>
            <Card.Body pt={0}>
              <Text color="fg.muted" lineHeight="tall">
                React, TypeScript, and Vite on the front end; Chakra UI for
                layout and accessibility; Convex for sync, auth, and data—so
                updates feel instant and your information stays scoped to your
                account.
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Card.Root
          variant="outline"
          borderRadius="xl"
          {...pageStaggerSlideLeftCompact(165)}
        >
          <Card.Header pb={2}>
            <HStack gap={3} align="flex-start">
              <Icon
                as={IconHeart}
                boxSize={6}
                color="fg.accent"
                mt={0.5}
                flexShrink={0}
              />
              <Card.Title textStyle="lg">Why we built it</Card.Title>
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <Text color="fg.muted" lineHeight="tall">
              Personal finance tools work best when they stay out of the way:
              fast to open, easy to log a purchase, and honest about totals. We
              built this app around that idea—clarity first, clutter never.
            </Text>
          </Card.Body>
        </Card.Root>

        <Card.Root
          variant="outline"
          borderRadius="xl"
          bg="bg.panel"
          {...pageStaggerSlideLeftCompact(220)}
        >
          <Card.Header pb={2}>
            <HStack gap={3} align="flex-start">
              <Icon
                as={IconMail}
                boxSize={6}
                color="fg.accent"
                mt={0.5}
                flexShrink={0}
              />
              <Card.Title textStyle="lg">Contact</Card.Title>
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <Text color="fg.muted" lineHeight="tall" mb={3}>
              Questions, ideas, or bug reports? Send a message—we read every
              email.
            </Text>
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              colorPalette="blue"
              fontWeight="medium"
            >
              {CONTACT_EMAIL}
            </Link>
          </Card.Body>
        </Card.Root>

        <HStack
          justify="center"
          gap={2}
          color="fg.subtle"
          fontSize="sm"
          {...pageStaggerSlideLeftCompact(275)}
        >
          <Icon as={IconReceipt2} boxSize={4} aria-hidden />
          <Text>Thanks for using My Expense Tracker.</Text>
        </HStack>
      </VStack>
    </Container>
  );
}
