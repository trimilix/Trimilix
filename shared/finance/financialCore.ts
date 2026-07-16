import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

export const MONEY_SCALE = 100;
export const BASIS_POINTS_PER_PERCENT = 100;
export const BASIS_POINTS_PER_UNIT = 10_000;
export const MONTHS_PER_YEAR = 12;
export const MAX_PROJECTION_MONTHS = 1_200;
export const MIN_ANNUAL_RETURN_BPS = -10_000;
export const MAX_ANNUAL_RETURN_BPS = 10_000;
export const MAX_INPUT_MONEY_CENTS = 1_000_000_000_000;
const MAX_SAFE_OUTPUT_CENTS = Number.MAX_SAFE_INTEGER;

export type CompoundingProjectionInput = {
  initialCents: number;
  monthlyContributionCents: number;
  annualReturnBps: number;
  months: number;
};

export type CompoundingProjectionPoint = {
  month: number;
  balanceCents: number;
  contributedCents: number;
};

export type CompoundingProjection = {
  finalBalanceCents: number;
  totalContributedCents: number;
  totalGainCents: number;
  points: CompoundingProjectionPoint[];
};

export type PortfolioRiskHolding = {
  ticker: string;
  valueCents: number;
  riskScore: number | null | undefined;
};

export type PortfolioRiskResult =
  | {
      status: "empty";
      score: null;
      missingTickers: string[];
      invalidTickers: string[];
      distribution: [];
    }
  | {
      status: "incomplete";
      score: null;
      missingTickers: string[];
      invalidTickers: string[];
      distribution: [];
    }
  | {
      status: "complete";
      score: number;
      missingTickers: [];
      invalidTickers: [];
      distribution: Array<{
        category: "Laag risico" | "Matig risico" | "Hoog risico";
        value: number;
      }>;
    };

function assertSafeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${field} must be a safe integer`);
  }
}

function assertMoneyInput(value: number, field: string) {
  assertSafeInteger(value, field);
  if (value < 0 || value > MAX_INPUT_MONEY_CENTS) {
    throw new RangeError(`${field} must be between 0 and ${MAX_INPUT_MONEY_CENTS} cents`);
  }
}

function toRoundedSafeCents(value: Decimal, field: string): number {
  const rounded = value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  if (rounded.isNegative() || rounded.greaterThan(MAX_SAFE_OUTPUT_CENTS)) {
    throw new RangeError(`${field} is outside the supported cent range`);
  }

  const cents = rounded.toNumber();
  assertSafeInteger(cents, field);
  return cents;
}

function roundPercentage(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculates monthly compound growth using an ordinary-annuity convention:
 * interest accrues over the opening balance and the contribution is added at
 * the end of the month. Fractional cents are retained internally; only public
 * output boundaries are rounded half-up to whole eurocents.
 */
export function calculateCompoundingProjection(
  input: CompoundingProjectionInput,
): CompoundingProjection {
  assertMoneyInput(input.initialCents, "initialCents");
  assertMoneyInput(input.monthlyContributionCents, "monthlyContributionCents");
  assertSafeInteger(input.annualReturnBps, "annualReturnBps");
  assertSafeInteger(input.months, "months");

  if (
    input.annualReturnBps < MIN_ANNUAL_RETURN_BPS ||
    input.annualReturnBps > MAX_ANNUAL_RETURN_BPS
  ) {
    throw new RangeError(
      `annualReturnBps must be between ${MIN_ANNUAL_RETURN_BPS} and ${MAX_ANNUAL_RETURN_BPS}`,
    );
  }
  if (input.months < 0 || input.months > MAX_PROJECTION_MONTHS) {
    throw new RangeError(`months must be between 0 and ${MAX_PROJECTION_MONTHS}`);
  }

  const monthlyRate = new Decimal(input.annualReturnBps)
    .div(BASIS_POINTS_PER_UNIT)
    .div(MONTHS_PER_YEAR);
  const growthFactor = new Decimal(1).plus(monthlyRate);
  const monthlyContribution = new Decimal(input.monthlyContributionCents);
  let balance = new Decimal(input.initialCents);
  let contributed = new Decimal(input.initialCents);
  const points: CompoundingProjectionPoint[] = [
    {
      month: 0,
      balanceCents: toRoundedSafeCents(balance, "balanceCents"),
      contributedCents: toRoundedSafeCents(contributed, "contributedCents"),
    },
  ];

  for (let month = 1; month <= input.months; month += 1) {
    balance = balance.times(growthFactor).plus(monthlyContribution);
    contributed = contributed.plus(monthlyContribution);

    if (month % MONTHS_PER_YEAR === 0 || month === input.months) {
      points.push({
        month,
        balanceCents: toRoundedSafeCents(balance, "balanceCents"),
        contributedCents: toRoundedSafeCents(contributed, "contributedCents"),
      });
    }
  }

  const finalBalanceCents = toRoundedSafeCents(balance, "finalBalanceCents");
  const totalContributedCents = toRoundedSafeCents(
    contributed,
    "totalContributedCents",
  );

  return {
    finalBalanceCents,
    totalContributedCents,
    totalGainCents: finalBalanceCents - totalContributedCents,
    points,
  };
}

/** Converts a euro amount to whole cents using explicit half-up rounding. */
export function eurosToCentsHalfUp(euros: number): number {
  if (!Number.isFinite(euros)) {
    throw new RangeError("euros must be finite");
  }
  return toRoundedSafeCents(
    new Decimal(euros.toString()).times(MONEY_SCALE),
    "euroCents",
  );
}

/** Converts a percentage to integer basis points using half-up rounding. */
export function percentageToBasisPointsHalfUp(percentage: number): number {
  if (!Number.isFinite(percentage)) {
    throw new RangeError("percentage must be finite");
  }
  const bps = new Decimal(percentage.toString())
    .times(BASIS_POINTS_PER_PERCENT)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
  assertSafeInteger(bps, "basisPoints");
  return bps;
}

/** Multiplies integer shares by an integer cent price without float drift. */
export function calculateHoldingValueCents(shares: number, priceCents: number): number {
  assertSafeInteger(shares, "shares");
  assertMoneyInput(priceCents, "priceCents");
  if (shares < 0) {
    throw new RangeError("shares must not be negative");
  }

  return toRoundedSafeCents(
    new Decimal(shares).times(priceCents),
    "holdingValueCents",
  );
}

/**
 * Produces a value-weighted educational 1–5 Trimilix risk indicator. Any
 * positive-value holding with missing or invalid risk data blocks the score;
 * the function never substitutes a default or silently drops that holding.
 */
export function calculateValueWeightedPortfolioRisk(
  holdings: PortfolioRiskHolding[],
): PortfolioRiskResult {
  const positiveHoldings = holdings.filter(holding => {
    assertMoneyInput(holding.valueCents, `valueCents:${holding.ticker}`);
    return holding.valueCents > 0;
  });

  if (positiveHoldings.length === 0) {
    return {
      status: "empty",
      score: null,
      missingTickers: [],
      invalidTickers: [],
      distribution: [],
    };
  }

  const missingTickers: string[] = [];
  const invalidTickers: string[] = [];

  for (const holding of positiveHoldings) {
    if (holding.riskScore == null) {
      missingTickers.push(holding.ticker);
    } else if (
      !Number.isInteger(holding.riskScore) ||
      holding.riskScore < 1 ||
      holding.riskScore > 5
    ) {
      invalidTickers.push(holding.ticker);
    }
  }

  if (missingTickers.length > 0 || invalidTickers.length > 0) {
    return {
      status: "incomplete",
      score: null,
      missingTickers: Array.from(new Set(missingTickers)).sort(),
      invalidTickers: Array.from(new Set(invalidTickers)).sort(),
      distribution: [],
    };
  }

  const totalValue = positiveHoldings.reduce(
    (sum, holding) => sum.plus(holding.valueCents),
    new Decimal(0),
  );
  const weightedScore = positiveHoldings.reduce(
    (sum, holding) =>
      sum.plus(new Decimal(holding.valueCents).times(holding.riskScore!)),
    new Decimal(0),
  );

  const categoryValue = {
    low: new Decimal(0),
    medium: new Decimal(0),
    high: new Decimal(0),
  };
  for (const holding of positiveHoldings) {
    const score = holding.riskScore!;
    const bucket = score <= 2 ? "low" : score === 3 ? "medium" : "high";
    categoryValue[bucket] = categoryValue[bucket].plus(holding.valueCents);
  }

  return {
    status: "complete",
    score: roundPercentage(weightedScore.div(totalValue)),
    missingTickers: [],
    invalidTickers: [],
    distribution: [
      {
        category: "Laag risico",
        value: roundPercentage(categoryValue.low.div(totalValue).times(100)),
      },
      {
        category: "Matig risico",
        value: roundPercentage(categoryValue.medium.div(totalValue).times(100)),
      },
      {
        category: "Hoog risico",
        value: roundPercentage(categoryValue.high.div(totalValue).times(100)),
      },
    ],
  };
}
