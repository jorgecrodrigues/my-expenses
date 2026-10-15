import React from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import {
  Badge,
  Button,
  HStack,
  IconButton,
  Skeleton,
  Table,
  Text,
} from "@chakra-ui/react";
import { IconRefresh, IconReportAnalytics } from "@tabler/icons-react";
import { useLocation } from "wouter";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import { toaster } from "@/components/ui/toaster";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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

export default function StatementsList() {
  const [, navigate] = useLocation();
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

  return (
    <>
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
              <Table.Cell fontSize="xs">{issuerLabel(statement.issuer)}</Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle">
                {formatDay(statement.dueDate)}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle">
                {statement.totalAmountCents !== undefined
                  ? formatCents(statement.totalAmountCents)
                  : "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs">
                <StatementStatusBadge status={statement.status} />
                {statement.status === "failed" && statement.errorMessage && (
                  <Text color="fg.error" mt={1} maxW="sm">
                    {statement.errorMessage}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  {statement.status === "completed" && (
                    <IconButton
                      aria-label="View report"
                      title="View report"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/credit-card/statements/${statement._id}`)
                      }
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
                      onClick={() => handleRetry(statement._id)}
                    >
                      <IconRefresh />
                    </IconButton>
                  )}
                  <RemoveStatementDialog statement={statement} />
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}

          {status === "LoadingFirstPage" || status === "LoadingMore"
            ? Array.from({ length: 3 }).map((_, index) => (
                <Table.Row key={`skeleton-${index}`}>
                  {Array.from({ length: COLUMNS }).map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Skeleton variant="shine" height="20px" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            : null}

          {status === "CanLoadMore" ? (
            <Table.Row>
              <Table.Cell colSpan={COLUMNS}>
                <Button variant="surface" onClick={() => loadMore(PER_PAGE)}>
                  Load More
                </Button>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {status === "Exhausted" && results.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={COLUMNS}>
                <Badge variant="outline" size="md">
                  No statements yet. Upload a Nubank or Inter PDF above.
                </Badge>
              </Table.Cell>
            </Table.Row>
          ) : null}
        </Table.Body>
      </Table.Root>
      <div ref={ref} />
    </>
  );
}
