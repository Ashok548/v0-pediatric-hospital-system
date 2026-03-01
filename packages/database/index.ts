import { PrismaClient } from "./generated/prisma/index.js";

/**
 * To prevent multiple instances of Prisma Client in development (due to hot reloading),
 * we attach it to the global object. This implementation uses plain JS syntax to avoid 
 * SyntaxErrors in environments that pick up this file as plain JS.
 */

// @ts-ignore
export const prisma = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    global.prisma = prisma;
}

export * from "./generated/prisma/index.js";
