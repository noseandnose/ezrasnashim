"use strict";
// TypeScript utility functions for better type safety and performance
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCodePointAt = safeCodePointAt;
exports.cleanHebrewText = cleanHebrewText;
exports.formatDate = formatDate;
exports.memoize = memoize;
exports.withRetry = withRetry;
exports.getEnvVar = getEnvVar;
/**
 * Safely gets codePoint from a string character with null check
 */
function safeCodePointAt(str, index) {
    if (index === void 0) { index = 0; }
    var codePoint = str.codePointAt(index);
    return codePoint !== undefined ? codePoint : null;
}
/**
 * Optimized Hebrew text cleaner with proper type safety
 */
function cleanHebrewText(text) {
    return text
        .replace(/&[a-zA-Z]+;|&#\d+;/g, '') // Remove HTML entities
        .replace(/\{[פס]\}/g, '') // Remove Hebrew paragraph markers
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
        .replace(/[\u25A0-\u25FF]/g, '') // Remove geometric shapes
        .replace(/[\uE000-\uF8FF]/g, '') // Remove private use area characters
        .replace(/[\u2400-\u243F]/g, '') // Remove control pictures
        .replace(/[\u2500-\u257F]/g, '') // Remove box drawing characters
        .replace(/[\uFE00-\uFE0F]/g, '') // Remove variation selectors
        .replace(/[\u0590-\u05CF]/g, function (match) {
        // Keep valid Hebrew characters, remove problematic ones
        var codePoint = safeCodePointAt(match);
        if (!codePoint)
            return '';
        if (codePoint >= 0x05D0 && codePoint <= 0x05EA)
            return match; // Hebrew letters
        if (codePoint >= 0x05B0 && codePoint <= 0x05BD)
            return match; // Hebrew points
        if (codePoint >= 0x05BF && codePoint <= 0x05C2)
            return match; // Hebrew points
        if (codePoint >= 0x05C4 && codePoint <= 0x05C5)
            return match; // Hebrew points
        if (codePoint === 0x05C7)
            return match; // Hebrew point
        return ''; // Remove other characters in Hebrew block
    })
        .trim();
}
/**
 * Performance-optimized date formatter
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
/**
 * Memoization utility for expensive operations
 */
function memoize(fn) {
    var cache = new Map();
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        var result = fn.apply(void 0, args);
        cache.set(key, result);
        return result;
    });
}
/**
 * Optimized async retry utility
 */
function withRetry(operation_1) {
    return __awaiter(this, arguments, void 0, function (operation, maxRetries, delayMs) {
        var _loop_1, attempt, state_1;
        if (maxRetries === void 0) { maxRetries = 3; }
        if (delayMs === void 0) { delayMs = 1000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (attempt) {
                        var _b, error_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 4]);
                                    _b = {};
                                    return [4 /*yield*/, operation()];
                                case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 2:
                                    error_1 = _c.sent();
                                    if (attempt === maxRetries) {
                                        throw error_1;
                                    }
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayMs * attempt); })];
                                case 3:
                                    _c.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: throw new Error('Max retries exceeded');
            }
        });
    });
}
/**
 * Type-safe environment variable getter
 */
function getEnvVar(name, defaultValue) {
    var value = process.env[name];
    if (!value && !defaultValue) {
        throw new Error("Environment variable ".concat(name, " is required"));
    }
    return value || defaultValue;
}
