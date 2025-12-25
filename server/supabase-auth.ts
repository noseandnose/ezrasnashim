import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RequestHandler, Request, Response, NextFunction } from 'express';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function isValidUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = () => {
  return isValidUrl(supabaseUrl) && Boolean(supabaseAnonKey);
};

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    supabaseClient = createClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    supabaseClient = null;
  }
} else {
  console.warn('Supabase credentials not configured. Authentication will be disabled.');
}

export const supabase = supabaseClient;

export interface SupabaseAuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: SupabaseAuthUser;
    }
  }
}

export const verifySupabaseToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ message: 'Authentication not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    if (!supabase) {
      return res.status(503).json({ message: 'Authentication not configured' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    req.supabaseUser = {
      id: user.id,
      email: user.email || null,
      firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
      lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
    };

    return next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Unauthorized - Token verification failed' });
  }
};

export const optionalAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isSupabaseConfigured() || !supabase) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.supabaseUser = {
        id: user.id,
        email: user.email || null,
        firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
      };
    }
  } catch (error) {
    // Silently continue without user for optional auth
  }

  return next();
};
