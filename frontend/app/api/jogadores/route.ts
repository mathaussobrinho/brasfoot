import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const jogadores = await prisma.jogador.findMany({
      where: { userId: auth.userId },
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
