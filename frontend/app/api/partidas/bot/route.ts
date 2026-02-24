import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const resultado = await simularPartidaDetalhada(auth.userId, null, 'bot')

    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao simular partida' }, { status: 400 })
  }
}
