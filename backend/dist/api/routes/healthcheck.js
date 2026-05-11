"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../config/db");
const router = (0, express_1.Router)();
router.get("/health", async (req, res) => {
    try {
        await db_1.db.$queryRaw `SELECT 1`;
        return res.status(200).send("OK");
    }
    catch (e) {
        return res.status(503).send("Service Unavailable");
    }
});
exports.default = router;
