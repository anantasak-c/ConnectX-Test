import { describe, expect, it } from "vitest";
import { getCopy, languages } from "./i18n";

describe("i18n copy", () => {
  it("supports Thai and English labels for the executive dashboard", () => {
    expect(languages).toEqual(["en", "th"]);
    expect(getCopy("en").pageTitle).toBe("HR Cost & Bonus Dashboard");
    expect(getCopy("th").eyebrow).toBe("Executive Compensation Analytics");
    expect(getCopy("th").pageTitle).toBe("HR Cost & Bonus Dashboard");
    expect(getCopy("th").kpis.totalIncome).toBe("รายได้รวม");
  });

  it("falls back to English for unsupported language values", () => {
    expect(getCopy("jp").loading).toBe("Loading compensation analytics...");
  });
});
