import { writeFileSync } from "fs";
import { swaggerSpec } from "../server/swagger.js";

const outPath = "openapi.json";
writeFileSync(outPath, JSON.stringify(swaggerSpec, null, 2), "utf-8");
console.log(`OpenAPI spec written to ${outPath}`);
