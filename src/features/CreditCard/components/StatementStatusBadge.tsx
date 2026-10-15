import { Badge, Spinner } from "@chakra-ui/react";
import type { CreditCardStatementStatus } from "../../../../convex/lib/creditCardValidators";
import { isStatementInProgress, STATUS_META } from "../utils/creditCard";

export default function StatementStatusBadge({
  status,
}: {
  status: CreditCardStatementStatus;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge colorPalette={meta.colorPalette} variant="subtle" size="sm" gap={1}>
      {isStatementInProgress(status) && <Spinner size="xs" />}
      {meta.label}
    </Badge>
  );
}
