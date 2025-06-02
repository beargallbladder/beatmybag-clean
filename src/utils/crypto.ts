// Simple crypto utils - in production use @node-rs/argon2
export async function hashPassword(password: string): Promise<string> {
  // For magic links, we don't need this
  return password;
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return hash === password;
} 