import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production' && (!secret || secret === 'seu-secret-jwt-aqui')) {
    throw new Error('JWT_SECRET deve ser definido em produção. Configure a variável de ambiente JWT_SECRET.')
  }
  return secret || 'seu-secret-jwt-aqui'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string }
    return decoded
  } catch {
    return null
  }
}
