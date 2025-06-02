import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { config } from '../config';
import { sendMagicLink } from '../services/email';
import { hashPassword, verifyPassword } from '../utils/crypto';

const auth = new Hono();

// Google OAuth callback
auth.post('/google', async (c) => {
  const { credential } = await c.req.json(); // Google ID token from frontend
  
  if (!credential) {
    return c.json({ error: 'Google credential required' }, 400);
  }

  try {
    // Verify Google ID token
    const response = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential);
    const payload = await response.json();
    
    if (!payload.email || !payload.email_verified) {
      return c.json({ error: 'Invalid Google token' }, 401);
    }

    // Check if user exists
    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', payload.email.toLowerCase())
      .executeTakeFirst();

    // Create user if doesn't exist
    if (!user) {
      user = await db
        .insertInto('users')
        .values({
          id: nanoid(),
          email: payload.email.toLowerCase(),
          passwordHash: '', // OAuth users don't have passwords
          role: 'free',
          credits: config.FREE_SHOTS_PER_MONTH,
          createdAt: new Date(),
          // Store Google info in metadata
          metadata: JSON.stringify({
            googleId: payload.sub,
            name: payload.name,
            picture: payload.picture,
            provider: 'google'
          })
        })
        .returningAll()
        .executeTakeFirst();
    } else {
      // Update Google info if user exists
      await db
        .updateTable('users')
        .set({
          metadata: JSON.stringify({
            googleId: payload.sub,
            name: payload.name,
            picture: payload.picture,
            provider: 'google'
          })
        })
        .where('id', '=', user.id)
        .execute();
    }

    // Generate JWT tokens
    const accessToken = await sign(
      {
        sub: user!.id,
        email: user!.email,
        role: user!.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      config.JWT_SECRET
    );

    const refreshToken = await sign(
      {
        sub: user!.id,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      },
      config.JWT_SECRET
    );

    return c.json({
      user: {
        id: user!.id,
        email: user!.email,
        role: user!.role,
        credits: user!.credits,
        name: payload.name,
        picture: payload.picture
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.json({ error: 'Google authentication failed' }, 401);
  }
});

// Magic link login
auth.post('/login', async (c) => {
  const { email } = await c.req.json();
  
  if (!email || !email.includes('@')) {
    return c.json({ error: 'Invalid email' }, 400);
  }

  // Check if user exists
  let user = await db
    .selectFrom('users')
    .select(['id', 'email'])
    .where('email', '=', email.toLowerCase())
    .executeTakeFirst();

  // Create user if doesn't exist
  if (!user) {
    user = await db
      .insertInto('users')
      .values({
        id: nanoid(),
        email: email.toLowerCase(),
        passwordHash: '', // No password for magic link users
        role: 'free',
        credits: config.FREE_SHOTS_PER_MONTH,
        createdAt: new Date()
      })
      .returningAll()
      .executeTakeFirst();
  }

  // Generate magic link token
  const token = nanoid();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15); // 15 min expiry

  // Store token (in production, use Redis or similar)
  await db
    .insertInto('magic_links')
    .values({
      token,
      userId: user!.id,
      expiresAt: expires
    })
    .execute();

  // Send magic link email
  await sendMagicLink(email, token);

  return c.json({ 
    message: 'Magic link sent to your email',
    expiresIn: '15 minutes'
  });
});

// Verify magic link
auth.get('/verify', async (c) => {
  const token = c.req.query('token');
  
  if (!token) {
    return c.json({ error: 'Token required' }, 400);
  }

  // Get magic link
  const magicLink = await db
    .selectFrom('magic_links')
    .select(['userId', 'expiresAt'])
    .where('token', '=', token)
    .executeTakeFirst();

  if (!magicLink || magicLink.expiresAt < new Date()) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Get user
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', magicLink.userId)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Delete used magic link
  await db
    .deleteFrom('magic_links')
    .where('token', '=', token)
    .execute();

  // Generate JWT tokens
  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    },
    config.JWT_SECRET
  );

  const refreshToken = await sign(
    {
      sub: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    },
    config.JWT_SECRET
  );

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      credits: user.credits
    },
    accessToken,
    refreshToken
  });
});

// Refresh token
auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  
  if (!refreshToken) {
    return c.json({ error: 'Refresh token required' }, 400);
  }

  try {
    const payload = await verify(refreshToken, config.JWT_SECRET);
    
    if (payload.type !== 'refresh') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    // Get user
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.sub as string)
      .executeTakeFirst();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Generate new access token
    const accessToken = await sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      },
      config.JWT_SECRET
    );

    return c.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        credits: user.credits
      }
    });
  } catch (error) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

// Get current user
auth.get('/me', async (c) => {
  const payload = c.get('jwtPayload');
  
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user = await db
    .selectFrom('users')
    .select(['id', 'email', 'role', 'credits'])
    .where('id', '=', payload.sub)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});

export { auth as authRoutes }; 