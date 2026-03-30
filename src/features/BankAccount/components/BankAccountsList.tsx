"use client";

import React from "react";
import { usePaginatedQuery } from "convex/react";
import {
  Badge,
  Button,
  HStack,
  Input,
  Separator,
  Skeleton,
  SkeletonCircle,
  Table,
  Text,
} from "@chakra-ui/react";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { IconArrowDown } from "@tabler/icons-react";
import CreateOrEditBankAccountDialog from "../modals/CreateOrEditBankAccount";
import RemoveBankAccountDialog from "../modals/RemoveBankAccount";
import {
  generateColorByString,
  getContrastingTextColor,
} from "@/shared/utils/color";

type SortField =
  | "accountName"
  | "accountType"
  | "accountAmount"
  | "_creationTime";

export default function BankAccountsList() {
  const [search, setSearch] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<SortField | undefined>(undefined);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [perPage] = React.useState<number>(15);

  const { ref, entry } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: "0px",
  });

  const { results, status, loadMore } = usePaginatedQuery(
    api.bankAccounts.getBankAccounts,
    {},
    { initialNumItems: perPage },
  );

  const onSortBy = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSortBy = (a: Doc<"bankAccounts">, b: Doc<"bankAccounts">) => {
    if (!sortBy) return 0;

    const fieldA = a[sortBy] ?? a._creationTime;
    const fieldB = b[sortBy] ?? b._creationTime;

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;

    return 0;
  };

  const filtered = results
    ?.filter((account) => {
      if (!search) return true;
      return (
        account.accountName?.toLowerCase().includes(search) ||
        account.accountNumber?.toLowerCase().includes(search) ||
        account.accountType?.toLowerCase().includes(search)
      );
    })
    ?.sort(handleSortBy);

  const totalBalance = filtered?.reduce(
    (acc, account) => acc + (account.accountAmount ?? 0),
    0,
  );

  React.useEffect(() => {
    if (entry?.isIntersecting && status === "CanLoadMore") {
      loadMore(perPage);
    }
  }, [entry?.isIntersecting, status, loadMore, perPage]);

  return (
    <>
      <HStack mb={4} justifyContent="flex-end" alignItems="center">
        <Input
          variant="outline"
          placeholder="Search accounts..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value.toLowerCase())
          }
        />
        <Separator orientation="vertical" mx={4} height={4} />
        <CreateOrEditBankAccountDialog />
      </HStack>

      <Table.Root size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              <Button
                aria-label="Sort by Name"
                variant={sortBy === "accountName" ? "solid" : "subtle"}
                size="sm"
                onClick={() => onSortBy("accountName")}
              >
                Name
                <IconArrowDown
                  style={{
                    transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
                    display: sortBy === "accountName" ? "inline" : "none",
                  }}
                />
              </Button>
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Button
                aria-label="Sort by Type"
                variant={sortBy === "accountType" ? "solid" : "subtle"}
                size="sm"
                onClick={() => onSortBy("accountType")}
              >
                Type
                <IconArrowDown
                  style={{
                    transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
                    display: sortBy === "accountType" ? "inline" : "none",
                  }}
                />
              </Button>
            </Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">Number</Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">Agency</Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">Digit</Table.ColumnHeader>
            <Table.ColumnHeader>
              <Button
                aria-label="Sort by Balance"
                variant={sortBy === "accountAmount" ? "solid" : "subtle"}
                size="sm"
                onClick={() => onSortBy("accountAmount")}
              >
                Balance
                <IconArrowDown
                  style={{
                    transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
                    display: sortBy === "accountAmount" ? "inline" : "none",
                  }}
                />
              </Button>
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <Button
                aria-label="Sort by Created At"
                variant={sortBy === "_creationTime" ? "solid" : "subtle"}
                size="sm"
                onClick={() => onSortBy("_creationTime")}
              >
                Created At
                <IconArrowDown
                  style={{
                    transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
                    display: sortBy === "_creationTime" ? "inline" : "none",
                  }}
                />
              </Button>
            </Table.ColumnHeader>
            <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filtered?.map((account) => (
            <Table.Row key={account._id}>
              <Table.Cell fontSize="xs">
                {account.accountName ?? "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs">
                {account.accountType ? (
                  <Badge
                    bg={generateColorByString(account.accountType)}
                    variant="surface"
                    size="sm"
                    color={getContrastingTextColor(
                      generateColorByString(account.accountType),
                    )}
                  >
                    {account.accountType}
                  </Badge>
                ) : (
                  "-"
                )}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle">
                {account.accountNumber ?? "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle">
                {account.accountAgency ?? "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle">
                {account.accountDigit ?? "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle">
                {account.accountAmount != null
                  ? account.accountAmount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                  : "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="fg.subtle" whiteSpace="nowrap">
                {new Date(account._creationTime).toLocaleString("pt-BR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Table.Cell>
              <Table.Cell>
                <HStack>
                  <CreateOrEditBankAccountDialog account={account} />
                  <RemoveBankAccountDialog account={account} />
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}

          <Table.Row>
            <Table.Cell
              colSpan={8}
              fontSize="lg"
              fontWeight="bold"
              textAlign="left"
            >
              <Text color="fg.accent" fontSize="md" fontWeight="bold">
                Total Balance:
                <Text as="span" ml={2} color="fg.accent">
                  {(totalBalance ?? 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              </Text>
            </Table.Cell>
          </Table.Row>

          {status === "LoadingFirstPage" ? (
            <>
              {Array.from({ length: 10 }).map((_, index) => (
                <Table.Row key={index}>
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Skeleton variant="shine" height="20px" />
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    <HStack gap={7}>
                      <SkeletonCircle size={6} />
                      <SkeletonCircle size={6} />
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </>
          ) : null}

          {status === "CanLoadMore" ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                <Button variant="surface" onClick={() => loadMore(perPage)}>
                  Load More
                </Button>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {status === "LoadingMore" ? (
            <Table.Row>
              {Array.from({ length: 7 }).map((_, cellIndex) => (
                <Table.Cell key={cellIndex}>
                  <Skeleton variant="shine" height="20px" />
                </Table.Cell>
              ))}
              <Table.Cell>
                <HStack gap={7}>
                  <SkeletonCircle size={6} />
                  <SkeletonCircle size={6} />
                </HStack>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {status === "Exhausted" ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                <Badge variant="outline" size="md">
                  No more accounts to load.
                </Badge>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {results && results.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                No accounts found. Please add a new account.
              </Table.Cell>
            </Table.Row>
          ) : null}
        </Table.Body>
      </Table.Root>

      <div ref={ref} />
    </>
  );
}
