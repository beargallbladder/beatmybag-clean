// Storage service for images
// In production, use Cloudflare R2, AWS S3, or Backblaze B2

export async function uploadToStorage(buffer: Buffer, key: string): Promise<string> {
  // For development, return a data URL
  // In production, upload to R2/S3 and return CDN URL
  
  if (process.env.NODE_ENV === 'development') {
    // Convert to base64 data URL for development
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  // Production upload to R2/S3
  // const response = await r2.put(key, buffer);
  // return `https://cdn.beatmybag.com/${key}`;
  
  // For now, return placeholder
  return `https://cdn.beatmybag.com/${key}`;
} 