import React from "react";
import {
  HStack,
  Skeleton,
  SkeletonCircle,
  Stack,
  Text,
  Button,
} from "@chakra-ui/react";
import { BarSegment, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useLocation, useParams } from "wouter";

/** Flex-grow weights mimicking uneven category splits (matches BarSegment proportions). */
const BAR_SEGMENT_SKELETON_WEIGHTS = [26, 14, 32, 18, 10] as const;

function CategoryBarSegmentSkeleton() {
  return (
    <Stack gap={4} w="full">
      <Stack w="full" gap={1}>
        <HStack w="full" gap={1} align="stretch">
          {BAR_SEGMENT_SKELETON_WEIGHTS.map((grow, i) => (
            <Skeleton
              key={i}
              flexGrow={grow}
              flexBasis={0}
              minW={0}
              height="18px"
              variant="shine"
              borderRadius="sm"
            />
          ))}
        </HStack>
        <HStack w="full" gap={1} align="stretch">
          {BAR_SEGMENT_SKELETON_WEIGHTS.map((grow, i) => (
            <Skeleton
              key={i}
              flexGrow={grow}
              flexBasis={0}
              minW={0}
              h="2.5rem"
              variant="shine"
              borderRadius="l1"
            />
          ))}
        </HStack>
        <HStack w="full" gap={1} align="stretch">
          {BAR_SEGMENT_SKELETON_WEIGHTS.map((grow, i) => (
            <Skeleton
              key={i}
              flexGrow={grow}
              flexBasis={0}
              minW={0}
              height="14px"
              variant="shine"
              borderRadius="sm"
            />
          ))}
        </HStack>
      </Stack>
      <HStack w="full" wrap="wrap" gap={4}>
        {BAR_SEGMENT_SKELETON_WEIGHTS.map((_, i) => (
          <HStack key={i} gap={2} align="center">
            <SkeletonCircle size="0.82em" variant="shine" flexShrink={0} />
            <HStack gap={1.5} align="center">
              <Skeleton
                height="16px"
                width={i % 3 === 0 ? "4.5rem" : i % 3 === 1 ? "6rem" : "5rem"}
                variant="shine"
                borderRadius="sm"
              />
              <Skeleton
                height="16px"
                width="2.25rem"
                variant="shine"
                borderRadius="sm"
              />
            </HStack>
          </HStack>
        ))}
      </HStack>
    </Stack>
  );
}

export default function CategoryBarSegment() {
  const params = useParams<{ month?: string; year?: string }>();

  const today = new Date();
  const date = React.useMemo(() => {
    const month = params.month ? parseInt(params.month, 10) - 1 : undefined;
    const year = params.year ? parseInt(params.year, 10) : undefined;
    if (month === undefined || year === undefined) {
      return undefined;
    }
    return new Date(year, month, 1);
  }, [params.month, params.year]);

  const [, setLocation] = useLocation();

  const user = useQuery(api.users.viewer);
  const data = useQuery(api.expenses.getExpenseByCategoryValues, {
    userId: user?._id as Id<"users">,
    month: date ? date.getMonth() + 1 : undefined,
    year: date ? date.getFullYear() : undefined,
  });

  const chart = useChart({
    data:
      data?.map((item) => ({
        name: item.category,
        value: item.total,
        color: generateColorByString(item.category),
      })) || [],
  });

  return (
    <>
      <HStack justify="space-between" mb={2} align="center" flexWrap="wrap" gap={2}>
        <Text fontSize="lg" fontWeight="bold">
          Expenses by Category
        </Text>
        {data === undefined ? (
          <Skeleton
            height="28px"
            width="11rem"
            variant="shine"
            borderRadius="sm"
          />
        ) : (
          <Text fontSize="lg" fontWeight="bold">
            Total:{" "}
            {chart
              .getTotal("value")
              ?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
          </Text>
        )}
      </HStack>

      {data === undefined ? (
        <CategoryBarSegmentSkeleton />
      ) : (
        <BarSegment.Root chart={chart}>
          <BarSegment.Content>
            <BarSegment.Value />
            <BarSegment.Bar
              tooltip={({ payload }: BarSegment.TooltipProps) => (
                <Button
                  w="100%"
                  h="100%"
                  bg="transparent"
                  rounded={0}
                  onClick={() => {
                    setLocation(
                      `/dashboard/month/${params.month || today.getMonth() + 1}/year/${params.year || today.getFullYear()}/category/${payload.name}`,
                    );
                  }}
                />
              )}
            />
            <BarSegment.Label textStyle="xs" />
            {data.length === 0 && (
              <Text>No expenses found for this month.</Text>
            )}
          </BarSegment.Content>
          <BarSegment.Legend showPercent />
        </BarSegment.Root>
      )}

      <Text fontSize="sm" color="gray.500" mx="auto" w="fit-content" mt={2}>
        Data for{" "}
        {date
          ? date.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : today.toLocaleDateString("en-US", { year: "numeric" })}
      </Text>
    </>
  );
}
