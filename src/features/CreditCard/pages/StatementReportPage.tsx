import { useMutation, useQuery } from "convex/react";
import {
  Alert,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { useLocation, useParams } from "wouter";
import { toaster } from "@/components/ui/toaster";
import { api } from "../../../../convex/_generated/api";
import AiSummary from "../components/AiSummary";
import InstallmentsTable from "../components/InstallmentsTable";
import ReportSummaryCards from "../components/ReportSummaryCards";
import StatementCategoryChart from "../components/StatementCategoryChart";
import StatementStatusBadge from "../components/StatementStatusBadge";
import TopMerchantsList from "../components/TopMerchantsList";
import TransactionsTable from "../components/TransactionsTable";
import {
  formatCents,
  formatDay,
  formatReferenceMonth,
  getTotalMismatchCents,
  isStatementInProgress,
  issuerLabel,
} from "../utils/creditCard";

export default function StatementReportPage() {
  const { statementId = "" } = useParams<{ statementId: string }>();
  const [, navigate] = useLocation();
  const data = useQuery(api.creditCardStatements.getStatementReport, {
    statementId,
  });
  const retryStatement = useMutation(api.creditCardStatements.retryStatement);

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => navigate("/credit-card")}>
      <IconArrowLeft />
      Back to statements
    </Button>
  );

  if (data === undefined) {
    return (
      <Stack gap={4} aria-label="Loading report">
        <Skeleton height="40px" width="50%" variant="shine" />
        <Skeleton height="120px" variant="shine" />
        <Skeleton height="300px" variant="shine" />
      </Stack>
    );
  }

  if (data === null) {
    return (
      <Stack gap={4} align="flex-start">
        {backButton}
        <Heading size="md">Statement not found</Heading>
        <Text color="fg.muted">
          It may have been deleted, or the link is not valid.
        </Text>
      </Stack>
    );
  }

  const { statement, report } = data;
  const mismatch = getTotalMismatchCents(statement);

  const handleRetry = async () => {
    try {
      await retryStatement({ statementId: statement._id });
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Could not process the statement again",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <Stack gap={6}>
      <Box>{backButton}</Box>
      <Stack gap={1}>
        <HStack gap={3} wrap="wrap">
          <Heading>
            {issuerLabel(statement.issuer)}{" "}
            {formatReferenceMonth(statement.referenceMonth)}
          </Heading>
          <StatementStatusBadge status={statement.status} />
        </HStack>
        <Text color="fg.muted" fontSize="sm">
          {statement.filename}
          {statement.cardLastDigits && ` · Card ending ${statement.cardLastDigits}`}
          {statement.closingDate && ` · Closed ${formatDay(statement.closingDate)}`}
          {statement.dueDate && ` · Due ${formatDay(statement.dueDate)}`}
          {statement.totalAmountCents !== undefined &&
            ` · Total ${formatCents(statement.totalAmountCents)}`}
        </Text>
      </Stack>

      {isStatementInProgress(statement.status) && (
        <Alert.Root status="info">
          <Spinner size="sm" />
          <Alert.Content>
            <Alert.Title>Analyzing statement</Alert.Title>
            <Alert.Description>
              Gemini is reading the PDF. This usually takes less than a minute
              and the report updates by itself.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {statement.status === "failed" && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>The statement could not be processed</Alert.Title>
            <Alert.Description>
              {statement.errorMessage ?? "Unexpected error."}
            </Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="surface" onClick={handleRetry}>
            <IconRefresh />
            Process again
          </Button>
        </Alert.Root>
      )}

      {report && (
        <>
          {mismatch !== null && (
            <Alert.Root status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Totals do not match</Alert.Title>
                <Alert.Description>
                  The extracted lines add up to{" "}
                  {formatCents(statement.extractedSumCents ?? 0)}, but the
                  statement total is{" "}
                  {formatCents(statement.totalAmountCents ?? 0)} (
                  {formatCents(mismatch)} difference). Some lines may be missing
                  or the total may include a previous balance; check the
                  transactions below.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          <ReportSummaryCards report={report} />

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <StatementCategoryChart categories={report.byCategory} />
            <TopMerchantsList merchants={report.topMerchants} />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <AiSummary summary={statement.aiSummary} />
            <InstallmentsTable installments={report.installments} />
          </SimpleGrid>

          <TransactionsTable
            statementId={statement._id}
            categories={report.byCategory.map((c) => c.category)}
          />
        </>
      )}
    </Stack>
  );
}
