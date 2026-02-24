import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { criarLeilao } from '@backend/lib/leilao'
import { z } from 'zod'

const criarLeilaoSchema = z.object({
  jogadorId: z.string(),
  lanceInicial: z.number().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const data = criarLeilaoSchema.parse(body)

    const leilao = await criarLeilao(data.jogadorId, auth.userId, data.lanceInicial)

    return NextResponse.json({ leilao })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao criar leilão' }, { status: 400 })
  }
}
