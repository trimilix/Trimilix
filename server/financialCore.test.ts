import { describe, expect, it } from "vitest";
import {
  MAX_PROJECTION_MONTHS,
  calculateCompoundingProjection,
  calculateHoldingValueCents,
  calculateValueWeightedPortfolioRisk,
  eurosToCentsHalfUp,
  percentageToBasisPointsHalfUp,
} from "@shared/finance/financialCore";

describe("financial core rounding contracts", () => {
  it("converts euros to cents using explicit half-up rounding", () => {
    expect(eurosToCentsHalfUp(1.005)).toBe(101);
    expect(eurosToCentsHalfUp(1.004)).toBe(100);
    expect(eurosToCentsHalfUp(0)).toBe(0);
  });

  it("converts percentage input to integer basis points half-up", () => {
    expect(percentageToBasisPointsHalfUp(7.125)).toBe(713);
    expect(percentageToBasisPointsHalfUp(7.124)).toBe(712);
    expect(percentageToBasisPointsHalfUp(-1.125)).toBe(-113);
  });

  it("rejects non-finite conversion inputs", () => {
    expect(() => eurosToCentsHalfUp(Number.NaN)).toThrow(/finite/);
    expect(() => percentageToBasisPointsHalfUp(Number.POSITIVE_INFINITY)).toThrow(
      /finite/,
    );
  });
});

describe("monthly compound growth with end-of-month contributions", () => {
  it("matches the OpenStax monthly compound-interest reference case", () => {
    const result = calculateCompoundingProjection({
      initialCents: 500_000,
      monthlyContributionCents: 0,
      annualReturnBps: 380,
      months: 60,
    });

    expect(result.finalBalanceCents).toBe(604_443);
    expect(result.totalContributedCents).toBe(500_000);
    expect(result.totalGainCents).toBe(104_443);
  });

  it("matches an independently calculated ordinary-annuity reference case", () => {
    const result = calculateCompoundingProjection({
      initialCents: 100_000,
      monthlyContributionCents: 10_000,
      annualReturnBps: 1_200,
      months: 12,
    });

    // Closed-form reference: P(1+i)^n + PMT(((1+i)^n-1)/i), i = 0.12/12.
    expect(result.finalBalanceCents).toBe(239_508);
    expect(result.totalContributedCents).toBe(220_000);
    expect(result.totalGainCents).toBe(19_508);
  });

  it("adds contributions without gain when the return is zero", () => {
    const result = calculateCompoundingProjection({
      initialCents: 100_000,
      monthlyContributionCents: 10_000,
      annualReturnBps: 0,
      months: 12,
    });

    expect(result.finalBalanceCents).toBe(220_000);
    expect(result.totalGainCents).toBe(0);
  });

  it("retains the opening amount for a zero-month projection", () => {
    const result = calculateCompoundingProjection({
      initialCents: 123_456,
      monthlyContributionCents: 99,
      annualReturnBps: 700,
      months: 0,
    });

    expect(result).toEqual({
      finalBalanceCents: 123_456,
      totalContributedCents: 123_456,
      totalGainCents: 0,
      points: [{ month: 0, balanceCents: 123_456, contributedCents: 123_456 }],
    });
  });

  it("supports a negative nominal annual return without fabricating gains", () => {
    const result = calculateCompoundingProjection({
      initialCents: 100_000,
      monthlyContributionCents: 0,
      annualReturnBps: -1_200,
      months: 12,
    });

    expect(result.finalBalanceCents).toBe(88_638);
    expect(result.totalGainCents).toBe(-11_362);
  });

  it("accepts the documented maximum horizon when growth is bounded", () => {
    const result = calculateCompoundingProjection({
      initialCents: 1,
      monthlyContributionCents: 1,
      annualReturnBps: 0,
      months: MAX_PROJECTION_MONTHS,
    });

    expect(result.finalBalanceCents).toBe(1_201);
    expect(result.points.at(-1)?.month).toBe(MAX_PROJECTION_MONTHS);
  });

  it.each([
    { field: "negative money", input: { initialCents: -1, monthlyContributionCents: 0, annualReturnBps: 0, months: 1 } },
    { field: "fractional cents", input: { initialCents: 1.5, monthlyContributionCents: 0, annualReturnBps: 0, months: 1 } },
    { field: "return below minimum", input: { initialCents: 0, monthlyContributionCents: 0, annualReturnBps: -10_001, months: 1 } },
    { field: "return above maximum", input: { initialCents: 0, monthlyContributionCents: 0, annualReturnBps: 10_001, months: 1 } },
    { field: "negative horizon", input: { initialCents: 0, monthlyContributionCents: 0, annualReturnBps: 0, months: -1 } },
    { field: "horizon above maximum", input: { initialCents: 0, monthlyContributionCents: 0, annualReturnBps: 0, months: MAX_PROJECTION_MONTHS + 1 } },
  ])("rejects $field", ({ input }) => {
    expect(() => calculateCompoundingProjection(input)).toThrow(RangeError);
  });
});

describe("holding valuation", () => {
  it("multiplies integer shares and cent prices without float drift", () => {
    expect(calculateHoldingValueCents(17, 12_345)).toBe(209_865);
  });

  it("rejects negative or fractional shares", () => {
    expect(() => calculateHoldingValueCents(-1, 100)).toThrow(RangeError);
    expect(() => calculateHoldingValueCents(1.5, 100)).toThrow(RangeError);
  });
});

describe("value-weighted portfolio risk", () => {
  it("weights risk by holding value and returns a value distribution", () => {
    const result = calculateValueWeightedPortfolioRisk([
      { ticker: "LOW", valueCents: 10_000, riskScore: 1 },
      { ticker: "HIGH", valueCents: 90_000, riskScore: 5 },
    ]);

    expect(result).toEqual({
      status: "complete",
      score: 4.6,
      missingTickers: [],
      invalidTickers: [],
      distribution: [
        { category: "Laag risico", value: 10 },
        { category: "Matig risico", value: 0 },
        { category: "Hoog risico", value: 90 },
      ],
    });
  });

  it("blocks the score when a positive-value holding has missing data", () => {
    const result = calculateValueWeightedPortfolioRisk([
      { ticker: "KNOWN", valueCents: 10_000, riskScore: 2 },
      { ticker: "MISSING", valueCents: 90_000, riskScore: null },
    ]);

    expect(result.status).toBe("incomplete");
    expect(result.score).toBeNull();
    expect(result.missingTickers).toEqual(["MISSING"]);
    expect(result.distribution).toEqual([]);
  });

  it("blocks invalid scores instead of clipping or defaulting them", () => {
    const result = calculateValueWeightedPortfolioRisk([
      { ticker: "TOO_HIGH", valueCents: 10_000, riskScore: 6 },
      { ticker: "FRACTIONAL", valueCents: 10_000, riskScore: 2.5 },
    ]);

    expect(result.status).toBe("incomplete");
    expect(result.invalidTickers).toEqual(["FRACTIONAL", "TOO_HIGH"]);
    expect(result.score).toBeNull();
  });

  it("ignores missing risk data on zero-value rows", () => {
    const result = calculateValueWeightedPortfolioRisk([
      { ticker: "ZERO", valueCents: 0, riskScore: null },
      { ticker: "LIVE", valueCents: 25_000, riskScore: 3 },
    ]);

    expect(result.status).toBe("complete");
    expect(result.score).toBe(3);
  });

  it("returns an explicit empty state when there is no positive exposure", () => {
    expect(
      calculateValueWeightedPortfolioRisk([
        { ticker: "ZERO", valueCents: 0, riskScore: null },
      ]),
    ).toEqual({
      status: "empty",
      score: null,
      missingTickers: [],
      invalidTickers: [],
      distribution: [],
    });
  });

  it("rejects unsafe or negative holding values", () => {
    expect(() =>
      calculateValueWeightedPortfolioRisk([
        { ticker: "NEG", valueCents: -1, riskScore: 3 },
      ]),
    ).toThrow(RangeError);
  });
});
