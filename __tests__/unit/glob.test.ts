import { matchesAnyGlob, matchesGlob } from "@/lib/utils";

const cases: ReadonlyArray<readonly [string, string, boolean]> = [
  ["models/**/*.sql", "models/marts/facts/fct_orders.sql", true],
  ["models/marts/facts/**/*.sql", "models/marts/facts/fct_orders.sql", true],
  ["models/**/*.sql", "seeds/raw/customers.csv", false],
  ["*.sql", "models/fct_orders.sql", false],
  ["models/*.sql", "models/fct_orders.sql", true],
  ["schemas/**/*.avsc", "schemas/orders.avsc", true],
  ["schemas/**/*.avsc", "protos/orders.proto", false],
  ["**/*.{py,ts,js}", "src/app.py", true],
  ["**/*.{py,ts,js}", "lib/client.ts", true],
  ["**/*.{py,ts,js}", "public/app.js", true],
  ["**/*.{py,ts,js}", "styles/app.css", false],
  ["tests/**/*.py", "tests/test_audit.py", true],
  ["tests/**/test_*.py", "tests/unit/test_spec_parity.py", true],
];

describe("matchesGlob", () => {
  it.each(cases)("matches %s against %s => %s", (glob: string, filePath: string, expected: boolean) => {
    expect(matchesGlob(glob, filePath)).toBe(expected);
  });

  it("supports Windows-style separators", () => {
    expect(
      matchesGlob("models/**/*.sql", "models\\marts\\facts\\fct_orders.sql"),
    ).toBe(true);
  });

  it("matchesAnyGlob returns true when any pattern matches", () => {
    expect(
      matchesAnyGlob("models/marts/facts/fct_orders.sql", [
        "seeds/**/*.csv",
        "models/**/*.sql",
      ]),
    ).toBe(true);
  });
});