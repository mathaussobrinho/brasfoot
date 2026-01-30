import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const jogadores = await prisma.jogador.findMany({
      where: { userId: decoded.userId },
      orderBy: [
        { raridade: 'asc' },
        { overall: 'desc' }
      ]
    })

    return NextResponse.json({ jogadores })
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar jogadores' },
      { status: 500 }
    )
  }
}
