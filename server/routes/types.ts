import type { Express } from "express";

export type RouteRegistrar = (app: Express) => void;
