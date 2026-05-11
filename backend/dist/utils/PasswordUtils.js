"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtils = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PasswordUtils {
    static async hash(password) {
        return await bcryptjs_1.default.hash(password, this.SALT_ROUNDS);
    }
    static async compare(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
}
exports.PasswordUtils = PasswordUtils;
PasswordUtils.SALT_ROUNDS = 12; // High cost factor for production security
