import { validateAdminLogin, verifyAdminToken, isJwtConfigured, isAdminConfigured } from "../auth";

export function requireAdminAuth(req: any, res: any, next: any) {
  if (!isAdminConfigured()) {
    return res.status(500).json({ 
      message: "Admin authentication not configured" 
    });
  }
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  if (!token) {
    return res.status(401).json({ 
      message: "Unauthorized: No credentials provided" 
    });
  }
  
  if (!isJwtConfigured()) {
    return res.status(500).json({ 
      message: "JWT authentication not configured. Please set JWT_SECRET." 
    });
  }
  
  const jwtResult = verifyAdminToken(token);
  if (jwtResult.valid) {
    return next();
  }
  if (jwtResult.expired) {
    return res.status(401).json({ 
      message: "Unauthorized: Token expired, please login again" 
    });
  }
  
  return res.status(401).json({ 
    message: "Unauthorized: Invalid admin credentials" 
  });
}

export { validateAdminLogin };
