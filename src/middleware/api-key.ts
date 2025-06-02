import { MiddlewareHandler } from 'hono';
import { db } from '../db';

// Simple API key middleware
export const apiKey: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }

  // Check if API key exists and is valid
  const keyData = await db
    .selectFrom('api_keys')
    .select(['userId', 'permissions', 'expiresAt'])
    .where('key', '=', apiKey)
    .where('active', '=', true)
    .executeTakeFirst();

  if (!keyData) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  if (keyData.expiresAt && keyData.expiresAt < new Date()) {
    return c.json({ error: 'API key expired' }, 401);
  }

  // Add user info to context
  c.set('apiKeyUser', {
    userId: keyData.userId,
    permissions: JSON.parse(keyData.permissions)
  });

  await next();
};

// Permission check middleware
export const requirePermission = (permission: string): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get('apiKeyUser');
    
    if (!user?.permissions?.includes(permission)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}; 