import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getUserPortfolios, getPortfolioWithHoldings, createPortfolio, getUserGoals, getUserSubscription, getEtfBySymbol, createEtf, listEtfs, getDb } from "./db";
import { analyzePortfolio } from "./portfolioAnalysis";
import { etfs } from "../drizzle/schema";
import { count } from "drizzle-orm";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  portfolio: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserPortfolios(ctx.user.id)
    ),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) =>
      getPortfolioWithHoldings(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1, "Naam is verplicht").max(255, "Naam is te lang"),
      description: z.string().max(1000, "Beschrijving is te lang").optional(),
      currency: z.string().length(3, "Valuta moet 3 tekens zijn").default("EUR"),
    })).mutation(({ ctx, input }) =>
      createPortfolio(ctx.user.id, input)
    ),
    analyze: protectedProcedure.input(z.object({ portfolioId: z.number().int().positive() })).query(({ ctx, input }) =>
      analyzePortfolio(input.portfolioId, ctx.user.id)
    ),
  }),

  goals: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserGoals(ctx.user.id)
    ),
  }),

  subscription: router({
    get: protectedProcedure.query(({ ctx }) =>
      getUserSubscription(ctx.user.id)
    ),
  }),

  etf: router({
    list: protectedProcedure.query(() =>
      listEtfs()
    ),
    get: protectedProcedure.input(z.object({ symbol: z.string() })).query(({ input }) =>
      getEtfBySymbol(input.symbol)
    ),
    create: adminProcedure.input(z.object({
      symbol: z.string().max(10),
      name: z.string().max(255),
      isin: z.string().max(12).optional(),
      ter: z.number().int().optional(),
      currency: z.string().max(3),
      assetClass: z.string().max(50).optional(),
      region: z.string().max(50).optional(),
    })).mutation(({ input }) =>
      createEtf(input)
    ),
    count: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const result = await db.select({ count: count() }).from(etfs);
      return result[0];
    }),
  }),
});

export type AppRouter = typeof appRouter;
