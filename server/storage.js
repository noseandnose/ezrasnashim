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
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
var axiosClient_1 = require("./axiosClient");
var schema_1 = require("../shared/schema");
var db_1 = require("./db");
var drizzle_orm_1 = require("drizzle-orm");
var typeHelpers_1 = require("./typeHelpers");
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
        // Skip initialization for better performance
    }
    DatabaseStorage.prototype.initializeDefaults = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Skip initialization to improve startup performance
                return [2 /*return*/];
            });
        });
    };
    DatabaseStorage.prototype.initializeData = function () {
        this.initializeDefaults().catch(console.error);
    };
    // Shop Items methods
    DatabaseStorage.prototype.getAllShopItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.shopItems).where((0, drizzle_orm_1.eq)(schema_1.shopItems.isActive, true))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getShopItemById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.shopItems).where((0, drizzle_orm_1.eq)(schema_1.shopItems.id, id))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createShopItem = function (insertItem) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.shopItems).values(insertItem).returning()];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item];
                }
            });
        });
    };
    // Tehillim methods
    DatabaseStorage.prototype.getActiveNames = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cleanupExpiredNames()];
                    case 1:
                        _a.sent();
                        now = new Date();
                        return [4 /*yield*/, db_1.db.select().from(schema_1.tehillimNames).where((0, drizzle_orm_1.gt)(schema_1.tehillimNames.expiresAt, now))];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTehillimName = function (insertName) {
        return __awaiter(this, void 0, void 0, function () {
            var name;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.tehillimNames).values(__assign(__assign({}, insertName), { dateAdded: new Date(), expiresAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), userId: null })).returning()];
                    case 1:
                        name = (_a.sent())[0];
                        return [2 /*return*/, name];
                }
            });
        });
    };
    DatabaseStorage.prototype.cleanupExpiredNames = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, db_1.db.delete(schema_1.tehillimNames).where((0, drizzle_orm_1.lt)(schema_1.tehillimNames.expiresAt, now))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getGlobalTehillimProgress = function () {
        return __awaiter(this, void 0, void 0, function () {
            var progress, initialName, newProgress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.globalTehillimProgress).limit(1)];
                    case 1:
                        progress = (_a.sent())[0];
                        if (!!progress) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getRandomNameForInitialAssignment()];
                    case 2:
                        initialName = _a.sent();
                        return [4 /*yield*/, db_1.db.insert(schema_1.globalTehillimProgress).values({
                                currentPerek: 1,
                                currentNameId: (initialName === null || initialName === void 0 ? void 0 : initialName.id) || null,
                                completedBy: null
                            }).returning()];
                    case 3:
                        newProgress = (_a.sent())[0];
                        return [2 /*return*/, newProgress];
                    case 4: return [2 /*return*/, progress];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateGlobalTehillimProgress = function (currentPerek, language, completedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var progress, isBookComplete, nextPerek, nextName, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.globalTehillimProgress).limit(1)];
                    case 1:
                        progress = (_a.sent())[0];
                        if (!progress) return [3 /*break*/, 6];
                        isBookComplete = currentPerek === 150;
                        nextPerek = currentPerek >= 150 ? 1 : currentPerek + 1;
                        if (!isBookComplete) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.trackEvent({
                                eventType: 'tehillim_book_complete',
                                eventData: {
                                    completedBy: completedBy || 'Anonymous',
                                    language: language,
                                    completedAt: new Date().toISOString()
                                },
                                sessionId: 'system' // System-generated event
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.getRandomNameForInitialAssignment()];
                    case 4:
                        nextName = _a.sent();
                        return [4 /*yield*/, db_1.db.update(schema_1.globalTehillimProgress)
                                .set({
                                currentPerek: nextPerek,
                                currentNameId: (nextName === null || nextName === void 0 ? void 0 : nextName.id) || null,
                                lastUpdated: new Date(),
                                completedBy: completedBy || null
                            })
                                .where((0, drizzle_orm_1.eq)(schema_1.globalTehillimProgress.id, progress.id))
                                .returning()];
                    case 5:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 6: return [2 /*return*/, this.getGlobalTehillimProgress()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRandomNameForPerek = function () {
        return __awaiter(this, void 0, void 0, function () {
            var progress, assignedName, newName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGlobalTehillimProgress()];
                    case 1:
                        progress = _a.sent();
                        if (!progress.currentNameId) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db.select().from(schema_1.tehillimNames).where((0, drizzle_orm_1.eq)(schema_1.tehillimNames.id, progress.currentNameId))];
                    case 2:
                        assignedName = (_a.sent())[0];
                        if (assignedName) {
                            return [2 /*return*/, assignedName];
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.getRandomNameForInitialAssignment()];
                    case 4:
                        newName = _a.sent();
                        if (!(newName && progress.id)) return [3 /*break*/, 6];
                        // Update the progress with this name
                        return [4 /*yield*/, db_1.db.update(schema_1.globalTehillimProgress)
                                .set({ currentNameId: newName.id })
                                .where((0, drizzle_orm_1.eq)(schema_1.globalTehillimProgress.id, progress.id))];
                    case 5:
                        // Update the progress with this name
                        _a.sent();
                        return [2 /*return*/, newName];
                    case 6: return [2 /*return*/, undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRandomNameForInitialAssignment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeNames, randomIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cleanupExpiredNames()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getActiveNames()];
                    case 2:
                        activeNames = _a.sent();
                        if (activeNames.length === 0)
                            return [2 /*return*/, undefined];
                        randomIndex = Math.floor(Math.random() * activeNames.length);
                        return [2 /*return*/, activeNames[randomIndex]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSefariaTehillim = function (perek, language) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, text, cleanText, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        url = "https://www.sefaria.org/api/texts/Psalms.".concat(perek);
                        return [4 /*yield*/, axiosClient_1.default.get(url)];
                    case 1:
                        response = _a.sent();
                        data = response.data;
                        text = '';
                        if (language === 'hebrew' && data.he) {
                            if (Array.isArray(data.he)) {
                                text = data.he.join('\n');
                            }
                            else if (typeof data.he === 'string') {
                                text = data.he;
                            }
                        }
                        else if (language === 'english' && data.text) {
                            if (Array.isArray(data.text)) {
                                text = data.text.join('\n');
                            }
                            else if (typeof data.text === 'string') {
                                text = data.text;
                            }
                        }
                        // Fallback to English if Hebrew not available or empty
                        if (!text && data.text) {
                            if (Array.isArray(data.text)) {
                                text = data.text.join('\n');
                            }
                            else if (typeof data.text === 'string') {
                                text = data.text;
                            }
                        }
                        if (!text) {
                            throw new Error('No text content found in API response');
                        }
                        cleanText = text
                            .replace(/<br\s*\/?>/gi, '\n') // Replace <br> tags with newlines
                            .replace(/<small>(.*?)<\/small>/gi, '$1') // Remove <small> tags but keep content
                            .replace(/<sup[^>]*>.*?<\/sup>/gi, '') // Remove footnote superscripts
                            .replace(/<i[^>]*>.*?<\/i>/gi, '') // Remove footnote italic text
                            .replace(/<[^>]*>/gi, '') // Remove any remaining HTML tags
                            .replace(/&thinsp;/gi, '') // Remove thin space HTML entities
                            .replace(/&nbsp;/gi, ' ') // Replace non-breaking spaces with regular spaces
                            .replace(/&[a-zA-Z0-9#]+;/gi, '') // Remove HTML entities
                            .replace(/\{[פס]\}/g, '') // Remove Hebrew paragraph markers like {פ} and {ס}
                            .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove Unicode directional marks
                            .replace(/[\u2060\u00A0\u180E\u2000-\u200B\u2028\u2029\uFEFF]/g, '') // Remove zero-width spaces
                            .replace(/[\u25A0-\u25FF]/g, '') // Remove geometric shapes (rectangles, squares)
                            .replace(/[\uFFF0-\uFFFF]/g, '') // Remove specials block characters
                            .replace(/[\uE000-\uF8FF]/g, '') // Remove private use area characters
                            .replace(/[\u2400-\u243F]/g, '') // Remove control pictures
                            .replace(/[\u2500-\u257F]/g, '') // Remove box drawing characters
                            .replace(/[\uFE00-\uFE0F]/g, '') // Remove variation selectors
                            .replace(/[\u0590-\u05CF]/g, function (match) {
                            // Keep valid Hebrew characters, remove problematic ones
                            var codePoint = match.codePointAt(0);
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
                            .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive newlines
                            .trim();
                        return [2 /*return*/, {
                                text: cleanText,
                                perek: perek,
                                language: language
                            }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error fetching from Sefaria API:', error_1);
                        // Return fallback text if API fails
                        return [2 /*return*/, {
                                text: "Tehillim ".concat(perek, " - Unable to load from Sefaria API. Please try again later."),
                                perek: perek,
                                language: language
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Mincha methods
    DatabaseStorage.prototype.getMinchaPrayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.minchaPrayers).orderBy(schema_1.minchaPrayers.orderIndex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMinchaPrayer = function (insertPrayer) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.minchaPrayers).values(insertPrayer).returning()];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    // Morning prayer methods
    DatabaseStorage.prototype.getMorningPrayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.morningPrayers).orderBy(schema_1.morningPrayers.orderIndex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMorningPrayer = function (insertPrayer) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.morningPrayers).values(insertPrayer).returning()];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    // Maariv methods
    DatabaseStorage.prototype.getMaarivPrayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maarivPrayers).orderBy(schema_1.maarivPrayers.orderIndex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMaarivPrayer = function (insertPrayer) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.maarivPrayers).values(insertPrayer).returning()];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    // After Brochas methods
    DatabaseStorage.prototype.getAfterBrochasPrayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.afterBrochasPrayers)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createAfterBrochasPrayer = function (insertPrayer) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.afterBrochasPrayers).values(insertPrayer).returning()];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    // Birkat Hamazon methods
    DatabaseStorage.prototype.getBirkatHamazonPrayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.birkatHamazonPrayers).orderBy(schema_1.birkatHamazonPrayers.orderIndex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createBirkatHamazonPrayer = function (insertPrayer) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.birkatHamazonPrayers).values(insertPrayer).returning()];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    // Sponsor methods
    DatabaseStorage.prototype.getSponsorByContentTypeAndDate = function (contentType, date) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Since we now have daily sponsors instead of content-specific ones, just return the daily sponsor
                return [2 /*return*/, this.getDailySponsor(date)];
            });
        });
    };
    DatabaseStorage.prototype.createSponsor = function (insertSponsor) {
        return __awaiter(this, void 0, void 0, function () {
            var sponsor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.sponsors).values(insertSponsor).returning()];
                    case 1:
                        sponsor = (_a.sent())[0];
                        return [2 /*return*/, sponsor];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDailySponsor = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var sponsor, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.sponsors)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sponsors.sponsorshipDate, date), (0, drizzle_orm_1.eq)(schema_1.sponsors.isActive, true)))
                                .limit(1)];
                    case 1:
                        sponsor = (_a.sent())[0];
                        return [2 /*return*/, sponsor || undefined];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching daily sponsor:', error_2);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActiveSponsors = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.sponsors).where((0, drizzle_orm_1.eq)(schema_1.sponsors.isActive, true))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Daily Torah content methods
    DatabaseStorage.prototype.getDailyHalachaByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.dailyHalacha).where((0, drizzle_orm_1.eq)(schema_1.dailyHalacha.date, date)).limit(1)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Failed to fetch daily halacha:', error_3);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createDailyHalacha = function (insertHalacha) {
        return __awaiter(this, void 0, void 0, function () {
            var halacha;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.dailyHalacha).values(insertHalacha).returning()];
                    case 1:
                        halacha = (_a.sent())[0];
                        return [2 /*return*/, halacha];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDailyEmunaByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.dailyEmuna).where((0, drizzle_orm_1.eq)(schema_1.dailyEmuna.date, date)).limit(1)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Failed to fetch daily emuna:', error_4);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createDailyEmuna = function (insertEmuna) {
        return __awaiter(this, void 0, void 0, function () {
            var emuna;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.dailyEmuna).values(insertEmuna).returning()];
                    case 1:
                        emuna = (_a.sent())[0];
                        return [2 /*return*/, emuna];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDailyChizukByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.dailyChizuk).where((0, drizzle_orm_1.eq)(schema_1.dailyChizuk.date, date)).limit(1)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Failed to fetch daily chizuk:', error_5);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createDailyChizuk = function (insertChizuk) {
        return __awaiter(this, void 0, void 0, function () {
            var chizuk;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.dailyChizuk).values(insertChizuk).returning()];
                    case 1:
                        chizuk = (_a.sent())[0];
                        return [2 /*return*/, chizuk];
                }
            });
        });
    };
    DatabaseStorage.prototype.getFeaturedContentByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.featuredContent).where((0, drizzle_orm_1.eq)(schema_1.featuredContent.date, date)).limit(1)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Failed to fetch featured content:', error_6);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createFeaturedContent = function (insertFeatured) {
        return __awaiter(this, void 0, void 0, function () {
            var featured;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.featuredContent).values(insertFeatured).returning()];
                    case 1:
                        featured = (_a.sent())[0];
                        return [2 /*return*/, featured];
                }
            });
        });
    };
    // Pirkei Avot methods  
    DatabaseStorage.prototype.getAllPirkeiAvot = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.pirkeiAvot).orderBy(schema_1.pirkeiAvot.orderIndex)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPirkeiAvotByOrderIndex = function (orderIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.pirkeiAvot).where((0, drizzle_orm_1.eq)(schema_1.pirkeiAvot.orderIndex, orderIndex)).limit(1)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPirkeiAvot = function (insertPirkeiAvot) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.pirkeiAvot).values(insertPirkeiAvot).returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCurrentPirkeiAvot = function () {
        return __awaiter(this, void 0, void 0, function () {
            var progress, today, lastUpdated, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.getPirkeiAvotProgress()];
                    case 1:
                        progress = _a.sent();
                        today = new Date().toISOString().split('T')[0];
                        lastUpdated = progress.lastUpdated ? new Date(progress.lastUpdated).toISOString().split('T')[0] : '';
                        if (!(today !== lastUpdated)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.advancePirkeiAvotProgress()];
                    case 2:
                        progress = _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.getPirkeiAvotByOrderIndex(progress.currentOrderIndex)];
                    case 4: 
                    // Get the current Pirkei Avot content
                    return [2 /*return*/, _a.sent()];
                    case 5:
                        error_7 = _a.sent();
                        console.error('Error getting current Pirkei Avot:', error_7);
                        return [2 /*return*/, undefined];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Daily recipe methods
    DatabaseStorage.prototype.getDailyRecipeByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var recipe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.dailyRecipes)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(schema_1.dailyRecipes.fromDate, date), (0, drizzle_orm_1.gte)(schema_1.dailyRecipes.untilDate, date)))
                            .limit(1)];
                    case 1:
                        recipe = (_a.sent())[0];
                        return [2 /*return*/, recipe];
                }
            });
        });
    };
    DatabaseStorage.prototype.createDailyRecipe = function (insertRecipe) {
        return __awaiter(this, void 0, void 0, function () {
            var recipe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.dailyRecipes).values(insertRecipe).returning()];
                    case 1:
                        recipe = (_a.sent())[0];
                        return [2 /*return*/, recipe];
                }
            });
        });
    };
    DatabaseStorage.prototype.getParshaVortByWeek = function (week) {
        return __awaiter(this, void 0, void 0, function () {
            var vort;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.parshaVorts).where((0, drizzle_orm_1.eq)(schema_1.parshaVorts.fromDate, week))];
                    case 1:
                        vort = (_a.sent())[0];
                        return [2 /*return*/, vort || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getParshaVortByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var vort;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.parshaVorts)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(schema_1.parshaVorts.fromDate, date), (0, drizzle_orm_1.gte)(schema_1.parshaVorts.untilDate, date)))
                            .limit(1)];
                    case 1:
                        vort = (_a.sent())[0];
                        return [2 /*return*/, vort];
                }
            });
        });
    };
    DatabaseStorage.prototype.createParshaVort = function (insertVort) {
        return __awaiter(this, void 0, void 0, function () {
            var vort;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.parshaVorts).values(insertVort).returning()];
                    case 1:
                        vort = (_a.sent())[0];
                        return [2 /*return*/, vort];
                }
            });
        });
    };
    DatabaseStorage.prototype.getNishmasTextByLanguage = function (language) {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.nishmasText).where((0, drizzle_orm_1.eq)(schema_1.nishmasText.language, language))];
                    case 1:
                        text = (_a.sent())[0];
                        return [2 /*return*/, text || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createNishmasText = function (insertText) {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.nishmasText).values(insertText).returning()];
                    case 1:
                        text = (_a.sent())[0];
                        return [2 /*return*/, text];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateNishmasText = function (language, updatedText) {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.nishmasText)
                            .set(__assign(__assign({}, updatedText), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.nishmasText.language, language))
                            .returning()];
                    case 1:
                        text = (_a.sent())[0];
                        return [2 /*return*/, text];
                }
            });
        });
    };
    // Campaign methods
    DatabaseStorage.prototype.getActiveCampaign = function () {
        return __awaiter(this, void 0, void 0, function () {
            var campaign;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.campaigns)
                            .where((0, drizzle_orm_1.eq)(schema_1.campaigns.isActive, true))
                            .limit(1)];
                    case 1:
                        campaign = (_a.sent())[0];
                        return [2 /*return*/, campaign || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllCampaigns = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.campaigns)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCampaign = function (insertCampaign) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.campaigns)
                            .values(insertCampaign)
                            .returning()];
                    case 1:
                        campaign = (_a.sent())[0];
                        return [2 /*return*/, campaign];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCampaignProgress = function (id, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.campaigns)
                            .set({
                            currentAmount: amount,
                            updatedAt: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.campaigns.id, id))
                            .returning()];
                    case 1:
                        campaign = (_a.sent())[0];
                        return [2 /*return*/, campaign];
                }
            });
        });
    };
    // Donation methods
    DatabaseStorage.prototype.createDonation = function (donation) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.donations)
                            .values(donation)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateDonationStatus = function (stripePaymentIntentId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.donations)
                            .set({ status: status })
                            .where((0, drizzle_orm_1.eq)(schema_1.donations.stripePaymentIntentId, stripePaymentIntentId))
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPirkeiAvotProgress = function () {
        return __awaiter(this, void 0, void 0, function () {
            var progress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.pirkeiAvotProgress).limit(1)];
                    case 1:
                        progress = (_a.sent())[0];
                        if (!!progress) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db
                                .insert(schema_1.pirkeiAvotProgress)
                                .values({ currentOrderIndex: 0 })
                                .returning()];
                    case 2:
                        // Initialize with orderIndex 0 if no progress exists
                        progress = (_a.sent())[0];
                        _a.label = 3;
                    case 3: return [2 /*return*/, progress];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePirkeiAvotProgress = function (orderIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var progress, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPirkeiAvotProgress()];
                    case 1:
                        progress = _a.sent();
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.pirkeiAvotProgress)
                                .set({
                                currentOrderIndex: orderIndex,
                                lastUpdated: new Date()
                            })
                                .where((0, drizzle_orm_1.eq)(schema_1.pirkeiAvotProgress.id, progress.id))
                                .returning()];
                    case 2:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.advancePirkeiAvotProgress = function () {
        return __awaiter(this, void 0, void 0, function () {
            var progress, allContent, maxOrderIndex, nextOrderIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPirkeiAvotProgress()];
                    case 1:
                        progress = _a.sent();
                        return [4 /*yield*/, this.getAllPirkeiAvot()];
                    case 2:
                        allContent = _a.sent();
                        if (allContent.length === 0) {
                            // No content available, keep progress at 0
                            return [2 /*return*/, progress];
                        }
                        maxOrderIndex = Math.max.apply(Math, allContent.map(function (p) { return p.orderIndex; }));
                        nextOrderIndex = progress.currentOrderIndex + 1;
                        // Cycle back to beginning if we've reached the end
                        if (nextOrderIndex > maxOrderIndex) {
                            nextOrderIndex = 0;
                        }
                        return [4 /*yield*/, this.updatePirkeiAvotProgress(nextOrderIndex)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getWomensPrayersByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.womensPrayers)
                            .where((0, drizzle_orm_1.eq)(schema_1.womensPrayers.category, category))
                            .orderBy(schema_1.womensPrayers.prayerName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getWomensPrayerById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.womensPrayers)
                            .where((0, drizzle_orm_1.eq)(schema_1.womensPrayers.id, id))
                            .limit(1)];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    DatabaseStorage.prototype.createWomensPrayer = function (insertPrayer) {
        return __awaiter(this, void 0, void 0, function () {
            var prayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.womensPrayers)
                            .values(insertPrayer)
                            .returning()];
                    case 1:
                        prayer = (_a.sent())[0];
                        return [2 /*return*/, prayer];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActiveDiscountPromotion = function (userLocation) {
        return __awaiter(this, void 0, void 0, function () {
            var targetLocation, now, result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        targetLocation = userLocation === "israel" ? "israel" : "worldwide";
                        now = new Date();
                        return [4 /*yield*/, db_1.db.select()
                                .from(schema_1.discountPromotions)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.discountPromotions.isActive, true), (0, drizzle_orm_1.lte)(schema_1.discountPromotions.startDate, now), (0, drizzle_orm_1.gte)(schema_1.discountPromotions.endDate, now), (0, drizzle_orm_1.eq)(schema_1.discountPromotions.targetLocation, targetLocation)))
                                .limit(1)];
                    case 1:
                        result = _a.sent();
                        if (!(result.length === 0 && targetLocation === "israel")) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db.select()
                                .from(schema_1.discountPromotions)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.discountPromotions.isActive, true), (0, drizzle_orm_1.lte)(schema_1.discountPromotions.startDate, now), (0, drizzle_orm_1.gte)(schema_1.discountPromotions.endDate, now), (0, drizzle_orm_1.eq)(schema_1.discountPromotions.targetLocation, "worldwide")))
                                .limit(1)];
                    case 2:
                        result = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, result[0] || undefined];
                    case 4:
                        error_8 = _a.sent();
                        console.error('Database error in getActiveDiscountPromotion:', error_8);
                        return [2 /*return*/, undefined];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createDiscountPromotion = function (insertPromotion) {
        return __awaiter(this, void 0, void 0, function () {
            var promotion;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.discountPromotions)
                            .values(insertPromotion)
                            .returning()];
                    case 1:
                        promotion = (_a.sent())[0];
                        return [2 /*return*/, promotion];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTableInspirationByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var inspiration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.tableInspirations)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(schema_1.tableInspirations.fromDate, date), (0, drizzle_orm_1.gte)(schema_1.tableInspirations.untilDate, date)))
                            .limit(1)];
                    case 1:
                        inspiration = (_a.sent())[0];
                        return [2 /*return*/, inspiration];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTableInspiration = function (insertInspiration) {
        return __awaiter(this, void 0, void 0, function () {
            var inspiration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.tableInspirations)
                            .values(insertInspiration)
                            .returning()];
                    case 1:
                        inspiration = (_a.sent())[0];
                        return [2 /*return*/, inspiration];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCommunityImpactByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var impact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.communityImpact)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(schema_1.communityImpact.fromDate, date), (0, drizzle_orm_1.gte)(schema_1.communityImpact.untilDate, date)))
                            .limit(1)];
                    case 1:
                        impact = (_a.sent())[0];
                        return [2 /*return*/, impact];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCommunityImpact = function (insertImpact) {
        return __awaiter(this, void 0, void 0, function () {
            var impact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.communityImpact)
                            .values(insertImpact)
                            .returning()];
                    case 1:
                        impact = (_a.sent())[0];
                        return [2 /*return*/, impact];
                }
            });
        });
    };
    // Analytics methods implementation
    DatabaseStorage.prototype.trackEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var newEvent, today;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.analyticsEvents)
                            .values(event)
                            .returning()];
                    case 1:
                        newEvent = (_a.sent())[0];
                        today = (0, typeHelpers_1.formatDate)(new Date());
                        return [4 /*yield*/, this.recalculateDailyStats(today)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, newEvent];
                }
            });
        });
    };
    // Efficient session tracking - only record unique sessions once per day
    DatabaseStorage.prototype.recordActiveSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var today, existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        today = (0, typeHelpers_1.formatDate)(new Date());
                        return [4 /*yield*/, this.getDailyStats(today)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) return [3 /*break*/, 3];
                        // Increment unique users count by 1 (simple approach for session-based counting)
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.dailyStats)
                                .set({
                                uniqueUsers: (existing.uniqueUsers || 0) + 1,
                                updatedAt: new Date()
                            })
                                .where((0, drizzle_orm_1.eq)(schema_1.dailyStats.date, today))];
                    case 2:
                        // Increment unique users count by 1 (simple approach for session-based counting)
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: 
                    // Create new daily stats with this session
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.dailyStats)
                            .values({
                            date: today,
                            uniqueUsers: 1,
                            pageViews: 0,
                            tehillimCompleted: 0,
                            namesProcessed: 0,
                            booksCompleted: 0,
                            modalCompletions: {}
                        })];
                    case 4:
                        // Create new daily stats with this session
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Clean up old analytics events (keep only last 30 days)
    DatabaseStorage.prototype.cleanupOldAnalytics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var thirtyDaysAgo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return [4 /*yield*/, db_1.db
                                .delete(schema_1.analyticsEvents)
                                .where((0, drizzle_orm_1.lt)(schema_1.analyticsEvents.createdAt, thirtyDaysAgo))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDailyStats = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.dailyStats)
                            .where((0, drizzle_orm_1.eq)(schema_1.dailyStats.date, date))
                            .limit(1)];
                    case 1:
                        stats = (_a.sent())[0];
                        return [2 /*return*/, stats];
                }
            });
        });
    };
    DatabaseStorage.prototype.recalculateDailyStats = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var todayEvents, uniqueSessions, pageViews, tehillimCompleted, namesProcessed, booksCompleted, modalCompletions, existing, updated, newStats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.analyticsEvents)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gt)(schema_1.analyticsEvents.createdAt, new Date(date + 'T00:00:00')), (0, drizzle_orm_1.lt)(schema_1.analyticsEvents.createdAt, new Date(date + 'T23:59:59'))))];
                    case 1:
                        todayEvents = _a.sent();
                        uniqueSessions = new Set(todayEvents.map(function (e) { return e.sessionId; }).filter(Boolean));
                        pageViews = 0;
                        tehillimCompleted = todayEvents.filter(function (e) { return e.eventType === 'tehillim_complete'; }).length;
                        namesProcessed = todayEvents.filter(function (e) { return e.eventType === 'name_prayed'; }).length;
                        booksCompleted = todayEvents.filter(function (e) { return e.eventType === 'tehillim_book_complete'; }).length;
                        modalCompletions = {};
                        todayEvents
                            .filter(function (e) { return e.eventType === 'modal_complete'; })
                            .forEach(function (e) {
                            var _a;
                            var modalType = ((_a = e.eventData) === null || _a === void 0 ? void 0 : _a.modalType) || 'unknown';
                            modalCompletions[modalType] = (modalCompletions[modalType] || 0) + 1;
                        });
                        return [4 /*yield*/, this.getDailyStats(date)];
                    case 2:
                        existing = _a.sent();
                        if (!existing) return [3 /*break*/, 4];
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.dailyStats)
                                .set({
                                uniqueUsers: uniqueSessions.size,
                                pageViews: pageViews,
                                tehillimCompleted: tehillimCompleted,
                                namesProcessed: namesProcessed,
                                booksCompleted: booksCompleted,
                                totalActs: this.calculateTotalActs(modalCompletions, tehillimCompleted),
                                modalCompletions: modalCompletions,
                                updatedAt: new Date()
                            })
                                .where((0, drizzle_orm_1.eq)(schema_1.dailyStats.date, date))
                                .returning()];
                    case 3:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 4: return [4 /*yield*/, db_1.db
                            .insert(schema_1.dailyStats)
                            .values({
                            date: date,
                            uniqueUsers: uniqueSessions.size,
                            pageViews: pageViews,
                            tehillimCompleted: tehillimCompleted,
                            namesProcessed: namesProcessed,
                            booksCompleted: booksCompleted,
                            totalActs: this.calculateTotalActs(modalCompletions, tehillimCompleted),
                            modalCompletions: modalCompletions
                        })
                            .returning()];
                    case 5:
                        newStats = (_a.sent())[0];
                        return [2 /*return*/, newStats];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateDailyStats = function (date, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDailyStats(date)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.dailyStats)
                                .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                                .where((0, drizzle_orm_1.eq)(schema_1.dailyStats.date, date))
                                .returning()];
                    case 2:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 3: return [4 /*yield*/, this.recalculateDailyStats(date)];
                    case 4: 
                    // Use recalculation for initial creation
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Helper method to calculate total acts
    DatabaseStorage.prototype.calculateTotalActs = function (modalCompletions, tehillimCompleted) {
        var torahActs = ['torah', 'chizuk', 'emuna', 'halacha', 'featured-content'];
        var tefillaActs = ['tefilla', 'morning-brochas', 'mincha', 'maariv', 'nishmas', 'birkat-hamazon', 'tehillim-text', 'special-tehillim'];
        var tzedakaActs = ['tzedaka', 'donate'];
        var totalActs = 0;
        // Count modal acts
        for (var _i = 0, _a = Object.entries(modalCompletions || {}); _i < _a.length; _i++) {
            var _b = _a[_i], modalType = _b[0], count = _b[1];
            if (torahActs.includes(modalType) || tefillaActs.includes(modalType) || tzedakaActs.includes(modalType)) {
                totalActs += count;
            }
        }
        // Add tehillim completions as acts
        totalActs += tehillimCompleted || 0;
        return totalActs;
    };
    DatabaseStorage.prototype.getMonthlyStats = function (year, month) {
        return __awaiter(this, void 0, void 0, function () {
            var startDate, endDate, monthlyStats, totalUsers, totalPageViews, totalTehillimCompleted, totalNamesProcessed, totalBooksCompleted, totalActs, totalModalCompletions, _i, monthlyStats_1, stats, completions, _a, _b, _c, modalType, count, error_9;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        startDate = "".concat(year, "-").concat(month.toString().padStart(2, '0'), "-01");
                        endDate = new Date(year, month, 0).toISOString().split('T')[0];
                        return [4 /*yield*/, db_1.db
                                .select()
                                .from(schema_1.dailyStats)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.dailyStats.date, startDate), (0, drizzle_orm_1.lte)(schema_1.dailyStats.date, endDate)))];
                    case 1:
                        monthlyStats = _d.sent();
                        totalUsers = 0;
                        totalPageViews = 0;
                        totalTehillimCompleted = 0;
                        totalNamesProcessed = 0;
                        totalBooksCompleted = 0;
                        totalActs = 0;
                        totalModalCompletions = {};
                        for (_i = 0, monthlyStats_1 = monthlyStats; _i < monthlyStats_1.length; _i++) {
                            stats = monthlyStats_1[_i];
                            totalUsers += stats.uniqueUsers || 0;
                            totalPageViews += stats.pageViews || 0;
                            totalTehillimCompleted += stats.tehillimCompleted || 0;
                            totalNamesProcessed += stats.namesProcessed || 0;
                            totalBooksCompleted += stats.booksCompleted || 0;
                            totalActs += stats.totalActs || 0;
                            completions = stats.modalCompletions || {};
                            for (_a = 0, _b = Object.entries(completions); _a < _b.length; _a++) {
                                _c = _b[_a], modalType = _c[0], count = _c[1];
                                totalModalCompletions[modalType] = (totalModalCompletions[modalType] || 0) + count;
                            }
                        }
                        return [2 /*return*/, {
                                totalUsers: totalUsers,
                                totalPageViews: totalPageViews,
                                totalTehillimCompleted: totalTehillimCompleted,
                                totalNamesProcessed: totalNamesProcessed,
                                totalBooksCompleted: totalBooksCompleted,
                                totalActs: totalActs,
                                totalModalCompletions: totalModalCompletions
                            }];
                    case 2:
                        error_9 = _d.sent();
                        console.error('Error fetching monthly stats:', error_9);
                        // Return empty stats if error occurs
                        return [2 /*return*/, {
                                totalUsers: 0,
                                totalPageViews: 0,
                                totalTehillimCompleted: 0,
                                totalNamesProcessed: 0,
                                totalBooksCompleted: 0,
                                totalActs: 0,
                                totalModalCompletions: {}
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTotalStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allStats, totalUsers, totalPageViews, totalTehillimCompleted, totalNamesProcessed, totalBooksCompleted, totalActs, totalModalCompletions, _i, allStats_1, stats, completions, _a, _b, _c, modalType, count;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.dailyStats)];
                    case 1:
                        allStats = _d.sent();
                        totalUsers = 0;
                        totalPageViews = 0;
                        totalTehillimCompleted = 0;
                        totalNamesProcessed = 0;
                        totalBooksCompleted = 0;
                        totalActs = 0;
                        totalModalCompletions = {};
                        for (_i = 0, allStats_1 = allStats; _i < allStats_1.length; _i++) {
                            stats = allStats_1[_i];
                            totalUsers += stats.uniqueUsers || 0;
                            totalPageViews += stats.pageViews || 0;
                            totalTehillimCompleted += stats.tehillimCompleted || 0;
                            totalNamesProcessed += stats.namesProcessed || 0;
                            totalBooksCompleted += stats.booksCompleted || 0;
                            totalActs += stats.totalActs || 0;
                            completions = stats.modalCompletions || {};
                            for (_a = 0, _b = Object.entries(completions); _a < _b.length; _a++) {
                                _c = _b[_a], modalType = _c[0], count = _c[1];
                                totalModalCompletions[modalType] = (totalModalCompletions[modalType] || 0) + count;
                            }
                        }
                        return [2 /*return*/, {
                                totalUsers: totalUsers,
                                totalPageViews: totalPageViews,
                                totalTehillimCompleted: totalTehillimCompleted,
                                totalNamesProcessed: totalNamesProcessed,
                                totalBooksCompleted: totalBooksCompleted,
                                totalActs: totalActs,
                                totalModalCompletions: totalModalCompletions
                            }];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCommunityImpact = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeSponsors, totalDaysSponsored, successfulDonations, totalCampaigns, totalRaised;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.sponsors).where((0, drizzle_orm_1.eq)(schema_1.sponsors.isActive, true))];
                    case 1:
                        activeSponsors = _a.sent();
                        totalDaysSponsored = activeSponsors.length;
                        return [4 /*yield*/, db_1.db.select().from(schema_1.donations).where((0, drizzle_orm_1.eq)(schema_1.donations.status, 'succeeded'))];
                    case 2:
                        successfulDonations = _a.sent();
                        totalCampaigns = successfulDonations.length;
                        totalRaised = successfulDonations.reduce(function (sum, donation) { return sum + (donation.amount || 0); }, 0) / 100;
                        return [2 /*return*/, {
                                totalDaysSponsored: totalDaysSponsored,
                                totalCampaigns: totalCampaigns,
                                totalRaised: totalRaised
                            }];
                }
            });
        });
    };
    return DatabaseStorage;
}());
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
