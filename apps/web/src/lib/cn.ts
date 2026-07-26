type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Küçük class birleştirici. Harici bağımlılık gerektirmez. */
export function cn(...values: ClassValue[]): string {
  const output: string[] = [];
  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) output.push(nested);
    } else {
      output.push(String(value));
    }
  }
  return output.join(" ");
}
