/**
 * Checks if a given Date object is valid.
 * @param date - The Date object to validate.
 * @returns True if the date is valid, false otherwise.
 */
export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};
