import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'

/**
 * Extrai o token Bearer do request e valida. Retorna o userId ou uma resposta 401.
 */
export function getAuthUser(request: NextRequest): { userId: string } | NextResponse {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  return { userId: decoded.userId }
}
