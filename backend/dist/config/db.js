"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = require("./env");
// Singleton pattern to prevent multiple PrismaClient instances
let db;
if (process.env.NODE_ENV === "production") {
    exports.db = db = new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg(env_1.env.DATABASE_URL),
    });
}
else {
    // In development, check if we already have a global instance to avoid reconnects on hot reload
    if (!global.prismaDb) {
        global.prismaDb = new client_1.PrismaClient({
            adapter: new adapter_pg_1.PrismaPg(env_1.env.DATABASE_URL),
            errorFormat: 'pretty',
        });
    }
    exports.db = db = global.prismaDb;
}
