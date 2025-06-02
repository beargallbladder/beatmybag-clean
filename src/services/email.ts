// Email service
// In production, use Resend, SendGrid, or AWS SES

export async function sendMagicLink(email: string, token: string): Promise<void> {
  const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/verify?token=${token}`;
  
  console.log(`
    TO: ${email}
    SUBJECT: Your BeatMyBag Login Link
    
    Click here to login: ${magicLink}
    
    This link expires in 15 minutes.
  `);

  // In production:
  // await resend.emails.send({
  //   from: 'noreply@beatmybag.com',
  //   to: email,
  //   subject: 'Your BeatMyBag Login Link',
  //   html: `<a href="${magicLink}">Click here to login</a>`
  // });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  console.log(`
    TO: ${options.to}
    SUBJECT: ${options.subject}
    BODY: ${options.html}
  `);

  // In production:
  // await resend.emails.send({
  //   from: 'noreply@beatmybag.com',
  //   ...options
  // });
} 