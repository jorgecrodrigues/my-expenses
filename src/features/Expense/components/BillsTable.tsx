import React from "react";
import { useMutation } from "convex/react";
import {
  Badge,
  Box,
  Button,
  CloseButton,
  ColorSwatch,
  HStack,
  IconButton,
  Input,
  InputGroup,
  NativeSelect,
  Skeleton,
  Stack,
  Table,
  Tag,
  Text,
  Checkbox,
} from "@chakra-ui/react";
import {
  IconArrowBackUp,
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconSearch,
} from "@tabler/icons-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { toaster } from "@/components/ui/toaster";
import { formatBRL } from "@/shared/utils/currency";
import { generateColorByString } from "@/shared/utils/color";
import CreateOrEditExpenseDialog from "@/features/Expense/modals/CreateOrEditExpense";
import {
  getExpenseStatus,
  type Expense,
  type ExpenseStatus,
} from "@/features/Dashboard/utils/dashboardMetrics";
import OptionToggle from "@/shared/components/OptionToggle";
import useIsMobile from "@/shared/hooks/useIsMobile";

type StatusFilter = "all" | "open" | "overdue" | "paid";
type SortKey = "date" | "amount" | "name";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const SORT_OPTIONS: { label: string; sort: SortState }[] = [
  { label: "Due date (soonest)", sort: { key: "date", direction: "asc" } },
  { label: "Due date (latest)", sort: { key: "date", direction: "desc" } },
  { label: "Amount (highest)", sort: { key: "amount", direction: "desc" } },
  { label: "Amount (lowest)", sort: { key: "amount", direction: "asc" } },
  { label: "Name (A–Z)", sort: { key: "name", direction: "asc" } },
  { label: "Name (Z–A)", sort: { key: "name", direction: "desc" } },
];

const sortValue = ({ key, direction }: SortState) => `${key}-${direction}`;

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_BADGE: Record<
  ExpenseStatus,
  { label: string; colorPalette: string }
> = {
  paid: { label: "Paid", colorPalette: "green" },
  pending: { label: "Pending", colorPalette: "blue" },
  overdue: { label: "Overdue", colorPalette: "red" },
};

const SORT_COMPARATORS: Record<SortKey, (a: Expense, b: Expense) => number> = {
  date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  amount: (a, b) => a.amount - b.amount,
  name: (a, b) => a.name.localeCompare(b.name),
};

function matchesStatus(status: ExpenseStatus, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "open") return status !== "paid";
  return status === filter;
}

function daysFromToday(date: string, now: Date) {
  const due = new Date(date);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueDay.getTime() - today.getTime()) / DAY_MS);
}

const pluralizeBills = (count: number) =>
  `${count} ${count === 1 ? "bill" : "bills"}`;

const formatDueDate = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", { dateStyle: "medium" });

function BillStatus({
  expense,
  status,
  updating,
  onTogglePaid,
}: {
  expense: Expense;
  status: ExpenseStatus;
  updating: boolean;
  onTogglePaid: () => void;
}) {
  const badge = STATUS_BADGE[status];
  const paid = status === "paid";
  return (
    <HStack gap={1}>
      <Badge
        colorPalette={badge.colorPalette}
        variant="subtle"
        title={
          expense.paidAt
            ? `Paid on ${formatDueDate(expense.paidAt)}`
            : undefined
        }
      >
        {badge.label}
      </Badge>
      <IconButton
        size={{ base: "xs", md: "2xs" }}
        variant="ghost"
        colorPalette={paid ? "gray" : "green"}
        aria-label={`Mark ${expense.name} as ${paid ? "unpaid" : "paid"}`}
        title={paid ? "Mark as unpaid" : "Mark as paid"}
        loading={updating}
        onClick={onTogglePaid}
      >
        {paid ? <IconArrowBackUp /> : <IconCheck />}
      </IconButton>
    </HStack>
  );
}

function BillCard({
  expense,
  status,
  selected,
  updating,
  onSelectedChange,
  onTogglePaid,
  category,
  onCategoryChange,
  actions,
  now,
}: {
  expense: Expense;
  status: ExpenseStatus;
  selected: boolean;
  updating: boolean;
  onSelectedChange: (checked: boolean) => void;
  onTogglePaid: () => void;
  category?: string;
  onCategoryChange?: (category: string) => void;
  actions: React.ReactNode;
  now: Date;
}) {
  return (
    <Box
      as="li"
      borderWidth="1px"
      borderColor={selected ? "border.emphasized" : "border.subtle"}
      borderRadius="lg"
      bg={selected ? "bg.muted" : undefined}
      p={3}
      data-selected={selected ? "" : undefined}
    >
      <HStack align="flex-start" gap={3}>
        <Checkbox.Root
          size="sm"
          mt={0.5}
          checked={selected}
          onCheckedChange={(details) =>
            onSelectedChange(details.checked === true)
          }
        >
          <Checkbox.HiddenInput aria-label={`Select ${expense.name}`} />
          <Checkbox.Control />
        </Checkbox.Root>
        <Stack gap={2} flex="1" minW={0}>
          <HStack justify="space-between" align="flex-start" gap={3}>
            <Box minW={0}>
              <Text
                fontSize="sm"
                fontWeight="medium"
                truncate
                title={expense.name}
              >
                {expense.name}
              </Text>
              {expense.description && (
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  truncate
                  title={expense.description}
                >
                  {expense.description}
                </Text>
              )}
            </Box>
            <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
              {formatBRL(expense.amount)}
            </Text>
          </HStack>
          <HStack gap={2} wrap="wrap" rowGap={0}>
            <Text fontSize="xs" color="fg.muted">
              {formatDueDate(expense.date)}
            </Text>
            <DueHint expense={expense} status={status} now={now} />
          </HStack>
          <HStack justify="space-between" gap={2} wrap="wrap">
            <HStack gap={2} wrap="wrap" minW={0}>
              <BillStatus
                expense={expense}
                status={status}
                updating={updating}
                onTogglePaid={onTogglePaid}
              />
              <CategoryLabel
                category={expense.category}
                onSelect={
                  onCategoryChange && expense.category !== category
                    ? onCategoryChange
                    : undefined
                }
              />
            </HStack>
            <HStack gap={0} ms="auto">
              {actions}
            </HStack>
          </HStack>
        </Stack>
      </HStack>
    </Box>
  );
}

function DueHint({
  expense,
  status,
  now,
}: {
  expense: Expense;
  status: ExpenseStatus;
  now: Date;
}) {
  if (status === "paid") return null;
  const days = daysFromToday(expense.date, now);

  if (status === "overdue") {
    return (
      <Text fontSize="xs" color="fg.error">
        {days === 0 ? "Due today" : `${Math.abs(days)}d late`}
      </Text>
    );
  }
  if (days <= 7) {
    return (
      <Text fontSize="xs" color="fg.warning">
        {days === 0 ? "Due today" : `Due in ${days}d`}
      </Text>
    );
  }
  return null;
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  textAlign,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  textAlign?: "end";
}) {
  const active = sort.key === sortKey;
  return (
    <Table.ColumnHeader
      textAlign={textAlign}
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <Button
        size="xs"
        variant={active ? "subtle" : "ghost"}
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active &&
          (sort.direction === "asc" ? (
            <IconArrowUp size={12} />
          ) : (
            <IconArrowDown size={12} />
          ))}
      </Button>
    </Table.ColumnHeader>
  );
}

function CategoryLabel({
  category,
  onSelect,
}: {
  category: string;
  onSelect?: (category: string) => void;
}) {
  const content = (
    <>
      <ColorSwatch
        value={generateColorByString(category)}
        boxSize="2.5"
        rounded="full"
      />
      {category}
    </>
  );

  if (!onSelect) {
    return (
      <HStack gap={1.5} fontSize="sm">
        {content}
      </HStack>
    );
  }

  return (
    <Button
      size="xs"
      variant="ghost"
      fontWeight="normal"
      fontSize="sm"
      px={1.5}
      title={`Show only ${category}`}
      aria-label={`Filter by ${category}`}
      onClick={() => onSelect(category)}
    >
      {content}
    </Button>
  );
}

interface BillsTableProps {
  /** Bills to list (undefined while loading). */
  expenses?: Expense[];
  /** Period shown under the title, e.g. "March 2025". */
  monthLabel: string;
  /** Category the bills are filtered by, shown as a removable tag. */
  category?: string;
  /** Enables filtering by clicking a category; `undefined` clears it. */
  onCategoryChange?: (category: string | undefined) => void;
  /** Row actions; defaults to the edit dialog. */
  renderActions?: (expense: Expense) => React.ReactNode;
  now: Date;
}

const renderEditAction = (expense: Expense) => (
  <CreateOrEditExpenseDialog expense={expense} />
);

export default function BillsTable({
  expenses,
  monthLabel,
  category,
  onCategoryChange,
  renderActions = renderEditAction,
  now,
}: BillsTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<SortState>({
    key: "date",
    direction: "asc",
  });
  const [selectedIds, setSelectedIds] = React.useState<Set<Id<"expenses">>>(
    new Set(),
  );
  const [updatingIds, setUpdatingIds] = React.useState<Set<Id<"expenses">>>(
    new Set(),
  );

  const setExpensesPaid = useMutation(api.expenses.setExpensesPaid);
  const isMobile = useIsMobile();

  const withStatus = React.useMemo(
    () =>
      (expenses ?? []).map((expense) => ({
        expense,
        status: getExpenseStatus(expense, now),
      })),
    [expenses, now],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0,
      open: 0,
      overdue: 0,
      paid: 0,
    };
    for (const { status } of withStatus) {
      (["all", "open", "overdue", "paid"] as const).forEach((filter) => {
        if (matchesStatus(status, filter)) counts[filter] += 1;
      });
    }
    return counts;
  }, [withStatus]);

  const rows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const compare = SORT_COMPARATORS[sort.key];
    const direction = sort.direction === "asc" ? 1 : -1;

    return withStatus
      .filter(({ status }) => matchesStatus(status, statusFilter))
      .filter(
        ({ expense }) =>
          !term ||
          expense.name.toLowerCase().includes(term) ||
          expense.description?.toLowerCase().includes(term) ||
          expense.category.toLowerCase().includes(term),
      )
      .sort((a, b) => compare(a.expense, b.expense) * direction);
  }, [withStatus, search, sort, statusFilter]);

  const selectedRows = rows.filter(({ expense }) =>
    selectedIds.has(expense._id),
  );
  const selectedTotal = selectedRows.reduce(
    (sum, { expense }) => sum + expense.amount,
    0,
  );
  const rowsTotal = rows.reduce((sum, { expense }) => sum + expense.amount, 0);
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const someSelected = selectedRows.length > 0 && !allSelected;
  const isBulkUpdating = selectedRows.some(({ expense }) =>
    updatingIds.has(expense._id),
  );

  const handleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "amount" ? "desc" : "asc" },
    );

  const toggleRow = (id: Id<"expenses">, checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const { expense } of rows) {
        if (allSelected) next.delete(expense._id);
        else next.add(expense._id);
      }
      return next;
    });

  const setUpdating = (ids: Id<"expenses">[], updating: boolean) =>
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (updating) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const updatePaid = async (
    targets: Expense[],
    paid: boolean,
    { clearSelection }: { clearSelection: boolean },
  ) => {
    const ids = targets
      .filter((expense) => Boolean(expense.paidAt) !== paid)
      .map((expense) => expense._id);
    if (ids.length === 0) return;

    setUpdating(ids, true);
    try {
      await setExpensesPaid({ ids, paid });
      toaster.create({
        type: "success",
        title: `${pluralizeBills(ids.length)} marked as ${paid ? "paid" : "unpaid"}`,
        duration: 2000,
      });
      if (clearSelection) setSelectedIds(new Set());
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Failed to update bills.",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUpdating(ids, false);
    }
  };

  const toggleOnePaid = (expense: Expense, status: ExpenseStatus) =>
    updatePaid([expense], status !== "paid", { clearSelection: false });

  const emptyMessage =
    withStatus.length === 0
      ? "No bills for this month."
      : "No bills match the current filters.";

  const updateSelected = (paid: boolean) =>
    updatePaid(
      selectedRows.map(({ expense }) => expense),
      paid,
      { clearSelection: true },
    );

  const selectedUnpaid = selectedRows.filter(
    ({ status }) => status !== "paid",
  ).length;
  const selectedPaid = selectedRows.length - selectedUnpaid;

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
    >
      <HStack
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap={3}
        mb={4}
      >
        <Stack gap={0.5}>
          <Text fontSize="lg" fontWeight="bold">
            Bills
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {monthLabel}
          </Text>
        </Stack>
        <HStack gap={3} wrap="wrap">
          {category && (
            <Tag.Root size="lg" variant="subtle">
              <ColorSwatch
                value={generateColorByString(category)}
                boxSize="2.5"
                rounded="full"
              />
              <Tag.Label>{category}</Tag.Label>
              {onCategoryChange && (
                <Tag.EndElement>
                  <Tag.CloseTrigger
                    aria-label="Clear category filter"
                    onClick={() => onCategoryChange(undefined)}
                  />
                </Tag.EndElement>
              )}
            </Tag.Root>
          )}
          <OptionToggle
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: `All (${statusCounts.all})` },
              { value: "open", label: `Open (${statusCounts.open})` },
              { value: "overdue", label: `Overdue (${statusCounts.overdue})` },
              { value: "paid", label: `Paid (${statusCounts.paid})` },
            ]}
          />
          <InputGroup
            startElement={<IconSearch size={14} />}
            w={{ base: "full", md: "14rem" }}
          >
            <Input
              size="sm"
              placeholder="Search bills..."
              aria-label="Search bills"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
        </HStack>
      </HStack>

      {selectedRows.length > 0 && (
        <HStack
          justify="space-between"
          wrap="wrap"
          gap={3}
          mb={3}
          px={3}
          py={2}
          borderRadius="md"
          bg="bg.muted"
          role="status"
        >
          <Text fontSize="sm">
            <b>{selectedRows.length}</b> selected ·{" "}
            <b>{formatBRL(selectedTotal)}</b>
          </Text>
          <HStack gap={2}>
            <Button
              size="xs"
              colorPalette="green"
              loading={isBulkUpdating}
              disabled={selectedUnpaid === 0}
              onClick={() => updateSelected(true)}
            >
              Mark as paid
            </Button>
            <Button
              size="xs"
              variant="outline"
              loading={isBulkUpdating}
              disabled={selectedPaid === 0}
              onClick={() => updateSelected(false)}
            >
              Mark as unpaid
            </Button>
            <CloseButton
              size="xs"
              aria-label="Clear selection"
              onClick={() => setSelectedIds(new Set())}
            />
          </HStack>
        </HStack>
      )}

      {expenses === undefined ? (
        <Stack gap={2}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="40px" variant="shine" borderRadius="md" />
          ))}
        </Stack>
      ) : isMobile ? (
        <Stack gap={3}>
          <HStack justify="space-between" gap={3}>
            <Checkbox.Root
              size="sm"
              checked={someSelected ? "indeterminate" : allSelected}
              disabled={rows.length === 0}
              onCheckedChange={toggleAll}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label fontSize="sm" color="fg.muted">
                Select all
              </Checkbox.Label>
            </Checkbox.Root>
            <NativeSelect.Root size="sm" width="auto">
              <NativeSelect.Field
                aria-label="Sort bills"
                value={sortValue(sort)}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  const option = SORT_OPTIONS.find(
                    (item) => sortValue(item.sort) === event.target.value,
                  );
                  if (option) setSort(option.sort);
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option
                    key={sortValue(option.sort)}
                    value={sortValue(option.sort)}
                  >
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>

          {rows.length === 0 ? (
            <Text textAlign="center" py={10} color="fg.muted">
              {emptyMessage}
            </Text>
          ) : (
            <Stack as="ul" aria-label="Bills" gap={2} listStyleType="none">
              {rows.map(({ expense, status }) => (
                <BillCard
                  key={expense._id}
                  expense={expense}
                  status={status}
                  selected={selectedIds.has(expense._id)}
                  updating={updatingIds.has(expense._id)}
                  onSelectedChange={(checked) =>
                    toggleRow(expense._id, checked)
                  }
                  onTogglePaid={() => toggleOnePaid(expense, status)}
                  category={category}
                  onCategoryChange={onCategoryChange}
                  actions={renderActions(expense)}
                  now={now}
                />
              ))}
            </Stack>
          )}

          {rows.length > 0 && (
            <HStack
              justify="space-between"
              pt={3}
              borderTopWidth="1px"
              borderColor="border.subtle"
            >
              <Text color="fg.muted" fontSize="sm">
                {pluralizeBills(rows.length)}
              </Text>
              <Text fontWeight="bold">{formatBRL(rowsTotal)}</Text>
            </HStack>
          )}
        </Stack>
      ) : (
        <Table.ScrollArea>
          <Table.Root size="sm" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="1%">
                  <Checkbox.Root
                    size="sm"
                    checked={someSelected ? "indeterminate" : allSelected}
                    disabled={rows.length === 0}
                    onCheckedChange={toggleAll}
                  >
                    <Checkbox.HiddenInput aria-label="Select all bills" />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <SortableHeader
                  label="Bill"
                  sortKey="name"
                  sort={sort}
                  onSort={handleSort}
                />
                <Table.ColumnHeader>Category</Table.ColumnHeader>
                <SortableHeader
                  label="Due date"
                  sortKey="date"
                  sort={sort}
                  onSort={handleSort}
                />
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <SortableHeader
                  label="Amount"
                  sortKey="amount"
                  sort={sort}
                  onSort={handleSort}
                  textAlign="end"
                />
                <Table.ColumnHeader w="1%">
                  <Text srOnly>Actions</Text>
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map(({ expense, status }) => {
                const selected = selectedIds.has(expense._id);
                return (
                  <Table.Row
                    key={expense._id}
                    data-selected={selected ? "" : undefined}
                    bg={selected ? "bg.muted" : undefined}
                  >
                    <Table.Cell>
                      <Checkbox.Root
                        size="sm"
                        checked={selected}
                        onCheckedChange={(details) =>
                          toggleRow(expense._id, details.checked === true)
                        }
                      >
                        <Checkbox.HiddenInput
                          aria-label={`Select ${expense.name}`}
                        />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                    <Table.Cell maxW="18rem">
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        truncate
                        title={expense.name}
                      >
                        {expense.name}
                      </Text>
                      {expense.description && (
                        <Text
                          fontSize="xs"
                          color="fg.muted"
                          truncate
                          title={expense.description}
                        >
                          {expense.description}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <CategoryLabel
                        category={expense.category}
                        onSelect={
                          onCategoryChange && expense.category !== category
                            ? onCategoryChange
                            : undefined
                        }
                      />
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap">
                      <Text fontSize="sm">{formatDueDate(expense.date)}</Text>
                      <DueHint expense={expense} status={status} now={now} />
                    </Table.Cell>
                    <Table.Cell>
                      <BillStatus
                        expense={expense}
                        status={status}
                        updating={updatingIds.has(expense._id)}
                        onTogglePaid={() => toggleOnePaid(expense, status)}
                      />
                    </Table.Cell>
                    <Table.Cell
                      textAlign="end"
                      fontWeight="semibold"
                      whiteSpace="nowrap"
                    >
                      {formatBRL(expense.amount)}
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={0}>{renderActions(expense)}</HStack>
                    </Table.Cell>
                  </Table.Row>
                );
              })}

              {rows.length === 0 && (
                <Table.Row>
                  <Table.Cell
                    colSpan={7}
                    textAlign="center"
                    py={10}
                    color="fg.muted"
                  >
                    {emptyMessage}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
            {rows.length > 0 && (
              <Table.Footer>
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" fontSize="sm">
                    {pluralizeBills(rows.length)}
                  </Table.Cell>
                  <Table.Cell
                    textAlign="end"
                    fontWeight="bold"
                    whiteSpace="nowrap"
                  >
                    {formatBRL(rowsTotal)}
                  </Table.Cell>
                  <Table.Cell />
                </Table.Row>
              </Table.Footer>
            )}
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Box>
  );
}
