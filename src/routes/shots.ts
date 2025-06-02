import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { getShotAnalyzer } from '../services/shot-analyzer';
import { uploadToStorage } from '../services/storage';
import { db } from '../db';

const shots = new Hono();

// Analyze and create shot
shots.post('/analyze', async (c) => {
  try {
    const formData = await c.req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return c.json({ error: 'No image provided' }, 400);
    }

    // Get user from JWT
    const payload = c.get('jwtPayload');
    const userId = payload.sub;

    // Check user credits and role
    const user = await db
      .selectFrom('users')
      .select(['credits', 'role'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (user.role === 'free' && user.credits <= 0) {
      return c.json({ error: 'No credits remaining. Upgrade to Pro!' }, 403);
    }

    // Convert to buffer
    const buffer = Buffer.from(await image.arrayBuffer());

    // Analyze shot with role-based AI tiers
    const analyzer = getShotAnalyzer(c.env.OPENAI_API_KEY);
    const metrics = await analyzer.analyze(buffer, { 
      userRole: user.role,
      forceHighAccuracy: c.req.query('highAccuracy') === 'true' // Allow dealers to force premium
    });

    // Upload image
    const imageUrl = await uploadToStorage(buffer, `shots/${nanoid()}.jpg`);

    // Create shot record
    const shot = await db
      .insertInto('shots')
      .values({
        id: nanoid(),
        userId,
        ...metrics,
        imageUrl,
        tags: JSON.stringify([]),
        createdAt: new Date()
      })
      .returningAll()
      .executeTakeFirst();

    // Deduct credit for free users
    if (user.role === 'free') {
      await db
        .updateTable('users')
        .set({ credits: user.credits - 1 })
        .where('id', '=', userId)
        .execute();
    }

    return c.json({
      shot: {
        ...shot,
        tags: JSON.parse(shot.tags)
      },
      creditsRemaining: user.role === 'free' ? user.credits - 1 : -1,
      analysisDetails: {
        confidence: metrics.confidence,
        modelTier: user.role === 'dealer' ? 'premium' : 'standard',
        processingNote: metrics.confidence > 0.95 ? 'High accuracy extraction' : 'Standard extraction'
      }
    });
  } catch (error) {
    console.error('Shot analysis error:', error);
    return c.json({ error: 'Analysis failed' }, 500);
  }
});

// List user's shots
shots.get('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  
  // Pagination
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '20');

  let query = db
    .selectFrom('shots')
    .selectAll()
    .where('userId', '=', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit + 1);

  if (cursor) {
    query = query.where('createdAt', '<', new Date(cursor));
  }

  const shots = await query.execute();
  
  const hasMore = shots.length > limit;
  const items = hasMore ? shots.slice(0, -1) : shots;
  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

  return c.json({
    items: items.map(shot => ({
      ...shot,
      tags: JSON.parse(shot.tags)
    })),
    nextCursor,
    hasMore
  });
});

// Get single shot
shots.get('/:id', async (c) => {
  const id = c.req.param('id');
  const payload = c.get('jwtPayload');
  const userId = payload.sub;

  const shot = await db
    .selectFrom('shots')
    .selectAll()
    .where('id', '=', id)
    .where('userId', '=', userId)
    .executeTakeFirst();

  if (!shot) {
    return c.json({ error: 'Shot not found' }, 404);
  }

  return c.json({
    ...shot,
    tags: JSON.parse(shot.tags)
  });
});

// Delete shot
shots.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const payload = c.get('jwtPayload');
  const userId = payload.sub;

  const result = await db
    .deleteFrom('shots')
    .where('id', '=', id)
    .where('userId', '=', userId)
    .executeTakeFirst();

  if (result.numDeletedRows === 0) {
    return c.json({ error: 'Shot not found' }, 404);
  }

  return c.json({ success: true });
});

export { shots as shotRoutes }; 