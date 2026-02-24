import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { removerDoLeilao } from '@backend/lib/leilao'
import { z } from 'zod'

const removerSchema = z.object({
  jogadorId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const data = removerSchema.parse(body)

    await removerDoLeilao(data.jogadorId, auth.userId)

    return NextResponse.json({ message: 'Jogador removido do leilão' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao remover do leilão' }, { status: 400 })
  }
}
