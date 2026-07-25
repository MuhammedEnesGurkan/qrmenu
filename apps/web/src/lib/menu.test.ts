import { describe, expect, it } from "vitest";
import { formatMoney } from "./menu";

describe("formatMoney", () => {
  it("formats TRY values for Turkish menus", () => {
    const value = formatMoney(399, "TRY");
    expect(value).toContain("399,00");
    expect(value).toMatch(/₺|TRY/);
  });
});

