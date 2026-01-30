import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'

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

    const resultado = await simularPartidaDetalhada(decoded.userId, null, 'bot')

    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao simular partida' }, { status: 400 })
  }
}
