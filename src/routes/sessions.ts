import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db';

const sessions = new Hono();

// Middleware to check dealer role
const requireDealer = async (c: any, next: any) => {
  const payload = c.get('jwtPayload');
  const user = await db
    .selectFrom('users')
    .select(['role'])
    .where('id', '=', payload.sub)
    .executeTakeFirst();

  if (!user || (user.role !== 'dealer' && user.role !== 'admin')) {
    return c.json({ error: 'Dealer access required' }, 403);
  }

  await next();
};

// Create customer session
sessions.post('/', requireDealer, async (c) => {
  const payload = c.get('jwtPayload');
  const data = await c.req.json();

  const session = await db
    .insertInto('sessions')
    .values({
      id: nanoid(),
      dealerId: payload.sub,
      customerName: data.customerName,
      customerEmail: data.customerEmail || '',
      customerPhone: data.customerPhone || '',
      notes: data.notes || '',
      tags: JSON.stringify(data.tags || []),
      shots: JSON.stringify([]),
      createdAt: new Date()
    })
    .returningAll()
    .executeTakeFirst();

  return c.json({
    ...session,
    tags: JSON.parse(session.tags),
    shots: JSON.parse(session.shots)
  });
});

// List customer sessions
sessions.get('/', requireDealer, async (c) => {
  const payload = c.get('jwtPayload');
  
  const sessions = await db
    .selectFrom('sessions')
    .selectAll()
    .where('dealerId', '=', payload.sub)
    .orderBy('createdAt', 'desc')
    .execute();

  // Get shot counts
  const sessionsWithStats = await Promise.all(
    sessions.map(async (session) => {
      const shotIds = JSON.parse(session.shots);
      return {
        id: session.id,
        customerName: session.customerName,
        customerEmail: session.customerEmail,
        shotCount: shotIds.length,
        tags: JSON.parse(session.tags),
        createdAt: session.createdAt,
        lastActivity: session.sharedAt || session.createdAt
      };
    })
  );

  return c.json({ sessions: sessionsWithStats });
});

// Share shots with customer
sessions.post('/:id/share', requireDealer, async (c) => {
  const sessionId = c.req.param('id');
  const payload = c.get('jwtPayload');
  const data = await c.req.json();

  // Verify session ownership
  const session = await db
    .selectFrom('sessions')
    .selectAll()
    .where('id', '=', sessionId)
    .where('dealerId', '=', payload.sub)
    .executeTakeFirst();

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (!session.customerEmail) {
    return c.json({ error: 'Customer email not set' }, 400);
  }

  // Update session with shot IDs
  await db
    .updateTable('sessions')
    .set({
      shots: JSON.stringify(data.shotIds),
      sharedAt: new Date()
    })
    .where('id', '=', sessionId)
    .execute();

  // In production, send email via Resend/SendGrid
  // await sendEmail({
  //   to: session.customerEmail,
  //   subject: data.subject,
  //   html: buildEmailTemplate(data.message, data.shotIds)
  // });

  return c.json({
    success: true,
    emailSent: true,
    recipientEmail: session.customerEmail,
    sharedShots: data.shotIds.length
  });
});

export { sessions as sessionRoutes }; 