"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
var express_1 = require("express");
var routes_js_1 = require("./routes.js");
var cors_1 = require("cors");
var path_1 = require("path");
var url_1 = require("url");
var compression_1 = require("compression");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var app = (0, express_1.default)();
exports.app = app;
// Enable compression for all responses
app.use((0, compression_1.default)({
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (1-9, 6 is good balance)
    filter: function (req, res) {
        // Don't compress if the request includes a Cache-Control: no-transform directive
        if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
            return false;
        }
        return compression_1.default.filter(req, res);
    }
}));
// Security and performance headers
app.use(function (req, res, next) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Skip X-Frame-Options completely to allow iframe embedding
    // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Performance headers for static assets
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // API responses get short cache
    if (req.url.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    next();
});
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        // Allow Vite dev server and any origin
        var allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5000', // Add backend origin
            'http://127.0.0.1:5000',
            /\.replit\.dev$/,
            /\.replit\.app$/,
            'https://api.ezrasnashim.app',
            'https://staging.ezrasnashim.app'
        ];
        var isAllowed = allowedOrigins.some(function (allowed) {
            if (typeof allowed === 'string') {
                return origin === allowed;
            }
            return allowed.test(origin);
        });
        if (isAllowed || !origin) {
            return callback(null, true);
        }
        // Allow any origin as fallback for development
        return callback(null, true);
    },
    credentials: true,
}));
// Increase JSON limit for large payloads
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '10mb' }));
app.use(function (req, res, next) {
    var start = Date.now();
    var path = req.path;
    var capturedJsonResponse = undefined;
    var originalResJson = res.json;
    res.json = function (bodyJson) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, __spreadArray([bodyJson], args, true));
    };
    res.on("finish", function () {
        var duration = Date.now() - start;
        if (path.startsWith("/api")) {
            var logLine = "".concat(req.method, " ").concat(path, " ").concat(res.statusCode, " in ").concat(duration, "ms");
            if (capturedJsonResponse) {
                logLine += " :: ".concat(JSON.stringify(capturedJsonResponse));
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            console.log(logLine);
        }
    });
    next();
});
// Initialize server configuration
function initializeServer() {
    return __awaiter(this, void 0, void 0, function () {
        var server, publicPath_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, routes_js_1.registerRoutes)(app)];
                case 1:
                    server = _a.sent();
                    // Serve static files in production
                    if (process.env.NODE_ENV === 'production') {
                        publicPath_1 = path_1.default.join(__dirname, 'public');
                        app.use(express_1.default.static(publicPath_1));
                        // Serve React app for any non-API routes
                        app.get('*', function (req, res) {
                            if (!req.path.startsWith('/api')) {
                                res.sendFile(path_1.default.join(publicPath_1, 'index.html'));
                            }
                        });
                    }
                    else {
                        // In development, handle client-side routing
                        app.get('*', function (req, res) {
                            if (!req.path.startsWith('/api') && !req.path.startsWith('/attached_assets')) {
                                // Redirect to the frontend dev server for client-side routing
                                var frontendUrl = process.env.VITE_DEV_URL || 'http://localhost:5173';
                                res.redirect(301, "".concat(frontendUrl).concat(req.path));
                            }
                        });
                    }
                    app.use(function (err, _req, res, _next) {
                        var status = (err === null || err === void 0 ? void 0 : err.status) || (err === null || err === void 0 ? void 0 : err.statusCode) || 500;
                        var message = (err === null || err === void 0 ? void 0 : err.message) || "Internal Server Error";
                        res.status(status).json({ message: message });
                        throw err;
                    });
                    return [2 /*return*/, server];
            }
        });
    });
}
// Start server for both production and development
initializeServer().then(function (server) {
    var _a;
    var isProduction = process.env.NODE_ENV === 'production';
    var defaultPort = isProduction ? '80' : '5000';
    var port = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : defaultPort);
    server.listen(port, '0.0.0.0', function () {
        var environment = process.env.NODE_ENV || 'development';
        var emoji = isProduction ? '🚀' : '⚡';
        console.log("".concat(emoji, " Ezras Nashim server running on port ").concat(port));
        console.log("\uD83D\uDCCD Environment: ".concat(environment));
    });
}).catch(console.error);
