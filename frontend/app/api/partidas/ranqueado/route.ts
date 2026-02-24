import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    // Busca oponente
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { tecnicoOverall: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const oponente = await prisma.user.findFirst({
      where: {
        id: { not: auth.userId },
        tecnicoOverall: {
          gte: user.tecnicoOverall - 5,
          lte: user.tecnicoOverall + 5
        },
        clube: { isNot: null } // Precisa ter clube criado
      }
    })

    if (!oponente) {
      return NextResponse.json({ error: 'Nenhum oponente encontrado no momento' }, { status: 404 })
    }

    const resultado = await simularPartidaDetalhada(auth.userId, oponente.id, 'ranqueado')

    return NextResponse.json({
      ...resultado,
      oponente: {
        id: oponente.id,
        nome: oponente.nome,
        sobrenome: oponente.sobrenome
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao simular partida' }, { status: 400 })
  }
}
