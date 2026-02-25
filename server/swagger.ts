import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Ezras Nashim API",
      version: "1.0.0",
      description:
        "REST API for the Ezras Nashim daily Jewish women's spiritual app. " +
        "Covers Torah content, Tefilla (prayer) resources, Tehillim chains, " +
        "analytics, push notifications, donations, and community features.",
      contact: {
        name: "Ezras Nashim",
        url: "https://ezrasnashim.app",
      },
    },
    servers: [
      { url: "https://api.ezrasnashim.app", description: "Production" },
      { url: "https://api.staging.ezrasnashim.app", description: "Staging" },
      { url: "http://localhost:5000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        AdminBearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from POST /api/admin/login",
        },
        SupabaseAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Supabase JWT access token for optional user authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        AnalyticsEvent: {
          type: "object",
          required: ["eventType"],
          properties: {
            eventType: { type: "string", example: "page_view" },
            deviceId: { type: "string" },
            userId: { type: "string" },
            metadata: { type: "object" },
          },
        },
        TehillimChain: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            reason: { type: "string" },
            slug: { type: "string" },
            isActive: { type: "boolean" },
            creatorDeviceId: { type: "string", nullable: true },
          },
        },
        TehillimProgress: {
          type: "object",
          properties: {
            currentPerek: { type: "integer" },
            completedPerakim: { type: "array", items: { type: "integer" } },
            totalCompleted: { type: "integer" },
          },
        },
        Sponsor: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            dedication: { type: "string" },
            contentType: { type: "string" },
            date: { type: "string", format: "date" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "integer" },
            text: { type: "string" },
            date: { type: "string", format: "date" },
            category: { type: "string", enum: ["Message", "Feature", "Bug Fix", "Poll"] },
            likes: { type: "integer" },
            dislikes: { type: "integer" },
            pinned: { type: "boolean" },
          },
        },
        GratitudeEntry: {
          type: "object",
          properties: {
            id: { type: "integer" },
            text: { type: "string" },
            date: { type: "string", format: "date" },
            completedWithTehillim: { type: "boolean" },
            userId: { type: "string" },
          },
        },
        DonationSession: {
          type: "object",
          properties: {
            url: { type: "string", description: "Stripe Checkout session URL" },
            sessionId: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Server health and version endpoints" },
      { name: "Auth", description: "User authentication (Supabase)" },
      { name: "Admin", description: "Admin-only management endpoints (JWT required)" },
      { name: "Analytics", description: "Usage tracking and statistics" },
      { name: "Location", description: "Geolocation and Hebrew date utilities" },
      { name: "Zmanim", description: "Jewish prayer times (zmanim)" },
      { name: "Tehillim", description: "Psalms reading and global progress" },
      { name: "Tehillim Chains", description: "Personal / community Tehillim prayer chains" },
      { name: "Prayers", description: "Prayer texts (Mincha, Maariv, Morning Brochas)" },
      { name: "Torah Content", description: "Daily Torah learning content" },
      { name: "Life Content", description: "Marriage insights, recipes, and life classes" },
      { name: "Messages & Feed", description: "App announcements and community feed" },
      { name: "Push Notifications", description: "Web push subscription and delivery" },
      { name: "Sponsors", description: "Daily content sponsorships" },
      { name: "Donations", description: "Stripe payment and donation flows" },
      { name: "User", description: "Per-user mitzvah progress and gratitude journal" },
      { name: "Media", description: "Object storage and media proxy" },
    ],
  },
  apis: [
    path.join(__dirname, "routes.ts"),
    path.join(__dirname, "routes", "*.ts"),
    path.join(__dirname, "swagger-paths.ts"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
