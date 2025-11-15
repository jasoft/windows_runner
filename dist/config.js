"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parseNumber = (value) => {
    if (!value) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
exports.config = {
    port: parseNumber(process.env.PORT) ?? 3000,
    allowedCommands: process.env.ALLOWED_COMMANDS
        ?.split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0),
    defaultTimeoutMs: parseNumber(process.env.DEFAULT_TIMEOUT_MS),
    maxOutputLength: parseNumber(process.env.MAX_OUTPUT_LENGTH) ?? 200000,
};
//# sourceMappingURL=config.js.map