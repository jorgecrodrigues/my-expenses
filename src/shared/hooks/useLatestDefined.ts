import React from "react";

/**
 * Returns `value`, or the last defined value while it is undefined. Keeps a
 * Convex query result on screen while the query reloads with new arguments.
 */
export default function useLatestDefined<T>(value: T | undefined): T | undefined {
  const [latest, setLatest] = React.useState(value);
  if (value !== undefined && value !== latest) {
    setLatest(value);
  }
  return value ?? latest;
}
