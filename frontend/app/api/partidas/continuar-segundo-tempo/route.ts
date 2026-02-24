import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { continuarSegundoTempo } from '@backend/lib/matchmaking'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { partidaId } = body

    if (!partidaId) {
      return NextResponse.json({ error: 'PartidaId é obrigatório' }, { status: 400 })
    }

    const resultado = continuarSegundoTempo(partidaId, auth.userId)

    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao continuar segundo tempo' }, { status: 400 })
  }
}
