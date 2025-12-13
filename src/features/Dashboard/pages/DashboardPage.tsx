import React from "react";
import { Button, HStack, Input } from "@chakra-ui/react";
import CategoryBarSegment from "../components/CategoryBarSegment";

export default function DashboardPage() {
  const [date, setDate] = React.useState<Date>(new Date());

  const handlePreviousMonth = () => {
    const prevMonth = new Date(
      date.getFullYear(),
      date.getMonth() - 1,
      date.getDate()
    );
    setDate(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    setDate(nextMonth);
  };

  return (
    <>
      <HStack mb={4} gap="md" justify="space-between">
        <div>
          <h2>Dashboard Page</h2>
          <p>Welcome to the Dashboard!</p>
        </div>
        <div>
          <HStack>
            <Input
              variant="outline"
              type="date"
              value={date.toISOString().slice(0, 10)}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
            <Button variant="surface" onClick={handlePreviousMonth}>
              Mês Anterior
            </Button>
            <Button variant="surface" onClick={handleNextMonth}>
              Próximo Mês
            </Button>
          </HStack>
        </div>
      </HStack>

      <CategoryBarSegment date={date} />
    </>
  );
}
