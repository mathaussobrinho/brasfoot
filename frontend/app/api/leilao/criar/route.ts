import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { criarLeilao } from '@backend/lib/leilao'
import { z } from 'zod'

const criarLeilaoSchema = z.object({
  jogadorId: z.string(),
  lanceInicial: z.number().min(1)
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
    const data = criarLeilaoSchema.parse(body)

    const leilao = await criarLeilao(data.jogadorId, decoded.userId, data.lanceInicial)

    return NextResponse.json({ leilao })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao criar leilão' }, { status: 400 })
  }
}
