import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '24h';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function getAdminPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH || null;
}

export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAdminToken(): string {
  const secret = getJwtSecret();
  return jwt.sign(
    { 
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    }, 
    secret, 
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyAdminToken(token: string): { valid: boolean; expired?: boolean } {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { role: string };
    
    if (decoded.role !== 'admin') {
      return { valid: false };
    }
    
    return { valid: true };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, expired: true };
    }
    return { valid: false };
  }
}

export async function validateAdminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const passwordHash = getAdminPasswordHash();
  const plainPassword = getAdminPassword();
  
  if (passwordHash) {
    const isValid = await verifyPassword(password, passwordHash);
    if (isValid) {
      return { success: true, token: generateAdminToken() };
    }
    return { success: false, error: 'Invalid password' };
  }
  
  if (plainPassword) {
    if (password === plainPassword) {
      return { success: true, token: generateAdminToken() };
    }
    return { success: false, error: 'Invalid password' };
  }
  
  return { success: false, error: 'Admin authentication not configured' };
}

export function isJwtConfigured(): boolean {
  return !!process.env.JWT_SECRET;
}

export function isAdminConfigured(): boolean {
  return !!(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);
}
