import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getUserPortfolios, getPortfolioWithHoldings, createPortfolio, getUserGoals, getUserSubscription } from "./db";
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
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) =>
      getPortfolioWithHoldings(input.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      description: z.string().optional(),
      currency: z.string().default("EUR"),
    })).mutation(({ ctx, input }) =>
      createPortfolio(ctx.user.id, input)
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
});

export type AppRouter = typeof appRouter;
