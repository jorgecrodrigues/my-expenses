import React from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { IconRefresh, IconReportAnalytics } from "@tabler/icons-react";
import { useLocation } from "wouter";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import useIsMobile from "@/shared/hooks/useIsMobile";
import { toaster } from "@/components/ui/toaster";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import RemoveStatementDialog from "../modals/RemoveStatement";
import StatementStatusBadge from "./StatementStatusBadge";
import {
  formatCents,
  formatDay,
  formatReferenceMonth,
  issuerLabel,
} from "../utils/creditCard";

const PER_PAGE = 15;
const COLUMNS = 6;

function StatementActions({
  statement,
  onView,
  onRetry,
}: {
  statement: Doc<"creditCardStatements">;
  onView: () => void;
  onRetry: () => void;
}) {
  return (
    <HStack gap={1}>
      {statement.status === "completed" && (
        <IconButton
          aria-label="View report"
          title="View report"
          variant="ghost"
          size="sm"
          onClick={onView}
        >
          <IconReportAnalytics />
        </IconButton>
      )}
      {statement.status === "failed" && (
        <IconButton
          aria-label="Process again"
          title="Process again"
          variant="ghost"
          size="sm"
          onClick={onRetry}
        >
          <IconRefresh />
        </IconButton>
      )}
      <RemoveStatementDialog statement={statement} />
    </HStack>
  );
}

const formatTotal = (statement: Doc<"creditCardStatements">) =>
  statement.totalAmountCents !== undefined
    ? formatCents(statement.totalAmountCents)
    : "-";

export default function StatementsList() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const retryStatement = useMutation(api.creditCardStatements.retryStatement);
  const { ref, entry } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: "0px",
  });
  const { results, status, loadMore } = usePaginatedQuery(
    api.creditCardStatements.listStatements,
    {},
    { initialNumItems: PER_PAGE },
  );

  React.useEffect(() => {
    if (entry?.isIntersecting && status === "CanLoadMore") {
      loadMore(PER_PAGE);
    }
  }, [entry?.isIntersecting, status, loadMore]);

  const handleRetry = async (statementId: Id<"creditCardStatements">) => {
    try {
      await retryStatement({ statementId });
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Could not process the statement again",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const renderActions = (statement: Doc<"creditCardStatements">) => (
    <StatementActions
      statement={statement}
      onView={() => navigate(`/credit-card/statements/${statement._id}`)}
      onRetry={() => handleRetry(statement._id)}
    />
  );

  const isLoading = status === "LoadingFirstPage" || status === "LoadingMore";
  const loadMoreButton = status === "CanLoadMore" && (
    <Button variant="surface" onClick={() => loadMore(PER_PAGE)}>
      Load More
    </Button>
  );
  const emptyState = status === "Exhausted" && results.length === 0 && (
    <Badge variant="outline" size="md" whiteSpace="normal">
      No statements yet. Upload a Nubank or Inter PDF above.
    </Badge>
  );

  if (isMobile) {
    return (
      <>
        <Stack gap={2}>
          {results.length > 0 && (
            <Stack as="ul" aria-label="Statements" gap={2} listStyleType="none">
              {results.map((statement) => (
                <Box
                  as="li"
                  key={statement._id}
                  borderWidth="1px"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  bg="bg.panel"
                  p={3}
                >
                  <HStack justify="space-between" align="flex-start" gap={3}>
                    <Stack gap={0.5} minW={0}>
                      <HStack gap={2} wrap="wrap">
                        <Text fontSize="sm" fontWeight="medium">
                          {formatReferenceMonth(statement.referenceMonth)}
                        </Text>
                        <StatementStatusBadge status={statement.status} />
                      </HStack>
                      <Text fontSize="xs" color="fg.muted">
                        {issuerLabel(statement.issuer)}
                        {statement.dueDate &&
                          ` · Due ${formatDay(statement.dueDate)}`}
                      </Text>
                      <Text fontSize="xs" color="fg.subtle" truncate>
                        {statement.filename}
                      </Text>
                    </Stack>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      whiteSpace="nowrap"
                    >
                      {formatTotal(statement)}
                    </Text>
                  </HStack>
                  {statement.status === "failed" && statement.errorMessage && (
                    <Text fontSize="xs" color="fg.error" mt={2}>
                      {statement.errorMessage}
                    </Text>
                  )}
                  <HStack justify="flex-end" mt={1}>
                    {renderActions(statement)}
                  </HStack>
                </Box>
              ))}
            </Stack>
          )}
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant="shine" height="88px" />
            ))}
          {loadMoreButton}
          {emptyState}
        </Stack>
        <div ref={ref} />
      </>
    );
  }

  return (
    <>
      <Table.ScrollArea>
        <Table.Root size="sm" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Statement</Table.ColumnHeader>
              <Table.ColumnHeader>Issuer</Table.ColumnHeader>
              <Table.ColumnHeader>Due date</Table.ColumnHeader>
              <Table.ColumnHeader>Total</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {results.map((statement) => (
              <Table.Row key={statement._id}>
                <Table.Cell fontSize="xs">
                  <Text fontWeight="medium">
                    {formatReferenceMonth(statement.referenceMonth)}
                  </Text>
                  <Text color="fg.muted" truncate maxW="xs">
                    {statement.filename}
                  </Text>
                </Table.Cell>
                <Table.Cell fontSize="xs">
                  {issuerLabel(statement.issuer)}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {formatDay(statement.dueDate)}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {formatTotal(statement)}
                </Table.Cell>
                <Table.Cell fontSize="xs">
                  <StatementStatusBadge status={statement.status} />
                  {statement.status === "failed" && statement.errorMessage && (
                    <Text color="fg.error" mt={1} maxW="sm">
                      {statement.errorMessage}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>{renderActions(statement)}</Table.Cell>
              </Table.Row>
            ))}

            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Table.Row key={`skeleton-${index}`}>
                  {Array.from({ length: COLUMNS }).map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Skeleton variant="shine" height="20px" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}

            {loadMoreButton && (
              <Table.Row>
                <Table.Cell colSpan={COLUMNS}>{loadMoreButton}</Table.Cell>
              </Table.Row>
            )}

            {emptyState && (
              <Table.Row>
                <Table.Cell colSpan={COLUMNS}>{emptyState}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <div ref={ref} />
    </>
  );
}
