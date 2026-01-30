import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { removerDoLeilao } from '@backend/lib/leilao'
import { z } from 'zod'

const removerSchema = z.object({
  jogadorId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const data = removerSchema.parse(body)

    await removerDoLeilao(data.jogadorId, decoded.userId)

    return NextResponse.json({ message: 'Jogador removido do leilão' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao remover do leilão' }, { status: 400 })
  }
}
