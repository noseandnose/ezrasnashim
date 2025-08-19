"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.registerRoutes = registerRoutes;
var http_1 = require("http");
var stripe_1 = require("stripe");
var storage_js_1 = require("./storage.js");
var axiosClient_js_1 = require("./axiosClient.js");
var path_1 = require("path");
var url_1 = require("url");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
var stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
var schema_js_1 = require("../shared/schema.js");
var zod_1 = require("zod");
function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        var httpServer;
        var _this = this;
        return __generator(this, function (_a) {
            // Calendar download endpoint using GET request to avoid CORS issues
            app.get("/api/download-calendar", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var title, hebrewDate, gregorianDate, years, events, currentYear, inputDate, inputYear, inputMonth, inputDay, hebcalUrl, hebcalResponse, hebrewDateInfo, hebrewDay, hebrewMonth, today, startYear, thisYearUrl, thisYearResponse, thisYearDate, _a, i, targetYear, hebrewYear, convertUrl, convertResponse, gregorianResult, eventDate, dateStr, error_1, error_2, startYear, i, eventYear, eventDate, dateStr, nextYear, dateStr, icsContent, filename, error_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 17, , 18]);
                            title = req.query.title || "Event";
                            hebrewDate = req.query.hebrewDate || "";
                            gregorianDate = req.query.gregorianDate || "";
                            years = parseInt(req.query.years) || 1;
                            console.log('Calendar download request:', { title: title, hebrewDate: hebrewDate, gregorianDate: gregorianDate, years: years });
                            events = [];
                            currentYear = new Date().getFullYear();
                            if (!(gregorianDate && hebrewDate)) return [3 /*break*/, 15];
                            inputDate = new Date(gregorianDate);
                            inputYear = inputDate.getFullYear();
                            inputMonth = inputDate.getMonth() + 1;
                            inputDay = inputDate.getDate();
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 13, , 14]);
                            hebcalUrl = "https://www.hebcal.com/converter?cfg=json&gy=".concat(inputYear, "&gm=").concat(inputMonth, "&gd=").concat(inputDay, "&g2h=1");
                            return [4 /*yield*/, axiosClient_js_1.default.get(hebcalUrl)];
                        case 2:
                            hebcalResponse = _b.sent();
                            hebrewDateInfo = hebcalResponse.data;
                            if (!hebrewDateInfo || !hebrewDateInfo.hd || !hebrewDateInfo.hm) {
                                throw new Error('Failed to get Hebrew date information');
                            }
                            hebrewDay = hebrewDateInfo.hd;
                            hebrewMonth = hebrewDateInfo.hm;
                            today = new Date();
                            startYear = currentYear;
                            if (!(inputDate < today)) return [3 /*break*/, 6];
                            thisYearUrl = "https://www.hebcal.com/converter?cfg=json&hy=".concat(5785 + (currentYear - 2025), "&hm=").concat(hebrewMonth, "&hd=").concat(hebrewDay, "&h2g=1");
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, axiosClient_js_1.default.get(thisYearUrl)];
                        case 4:
                            thisYearResponse = _b.sent();
                            thisYearDate = new Date(thisYearResponse.data.gy, thisYearResponse.data.gm - 1, thisYearResponse.data.gd);
                            if (thisYearDate < today) {
                                startYear = currentYear + 1;
                            }
                            return [3 /*break*/, 6];
                        case 5:
                            _a = _b.sent();
                            startYear = currentYear + 1;
                            return [3 /*break*/, 6];
                        case 6:
                            i = 0;
                            _b.label = 7;
                        case 7:
                            if (!(i < years)) return [3 /*break*/, 12];
                            targetYear = startYear + i;
                            hebrewYear = 5785 + (targetYear - 2025);
                            convertUrl = "https://www.hebcal.com/converter?cfg=json&hy=".concat(hebrewYear, "&hm=").concat(hebrewMonth, "&hd=").concat(hebrewDay, "&h2g=1");
                            _b.label = 8;
                        case 8:
                            _b.trys.push([8, 10, , 11]);
                            return [4 /*yield*/, axiosClient_js_1.default.get(convertUrl)];
                        case 9:
                            convertResponse = _b.sent();
                            gregorianResult = convertResponse.data;
                            if (gregorianResult && gregorianResult.gy && gregorianResult.gm && gregorianResult.gd) {
                                eventDate = new Date(gregorianResult.gy, gregorianResult.gm - 1, gregorianResult.gd);
                                dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
                                events.push([
                                    'BEGIN:VEVENT',
                                    "UID:hebrew-".concat(dateStr, "-").concat(i, "-").concat(Date.now(), "@ezrasnashim.com"),
                                    "DTSTAMP:".concat(new Date().toISOString().replace(/[-:]/g, '').split('.')[0], "Z"),
                                    "DTSTART;VALUE=DATE:".concat(dateStr),
                                    "SUMMARY:".concat(title),
                                    "DESCRIPTION:Hebrew Date: ".concat(hebrewDate, "\\nGregorian: ").concat(eventDate.toLocaleDateString()),
                                    'STATUS:CONFIRMED',
                                    'TRANSP:TRANSPARENT',
                                    'END:VEVENT'
                                ].join('\r\n'));
                            }
                            return [3 /*break*/, 11];
                        case 10:
                            error_1 = _b.sent();
                            console.error("Failed to convert Hebrew date for year ".concat(targetYear, ":"), error_1);
                            return [3 /*break*/, 11];
                        case 11:
                            i++;
                            return [3 /*break*/, 7];
                        case 12: return [3 /*break*/, 14];
                        case 13:
                            error_2 = _b.sent();
                            console.error('Hebrew date conversion error:', error_2);
                            startYear = inputDate.getFullYear() < currentYear ? currentYear : inputDate.getFullYear();
                            for (i = 0; i < years; i++) {
                                eventYear = startYear + i;
                                eventDate = new Date(eventYear, inputDate.getMonth(), inputDate.getDate());
                                dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
                                events.push([
                                    'BEGIN:VEVENT',
                                    "UID:hebrew-fallback-".concat(dateStr, "-").concat(Date.now(), "@ezrasnashim.com"),
                                    "DTSTAMP:".concat(new Date().toISOString().replace(/[-:]/g, '').split('.')[0], "Z"),
                                    "DTSTART;VALUE=DATE:".concat(dateStr),
                                    "SUMMARY:".concat(title),
                                    "DESCRIPTION:Hebrew Date: ".concat(hebrewDate),
                                    'STATUS:CONFIRMED',
                                    'TRANSP:TRANSPARENT',
                                    'END:VEVENT'
                                ].join('\r\n'));
                            }
                            return [3 /*break*/, 14];
                        case 14: return [3 /*break*/, 16];
                        case 15:
                            nextYear = currentYear + 1;
                            dateStr = "".concat(nextYear, "0101");
                            events.push([
                                'BEGIN:VEVENT',
                                "UID:simple-".concat(Date.now(), "@ezrasnashim.com"),
                                "DTSTAMP:".concat(new Date().toISOString().replace(/[-:]/g, '').split('.')[0], "Z"),
                                "DTSTART;VALUE=DATE:".concat(dateStr),
                                "SUMMARY:".concat(title),
                                'DESCRIPTION:Calendar event',
                                'STATUS:CONFIRMED',
                                'TRANSP:TRANSPARENT',
                                'END:VEVENT'
                            ].join('\r\n'));
                            _b.label = 16;
                        case 16:
                            icsContent = __spreadArray(__spreadArray([
                                'BEGIN:VCALENDAR',
                                'VERSION:2.0',
                                'PRODID:-//Ezras Nashim//Hebrew Date Converter//EN',
                                'CALSCALE:GREGORIAN',
                                'METHOD:PUBLISH'
                            ], events, true), [
                                'END:VCALENDAR'
                            ], false).join('\r\n');
                            filename = "".concat(title.replace(/[^a-zA-Z0-9]/g, '_'), "_").concat(years, "_years.ics");
                            // Set headers for file download
                            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                            res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                            res.setHeader('Content-Length', Buffer.byteLength(icsContent).toString());
                            res.send(icsContent);
                            return [3 /*break*/, 18];
                        case 17:
                            error_3 = _b.sent();
                            console.error('Calendar download error:', error_3);
                            res.status(500).json({ message: "Failed to generate calendar" });
                            return [3 /*break*/, 18];
                        case 18: return [2 /*return*/];
                    }
                });
            }); });
            // Hebcal Zmanim API proxy route
            app.get("/api/zmanim/:lat/:lng", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, lat, lng, today, latitude, longitude, tzid, hebcalUrl, response, data, formatTime, locationName, nominatimUrl, geocodeResponse, address, city, country, parts, geocodeError_1, formattedTimes, error_4;
                var _b, _c, _d, _e, _f, _g, _h;
                return __generator(this, function (_j) {
                    switch (_j.label) {
                        case 0:
                            _j.trys.push([0, 6, , 7]);
                            _a = req.params, lat = _a.lat, lng = _a.lng;
                            today = new Date().toISOString().split('T')[0];
                            latitude = parseFloat(lat);
                            longitude = parseFloat(lng);
                            tzid = 'America/New_York';
                            // Basic timezone detection based on longitude and known regions
                            if (latitude >= 29 && latitude <= 33.5 && longitude >= 34 && longitude <= 36) {
                                // Israel region
                                tzid = 'Asia/Jerusalem';
                            }
                            else if (longitude >= -125 && longitude <= -66) {
                                // North America
                                if (longitude >= -125 && longitude <= -120)
                                    tzid = 'America/Los_Angeles';
                                else if (longitude >= -120 && longitude <= -105)
                                    tzid = 'America/Denver';
                                else if (longitude >= -105 && longitude <= -90)
                                    tzid = 'America/Chicago';
                                else if (longitude >= -90 && longitude <= -66)
                                    tzid = 'America/New_York';
                            }
                            else if (longitude >= -10 && longitude <= 30) {
                                // Europe
                                tzid = 'Europe/London';
                            }
                            else if (longitude >= -80 && longitude <= -60) {
                                // Eastern Canada
                                tzid = 'America/Toronto';
                            }
                            hebcalUrl = "https://www.hebcal.com/zmanim?cfg=json&latitude=".concat(latitude, "&longitude=").concat(longitude, "&tzid=").concat(tzid, "&date=").concat(today);
                            return [4 /*yield*/, axiosClient_js_1.default.get(hebcalUrl)];
                        case 1:
                            response = _j.sent();
                            data = response.data;
                            formatTime = function (timeStr) {
                                if (!timeStr)
                                    return null;
                                try {
                                    // Parse ISO timestamp and extract local time components
                                    var match = timeStr.match(/T(\d{2}):(\d{2}):/);
                                    if (match) {
                                        var hours = parseInt(match[1]);
                                        var minutes = match[2];
                                        var period = hours >= 12 ? 'PM' : 'AM';
                                        var displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                                        return "".concat(displayHours, ":").concat(minutes, " ").concat(period);
                                    }
                                    return timeStr;
                                }
                                catch (error) {
                                    if (process.env.NODE_ENV === 'development') {
                                        console.error('Time formatting error:', error, 'for time:', timeStr);
                                    }
                                    return timeStr;
                                }
                            };
                            locationName = 'Current Location';
                            _j.label = 2;
                        case 2:
                            _j.trys.push([2, 4, , 5]);
                            nominatimUrl = "https://nominatim.openstreetmap.org/reverse?lat=".concat(latitude, "&lon=").concat(longitude, "&format=json&addressdetails=1");
                            return [4 /*yield*/, axiosClient_js_1.default.get(nominatimUrl, {
                                    headers: {
                                        'User-Agent': 'EzrasNashim/1.0 (jewish-prayer-app)'
                                    }
                                })];
                        case 3:
                            geocodeResponse = _j.sent();
                            if (geocodeResponse.data && geocodeResponse.data.address) {
                                address = geocodeResponse.data.address;
                                city = address.city || address.town || address.village || address.municipality || address.suburb;
                                country = address.country;
                                // Handle Hebrew country names
                                if (country === 'ישראל') {
                                    country = 'Israel';
                                }
                                // Special handling for Israeli locations
                                if (country === 'Israel' || address.country_code === 'il') {
                                    // Use intelligent coordinate-based names for Israel (expanded ranges)
                                    if (latitude >= 31.60 && latitude <= 31.90 && longitude >= 34.90 && longitude <= 35.20) {
                                        locationName = 'Bet Shemesh, Israel';
                                    }
                                    else if (latitude >= 31.7 && latitude <= 31.85 && longitude >= 35.1 && longitude <= 35.3) {
                                        locationName = 'Jerusalem, Israel';
                                    }
                                    else if (latitude >= 31.95 && latitude <= 32.15 && longitude >= 34.65 && longitude <= 34.85) {
                                        locationName = 'Tel Aviv, Israel';
                                    }
                                    else if (latitude >= 32.7 && latitude <= 32.9 && longitude >= 35.0 && longitude <= 35.3) {
                                        locationName = 'Haifa, Israel';
                                    }
                                    else if (latitude >= 31.2 && latitude <= 31.3 && longitude >= 34.7 && longitude <= 34.9) {
                                        locationName = 'Beer Sheva, Israel';
                                    }
                                    else {
                                        locationName = 'Israel';
                                    }
                                }
                                else if (city && country) {
                                    locationName = "".concat(city, ", ").concat(country);
                                }
                                else if (city) {
                                    locationName = city;
                                }
                                else if (geocodeResponse.data.display_name) {
                                    parts = geocodeResponse.data.display_name.split(',');
                                    if (parts.length >= 2) {
                                        locationName = "".concat(parts[0].trim(), ", ").concat(parts[parts.length - 1].trim());
                                    }
                                    else {
                                        locationName = parts[0].trim();
                                    }
                                }
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            geocodeError_1 = _j.sent();
                            // If reverse geocoding fails, use intelligent coordinate-based fallback
                            if (process.env.NODE_ENV === 'development') {
                                console.warn('Reverse geocoding failed:', geocodeError_1);
                            }
                            // Provide intelligent location names based on known coordinates (expanded ranges)
                            if (latitude >= 31.60 && latitude <= 31.90 && longitude >= 34.90 && longitude <= 35.20) {
                                locationName = 'Bet Shemesh, Israel';
                            }
                            else if (latitude >= 31.7 && latitude <= 31.85 && longitude >= 35.1 && longitude <= 35.3) {
                                locationName = 'Jerusalem, Israel';
                            }
                            else if (latitude >= 31.95 && latitude <= 32.15 && longitude >= 34.65 && longitude <= 34.85) {
                                locationName = 'Tel Aviv, Israel';
                            }
                            else if (latitude >= 40.65 && latitude <= 40.85 && longitude >= -74.15 && longitude <= -73.95) {
                                locationName = 'New York City, NY';
                            }
                            else if (latitude >= 33.95 && latitude <= 34.15 && longitude >= -118.35 && longitude <= -118.15) {
                                locationName = 'Los Angeles, CA';
                            }
                            else {
                                // General region-based fallback
                                if (latitude >= 29 && latitude <= 33.5 && longitude >= 34 && longitude <= 36) {
                                    locationName = 'Israel';
                                }
                                else if (longitude >= -125 && longitude <= -66) {
                                    locationName = 'United States';
                                }
                                else if (longitude >= -10 && longitude <= 30) {
                                    locationName = 'Europe';
                                }
                                else {
                                    locationName = "".concat(latitude.toFixed(2), "\u00B0, ").concat(longitude.toFixed(2), "\u00B0");
                                }
                            }
                            return [3 /*break*/, 5];
                        case 5:
                            formattedTimes = {
                                sunrise: formatTime((_b = data.times) === null || _b === void 0 ? void 0 : _b.sunrise),
                                shkia: formatTime((_c = data.times) === null || _c === void 0 ? void 0 : _c.sunset),
                                tzaitHakochavim: formatTime((_d = data.times) === null || _d === void 0 ? void 0 : _d.tzeit7083deg),
                                minchaGedolah: formatTime((_e = data.times) === null || _e === void 0 ? void 0 : _e.minchaGedola),
                                minchaKetanah: formatTime((_f = data.times) === null || _f === void 0 ? void 0 : _f.minchaKetana),
                                candleLighting: formatTime((_g = data.times) === null || _g === void 0 ? void 0 : _g.candleLighting),
                                havdalah: formatTime((_h = data.times) === null || _h === void 0 ? void 0 : _h.havdalah),
                                hebrewDate: data.date || '',
                                location: locationName,
                                coordinates: {
                                    lat: latitude,
                                    lng: longitude
                                },
                                // TODO: Add notification/reminder functionality
                                // - Can set alerts for specific zmanim times
                                // - Push notifications for important times like candle lighting
                                // TODO: Add minhag customization options
                                // - Different calculations for tzait hakochavim (18 min, 42 min, etc.)
                                // - Sephardic vs Ashkenazi customs for zmanim
                                // - Custom candle lighting time preferences
                            };
                            res.json(formattedTimes);
                            return [3 /*break*/, 7];
                        case 6:
                            error_4 = _j.sent();
                            console.error('Error fetching Hebcal zmanim:', error_4);
                            res.status(500).json({ message: "Failed to fetch zmanim from Hebcal API" });
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            }); });
            // Hebcal Shabbos times proxy route
            app.get("/api/shabbos/:lat/:lng", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, lat, lng, latitude, longitude, response, data, zmanimResponse, zmanimData, result_1, error_5;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 5, , 6]);
                            _a = req.params, lat = _a.lat, lng = _a.lng;
                            latitude = parseFloat(lat);
                            longitude = parseFloat(lng);
                            if (isNaN(latitude) || isNaN(longitude)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid coordinates" })];
                            }
                            console.log("[Server API Request] GET https://www.hebcal.com/shabbat/?cfg=json&latitude=".concat(latitude, "&longitude=").concat(longitude));
                            return [4 /*yield*/, fetch("https://www.hebcal.com/shabbat/?cfg=json&latitude=".concat(latitude, "&longitude=").concat(longitude))];
                        case 1:
                            response = _b.sent();
                            console.log("[Server API Response] ".concat(response.status, " GET https://www.hebcal.com/shabbat/?cfg=json&latitude=").concat(latitude, "&longitude=").concat(longitude));
                            if (!response.ok) {
                                throw new Error('Failed to fetch Shabbos times from Hebcal');
                            }
                            return [4 /*yield*/, response.json()];
                        case 2:
                            data = _b.sent();
                            return [4 /*yield*/, fetch("http://localhost:".concat(process.env.PORT || 5000, "/api/zmanim/").concat(latitude, "/").concat(longitude))];
                        case 3:
                            zmanimResponse = _b.sent();
                            return [4 /*yield*/, zmanimResponse.json()];
                        case 4:
                            zmanimData = _b.sent();
                            result_1 = {
                                location: zmanimData.location || 'Unknown Location',
                                candleLighting: null,
                                havdalah: null,
                                parsha: null
                            };
                            data.items.forEach(function (item) {
                                var _a;
                                console.log('Processing item:', item.title);
                                if (item.title.includes("Candle lighting:")) {
                                    // Extract time with possible pm/am suffix (e.g., "Candle lighting: 8:00pm" or "Candle lighting: 19:23")
                                    var timeMatch = item.title.match(/Candle lighting: (\d{1,2}:\d{2})(pm|am|p\.m\.|a\.m\.)?/i);
                                    console.log('Candle lighting timeMatch:', timeMatch);
                                    if (timeMatch) {
                                        var _b = timeMatch[1].split(':'), hours = _b[0], minutes = _b[1];
                                        var hour12 = parseInt(hours);
                                        var suffix = (_a = timeMatch[2]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                                        console.log('Candle lighting - hour12:', hour12, 'minutes:', minutes, 'suffix:', suffix);
                                        if (suffix) {
                                            // Already has am/pm, just format it properly
                                            var displayHour = hour12 === 0 ? 12 : hour12;
                                            result_1.candleLighting = "".concat(displayHour, ":").concat(minutes, " ").concat(suffix.toUpperCase().replace(/\./g, ''));
                                        }
                                        else {
                                            // 24-hour format, convert to 12-hour
                                            var displayHour = hour12 > 12 ? hour12 - 12 : (hour12 === 0 ? 12 : hour12);
                                            var period = hour12 >= 12 ? 'PM' : 'AM';
                                            result_1.candleLighting = "".concat(displayHour, ":").concat(minutes, " ").concat(period);
                                        }
                                        console.log('Final candleLighting:', result_1.candleLighting);
                                    }
                                }
                                else if (item.title.includes("Havdalah:")) {
                                    console.log('Full title for havdalah:', item.title);
                                    // Check if it has pm/am at the end of the full title  
                                    var timeWithSuffixMatch = item.title.match(/Havdalah: (\d{1,2}:\d{2})\s*(pm|am)/i);
                                    if (timeWithSuffixMatch) {
                                        var time = timeWithSuffixMatch[1], suffix = timeWithSuffixMatch[2];
                                        var _c = time.split(':'), hours = _c[0], minutes = _c[1];
                                        var hour12 = parseInt(hours);
                                        console.log('Havdalah with suffix - hour12:', hour12, 'minutes:', minutes, 'suffix:', suffix);
                                        var displayHour = hour12 === 0 ? 12 : hour12;
                                        result_1.havdalah = "".concat(displayHour, ":").concat(minutes, " ").concat(suffix.toUpperCase());
                                        console.log('Final havdalah:', result_1.havdalah);
                                    }
                                    else {
                                        // Try 24-hour format
                                        var timeMatch = item.title.match(/Havdalah: (\d{1,2}:\d{2})/);
                                        if (timeMatch) {
                                            var _d = timeMatch[1].split(':'), hours = _d[0], minutes = _d[1];
                                            var hour24 = parseInt(hours);
                                            console.log('Havdalah 24hr - hour24:', hour24, 'minutes:', minutes);
                                            var displayHour = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
                                            var period = hour24 >= 12 ? 'PM' : 'AM';
                                            result_1.havdalah = "".concat(displayHour, ":").concat(minutes, " ").concat(period);
                                            console.log('Final havdalah:', result_1.havdalah);
                                        }
                                    }
                                }
                                else if (item.title.startsWith("Parashat ") || item.title.startsWith("Parashah ")) {
                                    result_1.parsha = item.title;
                                }
                            });
                            res.json(result_1);
                            return [3 /*break*/, 6];
                        case 5:
                            error_5 = _b.sent();
                            console.error('Error fetching Shabbos times:', error_5);
                            res.status(500).json({ message: "Failed to fetch Shabbos times from Hebcal API" });
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            // Sefaria API proxy route for Morning Brochas
            app.get("/api/sefaria/morning-brochas", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var morningBlessingUrls, cleanText_1, results, validBlessings, error_6;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            morningBlessingUrls = [
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Modeh_Ani.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Modeh_Ani.2",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Netilat_Yadayim.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Asher_Yatzar.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Elokai_Neshama.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Blessings.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Blessings.2",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Blessings.3",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Study.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Study.3",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.1",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.2",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.3",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.5",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.6",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.7",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.8",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.9",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.10",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.11",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.12",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.13",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.14",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.15",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.16",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.17",
                                "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.18"
                            ];
                            cleanText_1 = function (text) {
                                if (!text)
                                    return '';
                                // Convert to string if it's not already
                                var textStr = typeof text === 'string' ? text : String(text);
                                return textStr
                                    .replace(/<[^>]*>/g, '') // Remove all HTML tags
                                    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                                    .replace(/&amp;/g, '&') // Replace HTML entities
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&quot;/g, '"')
                                    .replace(/&#39;/g, "'")
                                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                                    .trim();
                            };
                            return [4 /*yield*/, Promise.all(morningBlessingUrls.map(function (url) { return __awaiter(_this, void 0, void 0, function () {
                                    var hebrewUrl, hebrewResponse, hebrewText, hebrewVersion, englishUrl, englishText, englishResponse, englishVersion, englishError_1, error_7;
                                    var _a, _b, _c, _d, _e;
                                    return __generator(this, function (_f) {
                                        switch (_f.label) {
                                            case 0:
                                                _f.trys.push([0, 6, , 7]);
                                                hebrewUrl = url + '?version=hebrew&return_format=text_only';
                                                return [4 /*yield*/, axiosClient_js_1.default.get(hebrewUrl)];
                                            case 1:
                                                hebrewResponse = _f.sent();
                                                hebrewText = '';
                                                if (((_b = (_a = hebrewResponse.data) === null || _a === void 0 ? void 0 : _a.versions) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                                                    hebrewVersion = hebrewResponse.data.versions.find(function (v) { return v.language === 'he' && v.text; });
                                                    if (hebrewVersion === null || hebrewVersion === void 0 ? void 0 : hebrewVersion.text) {
                                                        hebrewText = cleanText_1(hebrewVersion.text);
                                                    }
                                                }
                                                englishUrl = url + '?version=english&return_format=text_only';
                                                englishText = '';
                                                _f.label = 2;
                                            case 2:
                                                _f.trys.push([2, 4, , 5]);
                                                return [4 /*yield*/, axiosClient_js_1.default.get(englishUrl)];
                                            case 3:
                                                englishResponse = _f.sent();
                                                // Extract English text from API response
                                                if (((_d = (_c = englishResponse.data) === null || _c === void 0 ? void 0 : _c.versions) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                                                    englishVersion = englishResponse.data.versions.find(function (v) { return v.language === 'en' && v.text; });
                                                    if (englishVersion === null || englishVersion === void 0 ? void 0 : englishVersion.text) {
                                                        englishText = cleanText_1(englishVersion.text);
                                                    }
                                                }
                                                if (process.env.NODE_ENV === 'development') {
                                                    console.log('Found English text:', englishText.substring(0, 50) + '...');
                                                }
                                                return [3 /*break*/, 5];
                                            case 4:
                                                englishError_1 = _f.sent();
                                                if (process.env.NODE_ENV === 'development') {
                                                    console.log('No English version available for:', url);
                                                }
                                                return [3 /*break*/, 5];
                                            case 5: return [2 /*return*/, {
                                                    hebrew: hebrewText,
                                                    english: englishText,
                                                    ref: ((_e = hebrewResponse.data) === null || _e === void 0 ? void 0 : _e.ref) || ''
                                                }];
                                            case 6:
                                                error_7 = _f.sent();
                                                if (process.env.NODE_ENV === 'development') {
                                                    console.error('Error fetching morning blessing from Sefaria:', error_7);
                                                }
                                                return [2 /*return*/, { hebrew: '', english: '', ref: '' }];
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            validBlessings = results.filter(function (blessing) {
                                return blessing.hebrew.trim() || blessing.english.trim();
                            });
                            res.json(validBlessings);
                            return [3 /*break*/, 3];
                        case 2:
                            error_6 = _a.sent();
                            if (process.env.NODE_ENV === 'development') {
                                console.error('Error fetching morning brochas from Sefaria:', error_6);
                            }
                            res.status(500).json({ message: "Failed to fetch morning brochas from Sefaria API" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Handle preflight OPTIONS request for calendar download
            app.options("/api/calendar-events/download", function (req, res) {
                console.log('OPTIONS preflight request for calendar download');
                res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
                res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.sendStatus(200);
            });
            // Generate and download ICS calendar file
            app.post("/api/calendar-events/download", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, title_1, hebrewDate, gregorianDate_1, _b, years_1, parseOriginalDate, originalYear, originalMonth, originalDay, hebrewDay_1, hebrewMonth_1, response, error_8, generateICSContent, icsContent, filename, error_9;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 6, , 7]);
                            console.log('Calendar download request received:', {
                                method: req.method,
                                headers: req.headers,
                                body: req.body,
                                origin: req.get('origin')
                            });
                            _a = req.body, title_1 = _a.title, hebrewDate = _a.hebrewDate, gregorianDate_1 = _a.gregorianDate, _b = _a.years, years_1 = _b === void 0 ? 10 : _b;
                            if (!title_1 || !hebrewDate || !gregorianDate_1) {
                                return [2 /*return*/, res.status(400).json({ message: "Missing required fields" })];
                            }
                            parseOriginalDate = new Date(gregorianDate_1);
                            originalYear = parseOriginalDate.getFullYear();
                            originalMonth = parseOriginalDate.getMonth() + 1;
                            originalDay = parseOriginalDate.getDate();
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, axiosClient_js_1.default.get("https://www.hebcal.com/converter?cfg=json&gy=".concat(originalYear, "&gm=").concat(originalMonth, "&gd=").concat(originalDay, "&g2h=1"))];
                        case 2:
                            response = _c.sent();
                            if (response.data && response.data.hd && response.data.hm) {
                                hebrewDay_1 = response.data.hd;
                                hebrewMonth_1 = response.data.hm;
                                if (process.env.NODE_ENV === 'development') {
                                    console.log("Original date ".concat(gregorianDate_1, " converts to ").concat(hebrewDay_1, " ").concat(hebrewMonth_1));
                                }
                            }
                            else {
                                throw new Error('Invalid Hebrew date response');
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            error_8 = _c.sent();
                            if (process.env.NODE_ENV === 'development') {
                                console.error('Error converting original date to Hebrew:', error_8);
                            }
                            return [2 /*return*/, res.status(400).json({ message: "Failed to convert input date to Hebrew date" })];
                        case 4:
                            generateICSContent = function () { return __awaiter(_this, void 0, void 0, function () {
                                var now, uid, dtStamp, icsContent, currentYear, today, inputDate, thisYearInputDate, hasPassedThisYear, startYear, i, targetYear, hebrewYear, hebrewYearsToTry, englishDateForYear, _i, hebrewYearsToTry_1, hy, response, convertedYear, err_1, dateStr, error_10;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            now = new Date();
                                            uid = "hebrew-date-".concat(Date.now(), "@ezrasnashim.com");
                                            dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                                            icsContent = [
                                                'BEGIN:VCALENDAR',
                                                'VERSION:2.0',
                                                'PRODID:-//Ezras Nashim//Hebrew Date Converter//EN',
                                                'CALSCALE:GREGORIAN',
                                                'METHOD:PUBLISH'
                                            ];
                                            currentYear = new Date().getFullYear();
                                            today = new Date();
                                            inputDate = new Date(gregorianDate_1);
                                            thisYearInputDate = new Date(currentYear, inputDate.getMonth(), inputDate.getDate());
                                            hasPassedThisYear = today > thisYearInputDate;
                                            startYear = hasPassedThisYear ? currentYear + 1 : currentYear;
                                            if (process.env.NODE_ENV === 'development') {
                                                console.log("Input date: ".concat(gregorianDate_1, ", This year's date: ").concat(thisYearInputDate.toDateString(), ", Today: ").concat(today.toDateString()));
                                                console.log("Has passed this year: ".concat(hasPassedThisYear, ", Starting from year: ").concat(startYear));
                                            }
                                            i = 0;
                                            _a.label = 1;
                                        case 1:
                                            if (!(i < years_1)) return [3 /*break*/, 11];
                                            targetYear = startYear + i;
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 9, , 10]);
                                            hebrewYear = targetYear + 3760;
                                            hebrewYearsToTry = [hebrewYear, hebrewYear + 1];
                                            englishDateForYear = null;
                                            _i = 0, hebrewYearsToTry_1 = hebrewYearsToTry;
                                            _a.label = 3;
                                        case 3:
                                            if (!(_i < hebrewYearsToTry_1.length)) return [3 /*break*/, 8];
                                            hy = hebrewYearsToTry_1[_i];
                                            _a.label = 4;
                                        case 4:
                                            _a.trys.push([4, 6, , 7]);
                                            return [4 /*yield*/, axiosClient_js_1.default.get("https://www.hebcal.com/converter?cfg=json&hd=".concat(hebrewDay_1, "&hm=").concat(hebrewMonth_1, "&hy=").concat(hy, "&h2g=1"))];
                                        case 5:
                                            response = _a.sent();
                                            if (response.data && response.data.gy && response.data.gm && response.data.gd) {
                                                convertedYear = response.data.gy;
                                                // Only use this conversion if it falls in our target year
                                                if (convertedYear === targetYear) {
                                                    englishDateForYear = new Date(response.data.gy, response.data.gm - 1, response.data.gd);
                                                    if (process.env.NODE_ENV === 'development') {
                                                        console.log("".concat(hebrewDay_1, " ").concat(hebrewMonth_1, " ").concat(hy, " converts to ").concat(englishDateForYear.toDateString()));
                                                    }
                                                    return [3 /*break*/, 8];
                                                }
                                            }
                                            return [3 /*break*/, 7];
                                        case 6:
                                            err_1 = _a.sent();
                                            // Continue trying next Hebrew year
                                            return [3 /*break*/, 7];
                                        case 7:
                                            _i++;
                                            return [3 /*break*/, 3];
                                        case 8:
                                            if (englishDateForYear) {
                                                dateStr = englishDateForYear.toISOString().split('T')[0].replace(/-/g, '');
                                                icsContent.push('BEGIN:VEVENT', "UID:".concat(uid, "-").concat(targetYear), "DTSTAMP:".concat(dtStamp), "DTSTART;VALUE=DATE:".concat(dateStr), "SUMMARY:".concat(title_1), "DESCRIPTION:Hebrew Date: ".concat(hebrewDay_1, " ").concat(hebrewMonth_1, "\\nEnglish Date: ").concat(englishDateForYear.toLocaleDateString(), "\\nYear: ").concat(targetYear), 'STATUS:CONFIRMED', 'TRANSP:TRANSPARENT', 'END:VEVENT');
                                            }
                                            else {
                                                if (process.env.NODE_ENV === 'development') {
                                                    console.log("Could not find ".concat(hebrewDay_1, " ").concat(hebrewMonth_1, " in ").concat(targetYear));
                                                }
                                            }
                                            return [3 /*break*/, 10];
                                        case 9:
                                            error_10 = _a.sent();
                                            if (process.env.NODE_ENV === 'development') {
                                                console.error("Error processing year ".concat(targetYear, ":"), error_10);
                                            }
                                            return [3 /*break*/, 10];
                                        case 10:
                                            i++;
                                            return [3 /*break*/, 1];
                                        case 11:
                                            icsContent.push('END:VCALENDAR');
                                            return [2 /*return*/, icsContent.join('\r\n')];
                                    }
                                });
                            }); };
                            return [4 /*yield*/, generateICSContent()];
                        case 5:
                            icsContent = _c.sent();
                            filename = "".concat(title_1.replace(/[^a-zA-Z0-9]/g, '_'), "_").concat(years_1, "_years.ics");
                            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                            res.setHeader('Content-Disposition', "attachment; filename=\"".concat(filename, "\""));
                            res.send(icsContent);
                            return [3 /*break*/, 7];
                        case 6:
                            error_9 = _c.sent();
                            console.error('Error generating calendar file:', error_9);
                            console.error('Error stack:', error_9 instanceof Error ? error_9.stack : 'No stack trace');
                            res.status(500).json({
                                message: "Failed to generate calendar file",
                                error: error_9 instanceof Error ? error_9.message : 'Unknown error'
                            });
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            }); });
            // Shop routes
            app.get("/api/shop", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var items, error_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getAllShopItems()];
                        case 1:
                            items = _a.sent();
                            res.json(items);
                            return [3 /*break*/, 3];
                        case 2:
                            error_11 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch shop items" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/shop/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, item, error_12;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            id = parseInt(req.params.id);
                            if (isNaN(id)) {
                                return [2 /*return*/, res.status(400).json({ message: "Invalid shop item ID" })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.getShopItemById(id)];
                        case 1:
                            item = _a.sent();
                            if (!item) {
                                return [2 /*return*/, res.status(404).json({ message: "Shop item not found" })];
                            }
                            res.json(item);
                            return [3 /*break*/, 3];
                        case 2:
                            error_12 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch shop item" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Hebcal API proxy
            app.get("/api/hebcal/:location?", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var location_1, today, hebcalUrl, response, data, error_13;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            location_1 = req.params.location || "5128581";
                            today = new Date().toISOString().split('T')[0];
                            hebcalUrl = "https://www.hebcal.com/zmanim?cfg=json&geonameid=".concat(location_1, "&date=").concat(today);
                            return [4 /*yield*/, axiosClient_js_1.default.get(hebcalUrl)];
                        case 1:
                            response = _a.sent();
                            data = response.data;
                            res.json(data);
                            return [3 /*break*/, 3];
                        case 2:
                            error_13 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch from Hebcal API" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Table inspiration routes
            app.get("/api/table/inspiration/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, inspiration, error_14;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getTableInspirationByDate(date)];
                        case 1:
                            inspiration = _a.sent();
                            res.json(inspiration || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_14 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch table inspiration" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/table/inspiration", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, inspiration, error_15;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertTableInspirationSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createTableInspiration(validatedData)];
                        case 1:
                            inspiration = _a.sent();
                            res.json(inspiration);
                            return [3 /*break*/, 3];
                        case 2:
                            error_15 = _a.sent();
                            res.status(500).json({ message: "Failed to create table inspiration" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Community impact routes
            app.get("/api/community/impact/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, impact, error_16;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getCommunityImpactByDate(date)];
                        case 1:
                            impact = _a.sent();
                            res.json(impact || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_16 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch community impact" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Mincha routes
            app.get("/api/mincha/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayers, error_17;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getMinchaPrayers()];
                        case 1:
                            prayers = _a.sent();
                            res.json(prayers);
                            return [3 /*break*/, 3];
                        case 2:
                            error_17 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Mincha prayers" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Morning prayer routes
            app.get("/api/morning/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayers, error_18;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getMorningPrayers()];
                        case 1:
                            prayers = _a.sent();
                            res.json(prayers);
                            return [3 /*break*/, 3];
                        case 2:
                            error_18 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Morning prayers" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Maariv routes
            app.get("/api/maariv/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayers, error_19;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getMaarivPrayers()];
                        case 1:
                            prayers = _a.sent();
                            res.json(prayers);
                            return [3 /*break*/, 3];
                        case 2:
                            error_19 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Maariv prayers" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // After Brochas routes
            app.get("/api/after-brochas/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayers, error_20;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getAfterBrochasPrayers()];
                        case 1:
                            prayers = _a.sent();
                            res.json(prayers);
                            return [3 /*break*/, 3];
                        case 2:
                            error_20 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch After Brochas prayers" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/after-brochas/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayer, error_21;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.createAfterBrochasPrayer(req.body)];
                        case 1:
                            prayer = _a.sent();
                            res.json(prayer);
                            return [3 /*break*/, 3];
                        case 2:
                            error_21 = _a.sent();
                            res.status(500).json({ message: "Failed to create After Brochas prayer" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Birkat Hamazon routes
            app.get("/api/birkat-hamazon/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayers, error_22;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getBirkatHamazonPrayers()];
                        case 1:
                            prayers = _a.sent();
                            res.json(prayers);
                            return [3 /*break*/, 3];
                        case 2:
                            error_22 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Birkat Hamazon prayers" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/birkat-hamazon/prayers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var prayer, error_23;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.createBirkatHamazonPrayer(req.body)];
                        case 1:
                            prayer = _a.sent();
                            res.json(prayer);
                            return [3 /*break*/, 3];
                        case 2:
                            error_23 = _a.sent();
                            res.status(500).json({ message: "Failed to create Birkat Hamazon prayer" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Sponsor routes
            app.get("/api/sponsors/:contentType/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, contentType, date, sponsor, error_24;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = req.params, contentType = _a.contentType, date = _a.date;
                            return [4 /*yield*/, storage_js_1.storage.getSponsorByContentTypeAndDate(contentType, date)];
                        case 1:
                            sponsor = _b.sent();
                            res.json(sponsor || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_24 = _b.sent();
                            res.status(500).json({ message: "Failed to fetch sponsor" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/sponsors/daily/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, sponsor, error_25;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getDailySponsor(date)];
                        case 1:
                            sponsor = _a.sent();
                            res.json(sponsor || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_25 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch daily sponsor" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/sponsors", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var sponsors, error_26;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getActiveSponsors()];
                        case 1:
                            sponsors = _a.sent();
                            res.json(sponsors);
                            return [3 /*break*/, 3];
                        case 2:
                            error_26 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch sponsors" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/sponsors", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var sponsor, error_27;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.createSponsor(req.body)];
                        case 1:
                            sponsor = _a.sent();
                            res.json(sponsor);
                            return [3 /*break*/, 3];
                        case 2:
                            error_27 = _a.sent();
                            res.status(500).json({ message: "Failed to create sponsor" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Campaign routes
            app.get("/api/campaigns/active", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var campaign, error_28;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getActiveCampaign()];
                        case 1:
                            campaign = _a.sent();
                            res.json(campaign || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_28 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch active campaign" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/campaigns", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var campaigns, error_29;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getAllCampaigns()];
                        case 1:
                            campaigns = _a.sent();
                            res.json(campaigns);
                            return [3 /*break*/, 3];
                        case 2:
                            error_29 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch campaigns" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/campaigns", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var campaign, error_30;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.createCampaign(req.body)];
                        case 1:
                            campaign = _a.sent();
                            res.json(campaign);
                            return [3 /*break*/, 3];
                        case 2:
                            error_30 = _a.sent();
                            res.status(500).json({ message: "Failed to create campaign" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Daily Torah content routes
            app.get("/api/torah/halacha/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, halacha, error_31;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getDailyHalachaByDate(date)];
                        case 1:
                            halacha = _a.sent();
                            res.json(halacha || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_31 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch daily halacha" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/torah/halacha", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, halacha, error_32;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertDailyHalachaSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createDailyHalacha(validatedData)];
                        case 1:
                            halacha = _a.sent();
                            res.json(halacha);
                            return [3 /*break*/, 3];
                        case 2:
                            error_32 = _a.sent();
                            res.status(500).json({ message: "Failed to create daily halacha" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/torah/emuna/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, emuna, error_33;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getDailyEmunaByDate(date)];
                        case 1:
                            emuna = _a.sent();
                            res.json(emuna || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_33 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch daily emuna" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/torah/emuna", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, emuna, error_34;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertDailyEmunaSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createDailyEmuna(validatedData)];
                        case 1:
                            emuna = _a.sent();
                            res.json(emuna);
                            return [3 /*break*/, 3];
                        case 2:
                            error_34 = _a.sent();
                            res.status(500).json({ message: "Failed to create daily emuna" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/torah/chizuk/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, chizuk, error_35;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getDailyChizukByDate(date)];
                        case 1:
                            chizuk = _a.sent();
                            res.json(chizuk || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_35 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch daily chizuk" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/torah/chizuk", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, chizuk, error_36;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertDailyChizukSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createDailyChizuk(validatedData)];
                        case 1:
                            chizuk = _a.sent();
                            res.json(chizuk);
                            return [3 /*break*/, 3];
                        case 2:
                            error_36 = _a.sent();
                            res.status(500).json({ message: "Failed to create daily chizuk" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/torah/featured/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, featured, error_37;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getFeaturedContentByDate(date)];
                        case 1:
                            featured = _a.sent();
                            res.json(featured || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_37 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch featured content" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/torah/featured", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, featured, error_38;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertFeaturedContentSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createFeaturedContent(validatedData)];
                        case 1:
                            featured = _a.sent();
                            res.json(featured);
                            return [3 /*break*/, 3];
                        case 2:
                            error_38 = _a.sent();
                            res.status(500).json({ message: "Failed to create featured content" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/torah/pirkei-avot/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, currentPirkeiAvot, error_39;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getCurrentPirkeiAvot()];
                        case 1:
                            currentPirkeiAvot = _a.sent();
                            if (currentPirkeiAvot) {
                                // Return formatted response similar to other Torah content
                                res.json({
                                    text: currentPirkeiAvot.content,
                                    chapter: currentPirkeiAvot.chapter,
                                    source: "".concat(currentPirkeiAvot.chapter, ".").concat(currentPirkeiAvot.perek)
                                });
                            }
                            else {
                                res.json(null);
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_39 = _a.sent();
                            console.error('Error fetching Pirkei Avot:', error_39);
                            res.status(500).json({ message: "Failed to fetch Pirkei Avot content" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/torah/pirkei-avot/advance", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var progress, error_40;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.advancePirkeiAvotProgress()];
                        case 1:
                            progress = _a.sent();
                            res.json(progress);
                            return [3 /*break*/, 3];
                        case 2:
                            error_40 = _a.sent();
                            res.status(500).json({ message: "Failed to advance Pirkei Avot progress" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // New routes for Pirkei Avot management
            app.get("/api/pirkei-avot", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var allPirkeiAvot, error_41;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getAllPirkeiAvot()];
                        case 1:
                            allPirkeiAvot = _a.sent();
                            res.json(allPirkeiAvot);
                            return [3 /*break*/, 3];
                        case 2:
                            error_41 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch all Pirkei Avot content" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/pirkei-avot", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var newPirkeiAvot, error_42;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.createPirkeiAvot(req.body)];
                        case 1:
                            newPirkeiAvot = _a.sent();
                            res.json(newPirkeiAvot);
                            return [3 /*break*/, 3];
                        case 2:
                            error_42 = _a.sent();
                            res.status(500).json({ message: "Failed to create Pirkei Avot content" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Daily recipe routes
            app.get("/api/table/recipe/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var date, recipe, error_43;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            date = req.params.date;
                            return [4 /*yield*/, storage_js_1.storage.getDailyRecipeByDate(date)];
                        case 1:
                            recipe = _a.sent();
                            res.json(recipe || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_43 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch daily recipe" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/table/recipe", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var today, recipe, error_44;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            today = new Date().toISOString().split('T')[0];
                            return [4 /*yield*/, storage_js_1.storage.getDailyRecipeByDate(today)];
                        case 1:
                            recipe = _a.sent();
                            res.json(recipe || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_44 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch daily recipe" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/table/recipe", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, recipe, error_45;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertDailyRecipeSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createDailyRecipe(validatedData)];
                        case 1:
                            recipe = _a.sent();
                            res.json(recipe);
                            return [3 /*break*/, 3];
                        case 2:
                            error_45 = _a.sent();
                            res.status(500).json({ message: "Failed to create daily recipe" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/table/vort/:week", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var week, vort, error_46;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            week = req.params.week;
                            return [4 /*yield*/, storage_js_1.storage.getParshaVortByWeek(week)];
                        case 1:
                            vort = _a.sent();
                            res.json(vort || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_46 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Parsha vort" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/table/vort", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var today, vort, error_47;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            today = new Date().toISOString().split('T')[0];
                            return [4 /*yield*/, storage_js_1.storage.getParshaVortByDate(today)];
                        case 1:
                            vort = _a.sent();
                            res.json(vort || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_47 = _a.sent();
                            console.error('Error fetching Parsha vort:', error_47);
                            res.status(500).json({ message: "Failed to fetch Parsha vort" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/table/vort", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, vort, error_48;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertParshaVortSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createParshaVort(validatedData)];
                        case 1:
                            vort = _a.sent();
                            res.json(vort);
                            return [3 /*break*/, 3];
                        case 2:
                            error_48 = _a.sent();
                            res.status(500).json({ message: "Failed to create Parsha vort" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Zmanim route that returns parsed and adjusted times
            app.get("/api/zmanim/:location?", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var location_2, today, hebcalUrl, response, data, times, formatTime, adjustTime, error_49;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            location_2 = req.params.location || "5128581";
                            today = new Date().toISOString().split('T')[0];
                            hebcalUrl = "https://www.hebcal.com/zmanim?cfg=json&geonameid=".concat(location_2, "&date=").concat(today);
                            return [4 /*yield*/, axiosClient_js_1.default.get(hebcalUrl)];
                        case 1:
                            response = _c.sent();
                            data = response.data;
                            times = {};
                            if (data.times) {
                                formatTime = function (timeStr) {
                                    if (!timeStr)
                                        return 'N/A';
                                    var date = new Date(timeStr);
                                    return date.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'America/New_York'
                                    });
                                };
                                adjustTime = function (timeStr, adjustmentMinutes) {
                                    if (!timeStr)
                                        return 'N/A';
                                    try {
                                        var date = new Date(timeStr);
                                        date.setMinutes(date.getMinutes() + adjustmentMinutes);
                                        return date.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: 'America/New_York'
                                        });
                                    }
                                    catch (_a) {
                                        return 'N/A';
                                    }
                                };
                                times.sunrise = adjustTime(data.times.sunrise, -3); // 3 minutes earlier
                                times.shkia = adjustTime(data.times.sunset, -42); // 42 minutes earlier  
                                times.tzaitHakochavim = formatTime(data.times.tzeit7083deg);
                                times.minchaGedolah = formatTime(data.times.minchaGedola);
                                times.minchaKetanah = formatTime(data.times.minchaKetana);
                                times.candleLighting = formatTime(data.times.candlelighting);
                                times.havdalah = formatTime(data.times.havdalah);
                                times.hebrewDate = ((_a = data.date) === null || _a === void 0 ? void 0 : _a.hebrew) || '';
                                times.location = ((_b = data.location) === null || _b === void 0 ? void 0 : _b.title) || 'New York';
                            }
                            res.json(times);
                            return [3 /*break*/, 3];
                        case 2:
                            error_49 = _c.sent();
                            res.status(500).json({ message: "Failed to fetch zmanim data" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Tehillim routes
            app.get("/api/tehillim/progress", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var progress, randomName, error_50;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, storage_js_1.storage.cleanupExpiredNames()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, storage_js_1.storage.getGlobalTehillimProgress()];
                        case 2:
                            progress = _a.sent();
                            return [4 /*yield*/, storage_js_1.storage.getRandomNameForPerek()];
                        case 3:
                            randomName = _a.sent();
                            res.json(__assign(__assign({}, progress), { assignedName: (randomName === null || randomName === void 0 ? void 0 : randomName.hebrewName) || null }));
                            return [3 /*break*/, 5];
                        case 4:
                            error_50 = _a.sent();
                            console.error('Error fetching Tehillim progress:', error_50);
                            res.status(500).json({ error: "Failed to fetch Tehillim progress" });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/tehillim/complete", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, currentPerek, language, completedBy, updatedProgress, error_51;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = req.body, currentPerek = _a.currentPerek, language = _a.language, completedBy = _a.completedBy;
                            if (!currentPerek || currentPerek < 1 || currentPerek > 150) {
                                return [2 /*return*/, res.status(400).json({ error: "Invalid perek number" })];
                            }
                            if (!language || !['english', 'hebrew'].includes(language)) {
                                return [2 /*return*/, res.status(400).json({ error: "Language must be 'english' or 'hebrew'" })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.updateGlobalTehillimProgress(currentPerek, language, completedBy)];
                        case 1:
                            updatedProgress = _b.sent();
                            res.json(updatedProgress);
                            return [3 /*break*/, 3];
                        case 2:
                            error_51 = _b.sent();
                            console.error('Error completing Tehillim:', error_51);
                            res.status(500).json({ error: "Failed to complete Tehillim" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/tehillim/current-name", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var name_1, error_52;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getRandomNameForPerek()];
                        case 1:
                            name_1 = _a.sent();
                            res.json(name_1 || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_52 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch current name" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/tehillim/names", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var names, error_53;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getActiveNames()];
                        case 1:
                            names = _a.sent();
                            res.json(names);
                            return [3 /*break*/, 3];
                        case 2:
                            error_53 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Tehillim names" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Global Tehillim Progress endpoint
            app.get("/api/tehillim/global-progress", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                var progress, error_54;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getGlobalTehillimProgress()];
                        case 1:
                            progress = _a.sent();
                            res.json(progress);
                            return [3 /*break*/, 3];
                        case 2:
                            error_54 = _a.sent();
                            console.error("Error fetching global tehillim progress:", error_54);
                            res.status(500).json({ message: "Failed to fetch global tehillim progress" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Get Tehillim text from Sefaria API
            app.get("/api/tehillim/text/:perek", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var perek, language, tehillimData, error_55;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            perek = parseInt(req.params.perek);
                            language = req.query.language || 'english';
                            if (isNaN(perek) || perek < 1 || perek > 150) {
                                return [2 /*return*/, res.status(400).json({ error: "Perek must be between 1 and 150" })];
                            }
                            if (!['english', 'hebrew'].includes(language)) {
                                return [2 /*return*/, res.status(400).json({ error: "Language must be 'english' or 'hebrew'" })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.getSefariaTehillim(perek, language)];
                        case 1:
                            tehillimData = _a.sent();
                            res.json(tehillimData);
                            return [3 /*break*/, 3];
                        case 2:
                            error_55 = _a.sent();
                            console.error('Error fetching Tehillim text:', error_55);
                            res.status(500).json({ error: "Failed to fetch Tehillim text" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Get Tehillim preview (first line) from Sefaria API
            app.get("/api/tehillim/preview/:perek", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var perek, language, tehillimText, firstLine, error_56;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            perek = parseInt(req.params.perek);
                            language = req.query.language || 'hebrew';
                            if (isNaN(perek) || perek < 1 || perek > 150) {
                                return [2 /*return*/, res.status(400).json({ error: 'Perek must be between 1 and 150' })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.getSefariaTehillim(perek, language)];
                        case 1:
                            tehillimText = _a.sent();
                            firstLine = tehillimText.text.split('\n')[0] || tehillimText.text.substring(0, 100) + '...';
                            res.json({
                                preview: firstLine,
                                perek: tehillimText.perek,
                                language: tehillimText.language
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_56 = _a.sent();
                            console.error('Error fetching Tehillim preview:', error_56);
                            res.status(500).json({ error: 'Failed to fetch Tehillim preview' });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/tehillim/names", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, name_2, error_57;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertTehillimNameSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createTehillimName(validatedData)];
                        case 1:
                            name_2 = _a.sent();
                            res.json(name_2);
                            return [3 /*break*/, 3];
                        case 2:
                            error_57 = _a.sent();
                            if (error_57 instanceof zod_1.z.ZodError) {
                                res.status(400).json({ message: "Invalid name data", errors: error_57.errors });
                            }
                            else {
                                res.status(500).json({ message: "Failed to create Tehillim name" });
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Nishmas text routes
            app.get("/api/nishmas/:language", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var language, text, error_58;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            language = req.params.language;
                            return [4 /*yield*/, storage_js_1.storage.getNishmasTextByLanguage(language)];
                        case 1:
                            text = _a.sent();
                            res.json(text || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_58 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Nishmas text" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/nishmas", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validatedData, text, error_59;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            validatedData = schema_js_1.insertNishmasTextSchema.parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.createNishmasText(validatedData)];
                        case 1:
                            text = _a.sent();
                            res.json(text);
                            return [3 /*break*/, 3];
                        case 2:
                            error_59 = _a.sent();
                            res.status(500).json({ message: "Failed to create Nishmas text" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.put("/api/nishmas/:language", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var language, validatedData, text, error_60;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            language = req.params.language;
                            validatedData = schema_js_1.insertNishmasTextSchema.partial().parse(req.body);
                            return [4 /*yield*/, storage_js_1.storage.updateNishmasText(language, validatedData)];
                        case 1:
                            text = _a.sent();
                            res.json(text);
                            return [3 /*break*/, 3];
                        case 2:
                            error_60 = _a.sent();
                            res.status(500).json({ message: "Failed to update Nishmas text" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Pirkei Avot progression route
            app.get("/api/pirkei-avot/progress", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var progress, error_61;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getPirkeiAvotProgress()];
                        case 1:
                            progress = _a.sent();
                            res.json(progress);
                            return [3 /*break*/, 3];
                        case 2:
                            error_61 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch Pirkei Avot progress" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Women's prayer routes
            app.get("/api/womens-prayers/:category", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var category, prayers, error_62;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            category = req.params.category;
                            return [4 /*yield*/, storage_js_1.storage.getWomensPrayersByCategory(category)];
                        case 1:
                            prayers = _a.sent();
                            res.json(prayers);
                            return [3 /*break*/, 3];
                        case 2:
                            error_62 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch women's prayers" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/womens-prayers/prayer/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, prayer, error_63;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            id = req.params.id;
                            return [4 /*yield*/, storage_js_1.storage.getWomensPrayerById(parseInt(id))];
                        case 1:
                            prayer = _a.sent();
                            res.json(prayer || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_63 = _a.sent();
                            res.status(500).json({ message: "Failed to fetch prayer" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Discount promotion routes
            app.get("/api/discount-promotions/active", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, lat, lng, userLocation, latitude, longitude, promotion, error_64;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = req.query, lat = _a.lat, lng = _a.lng;
                            userLocation = "worldwide";
                            // Check if coordinates are in Israel (approximate bounding box)
                            if (lat && lng) {
                                latitude = parseFloat(lat);
                                longitude = parseFloat(lng);
                                // Israel's approximate coordinates: 29.5-33.4°N, 34.3-35.9°E
                                if (latitude >= 29.5 && latitude <= 33.4 && longitude >= 34.3 && longitude <= 35.9) {
                                    userLocation = "israel";
                                }
                            }
                            return [4 /*yield*/, storage_js_1.storage.getActiveDiscountPromotion(userLocation)];
                        case 1:
                            promotion = _b.sent();
                            res.json(promotion || null);
                            return [3 /*break*/, 3];
                        case 2:
                            error_64 = _b.sent();
                            console.error('Error fetching discount promotion:', error_64);
                            res.status(500).json({ message: "Failed to fetch active discount promotion" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Donation completion handler
            app.post("/api/donation-complete", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, donationType, sponsorName, dedication, message, today, error_65;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            _a = req.body, donationType = _a.donationType, sponsorName = _a.sponsorName, dedication = _a.dedication, message = _a.message;
                            if (!(donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName)) return [3 /*break*/, 2];
                            today = new Date().toISOString().split('T')[0];
                            // Create sponsor record
                            return [4 /*yield*/, storage_js_1.storage.createSponsor({
                                    name: sponsorName,
                                    sponsorshipDate: today,
                                    inHonorMemoryOf: dedication || null,
                                    message: message || null,
                                    isActive: true
                                })];
                        case 1:
                            // Create sponsor record
                            _b.sent();
                            console.log("Created sponsor record for ".concat(sponsorName, " on ").concat(today));
                            res.json({ success: true, message: 'Sponsor record created' });
                            return [3 /*break*/, 3];
                        case 2:
                            res.json({ success: true, message: 'No sponsor record needed' });
                            _b.label = 3;
                        case 3: return [3 /*break*/, 5];
                        case 4:
                            error_65 = _b.sent();
                            console.error('Failed to create sponsor record:', error_65);
                            res.status(500).json({
                                success: false,
                                message: 'Failed to create sponsor record',
                                error: error_65.message
                            });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            // Serve Apple Pay domain verification file
            app.get("/.well-known/apple-developer-merchantid-domain-association", function (req, res) {
                console.log('Apple Pay domain verification file requested');
                res.setHeader('Content-Type', 'text/plain');
                // Send the Apple Pay domain verification content
                res.send('7B227073704964223A2239373830303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222C2276657273696F6E223A312C22637265617465644F6E223A313534373531373737393538332C227369676E6174757265223A22333038303036303932613836343838366637306430313037303261303830333038303330383130373061303132383034383336633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933656436656537613738303830333038623135333032303136633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933653465363536333736333230323030316634663932343461353835653935386164633135383334393834333030613036303832613836343836366637306430323031303130353030333038316330313035313030313031303330383161323330613036303832613836343836366637306430323031303130353030613038316138306161613863633763373036346166336535303635633532383336303830343363333462646338663034376335383230653566346165613333383035396430303862343030626536646662366562633036316236636632666637353633643832326231333436326631353638346633343730323666346134623430393231633666643234613432626639316462623366616430666332353265663763306562333062656165663532376338393964633962633934366234336533633633373434656535643333353935373766613730356233323863373330326635313934306433653231656165613730306436636638613039316137383435363237663131373437343832363738623634626238636330373766343439346533336262646633656665353264653331643339363030313531643165353832636166633264373563373737303765373937616636613733356135326431656137356639393737323661666533306531356232616336633330653430313536633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933653065363536333637333230323030316634663932343461353835653935386164633135383334393834333030613036303832613836343836366637306430323031303130353030613038316331393938643831373439373531643362343261646365643234306633373830346264346133316462323334363433356136303237633862303262396336303263363365316462636536613161663833613830326532616461656564396331626437316433313035393864666534393366393736313535653436613436396634353639303936326439633161393836383363653766326364623337613235346136393233383866393264356434633461393034663037333336396334633165386135613833666131363836383461396666343661323633653362643139646431636533393866393862616563643638363930373766626532663465636639326635656565616232393063643235653639336235313936346366656362643134376665383837626635303935333463383562653537653433356235356666616637616163323962303438383230333931643366353661626231633939643437306665636636333066653932383535323732343739613836343030613035646630323030303461616636623334646531646530623234383866326439396436303031646336613739366338373836346564303134356162313036643166363262393438313662373735386365346630363237353332373738343538353937343066343863313565626537623938653735643238633732303530373562306134376233623964333335653838653436346431313265323363376235623564663139653436656162636562373031383862376435376661653865646166393064333330333938656465393230633535643465343831653832353437336336643834303065643464646338643339333366303339636239323763646261626437343763656538316436626137356439313364363338643565653361313564626535303939393035663530396263656633316137653538646537373132333766366632396130303035383936623132366236623766363464656662653032303030333038323033383233303832303162313061303330323031303230323034303031623063653834333038313061303630383261383634383836663730643031303130623035303030613831393733303833363130623330303933303631303433353533343130633033353535333130313133303132303630333535303430613063306236313730373036633635323036393665363332653330316533303163303630333535303430333063313535313631373030366336353230343934343230353137323635373336393734363537363636363936333631373436393666366535333635373237363639363365373330323030353364653532633537326133383833306266656466613763383130333066333734663030653261323963336631383032636330323364353764316132346137663165366161326533623538636566333333356631656337313135623830333264623963643866313131636638303661643038643738653538626236353135316233643439663966303165356535356166383732333738626138623633393436316532623562313638653563393436393932303065643634656531306665336434333433343332356431666336353139613537393966303363623465323734306664316563656265333866376431376539613064653936623138623066383666353662386664663061613730396232653736616439376437616632383464623536646662373164383166653961633635646533613533393837336666373165353966336131373539373765343935393966393337636135626133376232353735343233373938343433373863326564353261343765366338393337376135343764646234633835313039663165383033353631396431623632333738383839333434366531393461653930393065333738373433383863353966373437646434323334646462623633353036303030222C22706F6453223A224D4947654D5167724243674B4A6B69615256596E61517245414151524341444242414C6F33364B675447456469306C656D456D6A526C597A67744C43386B58434B7547456A376F7648733978716E416C736F2B5841343648794A454A4E6B576A69524D415054714B316D786E393253664A39373637336545505567776966357834636C4F76316976726E6E6D3942783947666C4144615A4B5377334E7A4B764B6C6B6E334B484B77324B33494C484C7243525A6857655561613346446D5153413D222C22706F64223A224D4947654D5167724243674B4A6B69615256596E61517245414151524341444242414C6F33364B675447456469306C656D456D6A526C597A67744C43386B58434B7547456A376F7648733978716E416C736F2B5841343648794A454A4E6B576A69524D415054714B316D786E393253664A39373637336545505567776966357834636C4F76316976726E6E6D3942783947666C4144615A4B5377334E7A4B764B6C6B6E334B484B77324B33494C484C7243525A6857655561613346446D5153413D22222C22747261646554223A313534373531373737393030302C22727041223A22456A30334E7A597A4E7A4D304D7A4D794E5463794E4441784E7A45334E6A67354E446B314E6A6C6D4D7A4E6A4D324D7A51794E6D566D4E4463344E324A684F4738325A4755304E7A5530597A466A4E446B314E7A593551413D3D222C227230336B53636F7265223A312C2272336B53636F7265223A312C22723361723053636F7265223A312C2264737377536D34537461747573223A302C227231676D536D34537461747573223A302C22697373756572536D34537461747573223A302C22687638386D74537461747573223A302C2268763838537461747573223A317D');
            });
            // Test Stripe connection endpoint
            app.get("/api/stripe-test", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var testIntent, error_66;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            console.log('Testing Stripe connection...');
                            console.log('Stripe key configured:', !!process.env.STRIPE_SECRET_KEY);
                            console.log('Stripe key format:', ((_a = process.env.STRIPE_SECRET_KEY) === null || _a === void 0 ? void 0 : _a.substring(0, 7)) + '...');
                            return [4 /*yield*/, stripe.paymentIntents.create({
                                    amount: 100, // $1.00
                                    currency: 'usd',
                                    metadata: { test: 'true' }
                                })];
                        case 1:
                            testIntent = _b.sent();
                            console.log('Test payment intent created:', testIntent.id);
                            res.json({
                                success: true,
                                message: 'Stripe connection working',
                                testIntentId: testIntent.id,
                                status: testIntent.status
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_66 = _b.sent();
                            console.error('Stripe test failed:', {
                                message: error_66.message,
                                type: error_66.type,
                                code: error_66.code,
                                decline_code: error_66.decline_code
                            });
                            res.status(500).json({
                                success: false,
                                error: error_66.message,
                                type: error_66.type,
                                code: error_66.code
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Stripe payment route for donations
            app.post("/api/create-payment-intent", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var testIntent, error_67;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, stripe.checkout.sessions.create({
                                    // amount: 100, // $1.00
                                    currency: 'usd',
                                    metadata: { test: 'true' },
                                    line_items: [{
                                            quantity: 1,
                                            price_data: {
                                                currency: 'usd',
                                                unit_amount_decimal: '181800',
                                                product_data: {
                                                    name: "donation"
                                                }
                                            }
                                        }],
                                    ui_mode: 'embedded',
                                    mode: 'payment',
                                    redirect_on_completion: 'never',
                                    payment_intent_data: {
                                        metadata: {
                                            source: "ezras-nashim-donation",
                                            donationType: "General Donation",
                                            sponsorName: "js",
                                            dedication: "jsz",
                                            email: "jzier3@gmail.com",
                                            timestamp: new Date().toISOString()
                                        },
                                    }
                                })];
                        case 1:
                            testIntent = _a.sent();
                            console.log('Session created successfully:', testIntent.client_secret);
                            res.json({
                                clientSecret: testIntent.client_secret,
                                amount: 1818,
                                paymentIntentId: testIntent.id
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_67 = _a.sent();
                            console.error('Stripe payment intent creation failed:', {
                                error: error_67.message,
                                code: error_67.code,
                                type: error_67.type,
                                decline_code: error_67.decline_code
                            });
                            res.status(500).json({
                                message: "Error creating payment intent: " + error_67.message,
                                code: error_67.code,
                                type: error_67.type
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Universal media proxy endpoint - supports multiple hosting services
            app.get("/api/media-proxy/:service/*", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var service, filePath, mediaUrl, response, contentType, error_68;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            service = req.params.service;
                            filePath = req.params[0];
                            mediaUrl = '';
                            // Support different hosting services
                            switch (service) {
                                case 'github':
                                    // GitHub raw file format: https://raw.githubusercontent.com/username/repo/branch/path/file
                                    mediaUrl = "https://raw.githubusercontent.com/".concat(filePath);
                                    break;
                                case 'cloudinary':
                                    // Cloudinary format: https://res.cloudinary.com/cloud-name/resource_type/upload/v1234567890/file
                                    mediaUrl = "https://res.cloudinary.com/".concat(filePath);
                                    break;
                                case 'supabase':
                                    // Supabase storage format
                                    mediaUrl = "https://".concat(process.env.SUPABASE_PROJECT_ID, ".supabase.co/storage/v1/object/public/").concat(filePath);
                                    break;
                                case 'firebase':
                                    // Firebase storage format
                                    mediaUrl = "https://firebasestorage.googleapis.com/v0/b/".concat(filePath);
                                    break;
                                case 'gdrive':
                                default:
                                    // Fallback to Google Drive for backward compatibility
                                    mediaUrl = "https://drive.usercontent.google.com/download?id=".concat(filePath, "&export=download");
                                    break;
                            }
                            return [4 /*yield*/, axiosClient_js_1.default.get(mediaUrl, {
                                    maxRedirects: 10,
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (compatible; EzrasNashim/1.0)'
                                    },
                                    responseType: 'stream'
                                })];
                        case 1:
                            response = _a.sent();
                            if (response.status !== 200) {
                                return [2 /*return*/, res.status(404).json({ error: "Media file not found" })];
                            }
                            contentType = response.headers['content-type'] || 'application/octet-stream';
                            res.setHeader('Content-Type', contentType);
                            res.setHeader('Accept-Ranges', 'bytes');
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Cache-Control', 'public, max-age=3600');
                            // Stream the response directly with axios
                            if (response.data) {
                                response.data.pipe(res);
                            }
                            else {
                                res.status(500).json({ error: "No response body" });
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_68 = _a.sent();
                            console.error('Media proxy error:', error_68);
                            res.status(500).json({ error: "Failed to fetch media" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Keep old audio proxy for backward compatibility
            app.get("/api/audio-proxy/:fileId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var fileId;
                return __generator(this, function (_a) {
                    fileId = req.params.fileId;
                    // Redirect to new universal proxy with gdrive service
                    res.redirect("/api/media-proxy/gdrive/".concat(fileId));
                    return [2 /*return*/];
                });
            }); });
            // Serve frontend application on root route
            app.get("/", function (req, res) {
                // In Replit environment, we need to serve the frontend differently
                if (process.env.REPLIT_DOMAINS) {
                    // For Replit, redirect to the frontend port
                    var replitDomain = process.env.REPLIT_DOMAINS;
                    res.redirect("https://".concat(replitDomain));
                }
                else {
                    // Local development
                    res.redirect("http://localhost:5173");
                }
            });
            // Manual donation success update (for testing when webhook isn't configured)
            app.post("/api/donations/update-status", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, paymentIntentId, status_1, donation, error_69;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            _a = req.body, paymentIntentId = _a.paymentIntentId, status_1 = _a.status;
                            if (!paymentIntentId || !status_1) {
                                return [2 /*return*/, res.status(400).json({ message: "Payment intent ID and status required" })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.updateDonationStatus(paymentIntentId, status_1)];
                        case 1:
                            donation = _b.sent();
                            if (!!donation) return [3 /*break*/, 3];
                            // If donation doesn't exist, create it with succeeded status
                            return [4 /*yield*/, storage_js_1.storage.createDonation({
                                    stripePaymentIntentId: paymentIntentId,
                                    amount: 100, // Default $1 for testing
                                    donationType: "General Donation",
                                    status: status_1
                                })];
                        case 2:
                            // If donation doesn't exist, create it with succeeded status
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            res.json({ message: "Donation status updated", donation: donation });
                            return [3 /*break*/, 5];
                        case 4:
                            error_69 = _b.sent();
                            console.error('Error updating donation status:', error_69);
                            res.status(500).json({ message: "Failed to update donation status" });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            // Analytics routes
            // Only track essential completion events (not page views)
            app.post("/api/analytics/track", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, eventType, eventData, sessionId, allowedEvents, event_1, error_70;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = req.body, eventType = _a.eventType, eventData = _a.eventData, sessionId = _a.sessionId;
                            allowedEvents = ['modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete'];
                            if (!allowedEvents.includes(eventType)) {
                                return [2 /*return*/, res.status(400).json({ message: "Event type not tracked" })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.trackEvent({
                                    eventType: eventType,
                                    eventData: eventData,
                                    sessionId: sessionId
                                })];
                        case 1:
                            event_1 = _b.sent();
                            res.json(event_1);
                            return [3 /*break*/, 3];
                        case 2:
                            error_70 = _b.sent();
                            console.error('Error tracking analytics event:', error_70);
                            res.status(500).json({ message: "Failed to track event" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Efficient session tracking - updates daily stats only once per session
            app.post("/api/analytics/session", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var sessionId, error_71;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            sessionId = req.body.sessionId;
                            if (!sessionId) {
                                return [2 /*return*/, res.status(400).json({ message: "Session ID required" })];
                            }
                            return [4 /*yield*/, storage_js_1.storage.recordActiveSession(sessionId)];
                        case 1:
                            _a.sent();
                            res.json({ success: true });
                            return [3 /*break*/, 3];
                        case 2:
                            error_71 = _a.sent();
                            console.error('Error recording session:', error_71);
                            res.status(500).json({ message: "Failed to record session" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Data cleanup endpoint - remove old analytics data
            app.post("/api/analytics/cleanup", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var error_72;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.cleanupOldAnalytics()];
                        case 1:
                            _a.sent();
                            res.json({ success: true, message: "Old analytics data cleaned up" });
                            return [3 /*break*/, 3];
                        case 2:
                            error_72 = _a.sent();
                            console.error('Error cleaning up analytics:', error_72);
                            res.status(500).json({ message: "Failed to cleanup analytics" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/analytics/stats/today", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var today, stats, error_73;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            today = new Date().toISOString().split('T')[0];
                            return [4 /*yield*/, storage_js_1.storage.getDailyStats(today)];
                        case 1:
                            stats = _a.sent();
                            res.json(stats || {
                                date: today,
                                uniqueUsers: 0,
                                pageViews: 0,
                                tehillimCompleted: 0,
                                namesProcessed: 0,
                                modalCompletions: {}
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_73 = _a.sent();
                            console.error('Error fetching today stats:', error_73);
                            res.status(500).json({ message: "Failed to fetch today's stats" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/analytics/stats/month", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var now, year, month, monthlyStats, error_74;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            now = new Date();
                            year = parseInt(req.query.year) || now.getFullYear();
                            month = parseInt(req.query.month) || (now.getMonth() + 1);
                            return [4 /*yield*/, storage_js_1.storage.getMonthlyStats(year, month)];
                        case 1:
                            monthlyStats = _a.sent();
                            res.json(monthlyStats);
                            return [3 /*break*/, 3];
                        case 2:
                            error_74 = _a.sent();
                            console.error('Error fetching monthly stats:', error_74);
                            res.status(500).json({ message: "Failed to fetch monthly stats" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/analytics/stats/total", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var totals, error_75;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getTotalStats()];
                        case 1:
                            totals = _a.sent();
                            res.json(totals);
                            return [3 /*break*/, 3];
                        case 2:
                            error_75 = _a.sent();
                            console.error('Error fetching total stats:', error_75);
                            res.status(500).json({ message: "Failed to fetch total stats" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/analytics/stats/daily", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var dailyStats, today, i, date, dateStr, stats, error_76;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            dailyStats = [];
                            today = new Date();
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < 30)) return [3 /*break*/, 4];
                            date = new Date(today);
                            date.setDate(date.getDate() - i);
                            dateStr = date.toISOString().split('T')[0];
                            return [4 /*yield*/, storage_js_1.storage.getDailyStats(dateStr)];
                        case 2:
                            stats = _a.sent();
                            if (stats) {
                                dailyStats.push(stats);
                            }
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4:
                            res.json(dailyStats);
                            return [3 /*break*/, 6];
                        case 5:
                            error_76 = _a.sent();
                            console.error('Error fetching daily stats:', error_76);
                            res.status(500).json({ message: "Failed to fetch daily stats" });
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/analytics/community-impact", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var impact, error_77;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage_js_1.storage.getCommunityImpact()];
                        case 1:
                            impact = _a.sent();
                            res.json(impact);
                            return [3 /*break*/, 3];
                        case 2:
                            error_77 = _a.sent();
                            console.error('Error fetching community impact:', error_77);
                            res.status(500).json({ message: "Failed to fetch community impact" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // IP-based location detection (works with VPN)
            app.get("/api/location/ip", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var clientIP, ipResponse, locationData, error_78;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            clientIP = req.headers['x-forwarded-for'] ||
                                req.headers['x-real-ip'] ||
                                req.connection.remoteAddress ||
                                req.socket.remoteAddress ||
                                ((_b = (_a = req.connection) === null || _a === void 0 ? void 0 : _a.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
                                '127.0.0.1';
                            console.log('IP-based location detection for IP:', clientIP);
                            return [4 /*yield*/, axiosClient_js_1.default.get("http://ip-api.com/json/".concat(clientIP, "?fields=status,message,country,regionName,city,lat,lon,timezone"))];
                        case 1:
                            ipResponse = _c.sent();
                            if (ipResponse.data.status === 'success') {
                                locationData = {
                                    coordinates: {
                                        lat: ipResponse.data.lat,
                                        lng: ipResponse.data.lon
                                    },
                                    location: "".concat(ipResponse.data.city, ", ").concat(ipResponse.data.regionName, ", ").concat(ipResponse.data.country),
                                    timezone: ipResponse.data.timezone,
                                    source: 'ip'
                                };
                                console.log('IP-based location detected:', locationData);
                                res.json(locationData);
                            }
                            else {
                                console.log('IP-based location failed:', ipResponse.data.message);
                                res.status(400).json({ error: 'Could not determine location from IP address' });
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_78 = _c.sent();
                            console.error('IP-based location detection error:', error_78);
                            res.status(500).json({ error: 'Failed to detect location from IP' });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/healthcheck", function (req, res) {
                res.json({ status: "OK" });
            });
            httpServer = (0, http_1.createServer)(app);
            return [2 /*return*/, httpServer];
        });
    });
}
