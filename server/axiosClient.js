"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
// Create axios instance for server-side API calls
var serverAxiosClient = axios_1.default.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'Ezras-Nashim/1.0'
    },
});
// Request interceptor for logging
serverAxiosClient.interceptors.request.use(function (config) {
    var _a;
    if (process.env.NODE_ENV === 'development') {
        var url = config.baseURL ? "".concat(config.baseURL).concat(config.url) : config.url;
        console.log("[Server API Request] ".concat((_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase(), " ").concat(url));
    }
    return config;
}, function (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error('[Server API Request Error]', error);
    }
    return Promise.reject(error);
});
// Response interceptor for logging
serverAxiosClient.interceptors.response.use(function (response) {
    var _a;
    if (process.env.NODE_ENV === 'development') {
        console.log("[Server API Response] ".concat(response.status, " ").concat((_a = response.config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase(), " ").concat(response.config.url));
    }
    return response;
}, function (error) {
    var _a, _b, _c, _d;
    if (process.env.NODE_ENV === 'development') {
        var url = (_a = error.config) === null || _a === void 0 ? void 0 : _a.url;
        var method = (_c = (_b = error.config) === null || _b === void 0 ? void 0 : _b.method) === null || _c === void 0 ? void 0 : _c.toUpperCase();
        console.error("[Server API Error] ".concat(((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) || 'Unknown', " ").concat(method, " ").concat(url));
        console.error('Server API Error details:', error.message);
    }
    return Promise.reject(error);
});
exports.default = serverAxiosClient;
