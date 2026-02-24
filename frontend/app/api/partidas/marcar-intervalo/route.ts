import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { marcarIntervalo } from '@backend/lib/matchmaking'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { partidaId } = body

    if (!partidaId) {
      return NextResponse.json({ error: 'PartidaId é obrigatório' }, { status: 400 })
    }

    marcarIntervalo(partidaId)

    return NextResponse.json({ sucesso: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao marcar intervalo' }, { status: 400 })
  }
}
