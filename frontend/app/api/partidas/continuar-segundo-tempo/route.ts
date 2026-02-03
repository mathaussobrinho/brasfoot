import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { continuarSegundoTempo } from '@backend/lib/matchmaking'

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
    const { partidaId } = body

    if (!partidaId) {
      return NextResponse.json({ error: 'PartidaId é obrigatório' }, { status: 400 })
    }

    const resultado = continuarSegundoTempo(partidaId, decoded.userId)

    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao continuar segundo tempo' }, { status: 400 })
  }
}
