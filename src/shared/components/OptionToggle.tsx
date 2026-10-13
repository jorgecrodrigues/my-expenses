import { Button, ButtonGroup } from "@chakra-ui/react";

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface OptionToggleProps<T extends string> {
  label: string;
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
}

export default function OptionToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: OptionToggleProps<T>) {
  return (
    <ButtonGroup
      size="xs"
      variant="outline"
      attached
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Button
            key={option.value}
            variant={active ? "solid" : "outline"}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
