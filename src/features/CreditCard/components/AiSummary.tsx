import { Box, HStack, Icon, List, Stack, Text } from "@chakra-ui/react";
import { IconSparkles } from "@tabler/icons-react";
import { parseSummary } from "../utils/summary";

export default function AiSummary({ summary }: { summary?: string }) {
  const blocks = summary ? parseSummary(summary) : [];

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
    >
      <HStack gap={2} mb={3}>
        <Icon as={IconSparkles} boxSize={5} color="fg.accent" />
        <Text fontSize="lg" fontWeight="bold">
          AI analysis
        </Text>
      </HStack>
      {blocks.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          The analysis is not available for this statement yet.
        </Text>
      ) : (
        <Stack gap={2} fontSize="sm">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <Text key={index} fontWeight="semibold" mt={index > 0 ? 2 : 0}>
                  {block.text}
                </Text>
              );
            }
            if (block.type === "list") {
              return (
                <List.Root key={index} ps={5} gap={1}>
                  {block.items.map((item, itemIndex) => (
                    <List.Item key={itemIndex}>{item}</List.Item>
                  ))}
                </List.Root>
              );
            }
            return <Text key={index}>{block.text}</Text>;
          })}
        </Stack>
      )}
    </Box>
  );
}
